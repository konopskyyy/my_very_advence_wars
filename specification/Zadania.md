# Zadania

Zadania spoza tej listy się nie robi — nową pracę dopisuj do tabeli poniżej
(zasady w `AGENTS.md`). Tabela jest **jedynym źródłem statusu i powiązań**;
kontekst, opis i kryteria leżą wyłącznie w [[Zadania-opisy]].

Status: ✅ zrobione · 🚧 w toku · ⬜ do zrobienia

Zadania zduplikowane i wersje zastąpione późniejszą pracą leżą w
[[Archiwum-zadan]]. **Archiwum nie jest źródłem pracy** — nie szukaj tam
zadań do wykonania.

## Przegląd

| ID | Zadanie | Status | Powiązane |
| --- | --- | --- | --- |
| [[Zadania-opisy#GRA-001: Edytor mapy\|GRA-001]] | Edytor mapy | ✅ | ADR-003, ADR-004, ADR-005, INTERF-003 |
| [[Zadania-opisy#GRA-002: Model jednostek\|GRA-002]] | Model jednostek | 🚧 | ADR-003 |
| [[Zadania-opisy#GRA-003: Zapis i wczytywanie map\|GRA-003]] | Zapis i wczytywanie map | ⬜ | ADR-005, INTERF-003 |
| [[Zadania-opisy#GRA-004: Podstawa budowy mapek\|GRA-004]] | Podstawa budowy mapek | ✅ | ADR-004, ADR-005, GRA-001, GRA-003, INTERF-003 |
| [[Zadania-opisy#GRA-005: Punkt bazowy — stan po ostatnim commicie\|GRA-005]] | Punkt bazowy — stan po ostatnim commicie | ✅ | GRA-001, GRA-004, ADR-004, ADR-005 |
| [[Zadania-opisy#GRA-006: Rozbudowa generatora map\|GRA-006]] | Rozbudowa generatora map | ✅ | GRA-001, GRA-003, GRA-004, GRA-005, ADR-004, ADR-005, INTERF-003 |
| [[Zadania-opisy#GRA-007: Moduł mapy i algorytm układu heks\|GRA-007]] | Moduł mapy i algorytm układu heks | ✅ | GRA-004, GRA-005, GRA-006, ADR-004, ADR-005, ADR-006, INTERF-003, INTERF-004 |
| [[Zadania-opisy#GRA-008: Narzędzia deweloperskie i dev bar mapy\|GRA-008]] | Narzędzia deweloperskie i dev bar mapy | ✅ | GRA-006, ADR-007, INTERF-003 |
| [[Zadania-opisy#GRA-009: Menu bez pola bitwy, z wyjściem z gry\|GRA-009]] | Menu bez pola bitwy, z wyjściem z gry | ✅ | GRA-001, INTERF-001, INTERF-002, INTERF-003 |
| [[Zadania-opisy#GRA-010: Strona gry bez paska przewijania\|GRA-010]] | Strona gry bez paska przewijania | ✅ | GRA-009, INTERF-001 |
| [[Zadania-opisy#GRA-011: Podwojone kolumny w odczycie edytora\|GRA-011]] | Podwojone kolumny w odczycie edytora | ✅ | ADR-004, ADR-005, GRA-001, INTERF-003 |
| [[Zadania-opisy#GRA-012: Jednostki w edytorze map\|GRA-012]] | Jednostki w edytorze map | ✅ | GRA-002, GRA-003, ADR-003, ADR-011, INTERF-003 |
| [[Zadania-opisy#GRA-013: Testy klienta w lustrzanym drzewie\|GRA-013]] | Testy klienta w lustrzanym drzewie | ✅ | ADR-008, `specification/Konwencje.md` |
| [[Zadania-opisy#GRA-014: CI typów TypeScript\|GRA-014]] | CI typów TypeScript | ✅ | ADR-009, `specification/Infrastruktura.md` |
| [[Zadania-opisy#GRA-015: Rzeczownikowy opis commitów\|GRA-015]] | Rzeczownikowy opis commitów | ✅ | ADR-010, `AGENTS.md` |
| [[Zadania-opisy#GRA-016: Menu wyboru terenu i jednostek\|GRA-016]] | Menu wyboru terenu i jednostek | ✅ | GRA-012, ADR-011, ADR-012, INTERF-003 |
| [[Zadania-opisy#GRA-017: Wybór mapy przy wejściu do edytora\|GRA-017]] | Wybór mapy przy wejściu do edytora | ✅ | GRA-006, GRA-009, ADR-013, INTERF-001, INTERF-004 |
| [[Zadania-opisy#GRA-018: Tymczasowo zawsze widoczny pasek dev\|GRA-018]] | Tymczasowo zawsze widoczny pasek dev | ✅ | GRA-008, ADR-014, INTERF-003 |
| [[Zadania-opisy#GRA-019: Pełny ekran 16:9\|GRA-019]] | Pełny ekran 16:9 | ✅ | GRA-016, ADR-015, INTERF-003 |
| [[Zadania-opisy#GRA-020: Menu scenariuszy i duża mapa testowa\|GRA-020]] | Menu scenariuszy i duża mapa testowa | ✅ | GRA-012, ADR-016, INTERF-001, INTERF-005 |
| [[Zadania-opisy#GRA-021: Zapis map w wewnętrznym SQLite\|GRA-021]] | Zapis map w wewnętrznym SQLite | ✅ | GRA-003, GRA-020, ADR-017, INTERF-004, INTERF-005, INTERF-006 |
| [[Zadania-opisy#GRA-022: Wspólny moduł widoku mapy\|GRA-022]] | Wspólny moduł widoku mapy | ✅ | GRA-007, GRA-020, GRA-024, ADR-001, ADR-018, INTERF-003, INTERF-005 |
| [[Zadania-opisy#GRA-023: Przewijane listy map i scenariuszy\|GRA-023]] | Przewijane listy map i scenariuszy | ✅ | GRA-017, GRA-020, ADR-018, INTERF-004, INTERF-005 |
| [[Zadania-opisy#GRA-024: Przewijanie kamery krawędzią ekranu\|GRA-024]] | Przewijanie kamery krawędzią ekranu | ✅ | GRA-022, ADR-018, INTERF-003, INTERF-005 |
| [[Zadania-opisy#GRA-025: Zapisana wersja mapy wbudowanej w menu map\|GRA-025]] | Zapisana wersja mapy wbudowanej w menu map | ✅ | GRA-017, GRA-021, GRA-023, INTERF-004 |
| [[Zadania-opisy#GRA-026: Wersjonowane migracje SQLite\|GRA-026]] | Wersjonowane migracje SQLite | ⬜ | GRA-021, GRA-025, ADR-019, INTERF-006 |
| [[Zadania-opisy#GRA-027: Grywalny scenariusz — tury, armie, ruch i stały interfejs\|GRA-027]] | Grywalny scenariusz — tury, armie, ruch i stały interfejs | ✅ | GRA-020, GRA-021, ADR-016, ADR-020, ADR-021, ADR-022, ADR-023, ADR-024, INTERF-005 |
| [[Zadania-opisy#GRA-028: Nazwa mapy w edytorze\|GRA-028]] | Nazwa mapy w edytorze | ✅ | GRA-021, ADR-017, ADR-025, INTERF-003, INTERF-004 |
| [[Zadania-opisy#GRA-029: Menu scenariuszy z podglądem i edycją mapy\|GRA-029]] | Menu scenariuszy z podglądem i edycją mapy | ✅ | GRA-020, GRA-021, GRA-023, GRA-025, GRA-027, GRA-028, ADR-017, ADR-019, ADR-021, ADR-026, INTERF-004, INTERF-005, INTERF-006 |
| [[Zadania-opisy#GRA-030: Pełny ruch jednostek z trasą i animacją\|GRA-030]] | Pełny ruch jednostek z trasą i animacją | ✅ | GRA-027, ADR-001, ADR-022, ADR-027, INTERF-005 |
| [[Zadania-opisy#GRA-031: Kafelki terenu SVG z wariantami\|GRA-031]] | Kafelki terenu SVG z wariantami | ✅ | GRA-001, GRA-022, ADR-001, ADR-028, INTERF-003, INTERF-005 |
| [[Zadania-opisy#GRA-032: Pusta lista w menu map\|GRA-032]] | Pusta lista w menu map | ✅ | GRA-017, GRA-023, ADR-013, ADR-018, INTERF-004 |
| [[Zadania-opisy#GRA-033: Nowe grafiki kafelków i las\|GRA-033]] | Nowe grafiki kafelków i las | ✅ | GRA-031, ADR-028, INTERF-003 |
| [[Zadania-opisy#GRA-034: Wzmocnienie testów pod mutacje\|GRA-034]] | Wzmocnienie testów pod mutacje | ✅ | INFRA-002, GRA-013 |
| [[Zadania-opisy#GRA-035: Kolorystyka interfejsu zależna od tury\|GRA-035]] | Kolorystyka interfejsu zależna od tury | ✅ | GRA-027, ADR-020, ADR-024, INTERF-005 |
| [[Zadania-opisy#GRA-036: Symulacja ruchu w module mapy\|GRA-036]] | Symulacja ruchu w module mapy | ✅ | GRA-030, ADR-001, ADR-027 |
| [[Zadania-opisy#GRA-037: Moduł integracji z SQLite\|GRA-037]] | Moduł integracji z SQLite | ✅ | ADR-017, GRA-025 |
| [[Zadania-opisy#GRA-038: Mgła wojny i zasięg wzroku jednostek\|GRA-038]] | Mgła wojny i zasięg wzroku jednostek | ✅ | GRA-002, GRA-027, ADR-003, ADR-020, ADR-030, INTERF-003, INTERF-005, `specification/Mapy.md` |
| [[Zadania-opisy#GRA-039: Zasięgi ruchu, wzroku i strzału na mapie\|GRA-039]] | Zasięgi ruchu, wzroku i strzału na mapie | ✅ | GRA-002, GRA-027, GRA-030, GRA-038, ADR-001, ADR-003, ADR-031, INTERF-005, `specification/Mapy.md` |
| [[Zadania-opisy#GRA-040: Atak jednostek z obrażeniami i usuwaniem\|GRA-040]] | Atak jednostek z obrażeniami i usuwaniem | ✅ | GRA-002, GRA-027, GRA-030, GRA-039, ADR-001, ADR-003, ADR-032, INTERF-005, `specification/Mapy.md` |
| [[Zadania-opisy#GRA-041: Artyleria z pełnym zasięgiem i ruchowym kosztem strzału\|GRA-041]] | Artyleria z pełnym zasięgiem i ruchowym kosztem strzału | ✅ | GRA-002, GRA-039, GRA-040, ADR-001, ADR-032, ADR-033, INTERF-005, `specification/Mapy.md` |
| [[Zadania-opisy#SRV-001: Warstwowy moduł auth z encją użytkownika\|SRV-001]] | Warstwowy moduł auth z encją użytkownika | ✅ | ADR-029, API-001 |
| [[Zadania-opisy#SRV-002: Rejestracja i logowanie JWT\|SRV-002]] | Rejestracja i logowanie JWT | ✅ | SRV-001, ADR-029, API-001 |
| INFRA-001 | Środowisko Docker | ✅ | `specification/Infrastruktura.md` |
| [[Zadania-opisy#INFRA-002: Testy jednostkowe i mutacyjne w CI\|INFRA-002]] | Testy jednostkowe i mutacyjne w CI | ✅ | INFRA-001, `specification/Infrastruktura.md` |
| [[Zadania-opisy#INFRA-003: Testy backendu i mutacje w CI\|INFRA-003]] | Testy backendu i mutacje w CI | ✅ | INFRA-002, SRV-001, SRV-002, `specification/Infrastruktura.md` |
| [[Zadania-opisy#INFRA-004: Paczka Electrona dla Windows z WSL\|INFRA-004]] | Paczka Electrona dla Windows z WSL | ✅ | INFRA-001, `specification/Infrastruktura.md`, `specification/Mapy.md` |
| [[Zadania-opisy#INFRA-005: Hooki git z Husky i pre-commit\|INFRA-005]] | Hooki git z Husky i pre-commit | ✅ | INFRA-001, INFRA-002, `specification/Infrastruktura.md`, ADR-010 |
| [[Zadania-opisy#INFRA-006: Audyt narzędzi oceny jakości kodu\|INFRA-006]] | Audyt narzędzi oceny jakości kodu | ✅ | INFRA-002, `specification/Jakosc-kodu.md`, `specification/Infrastruktura.md` |
| [[Zadania-opisy#INFRA-007: Wspólny build gry w server/public/game\|INFRA-007]] | Wspólny build gry w server/public/game | ✅ | INFRA-001, INFRA-004, INTERF-008, `specification/Infrastruktura.md` |
| [[Zadania-opisy#GRA-042: Menu kampanii z wstążkami i kafelkami samouczka\|GRA-042]] | Menu kampanii z wstążkami i kafelkami samouczka | ✅ | INTERF-001, INTERF-007, ZAL-011 |
| [[Zadania-opisy#GRA-043: Pierwsza misja samouczka — Pierwsze kroki\|GRA-043]] | Pierwsza misja samouczka — Pierwsze kroki | 🚧 | GRA-042, INTERF-002, INTERF-007, ZAL-006, ZAL-011 |
| [[Zadania-opisy#GRA-044: Zasięg strzału zgodny z akcją jednostki\|GRA-044]] | Zasięg strzału zgodny z akcją jednostki | ✅ | GRA-039, GRA-040, GRA-041, ADR-031, ADR-032, ADR-033, INTERF-005 |
| [[Zadania-opisy#GRA-046: Przycisk kupowania jednostek z oknem podglądu\|GRA-046]] | Przycisk kupowania jednostek z oknem podglądu | ✅ | GRA-027, ADR-001, ADR-020, INTERF-005 |
| [[Zadania-opisy#GRA-049: Ruch w pasku zgodny z rzeczywistymi możliwościami\|GRA-049]] | Ruch w pasku zgodny z rzeczywistymi możliwościami | ✅ | GRA-041, GRA-047 (archiwum), ADR-033, INTERF-005 |
| [[Zadania-opisy#GRA-050: Mgła wojny z pamięcią odkrytych pól\|GRA-050]] | Mgła wojny z pamięcią odkrytych pól | ✅ | GRA-038, GRA-048 (archiwum), ADR-001, ADR-030, ADR-034, INTERF-005, `specification/Mapy.md` |
| [[Zadania-opisy#GRA-051: Animacja strzału i dźwięki walki\|GRA-051]] | Animacja strzału i dźwięki walki | ✅ | GRA-040, ADR-001, ADR-032, ADR-035, INTERF-005 |
| [[Zadania-opisy#GRA-052: Dźwięk ruchu piechoty\|GRA-052]] | Dźwięk ruchu piechoty | ✅ | GRA-051, ADR-001, ADR-035, INTERF-005 |
| [[Zadania-opisy#GRA-053: Klasa broni i dźwięki jako dane jednostki\|GRA-053]] | Klasa broni i dźwięki jako dane jednostki | ✅ | GRA-051, GRA-052, ADR-001, ADR-035, ADR-037, INTERF-005, ZAL-004 |
| [[Zadania-opisy#GRA-054: Dźwięk kliknięcia przycisków i śmierci piechoty\|GRA-054]] | Dźwięk kliknięcia przycisków i śmierci piechoty | ✅ | GRA-051, GRA-053, ADR-001, ADR-035, ADR-037, INTERF-005, ZAL-004 |
| [[Zadania-opisy#GRA-055: Ruch kafelek po kafelku i pociski wynikające z ruchu\|GRA-055]] | Ruch kafelek po kafelku i pociski wynikające z ruchu | ✅ | GRA-041, GRA-049, ADR-001, ADR-027, ADR-033, ADR-036, INTERF-005, ZAL-004, ZAL-005, ZAL-006, `specification/Mapy.md` |
| [[Zadania-opisy#GRA-056: Czytelna animacja strzału\|GRA-056]] | Czytelna animacja strzału | ✅ | GRA-051, ADR-001, ADR-035, INTERF-005 |
| [[Zadania-opisy#GRA-057: Planer tury z osią czasu i równoległe odtwarzanie\|GRA-057]] | Planer tury z osią czasu i równoległe odtwarzanie | ✅ | GRA-055, ADR-001, ADR-027, ADR-033, ADR-035, ADR-036, ADR-038, ADR-039, ADR-040, ZAL-005, ZAL-006, INTERF-005 |
| [[Zadania-opisy#GRA-060: Zapis planów tur i replay w SQLite\|GRA-060]] | Zapis planów tur i replay w SQLite | ✅ | GRA-057, ADR-019, ADR-041, INTERF-006 |
| [[Zadania-opisy#GRA-061: Dopracowanie planera i odtwarzania rozgrywki\|GRA-061]] | Dopracowanie planera i odtwarzania rozgrywki | ⬜ | GRA-060, GRA-043, ADR-040, ADR-041, ZAL-005, ZAL-006, INTERF-005, INTERF-006, INTERF-007 |
| [[Zadania-opisy#GRA-062: SI wroga — reguła zachowania z priorytetem\|GRA-062]] | SI wroga — reguła zachowania z priorytetem | ✅ | GRA-057, ADR-001, ADR-039, ADR-042, ZAL-004, ZAL-006, ZAL-012, INTERF-005 |
| [[Zadania-opisy#GRA-063: Linie strzału w planerze tury\|GRA-063]] | Linie strzału w planerze tury | ✅ | GRA-057, ADR-001, ADR-039, INTERF-005 |
| [[Zadania-opisy#GRA-064: Zasięg na hover i dwuklik potwierdzający ruch\|GRA-064]] | Zasięg na hover i dwuklik potwierdzający ruch | ✅ | GRA-057, GRA-063, ADR-001, ADR-039, INTERF-005 |
| [[Zadania-opisy#GRA-065: Potwierdzanie ataku i usuwanie akcji z planera\|GRA-065]] | Potwierdzanie ataku i usuwanie akcji z planera | ✅ | GRA-057, GRA-063, GRA-064, ADR-001, ADR-039, INTERF-005 |
| [[Zadania-opisy#GRA-066: Demo strony logowania i rejestracji\|GRA-066]] | Demo strony logowania i rejestracji | ✅ | INTERF-008, SRV-002, API-001 |
| [[Zadania-opisy#GRA-067: Strona główna klienta\|GRA-067]] | Strona główna klienta | 🚧 | GRA-066, INTERF-008, INTERF-001 |
| [[Zadania-opisy#GRA-068: Ruch po strzale z wspólnego budżetu\|GRA-068]] | Ruch po strzale z wspólnego budżetu | ✅ | GRA-041, GRA-055, ADR-033, ADR-043, ZAL-004, ZAL-006, INTERF-005 |
| [[Zadania-opisy#GRA-069: Zwiadowca z wzrokiem na całą mapę\|GRA-069]] | Zwiadowca z wzrokiem na całą mapę | ✅ | GRA-038, GRA-050, ADR-001, ADR-030, ZAL-004, INTERF-005 |
| [[Zadania-opisy#GRA-070: Bezpłatna rekrutacja jednostek z okna KUP\|GRA-070]] | Bezpłatna rekrutacja jednostek z okna KUP | ✅ | GRA-046, GRA-068, ADR-001, ADR-020, ADR-044, ZAL-009, INTERF-005 |
| [[Zadania-opisy#GRA-071: Kolorowe strzałki ruchu i koniec na zwolnionym heksie\|GRA-071]] | Kolorowe strzałki ruchu i koniec na zwolnionym heksie | ✅ | GRA-057, GRA-064, ADR-001, ADR-039, ADR-045, ZAL-004, INTERF-005 |
