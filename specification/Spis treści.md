# Spis treści

Dokumenty czytamy **punktowo** — po ID sekcji, nie w całości. Nagłówki są
kotwicami Obsidiana, więc `[[ADR#ADR-022: ...]]` otwiera samą decyzję.

| Dokument | Co zawiera | ID sekcji |
| --- | --- | --- |
| [[Zalozenia]] | reguły i dane rozgrywki | `ZAL-001`… |
| [[ADR]] | decyzje architektoniczne | `ADR-001`… |
| [[Wymagania]] | zakres gry | — |
| [[Interfejs]] | ekrany i sterowanie | `INTERF-001`… |
| [[API]] | endpointy backendu, kontrakt JSON/REST | `API-001`… |
| [[Mapy]] | model mapy, SQLite, format zapisu | — |
| [[Zadania]] | tabela zadań, statusy, powiązania | `GRA-001`…, `SRV-001`…, `INFRA-001` |
| [[Zadania-opisy]] | kontekst, opis i kryteria zadań | `GRA-001`…, `SRV-001`… |
| [[Infrastruktura]] | Docker, porty, CI | `INFRA-001` |
| [[Konwencje]] | testy, logi, dokumentacja, styl | — |

Przykład: `scripts/spec.sh ADR-022` pokazuje tylko jedną decyzję, a
`scripts/spec.sh --list` — spis wszystkich sekcji. Gdy znasz temat, ale nie ID:
`scripts/spec.sh --find "mgła"` zwraca pliki i nagłówki pasujących sekcji. Bez
skryptu: `grep -n "ADR-022" specification/ADR.md`, potem wycinek przez
`sed -n '120,132p' specification/ADR.md`.
