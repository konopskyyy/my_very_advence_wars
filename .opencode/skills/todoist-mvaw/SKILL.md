---
name: Todoist gra MVAW
description: Użyj przy dodawaniu, szukaniu, aktualizacji i completowaniu zadań Todoist dla gry My Very Advance Wars — wymusza sekcję „Gra my very advance wars" w projekcie „Programowanko" i zestaw etykiet FE/BE/devops/wazne.
---

# Todoist gra MVAW

Jedyne miejsce na zadania gry: projekt **Programowanko**, sekcja **Gra my very
advance wars**. Nie dodawaj zadań do Inboxu ani do innych projektów bez pytania.

## Narzędzia

Narzędzia Todoist są dostępne tylko przez `execute` (`tools.todoist[...]`).
Jeśli nazwa nie jest widoczna w katalogu, znajdź ją przez `search({ query: "todoist" })`
i wywołaj dokładnie zwróconą ścieżkę.

Identyfikatory z konta (sprawdź je nazwą, gdy coś się nie zgadza):

| Obiekt | ID |
| --- | --- |
| Projekt `Programowanko` | `6X3wJHXJfmMf6RG8` |
| Sekcja `Gra my very advance wars` | `6j2rqM3hR5XGvmH8` |

Przed dodaniem:

1. `get-overview({})` — potwierdź projekt i sekcję po nazwie.
2. `find-tasks({ sectionId: "6j2rqM3hR5XGvmH8", limit: 30 })` — sprawdź duplikaty.
3. `find-labels({})` — potwierdź etykiety.

Dodawaj jednym wywołaniem `add-tasks` z `projectId`, `sectionId` i `labels`.
Nie nadawaj dat ani priorytetów, jeśli użytkownik nie poprosił — domyślnie `p4`.

## Etykiety

Używaj tylko istniejących etykiet:

| Etykieta | Kiedy |
| --- | --- |
| `BE` | praca w `server/`, API, Doctrine, Symfony |
| `FE` | praca w `client/`, UI, Phaser, testy Vitest |
| `devops` | Docker, Makefile, CI, Electron, dokumentacja infrastruktury |
| `ważne` | zadanie blokujące inne prace (np. sesja przed zapisami) |
| `jakość` | refaktoring, testy, lint, metryki |
| `szybkie` | drobna poprawka do zrobienia od ręki |
| `przeczytać` | lektura/analiza, nie implementacja |
| `ai zrobione` | tylko gdy praca została już wykonana przez agenta |
| `czeka` | zadanie odłożone: czeka na zewnętrzne wydanie, decyzję albo wolne moce |
| `fastapp-user` | sprawy zewnętrznego narzędzia, nie kod gry |

Nowej etykiety nie twórz bez wyraźnego polecenia.

## Tytuły i opisy

- Tytuł: `ID-ZADANIA: Krótka nazwa` (np. `SRV-003: Weryfikacja ID tokenu Google w API`),
  zgodny z `specification/Zadania.md`.
- Opis: link do sekcji w `specification/Zadania-opisy.md`, jedno zdanie kontekstu
  i 3–5 kryteriów z dokumentacji. Nie kopiuj całej specyfikacji.
- Zmianę statusu w `specification/Zadania.md` (⬜ → ✅) rób dopiero po
  zakończeniu pracy, nie w momencie dodawania zadania do Todoist.

## Nie mieszaj

Nie używaj tego skillu do zadań domowych, angielskiego ani projektu Interview —
nawet jeśli nazwa sekcji jest podobna. W razie wątpliwości zapytaj.
