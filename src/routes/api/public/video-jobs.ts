import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { authorizeWorker as authorize } from '@/lib/worker-auth.server'

const completeSchema = z.object({
  video_id: z.string().uuid(),
  video_url: z.string().url().max(2048).optional(),
  estado_generacion: z.enum(['procesando', 'listo', 'error']).default('listo'),
})


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
