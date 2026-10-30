/** @type {import('@stryker-mutator/api/core').StrykerOptions} */
export default {
  testRunner: 'vitest',
  coverageAnalysis: 'perTest',
  mutate: ['src/core/**/*.ts'],
  // TypeScript 7 (kompilator natywny) nie udostępnia API JS, więc preprocesor
  // tsconfig w Strykerze pada na `ts.parseConfigFileTextToJson`. Wskazanie
  // nieistniejącego pliku wyłącza ten preprocesor; typy sprawdza osobny krok CI.
  tsconfigFile: 'tsconfig.stryker-disabled.json',
  reporters: ['clear-text', 'progress', 'json', 'html'],
  jsonReporter: { fileName: 'reports/mutation.json' },
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  thresholds: { high: 80, low: 60, break: 50 },
  timeoutMS: 30000,
};
