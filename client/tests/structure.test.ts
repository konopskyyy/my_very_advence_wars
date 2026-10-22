import { describe, expect, it } from 'vitest';

const STRUCTURE_FILE = './structure.test.ts';

const testFiles = Object.keys(import.meta.glob('./**/*.test.ts')).filter((file) => file !== STRUCTURE_FILE);
const sourceFiles = new Set(Object.keys(import.meta.glob('../src/**/*.ts')));

const mirrorPath = (testFile: string) => testFile.replace(/^\.\//, '../src/').replace(/\.test\.ts$/, '.ts');

describe('struktura testów', () => {
  it('każdy test ma moduł o tej samej ścieżce w src', () => {
    expect(testFiles.length).toBeGreaterThan(0);

    for (const file of testFiles) {
      expect(sourceFiles.has(mirrorPath(file)), `brak ${mirrorPath(file)} dla ${file}`).toBe(true);
    }
  });

  it('w src nie ma plików testowych', () => {
    expect([...sourceFiles].filter((file) => file.endsWith('.test.ts'))).toEqual([]);
  });
});
