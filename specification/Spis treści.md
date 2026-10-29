# Spis treści

Dokumenty czytamy **punktowo** — po ID sekcji, nie w całości. Nagłówki są
kotwicami Obsidiana, więc `[[ADR#ADR-022: ...]]` otwiera samą decyzję.

| Dokument | Co zawiera | ID sekcji |
| --- | --- | --- |
| [[ADR]] | decyzje architektoniczne | `ADR-001`… |
| [[Wymagania]] | zakres gry | — |
| [[Interfejs]] | ekrany i sterowanie | `INTERF-001`… |
| [[Mapy]] | model mapy, SQLite, format zapisu | — |
| [[Zadania]] | tabela zadań, statusy, powiązania | `GRA-001`…, `INFRA-001` |
| [[Zadania-opisy]] | kontekst, opis i kryteria zadań | `GRA-001`… |
| [[Infrastruktura]] | Docker, porty, CI | `INFRA-001` |
| [[Konwencje]] | testy, dokumentacja, styl | — |

Przykład: `grep -n "ADR-022" specification/ADR.md`, potem wycinek przez
`sed -n '120,132p' specification/ADR.md`.
