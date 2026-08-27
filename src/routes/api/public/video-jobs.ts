import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const completeSchema = z.object({
  video_id: z.string().uuid(),
  video_url: z.string().url().max(2048).optional(),
  estado_generacion: z.enum(['procesando', 'listo', 'error']).default('listo'),
})

async function authorize(request: Request): Promise<Response | null> {
  const token = process.env['VIDEO_WORKER_TOKEN']
  if (!token) return new Response('Server configuration error', { status: 500 })

  const match = /^Bearer ([^\s,]+)$/.exec(request.headers.get('authorization') ?? '')
  const provided = match?.[1]
  if (!provided) return new Response('Unauthorized', { status: 401 })

  const { createHash, timingSafeEqual } = await import('node:crypto')
  const digest = (v: string) => createHash('sha256').update(v, 'utf8').digest()
  if (!timingSafeEqual(digest(provided), digest(token))) {
    return new Response('Unauthorized', { status: 401 })
  }
  return null
}

// Photos are stored as domain-agnostic paths. Resolve them against the origin
// the worker actually reached (the deployed app), never the editor preview host.
function resolvePhotoUrls(urls: unknown, requestUrl: string): string[] {
  const origin = new URL(requestUrl).origin
  const list = Array.isArray(urls) ? urls : []
  return list
    .filter((u): u is string => typeof u === 'string' && u.length > 0)
    .map((u) => {
      const path = u.startsWith('http')
        ? new URL(u).pathname
        : u.startsWith('/')
          ? u
          : `/${u}`
      return `${origin}${path}`
    })
}

export const Route = createFileRoute('/api/public/video-jobs')({
  server: {
    handlers: {
      // Worker polls for pending jobs
      GET: async ({ request }) => {
        const denied = await authorize(request)
        if (denied) return denied

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { data, error } = await supabaseAdmin
          .from('videos')
          .select('id, fotos_urls, tier, creado_en')
          .eq('estado_generacion', 'procesando')
          .order('creado_en', { ascending: true })
          .limit(20)

        if (error) return new Response(error.message, { status: 500 })
        return Response.json({ jobs: data ?? [] })
      },

      // Worker reports a finished (or failed) job
      POST: async ({ request }) => {
        const denied = await authorize(request)
        if (denied) return denied

        let payload: unknown
        try {
          payload = await request.json()
        } catch {
          return new Response('Invalid JSON', { status: 400 })
        }

        const parsed = completeSchema.safeParse(payload)
        if (!parsed.success) {
          return Response.json({ error: 'Invalid payload' }, { status: 400 })
        }

        const { video_id, video_url, estado_generacion } = parsed.data
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { error } = await supabaseAdmin
          .from('videos')
          .update({
            estado_generacion,
            ...(video_url ? { video_url } : {}),
          })
          .eq('id', video_id)

        if (error) return new Response(error.message, { status: 500 })
        return Response.json({ ok: true })
      },
    },
  },
})
