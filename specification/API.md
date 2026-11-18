# API

Backend Symfony wystawia JSON/REST pod `http://localhost:18080/api` (port z
`BACKEND_PORT`, patrz [[Infrastruktura]]). Dokument opisuje **faktyczny
kontrakt** endpointów; zmiana pola albo kodu odpowiedzi wymaga aktualizacji
tego pliku i testu w `server/tests/`.

Wspólne zasady:

- `Content-Type: application/json` w żądaniach z ciałem,
- `Accept: application/json` w klientach — dzięki temu błędy walidacji i
  wyjątki wracają jako JSON, a nie HTML,
- uwierzytelnienie: nagłówek `Authorization: Bearer <token>` dla ścieżek
  chronionych,
- brak wersjonowania w URL; moduł auth jest pierwszym API i odpowiada pod
  `/api/auth`.

## Status usługi

### `GET /api`

Zwraca informacje o działającym backendzie:

```json
{
  "service": "server",
  "status": "ok",
  "framework": "Symfony 8.x"
}
```

Pod `/` nginx serwuje stronę startową, pod `/game/` — grę, a nie backend —
status sprawdzisz wyłącznie
pod `/api` (albo `/admin`). Test: `server/tests/Controller/HomeControllerTest.php`.

## API-001: Uwierzytelnianie

- **Status:** Zaimplementowane
- **Moduł:** `server/src/Auth/`
- **Baza:** MySQL, tabela `app_user` (migracja `DoctrineMigrations`).
- **Token:** JWT wystawiany przez Lexik, `RS256`, ważny 3600 sekund. Token nie
  jest odświeżany — po wygaśnięciu klient loguje się ponownie.

### `POST /api/auth/register`

Tworzy konto i od razu zwraca token, żeby klient nie musiał wykonywać drugiego
żądania logowania.

Żądanie:

```json
{
  "email": "gracz@example.com",
  "password": "tajne-haslo"
}
```

Odpowiedź `201 Created`:

```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "gracz@example.com",
    "createdAt": "2026-10-31T12:00:00+00:00"
  }
}
```

Błędy:

| Kod | Kiedy | Ciało |
| --- | --- | --- |
| `422` | brak pola, zły e-mail, hasło krótsze niż 8 lub dłuższe niż 72 znaki | standardowy JSON walidacji Symfony |
| `409` | e-mail jest już zarejestrowany | `{"error": "Email \"gracz@example.com\" is already registered."}` |

E-mail jest normalizowany do małych liter i przycinany z białych znaków.

### `POST /api/auth/login`

Weryfikuje e-mail i hasło i wystawia nowy token.

Żądanie:

```json
{
  "email": "gracz@example.com",
  "password": "tajne-haslo"
}
```

Odpowiedź `200 OK` — ten sam kształt co rejestracja (`token` + `user`).

Błędy:

| Kod | Kiedy | Ciało |
| --- | --- | --- |
| `401` | nieznany e-mail albo złe hasło | `{"error": "Invalid email or password."}` |
| `422` | brak pola e-mail lub hasła | standardowy JSON walidacji Symfony |

Odpowiedź `401` jest celowo taka sama dla nieznanego konta i złego hasła, żeby
nie zdradzać, które e-maile istnieją.

### `GET /api/auth/me`

Zwraca konto przypisane do tokenu. Służy do sprawdzenia, czy token jest nadal
ważny, i do odświeżenia danych użytkownika po starcie klienta.

Nagłówki:

```http
Authorization: Bearer <token>
```

Odpowiedź `200 OK`:

```json
{
  "id": 1,
  "email": "gracz@example.com",
  "createdAt": "2026-10-31T12:00:00+00:00"
}
```

Błędy:

| Kod | Kiedy | Ciało |
| --- | --- | --- |
| `401` | brak nagłówka, token niepoprawny albo wygasł | `{"code": 401, "message": "JWT Token not found"}` lub odpowiedni komunikat Lexika |

### Fixtury deweloperskie

Po `make fixtures` w bazie są konta:

| E-mail | Hasło | Rola |
| --- | --- | --- |
| `admin@example.com` | `admin1234` | `ROLE_USER` |
| `gracz@example.com` | `gracz1234` | `ROLE_USER` |

Fixtury są idempotentne względem e-maila: istniejące konto nie jest nadpisywane.
`doctrine:fixtures:load` domyślnie czyści tabele przed załadowaniem — używaj go
tylko w dev/test.

### Klucze i konfiguracja

- Para kluczy: `server/config/jwt/private.pem` i `public.pem` (poza git),
  generowana przez `make jwt-keys`.
- `JWT_SECRET_KEY`, `JWT_PUBLIC_KEY`, `JWT_PASSPHRASE` — w `server/.env`
  (ignorowany plik lokalny).
- `CORS_ALLOW_ORIGIN` — wyrażenie regularne originów klienta (domyślnie
  localhost/127.0.0.1 na dowolnym porcie oraz `app://bundle` z Electrona).
- Firewall `api`: bezstanowy, `^/api`, jwt; publiczne są `GET /api` (status), `register` i `login`.

### Testy

`server/tests/Auth/` zawiera testy funkcjonalne HTTP (rejestracja, duplikat,
walidacja, logowanie, `me` z tokenem i bez). Uruchamianie: `make test-server`.
W `APP_ENV=test` Doctrine korzysta z SQLite (`server/var/test.db`), więc testy
nie potrzebują uruchomionego MySQL.

## API-002: Logowanie Google

- **Status:** Zaimplementowane
- **Moduł:** `server/src/Auth/`
- **Zależność:** ADR-050; token gry pozostaje taki jak w API-001 (Lexik, `RS256`, 3600 s).

Google ID token jest tylko jednorazowym dowodem tożsamości. Backend weryfikuje
go kluczami Google i sam wystawia token gry — klient nie dostaje `client_secret`.

### `POST /api/auth/google`

Żądanie:

```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

Odpowiedź `200 OK` — ten sam kształt co `POST /api/auth/login` (`token` + `user`).
Po wdrożeniu API-003 odpowiedź dostaje też `refreshToken`.

Błędy:

| Kod | Kiedy | Ciało |
| --- | --- | --- |
| `401` | zły podpis, nieznany `kid`, `aud` spoza listy, `iss` inny niż `accounts.google.com` / `https://accounts.google.com`, wygasły `exp` | `{"error": "Invalid Google credential."}` |
| `403` | `email_verified` jest `false` albo e-mail nie jest autorytatywny (nie `@gmail.com` i brak `hd`) | `{"error": "Google email cannot be verified."}` |
| `422` | brak pola `credential` | standardowy JSON walidacji Symfony |

Weryfikacja obejmuje podpis `RS256` przez klucze z
`https://www.googleapis.com/oauth2/v3/certs` (cache zgodnie z `Cache-Control`),
`aud` z listy `GOOGLE_CLIENT_IDS`, `iss`, `exp`, niepusty `sub` i `email`.
Do parsowania i walidacji używamy `lcobucci/jwt`; certyfikaty `x5c` są
konwertowane do PEM w adapterze infrastrukturalnym.

### Klienty i łączenie kont

- Dwa publiczne clienty Google: `web` (JavaScript origin `http://localhost:18573`
  i `http://localhost:18080`) oraz `desktop` (typ „Desktop app", loopback
  `http://127.0.0.1` na losowym porcie, PKCE S256).
- `GOOGLE_CLIENT_IDS` przyjmuje oba ID rozdzielone przecinkami — obsługujemy
  logowanie z przeglądarki i z Electrona jednym endpointem.
- Jeśli `sub` nie istnieje, szukamy użytkownika po e-mailu. Auto-link następuje
  tylko dla e-maila autorytatywnego; w przeciwnym razie `403`.
- Nowe konto Google-only ma unikalne `googleSub` i losowy hash hasła, więc
  `POST /api/auth/login` nie pozwala się na nie zalogować.

### Testy

`server/tests/Auth/GoogleLoginTest.php` pokrywa poprawny token web i desktop,
zły podpis, obcy `aud`, wygasły token, `email_verified: false`, e-mail
nieautorytatywny, link do istniejącego konta i utworzenie nowego konta.
Testy nie używają prawdziwego Google — JWK i credential są fixturami.
Uruchamianie: `make test-server`.

## API-003: Odświeżanie sesji

- **Status:** Zaimplementowane
- **Moduł:** `server/src/Auth/`
- **Zależność:** ADR-051; nie zmienia tokenu wystawianego przez Lexika.

### `POST /api/auth/refresh`

Żądanie:

```json
{
  "refreshToken": "opaque-random-string"
}
```

Odpowiedź `200 OK`:

```json
{
  "token": "nowy-jwt-gry",
  "refreshToken": "nowy-opaque-random-string",
  "user": {
    "id": 1,
    "email": "gracz@example.com",
    "createdAt": "2026-10-31T12:00:00+00:00"
  }
}
```

Stary refresh token zostaje unieważniony (rotacja). Jego ponowne użycie
unieważnia całą rodzinę tokenów tego użytkownika.

Błędy:

| Kod | Kiedy | Ciało |
| --- | --- | --- |
| `401` | token nieznany, wygasł, unieważniony albo użyty ponownie | `{"error": "Invalid refresh token."}` |
| `422` | brak pola `refreshToken` | standardowy JSON walidacji Symfony |

### `POST /api/auth/logout`

Żądanie:

```json
{
  "refreshToken": "opaque-random-string"
}
```

Odpowiedź `204 No Content` niezależnie od tego, czy token był znany — klient
i tak czyści lokalną sesję. Endpoint jest publiczny, więc nie wymaga
ważnego tokenu gry.

### Zmiany w pozostałych endpointach

Po wdrożeniu API-003 odpowiedzi `POST /api/auth/register`, `POST /api/auth/login`
i `POST /api/auth/google` mają dodatkowe pole `refreshToken`. `GET /api/auth/me`
pozostaje bez zmian. Klient przechowuje oba tokeny w `mvaw.auth` i przy `401`
z `me` próbuje najpierw odświeżenia.

### Testy

`server/tests/Auth/RefreshTokenTest.php` sprawdza rotację, ponowne użycie,
wygasły token, wylogowanie oraz to, że nowy token gry działa na `GET /api/auth/me`.
Testy działają na SQLite w `APP_ENV=test`; uruchamianie: `make test-server`.
