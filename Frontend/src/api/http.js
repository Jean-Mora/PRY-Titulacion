/**
 * Cliente HTTP único del frontend.
 *
 * Es el ÚNICO lugar que conoce la URL base de la API y el token JWT
 * (ver "Convenciones" en la arquitectura del frontend). Las páginas nunca
 * llaman a fetch directamente: usan las funciones de src/api/*.js.
 */

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'jf_token';

let unauthorizedHandler = null;

/** Error de la API con el código HTTP y el cuerpo devuelto por el backend. */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* almacenamiento no disponible (modo privado): la sesión dura lo que la pestaña */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* sin almacenamiento, nada que borrar */
  }
}

/**
 * Registra qué hacer cuando el backend responde 401 a una petición que
 * llevaba token (sesión vencida o inválida). AuthContext lo usa para
 * cerrar la sesión; ProtectedRoute redirige entonces a /admin/login.
 */
export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
}

/** Extrae un mensaje legible del cuerpo de error del backend. */
function errorMessage(data, status) {
  if (data && typeof data === 'object') {
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
    if (data.error && typeof data.error.message === 'string') return data.error.message;
  }
  if (status >= 500) return 'El servidor no está disponible. Intenta de nuevo en unos minutos.';
  return `Error ${status}`;
}

/**
 * Realiza una petición a la API.
 * @param {string} path Ruta relativa, p. ej. "/api/auth/me".
 * @param {object} [options] method, body (objeto o FormData), headers, signal.
 * @returns {Promise<any>} Cuerpo JSON de la respuesta (o null si no hay cuerpo).
 */
export async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
  const token = getToken();
  const finalHeaders = { Accept: 'application/json', ...headers };
  let finalBody = body;

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(body);
  }
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: finalBody,
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión.', 0, null);
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    // 401 con token = sesión vencida → cerrar sesión. Un 401 sin token
    // (p. ej. credenciales incorrectas en el login) solo se reporta.
    if (response.status === 401 && token) {
      clearToken();
      unauthorizedHandler?.();
    }
    throw new ApiError(errorMessage(data, response.status), response.status, data);
  }

  return data;
}

export const http = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};
