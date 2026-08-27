import { createFileRoute } from '@tanstack/react-router'

// Verificación manual de la firma de Stripe (t=...,v1=...) con HMAC SHA-256.
async function verificarFirma(rawBody: string, header: string | null, secret: string) {
  if (!header) return false
  const partes = Object.fromEntries(
    header.split(',').map((p) => {
      const [k, ...rest] = p.split('=')
      return [k?.trim() ?? '', rest.join('=')]
    }),
  ) as Record<string, string>

  const timestamp = partes['t']
  const firma = partes['v1']
  if (!timestamp || !firma) return false

  // Rechaza eventos con más de 5 minutos de antigüedad (protección anti-replay).
  const edad = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(edad) || edad > 300) return false

  const { createHmac, timingSafeEqual } = await import('node:crypto')
  const esperada = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex')

  const a = Buffer.from(esperada, 'utf8')
  const b = Buffer.from(firma, 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}

export const Route = createFileRoute('/api/public/stripe-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env['STRIPE_WEBHOOK_SECRET']
        if (!secret) return new Response('Server configuration error', { status: 500 })

        const rawBody = await request.text()
        const ok = await verificarFirma(rawBody, request.headers.get('stripe-signature'), secret)
        if (!ok) return new Response('Invalid signature', { status: 400 })

        let event: { type?: string; data?: { object?: Record<string, unknown> } }
        try {
          event = JSON.parse(rawBody)
        } catch {
          return new Response('Invalid JSON', { status: 400 })
        }

        if (event.type !== 'checkout.session.completed') {
          return Response.json({ received: true })
        }

        const session = event.data?.object ?? {}
        if (session['payment_status'] !== 'paid') {
          return Response.json({ received: true })
        }

        const metadata = (session['metadata'] ?? {}) as Record<string, unknown>
        const videoId =
          (typeof metadata['video_id'] === 'string' ? metadata['video_id'] : undefined) ??
          (typeof session['client_reference_id'] === 'string'
            ? (session['client_reference_id'] as string)
            : undefined)

        if (!videoId) return Response.json({ received: true })

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { error } = await supabaseAdmin
          .from('videos')
          .update({ estado_generacion: 'procesando' })
          .eq('id', videoId)
          .eq('estado_generacion', 'pendiente_pago')

        if (error) {
          console.error('[stripe-webhook]', error.message)
          return new Response('Update failed', { status: 500 })
        }

        return Response.json({ received: true })
      },
    },
  },
})
