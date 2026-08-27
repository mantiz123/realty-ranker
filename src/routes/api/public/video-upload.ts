import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

async function authorizeWorker(request: Request): Promise<Response | null> {
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


const BUCKET = 'property-videos'
const MAX_BYTES = 50 * 1024 * 1024
const ALLOWED = new Set(['video/mp4', 'video/quicktime', 'video/webm'])

const metaSchema = z.object({
  video_id: z.string().uuid().optional(),
  filename: z
    .string()
    .max(120)
    .regex(/^[A-Za-z0-9._-]+$/)
    .optional(),
})

function extFor(contentType: string) {
  if (contentType === 'video/webm') return 'webm'
  if (contentType === 'video/quicktime') return 'mov'
  return 'mp4'
}

export const Route = createFileRoute('/api/public/video-upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authorizeWorker(request)
        if (denied) return denied

        const url = new URL(request.url)
        const parsedMeta = metaSchema.safeParse({
          video_id: url.searchParams.get('video_id') ?? undefined,
          filename: url.searchParams.get('filename') ?? undefined,
        })
        if (!parsedMeta.success) {
          return Response.json({ error: 'Invalid query parameters' }, { status: 400 })
        }
        const { video_id, filename } = parsedMeta.data

        const requestType = request.headers.get('content-type') ?? ''
        let bytes: ArrayBuffer
        let contentType: string
        let originalName: string | undefined

        if (requestType.startsWith('multipart/form-data')) {
          const form = await request.formData()
          const file = form.get('file')
          if (!(file instanceof File)) {
            return Response.json({ error: 'Missing "file" field' }, { status: 400 })
          }
          contentType = file.type || 'video/mp4'
          originalName = file.name
          bytes = await file.arrayBuffer()
        } else {
          contentType = requestType.split(';')[0]?.trim() || 'video/mp4'
          bytes = await request.arrayBuffer()
        }

        if (!ALLOWED.has(contentType)) {
          return Response.json(
            { error: `Unsupported content type: ${contentType}` },
            { status: 415 },
          )
        }
        if (bytes.byteLength === 0) {
          return Response.json({ error: 'Empty body' }, { status: 400 })
        }
        if (bytes.byteLength > MAX_BYTES) {
          return Response.json({ error: 'File too large (max 50MB)' }, { status: 413 })
        }

        const safeName =
          filename ??
          (originalName && /^[A-Za-z0-9._-]+$/.test(originalName)
            ? originalName
            : `${crypto.randomUUID()}.${extFor(contentType)}`)
        const objectPath = `${video_id ?? 'unassigned'}/${Date.now()}-${safeName}`

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { error: uploadError } = await supabaseAdmin.storage
          .from(BUCKET)
          .upload(objectPath, bytes, { contentType, upsert: false })

        if (uploadError) {
          return Response.json({ error: uploadError.message }, { status: 500 })
        }

        const publicUrl = `${url.origin}/api/public/video-file/${objectPath}`

        if (video_id) {
          const { error: dbError } = await supabaseAdmin
            .from('videos')
            .update({ video_url: publicUrl, estado_generacion: 'listo' })
            .eq('id', video_id)
          if (dbError) {
            return Response.json(
              { error: dbError.message, url: publicUrl, path: objectPath },
              { status: 500 },
            )
          }
        }

        return Response.json({ ok: true, path: objectPath, url: publicUrl })
      },
    },
  },
})
