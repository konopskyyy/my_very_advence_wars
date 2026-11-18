'use strict';

const http = require('node:http');
const { shell } = require('electron');
const {
  AUTHORIZATION_ENDPOINT,
  DESKTOP_CLIENT_ID,
  SCOPES,
  TIMEOUT_MS,
  TOKEN_ENDPOINT,
} = require('./googleConfig.cjs');
const { createPkce, createState } = require('./googlePkce.cjs');

function resultPage(message, ok) {
  const color = ok ? '#8fd14f' : '#ff6b6b';
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>My Very Advance Wars</title></head><body style="background:#0b0b0b;color:#e8e8e8;font:16px sans-serif;display:grid;place-items:center;height:100vh;margin:0"><p style="border:1px solid ${color};padding:24px">${message}</p></body></html>`;
}

async function exchangeCodeForIdToken({
  code,
  codeVerifier,
  redirectUri,
  clientId = DESKTOP_CLIENT_ID,
  fetchImpl = fetch,
}) {
  const body = new URLSearchParams({
    client_id: clientId,
    code,
    code_verifier: codeVerifier,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  const response = await fetchImpl(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || typeof payload.id_token !== 'string') {
    throw new Error('Google nie wydał tokenu logowania.');
  }

  return payload.id_token;
}

async function requestGoogleIdToken({
  clientId = DESKTOP_CLIENT_ID,
  fetchImpl = fetch,
  openExternal = shell.openExternal,
  timeoutMs = TIMEOUT_MS,
} = {}) {
  if (!clientId) {
    throw new Error('Brak konfiguracji Google. Ustaw MVAW_GOOGLE_DESKTOP_CLIENT_ID.');
  }

  const { verifier, challenge } = createPkce();
  const state = createState();
  let server;
  let redirectUri;

  try {
    const { code } = await new Promise((resolve, reject) => {
      let timer;
      let settled = false;

      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        callback(value);
      };

      server = http.createServer((request, response) => {
        const url = new URL(request.url, 'http://127.0.0.1');

        if (url.pathname !== '/callback') {
          response.writeHead(404);
          response.end();
          return;
        }

        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

        if (url.searchParams.get('state') !== state) {
          response.end(resultPage('Logowanie Google nie powiodło się. Wróć do gry i spróbuj ponownie.', false));
          finish(reject, new Error('Nieprawidłowy stan logowania Google.'));
          return;
        }

        const authorizationCode = url.searchParams.get('code');
        if (!authorizationCode) {
          response.end(resultPage('Logowanie Google nie powiodło się. Wróć do gry i spróbuj ponownie.', false));
          finish(reject, new Error(url.searchParams.get('error') || 'Google nie zwrócił kodu autoryzacji.'));
          return;
        }

        response.end(resultPage('Logowanie zakończone. Wróć do gry.', true));
        finish(resolve, { code: authorizationCode });
      });

      server.on('error', (error) => finish(reject, error));

      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        redirectUri = `http://127.0.0.1:${address.port}/callback`;
        const authorizationUrl = new URL(AUTHORIZATION_ENDPOINT);
        authorizationUrl.search = new URLSearchParams({
          client_id: clientId,
          code_challenge: challenge,
          code_challenge_method: 'S256',
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: SCOPES,
          state,
        }).toString();

        void Promise.resolve(openExternal(authorizationUrl.toString())).catch((error) =>
          finish(reject, error),
        );
      });

      timer = setTimeout(() => {
        finish(reject, new Error('Logowanie Google trwało zbyt długo. Spróbuj ponownie.'));
      }, timeoutMs);
    });

    return await exchangeCodeForIdToken({
      code,
      codeVerifier: verifier,
      redirectUri,
      clientId,
      fetchImpl,
    });
  } finally {
    server?.close();
  }
}

module.exports = { exchangeCodeForIdToken, requestGoogleIdToken };
