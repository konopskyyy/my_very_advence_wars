'use strict';

const { createHash, randomBytes } = require('node:crypto');

function base64url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createPkce() {
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash('sha256').update(verifier, 'ascii').digest());
  return { verifier, challenge };
}

function createState() {
  return base64url(randomBytes(24));
}

module.exports = { base64url, createPkce, createState };
