import { describe, expect, it } from 'vitest';
import { isGameEntry } from '../../src/view/gameEntry';

describe('isGameEntry', () => {
  it('startuje grę bezpośrednio pod /game i /game/', () => {
    expect(isGameEntry('/game', '')).toBe(true);
    expect(isGameEntry('/game/', '')).toBe(true);
  });

  it('pokazuje stronę startową pod /', () => {
    expect(isGameEntry('/', '')).toBe(false);
    expect(isGameEntry('/index.html', '')).toBe(false);
  });

  it('traktuje ?desktop=1 jak wejście do gry', () => {
    expect(isGameEntry('/', '?desktop=1')).toBe(true);
    expect(isGameEntry('/index.html', '?desktop=1')).toBe(true);
  });

  it('nie reaguje na inne parametry', () => {
    expect(isGameEntry('/', '?foo=1')).toBe(false);
  });
});
