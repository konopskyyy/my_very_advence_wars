# AGENTS.md

Monorepo gry *My Very Advance Wars*: `client/` (TypeScript + Phaser + Vite),
`server/` (Symfony, patrz `server/AGENTS.md`), `electron/` (opakowanie desktopowe),
`docker/` + `docker-compose.yml` (środowisko deweloperskie).

Uruchamianie przez `Makefile` w katalogu głównym — `make help` listuje cele.
Compose czyta `.env` (porty i hasła); wartości domyślane są w `docker-compose.yml`.

## Dokumentacja infrastruktury — obowiązek

`specification/Infrastruktura.md` opisuje **faktyczny stan** infrastruktury
(serwisy, porty, woluminy, zmienne, cele Makefile). Ta notatka i kod muszą się
zgadzać.

Przy **każdej** zmianie infrastruktury zaktualizuj ten dokument **w tym samym
commicie**. Za „zmianę infrastruktury" uznaj:

- `docker-compose.yml` — serwisy, porty, woluminy, zmienne środowiskowe,
- `docker/php/Dockerfile` i `docker/nginx/default.conf`,
- `Makefile` — nowe/usunięte cele,
- `electron/` — sposób uruchamiania i budowania,
- `.env.example` — nowe zmienne.

Kolejność poprawki: najpierw sekcje „Mapa sieci i portów" i „Codzienna praca"
(najszybciej się dezaktualizują), potem pozostałe sekcje, na końcu callouty
w „Rozwiązywanie problemów" (stare porty i polecenia). Nie zostawiaj
nieaktualnych numerów portów — czytelnik wpisze je do terminala.

## Komentarze — tylko gdy wnoszą wiedzę

Domyślnie **nie pisz komentarzy**. Kod ma się tłumaczyć sam nazwami. Komentarz
jest uzasadniony tylko wtedy, gdy wyjaśnia **dlaczego** coś jest zrobione wbrew
oczywistości — czego nie da się odczytać z kodu.

Pisz komentarz, gdy:
- obejście/niespodzianka (np. wolumin nadpisuje `vendor/`, więc autoload znika),
- wybór sprzeczny z intuicją (np. port niestandardowy celowo),
- ograniczenie zewnętrzne (wersja biblioteki, zachowanie frameworka).

Nie pisz komentarzy, które:
- powtarzają kod (`// ustaw tytuł okna` nad `title: ...`),
- opisują oczywiste (`// import zależności`, `// funkcja tworzy okno`),
- są nagłówkiem pliku streszczającym to, co widać w pierwszym akapicie kodu,
- tłumaczą składnię języka.

Sekcje w `docker-compose.yml`/`Makefile` dzielone komentarzem są OK — ale krótko
i tylko tam, gdzie naprawdę pomagają nawigować. Przy edycji istniejącego kodu
usuń komentarze, które przestały być prawdą.

## Inne konwencje

- Kod gry (logika `core/` bez zależności od Phasera) — patrz ADR-001 w
  `specification/ADR.md`. Nie wiąż logiki gry z silnikiem.
- Commity po polsku, styl conventional (`feat:`, `fix:`, `chore:`).
- Nie commituj sekretów: `.env` i `server/.env` są w `.gitignore` i mają tam zostać.
