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
