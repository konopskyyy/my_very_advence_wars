# My Very Advance Wars

Gra turowa w stylu *Advance Wars*: klient TypeScript + Phaser + Vite, backend
Symfony, opakowanie desktopowe Electron. Całość działa w Docker Compose,
a Electron uruchamiasz na hoście.

## Szybki start

```bash
make install     # .env z .env.example + hooki git
make up          # kontenery: client (Vite), nginx, server, db
make electron    # build do server/public/game + okno Electrona
```

Przydatne cele:

```bash
make help        # lista celów
make verify      # typy, testy i build do server/public/game
make electron-build  # build gry + rozpakowana paczka Electrona
make test-server     # testy backendu
```

Porty i zmienne środowiskowe są w `.env` (wzór: `.env.example`). Opis
infrastruktury, portów i codziennej pracy: `specification/Infrastruktura.md`.
Zasady pracy z repo: `AGENTS.md`.

## Dźwięk w Electronie (WSL)

Brak dźwięku w Electronie przy działającym dźwięku w przeglądarce oznacza
zwykle brak klienta PulseAudio w WSL. Chromium ładuje `libpulse.so.0` i bez
niego spada na ALSA, a WSLg nie wystawia karty dźwiękowej. W logach widać
`PcmOpen: default,No such file or directory`.

```bash
sudo apt install -y libpulse0
```

Ten sam pakiet instaluje `scripts/install_obsidian.sh`. Po instalacji
zrestartuj Electrona (`make electron`). Szczegóły: `specification/Infrastruktura.md`,
sekcja „Rozwiązywanie problemów” → „W Electronie nie ma dźwięku (WSL)”.
