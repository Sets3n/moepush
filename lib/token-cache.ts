const CACHE_TTL = 7000

export async function getCachedToken(
  cache: KVNamespace | undefined,
  cacheKey: string,
  fetchToken: () => Promise<string>
): Promise<string> {
  if (cache) {
    const cached = await cache.get(cacheKey)
    if (cached) return cached
  }

  const token = await fetchToken()

  if (cache) {
    await cache.put(cacheKey, token, { expirationTtl: CACHE_TTL })
  }

  return token
}
