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

## Krótkie logi komend

Polecenia, które dużo wypisują (testy, `tsc`, build), uruchamiaj przez
`scripts/compact-run.sh`. Na ekran trafia status, rozmiar i końcówka logu
(20 linii przy sukcesie, 40 przy błędzie), a pełny wynik zostaje w
`${TMPDIR:-/tmp}/opencode/mvaw`. Logi starsze niż doba są usuwane przy
następnym uruchomieniu.

```bash
scripts/compact-run.sh --label test -- npm test
scripts/compact-run.sh --last   # końcówka ostatniego logu
```

Zmienne `COMPACT_LOG_DIR`, `COMPACT_RETENTION_MINUTES`,
`COMPACT_TAIL_LINES` i `COMPACT_FAIL_TAIL_LINES` zmieniają kolejno katalog,
retencję i liczbę wypisywanych linii. Cele `make check`, `test`, `lint`
i `client-build` korzystają z tego skryptu.

Pliki czytaj przez `read` z `offset`/`limit`, a szukaj przez `grep`
z `path`/`include`. Shell `cat`, `sed`, `head`, `tail`, `grep` i `find` jest
zablokowany w `opencode.jsonc`, żeby jeden zrzut nie zjadał budżetu wyniku.

## Backend Symfony

- Nowe funkcje backendu są **modułami** w `server/src/<Moduł>/`, dzielonymi na
  warstwy: `Domain` (encje, wartości, repozytoria, wyjątki), `Application`
  (przypadki użycia i porty), `Infrastructure` (Doctrine, adaptery frameworka,
  fixtury) i `Presentation` (kontrolery, DTO, listenery). Przykład: `Auth`
  i ADR-029.
- `Domain` nie zna HTTP ani Lexika. Mapowanie Doctrine i kontrakty Symfony
  Security są deklarowane atrybutami na encji (ADR-029); `Application` zależy
  wyłącznie od encji i portów, a implementacje frameworkowe wchodzą
  w `Infrastructure`.
- Testy backendu leżą w `server/tests/` i powtarzają strukturę modułu
  (`tests/Auth/...`). Funkcjonalne testy HTTP dziedziczą po `WebTestCase`,
  a jednostkowe po `TestCase`/`KernelTestCase`.
- Testy backendu działają na SQLite w `APP_ENV=test`; produkcja i dev używają
  MySQL. Migracje generuje `make console make:migration`, a wykonuje
  `make migrate`.
- Zależności PHP dodawaj przez `composer require` (Flex rejestruje bundle
  i konfigurację), a nie ręcznym wpisem w `config/bundles.php`.

## Dokumentacja

- **Czytanie punktowe.** Najpierw `grep -n "<ID>"` w dokumencie, potem wycinek
  przez `sed -n`. Nie wczytuj całych `ADR.md`, `Mapy.md` ani
  `Infrastruktura.md`; kotwice sekcji są w [[Spis treści]].
- **Edycje punktowe.** Zmieniaj tylko sekcję, której dotyczy praca. Nie
  przepisuj całego pliku, gdy wystarczy `edit`; nowe treści dopisuj na końcu.
- **Jedno źródło statusu.** `Zadania.md` trzyma ID, nazwę, status i powiązania.
  `Zadania-opisy.md` trzyma wyłącznie kontekst, opis i kryteria — bez
  powtarzania statusu.
