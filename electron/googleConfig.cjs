'use strict';

const DESKTOP_CLIENT_ID = process.env.MVAW_GOOGLE_DESKTOP_CLIENT_ID || '';
const AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const SCOPES = 'openid email profile';
const TIMEOUT_MS = 5 * 60 * 1000;

module.exports = {
  AUTHORIZATION_ENDPOINT,
  DESKTOP_CLIENT_ID,
  SCOPES,
  TIMEOUT_MS,
  TOKEN_ENDPOINT,
};
