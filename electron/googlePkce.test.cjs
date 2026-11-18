'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const test = require('node:test');
const { base64url, createPkce, createState } = require('./googlePkce.cjs');

test('PKCE S256 odpowiada weryfikatorowi', () => {
  const { verifier, challenge } = createPkce();

  assert.match(verifier, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(challenge, base64url(createHash('sha256').update(verifier, 'ascii').digest()));
});

test('state jest nieprzewidywalny i unikalny', () => {
  const first = createState();
  const second = createState();

  assert.match(first, /^[A-Za-z0-9_-]{32}$/);
  assert.notEqual(first, second);
});
