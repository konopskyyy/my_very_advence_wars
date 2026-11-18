export interface AuthUser {
  readonly id: number;
  readonly email: string;
  readonly createdAt: string;
}

export interface AuthSession {
  readonly token: string;
  readonly refreshToken?: string;
  readonly user: AuthUser;
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

const NETWORK_MESSAGE = 'Nie można połączyć się z serwerem. Spróbuj ponownie.';
const UNKNOWN_MESSAGE = 'Coś poszło nie tak. Spróbuj ponownie.';

function resolveApiBase(): string {
  if (typeof window === 'undefined') {
    return '/api';
  }

  if (window.location.protocol === 'app:') {
    return 'http://localhost:18080/api';
  }

  return '/api';
}

async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function errorMessage(response: Response, body: unknown, path: string): string {
  if (response.status === 401) {
    if (path === '/auth/google') {
      return 'Logowanie Google nie powiodło się. Spróbuj ponownie.';
    }

    if (path === '/auth/refresh') {
      return 'Sesja wygasła. Zaloguj się ponownie.';
    }

    return 'Nieprawidłowy e-mail lub hasło.';
  }

  if (response.status === 403) {
    return 'Nie udało się potwierdzić adresu e-mail w Google.';
  }

  if (response.status === 409) {
    return 'Ten e-mail jest już zarejestrowany.';
  }

  if (response.status === 422) {
    return 'Sprawdź e-mail i hasło: hasło musi mieć od 8 do 72 znaków.';
  }

  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
    return body.error;
  }

  return UNKNOWN_MESSAGE;
}

async function request(
  path: string,
  init: RequestInit,
  fetchImpl: typeof fetch,
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');

  let response: Response;

  try {
    response = await fetchImpl(`${resolveApiBase()}${path}`, { ...init, headers });
  } catch {
    throw new AuthError(NETWORK_MESSAGE, 0);
  }

  if (!response.ok) {
    throw new AuthError(errorMessage(response, await readBody(response), path), response.status);
  }

  return response;
}

function parseUser(value: unknown): AuthUser {
  if (!value || typeof value !== 'object') {
    throw new AuthError(UNKNOWN_MESSAGE, 0);
  }

  const user = value as Partial<AuthUser>;

  if (typeof user.id !== 'number' || typeof user.email !== 'string') {
    throw new AuthError(UNKNOWN_MESSAGE, 0);
  }

  return {
    id: user.id,
    email: user.email,
    createdAt: typeof user.createdAt === 'string' ? user.createdAt : '',
  };
}

async function parseSession(response: Response): Promise<AuthSession> {
  const body = (await readBody(response)) as
    | { token?: unknown; refreshToken?: unknown; user?: unknown }
    | undefined;

  if (!body || typeof body.token !== 'string') {
    throw new AuthError(UNKNOWN_MESSAGE, 0);
  }

  const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : undefined;

  return {
    token: body.token,
    ...(refreshToken ? { refreshToken } : {}),
    user: parseUser(body.user),
  };
}

export async function login(
  email: string,
  password: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AuthSession> {
  const response = await request(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    fetchImpl,
  );

  return parseSession(response);
}

export async function register(
  email: string,
  password: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AuthSession> {
  const response = await request(
    '/auth/register',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    fetchImpl,
  );

  return parseSession(response);
}

export async function googleLogin(
  credential: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AuthSession> {
  const response = await request(
    '/auth/google',
    { method: 'POST', body: JSON.stringify({ credential }) },
    fetchImpl,
  );

  return parseSession(response);
}

export async function refreshSession(
  refreshToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AuthSession> {
  const response = await request(
    '/auth/refresh',
    { method: 'POST', body: JSON.stringify({ refreshToken }) },
    fetchImpl,
  );

  return parseSession(response);
}

export async function logoutSession(
  refreshToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  await request(
    '/auth/logout',
    { method: 'POST', body: JSON.stringify({ refreshToken }) },
    fetchImpl,
  );
}

export async function fetchMe(
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AuthUser> {
  const response = await request(
    '/auth/me',
    { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
    fetchImpl,
  );

  return parseUser(await readBody(response));
}
