const DEV_PARAMETER = 'dev';

export function devToolsEnabled(): boolean {
  return new URLSearchParams(window.location.search).get(DEV_PARAMETER) === '1';
}
