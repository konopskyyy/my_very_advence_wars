#!/bin/bash

# Zakończ w przypadku błędu
set -e

echo "=== Aktualizacja pakietów i instalacja zależności GUI ==="
sudo apt update

# Wykrywanie właściwej wersji libasound (libasound2t64 dla nowszych Ubuntu, libasound2 dla starszych)
if apt-cache show libasound2t64 >/dev/null 2>&1; then
    SOUND_PKG="libasound2t64"
else
    SOUND_PKG="libasound2"
fi

# Instalacja zaktualizowanej listy zależności
sudo apt install -y wget libfuse2 libgtk-3-0 libxml2-dev libxslt1-dev "$SOUND_PKG" libgbm1 libxss1 libnss3

echo "=== Pobieranie najnowszej wersji Obsidian ==="
LATEST_URL=$(curl -s https://api.github.com/repos/obsidianmd/obsidian-releases/releases/latest | grep "browser_download_url.*AppImage" | tail -n 1 | cut -d '"' -f 4)

if [ -z "$LATEST_URL" ]; then
    echo "Nie udało się znaleźć adresu pobierania AppImage. Sprawdź połączenie z internetem."
    exit 1
fi

mkdir -p ~/.local/bin
wget -O ~/.local/bin/Obsidian.AppImage "$LATEST_URL"

echo "=== Nadawanie uprawnień do uruchomienia ==="
chmod +x ~/.local/bin/Obsidian.AppImage

echo "=== Tworzenie aliasu dla wygody ==="
if ! grep -q "alias obsidian=" ~/.bashrc; then
    echo 'alias obsidian="~/.local/bin/Obsidian.AppImage --no-sandbox"' >> ~/.bashrc
    echo "Dodano alias 'obsidian' do ~/.bashrc"
fi

echo ""
echo "=== Instalacja zakończona sukcesem! ==="
echo "Uruchom polecenie: source ~/.bashrc"
echo "Następnie wpisz: obsidian"
