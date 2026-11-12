export function isGameEntry(pathname: string, search: string): boolean {
  const path = pathname.replace(/\/+$/, '');

  return path === '/game' || new URLSearchParams(search).has('desktop');
}
