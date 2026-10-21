# Commity

Commity piszemy **po polsku**, w stylu conventional — prefiks typu + krótka
treść po polsku.

Format: `typ: zdanie po polsku`

Typy:

| Prefiks   | Kiedy używać                                          |
| --------- | ----------------------------------------------------- |
| `feat:`   | nowa funkcjonalność                                   |
| `fix:`    | poprawka błędu                                        |
| `chore:`  | prace porządkowe, konfiguracja, zależności            |
| `docs:`   | wyłącznie zmiany w dokumentacji                        |
| `refactor:` | zmiana struktury kodu bez zmiany zachowania          |
| `test:`   | testy                                                  |
| `build:`  | skrypty budowania, tooling                            |
| `ci:`     | konfiguracja CI                                       |

Zasady:

- Opis po **polsku**, małą literą po dwukropku, bez kropki na końcu.
- Jeden commit = jedna spójna zmiana.
- Zmiana infrastruktury **w tym samym commicie** co aktualizacja
  [[Infrastruktura]] — patrz `AGENTS.md`.

Przykłady:

```
feat: dodaj edytor map w klientze
fix: popraw ładowanie zapisu w Electronie
chore: zaktualizuj zależności Vite
docs: opisz mapę portów w notatce infrastruktury
```
