import { API_URL } from './config';

let accessToken = null;
let onUnauthorized = () => {};
export function setSession(token, handler = () => {}) {
  accessToken = token;
  onUnauthorized = handler;
}
export async function request(
  path,
  {
    method = 'GET',
    body,
    authenticated = true,
    signal,
    multipart = false,
    timeoutMs = 20000,
  } = {},
) {
  const token = accessToken;
  if (authenticated && !token) {
    throw new Error('Please sign in to continue.');
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  if (signal?.aborted) {
    abort();
  }
  const timeout = setTimeout(abort, timeoutMs);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body && !multipart ? { 'Content-Type': 'application/json' } : {}),
        ...(authenticated ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: multipart ? body : JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401 && authenticated && token === accessToken) {
        onUnauthorized();
      }
      throw new Error(
        payload?.message ||
          (response.status === 403
            ? 'Your account does not have permission to view products.'
            : `Request failed (${response.status}). Please try again.`),
      );
    }
    if (!payload) {
      throw new Error(
        'The server returned an invalid response. Please try again.',
      );
    }
    return payload;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('Request timed out or was cancelled. Please try again.');
    }
    if (error instanceof TypeError) {
      throw new Error(
        'Cannot connect to the server. Check your internet connection.',
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
