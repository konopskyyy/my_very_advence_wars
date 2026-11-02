'use strict';

const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { net, protocol } = require('electron');

const SCHEME = 'app';

// Musi być wywołane przed app.whenReady(), inaczej Electron nie zarejestruje schematu.
function registerDistScheme() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
      },
    },
  ]);
}

function serveDist(root) {
  const base = path.normalize(root + path.sep);

  protocol.handle(SCHEME, async (request) => {
    const url = new URL(request.url);
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const target = path.normalize(path.join(root, relative));

    if (!target.startsWith(base)) {
      return new Response('Forbidden', { status: 403 });
    }

    try {
      return await net.fetch(pathToFileURL(target).toString());
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
}

module.exports = { SCHEME, registerDistScheme, serveDist };
