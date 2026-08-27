// Shared bearer-token check for the external video worker endpoints.
export async function authorizeWorker(request: Request): Promise<Response | null> {
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
