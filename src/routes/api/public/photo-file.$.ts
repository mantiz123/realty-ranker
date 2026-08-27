import { createFileRoute } from '@tanstack/react-router'

const BUCKET = 'property-photos'

export const Route = createFileRoute('/api/public/photo-file/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const objectPath = params._splat ?? ''
        if (!objectPath || objectPath.includes('..') || !/^[A-Za-z0-9._\-/]+$/.test(objectPath)) {
          return new Response('Not found', { status: 404 })
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { data, error } = await supabaseAdmin.storage
          .from(BUCKET)
          .createSignedUrl(objectPath, 60 * 60)

        if (error || !data?.signedUrl) {
          return new Response('Not found', { status: 404 })
        }

        return new Response(null, {
          status: 302,
          headers: {
            Location: data.signedUrl,
            'Cache-Control': 'public, max-age=1800',
          },
        })
      },
    },
  },
})
