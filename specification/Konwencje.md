# Konwencje kodu

## Testy klienta

Kod produkcyjny leży w `client/src/`, testy w `client/tests/`. Drzewo testów jest
**lustrem** drzewa `src/` — identyczna nazwa modułu plus `.test.ts`:

| Kod produkcyjny          | Test                           |
| ------------------------ | ------------------------------ |
| `src/core/state.ts`      | `tests/core/state.test.ts`     |
| `src/core/map/model.ts`  | `tests/core/map/model.test.ts` |
| `src/core/map/layout.ts` | `tests/core/map/layout.test.ts` |

Zasady:

- Ścieżka testu to ścieżka modułu z `src/` przeniesiona do `tests/` — bez
  dodatkowych katalogów (`unit/`, `map/` itp.).
- W `src/` nie ma plików `*.test.ts`; katalog `src/` zawiera wyłącznie kod
  produkcyjny.
- Import w teście jest względny i wskazuje dokładnie testowany moduł:
  `import { createMap } from '../../../src/core/map/model'`. Nie używamy
  aliasów (`@/`), żeby ścieżka w teście mówiła wprost, gdzie leży kod.
- Reguły pilnuje `tests/structure.test.ts`: każdy plik testowy musi mieć
  odpowiednik w `src/`, a w `src/` nie może pojawić się test. Ten jeden plik
  jest wyjątkiem od lustra — sam nie ma modułu w `src/`.
- Testy jednostkowe dotyczą `src/core/` (czysta logika bez Phasera, ADR-001).
  `view/` i `scenes/` nie mają testów jednostkowych.

Dodanie testu do nowego modułu `src/core/map/foo.ts` — utwórz
`tests/core/map/foo.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { costam } from '../../../src/core/map/foo';
```

Uruchamianie: `make test` (albo `cd client && npm test`); tryb watch:
`cd client && npm run test:watch`. Vitest bierze wyłącznie `tests/**/*.test.ts`
(`test.include` w `client/vite.config.ts`), a `tsc --noEmit` sprawdza także
testy, bo `tests/` jest w `client/tsconfig.json`.
