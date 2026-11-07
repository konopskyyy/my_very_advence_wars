---
name: Minimalny kontekst
description: Użyj przed eksploracją kodu lub specyfikacji w tym repo — ustala kolejność narzędzi i budżet outputu, żeby nie wysyłać całych plików.
---

# Minimalny kontekst

Cel: wynik jednego narzędzia poniżej ~8 tys. znaków. Najpierw adres, potem treść.

1. **Specyfikacja.** Nie znasz ID? `scripts/spec.sh --find "fraza"` zwraca
   same pliki i nagłówki. Potem `scripts/spec.sh ID` — jedna sekcja na
   wywołanie. Nie używaj `cat`/`sed` na `specification/*.md`.
2. **Kod.** Narzędzie `grep` z `path`/`include` wskazuje pliki i numery
   linii. Potem `read` z `offset`/`limit` (max 80 linii) na wycinek wokół
   trafienia. Shell `grep`/`cat`/`sed`/`head`/`tail` jest zablokowany —
   nie obchodź nim budżetu.
3. **Diff.** Najpierw `git diff --stat`, potem `git diff -- jeden/plik`.
   Nie pełny diff całego repo.
4. **Testy.** `make verify` (klient) albo `make test-server` (backend).
   Nie dopisuj `| tail -80`; `compact-run.sh` już skraca log.
5. **Odpowiedź.** Podaj ścieżkę i numer linii, nie wklejaj plików ani logów.

Jeśli wynik przekroczył budżet, nie dociągaj go w całości — powtórz węższe
zapytanie.
