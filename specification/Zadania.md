# Zadania

Zadania spoza tej listy się nie robi — nową pracę dopisuj do tabeli poniżej
(zasady w `AGENTS.md`). Tabela jest **jedynym źródłem statusu i powiązań**;
kontekst, opis i kryteria leżą wyłącznie w [[Zadania-opisy]].

Status: ✅ zrobione · 🚧 w toku · ⬜ do zrobienia

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
| [[Zadania-opisy#INFRA-001: Środowisko Docker\|INFRA-001]] | Środowisko Docker | ✅ | `specification/Infrastruktura.md` |
| [[Zadania-opisy#INFRA-002: Testy jednostkowe i mutacyjne w CI\|INFRA-002]] | Testy jednostkowe i mutacyjne w CI | ✅ | INFRA-001, `specification/Infrastruktura.md` |
