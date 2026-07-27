const cache = new Map();

export function clearTokenCache() {
  cache.clear();
}

export async function getCachedToken(key, fetchToken, {
  now = () => Date.now(),
  marginMs = 60_000,
} = {}) {
  const current = cache.get(key);

  // If we have an in-flight promise, await it (deduplication)
  if (current?.type === 'promise') {
    return await current.value;
  }

  // If we have a resolved token and it's not stale, return it
  if (current?.type === 'token' && current.value.expiresAt - marginMs > now()) {
    return current.value.token;
  }

  // Cache miss or stale token - create the fetch promise
  const fetchPromise = (async () => {
    const { token, expiresInSec } = await fetchToken();
    const expiresAt = now() + (expiresInSec ?? 3600) * 1000;
    cache.set(key, { type: 'token', value: { token, expiresAt } });
    return token;
  })();

  // Store the promise immediately to catch concurrent requests
  cache.set(key, { type: 'promise', value: fetchPromise });

  try {
    return await fetchPromise;
  } catch (error) {
    cache.delete(key); // Don't cache errors
    throw error;
  }
}
