import { ApiError } from './errors.js';

export async function fetchJSON(url, {
  method = 'GET',
  headers = {},
  body = undefined,
  timeout = 12_000,
  fetchImpl = fetch,
} = {}) {
  const options = { method, headers: { ...headers }, signal: AbortSignal.timeout(timeout) };

  if (body !== undefined) {
    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetchImpl(url, options);
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw new ApiError('The service did not respond in time.', 504);
    }
    throw new ApiError('The service could not be reached.', 502);
  }

  const raw = await response.text();
  let payload;
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || `Service returned HTTP ${response.status}.`;
    throw new ApiError(message, response.status, payload?.errors);
  }

  if (payload === null) {
    throw new ApiError('The service returned an unreadable response.', 502);
  }

  return payload ?? {};
}
