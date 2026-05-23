/**
 * Safe API fetch utility that handles Next.js Server Action error responses
 * and other non-JSON responses gracefully.
 */

interface SafeFetchOptions extends RequestInit {
  /** Expected response type: 'json' (default) or 'blob' */
  responseType?: 'json' | 'blob' | 'text'
}

interface SafeFetchResult<T> {
  data: T | null
  error: string | null
  ok: boolean
  status: number
}

/**
 * Safely fetch from API routes with defensive JSON parsing.
 * Prevents "Unexpected token 'S', 'Server act'..." errors when
 * Next.js returns a Server Action-encoded error response instead of JSON.
 */
export async function safeFetch<T = Record<string, unknown>>(
  url: string,
  options?: SafeFetchOptions
): Promise<SafeFetchResult<T>> {
  const { responseType = 'json', ...fetchOptions } = options || {}

  try {
    const res = await fetch(url, fetchOptions)

    if (responseType === 'blob') {
      if (!res.ok) {
        return { data: null, error: `HTTP ${res.status}`, ok: false, status: res.status }
      }
      const blob = await res.blob()
      return { data: blob as unknown as T, error: null, ok: true, status: res.status }
    }

    const text = await res.text()

    if (responseType === 'text') {
      return { data: text as unknown as T, error: null, ok: res.ok, status: res.status }
    }

    // Try to parse as JSON
    let data: T
    try {
      data = JSON.parse(text) as T
    } catch {
      // Check if it's a Server Action response
      if (text.startsWith('Server act') || text.includes('Server action')) {
        console.error('Received Server Action response instead of JSON. The API route may have failed at framework level.')
        return {
          data: null,
          error: 'Server error - permintaan tidak dapat diproses',
          ok: false,
          status: res.status,
        }
      }
      console.error('Non-JSON response:', text.substring(0, 100))
      return {
        data: null,
        error: 'Respon server tidak valid',
        ok: false,
        status: res.status,
      }
    }

    // If response is not OK, extract error from parsed JSON
    if (!res.ok) {
      const errorObj = data as Record<string, unknown>
      const errorMessage = (errorObj?.error as string) || `HTTP ${res.status}`
      return { data: null, error: errorMessage, ok: false, status: res.status }
    }

    return { data, error: null, ok: true, status: res.status }
  } catch (err) {
    console.error(`Fetch failed for ${url}:`, err)
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Koneksi gagal',
      ok: false,
      status: 0,
    }
  }
}

/**
 * Quick helper for JSON API calls with error throwing.
 * Throws on error, returns data on success.
 */
export async function apiFetch<T = Record<string, unknown>>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const result = await safeFetch<T>(url, options)
  if (!result.ok || result.error) {
    throw new Error(result.error || 'Permintaan gagal')
  }
  return result.data as T
}
