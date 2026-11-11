# Założenia gry

> [!info] Co opisuje ta notatka
> Reguły i dane rozgrywki: strony, tury, jednostki, teren, ruch, walkę, mgłę
> wojny i scenariusze. Decyzje techniczne są w [[ADR]], ekrany i sterowanie
> w [[Interfejs]], a format zapisu w [[Mapy]]. Ten dokument nie opisuje
> implementacji — wskazuje tylko, gdzie reguła żyje w kodzie.

## ZAL-001: Gatunek i zakres

- Turowa gra strategiczna na siatce heksagonalnej, inspirowana Advance Wars.
  Bitwa toczy się na mapie z terenem i jednostkami.
- Strony: niebieska (`blue`) i czerwona (`red`). Model zna też `neutral`,
  ale edytor i rozgrywka go nie używają.
- Jedna bitwa to scenariusz oparty na mapie z SQLite; gracz wybiera stronę
  przed startem.
- Obecny zakres to hot-seat na jednym PC: obie strony gra człowiek, bez SI
  i bez rozgrywki sieciowej.
- Warunek zwycięstwa nie jest jeszcze zdefiniowany; bitwa trwa do opuszczenia
  scenariusza.

## ZAL-002: Strony i tury

- Strony grają naprzemiennie w kolejności `blue → red → blue`; numer tury
  rośnie po każdym przejściu.
- Nowa bitwa zaczyna się od strony wybranej w menu scenariuszy (domyślnie
  niebieskiej); pierwsza tura ma numer 1.
- Początek tury przywraca jednostkom aktywnej strony pełny `movesLeft`,
  czyści `hasActed` i uzupełnia amunicję do wartości z `UnitStats.ammo`.
- Jednostki drugiej strony zachowują stan do swojej tury.
- Tura jest stanem sesji, nie częścią zapisanej mapy.

## ZAL-003: Mapa i teren

- Mapa jest zbiorem heksów w układzie pointy-top; współrzędne są absolutne,
  a brak heksa oznacza czarne tło.
- Teren określa koszt ruchu, przechodniość i wartość obrony.

| `TerrainId` | Etykieta | Koszt ruchu | Obrona |
| ----------- | -------- | ----------: | -----: |
| `plain`     | Łąka     |           1 |      0 |
| `forest`    | Las      |           2 |     20 |
| `water`     | Woda     |  nieprzech. |      0 |
| `mountain`  | Góry     |           3 |     30 |
| `swamp`     | Bagno    |           2 |     10 |
| `road`      | Droga    |         0.5 |      0 |
| `city`      | Miasto   |           1 |     40 |

- Woda jest nieprzechodnia; pozostałe tereny można przejść, jeśli starczy
  punktów ruchu.
- Obrona terenu jest zapisana w danych, ale walka jeszcze jej nie używa —
  obrażenia nie są zmniejszane przez teren ani statystykę `defense`.
- Nowa mapa startuje z wyłączoną mgłą wojny.

## ZAL-004: Jednostki

| `UnitKind`  | Etykieta  | Max HP | Ruch | Atak | Obrona | Zasięg wzroku | Zasięg strzału | Amunicja |
| ----------- | --------- | -----: | ---: | ---: | -----: | ------------: | -------------: | -------: |
| `infantry`  | Piechota  |     10 |    4 |    5 |      4 |             2 |              2 |        — |
| `tank`      | Czołg     |     20 |    3 |    9 |      7 |             3 |              1 |        6 |
| `artillery` | Artyleria |     14 |    2 |   12 |      3 |    cała mapa |     cała mapa |        6 |
| `scout`     | Zwiad     |      8 |    6 |    3 |      2 |             5 |              1 |        — |

- `moveRange` to budżet ruchu na turę, `visionRange` — promień widzenia,
  a `attackRange` — maksymalna odległość ataku.
- `defense` jest zapisane, ale nie zmniejsza obrażeń; walka korzysta wyłącznie
  z `attack` atakującego.
- Czołg i artyleria mają zapas strzałów (`ammo`); piechota i zwiad nie mają
  pola amunicji i nie zużywają pocisków. Bieżąca liczba pocisków wynika
  z pozostałego ruchu: pełny `moveRange` daje `ammo` strzałów, a każdy wydany
  punkt ruchu proporcjonalnie zmniejsza zapas. Jednostka nie przechowuje
  osobnego licznika amunicji.
- Jednostka zajmuje jeden heks; na jednym heksie stoi najwyżej jedna jednostka.
- Strony jednostek to `blue`, `red` i `neutral`; edytor i rozgrywka używają
  niebieskiej i czerwonej.
- Piechota ma domyślnie broń `RIFLE` (karabin), której `shotSound` wskazuje
  dźwięk wystrzału; pozostałe rodzaje nie mają jeszcze własnej broni i do czasu
  jej dodania korzystają z domyślnego dźwięku wystrzału.
- Dźwięk ruchu jest właściwością definicji jednostki (`UnitStats.moveSound`):
  piechota ma `'step'`, a czołg, artyleria i zwiad pozostają ciche.
- Dźwięk śmierci jest właściwością definicji jednostki (`UnitStats.deathSound`):
  piechota ma `'death'`, a czołg, artyleria i zwiad nie mają dźwięku śmierci.

## ZAL-005: Ruch

- Jednostka aktywnej strony z `movesLeft > 0` i bez `hasActed` porusza się
  po najtańszej trasie przez sąsiednie heksy.
- Koszt trasy to suma kosztów terenu odwiedzanych pól; nie może przekroczyć
  `movesLeft`.
- Teren nieprzechodni i zajęte heksy są wykluczone. Ukryta jednostka nadal
  zajmuje heks i blokuje ruch.
- Droga kosztuje 0,5 punktu ruchu, więc ułamkowy `movesLeft` jest normalnym
  stanem.
- Po ruchu odejmowany jest koszt każdego pokonanego heksa, a `hasActed`
  pojawia się dopiero przy zerowym ruchu. Jednostka może więc wykonać kilka
  odcinków ruchu w turze, aż wyczerpie budżet.
- Ruch planuje się w planerze: klik wybranej jednostki i heksa ustala trasę,
  a akcje wszystkich jednostek strony wykonują się dopiero po przycisku
  „WYKONAJ TURĘ”. Planowanie nie zmienia stanu gry.
- Plan nie zależy od kolejności klikania: trasa jest walidowana względem
  stanu na początku tury (teren i zajęte heksy), a heksy końcowe planów
  muszą być unikalne. Przelot przez ten sam heks jest dozwolony.
- Jednostki poruszają się równolegle. Oś czasu wyrównuje koniec akcji:
  jednostka z krótszym planem startuje później, a wszystkie ruchy i ataki
  kończą się w tym samym momencie.
- Zaplanowany ruch jest wiążący — jednostka nie zatrzymuje się po odkryciu
  wroga i nie reaguje ogniem w trakcie tury.
- Brak stref kontroli i dodatkowych zasad wejścia na heks.

## ZAL-006: Walka

- Atakuje jednostka aktywnej strony, która nie ma `hasActed`, ma strzał
  (jeśli używa pocisków) i ma cel w zasięgu `attackRange`.
- W scenariuszu kliknąć można tylko widocznego wroga; ukryta jednostka nie
  ujawnia się przez próbę ataku.
- Obrażenia są równe `attack` atakującego i odejmowane od `hp` celu; obrona
  celu i terenu nie zmniejszają obrażeń.
- Cel z `hp <= 0` znika ze stanu gry, a jego token jest usuwany.
- Liczba dostępnych pocisków wynika z `movesLeft`: pełny ruch daje `ammo`
  strzałów, a każdy wydany punkt ruchu proporcjonalnie zmniejsza zapas.
  Piechota i zwiad nie mają pocisków i nie zużywają ich.
- Piechota, czołg i zwiad po ataku dostają `hasActed`, co blokuje ruch
  i kolejny atak do następnej tury.
- Artyleria widzi i atakuje każdy heks mapy. Każdy strzał odejmuje od
  `movesLeft` `moveRange / ammo` punktu ruchu, więc może strzelać seriami,
  dopóki ma ruch; `hasActed` dostaje po wyczerpaniu ruchu.
- Ataki są częścią planu tury: gracz wskazuje cel, a atak trafia do sekwencji
  akcji jednostki. Liczbę ataków wyznaczają reguły i budżet, nie interfejs.
- Zaplanowane ataki rozstrzygają się po ruchach, w jednym wolumenie na końcu
  tury. Obrażenia liczy się z jednego stanu sprzed wolumenu, więc cel trafiony
  kilkoma atakami dostaje sumę obrażeń, a atakujący nie giną przed własnym
  strzałem. Kolejność ataków nie zmienia wyniku.
- Początek tury przywraca ruch jednostkom aktywnej strony, a wraz z nim
  proporcjonalny zapas pocisków.
- Brak ognia zwrotnego i redukcji obrażeń przez obronę; kontratak to osobna
  seria.

## ZAL-007: Mgła wojny

- Mgła jest flagą mapy (`GameMap.fogOfWar`), włączaną w edytorze; domyślnie
  jest wyłączona.
- Punktem widzenia jest strona aktywna w turze: własne jednostki są zawsze
  widoczne, a wrogie tylko wtedy, gdy leżą w zasięgu `visionRange` dowolnej
  własnej jednostki.
- Ukryta jednostka nadal zajmuje heks i blokuje ruch, ale nie da się jej
  wybrać ani zobaczyć w podglądzie heksu.
- Teren nie zasłania widoku. Kafle poza sumą zasięgów wzroku wszystkich
  własnych jednostek są zakryte: wcześniej widziane dostają półprzezroczystą
  mgłę, przez którą nadal widać rodzaj terenu, i pozostają odkryte do końca
  scenariusza, a nigdy niewidziane są czarne.
- Pamięć odkrytych pól jest per strona i sesyjna — nie trafia do zapisu mapy.
- Edytor zawsze pokazuje wszystkie jednostki; mgła działa dopiero
  w scenariuszu.

## ZAL-008: Scenariusze i armie

- Scenariusz nie ma osobnej tabeli ani metadanych: każda mapa z SQLite jest
  potencjalnym scenariuszem.
- Mapa bez jednostek danej strony dostaje automatyczne wojsko: 4 piechoty,
  2 czołgi, 2 artylerie i 2 zwiady na wolnych, przechodnich heksach wzdłuż
  wysokości mapy. Niebieskie startują od lewej, czerwone od prawej krawędzi.
- Uzupełnienie armii jest tylko sesyjne i nie zmienia zapisu mapy w SQLite.
- Wbudowany „Front Wschodni” ma mapę 48×28 (1344 kafle), wszystkie rodzaje
  terenu, po 10 jednostek każdej strony i włączoną mgłę wojny.
- Brak celów misji, limitu tur i warunków zwycięstwa.

## ZAL-009: Poza zakresem

- warunek zwycięstwa i porażki,
- zaawansowane SI (współpraca jednostek, ocena terenu, reakcja na plan gracza),
- rozgrywka sieciowa i synchronizacja tur,
- kontratak, animacje trafień i redukcja obrażeń przez `defense` lub teren,
- zaopatrzenie, naprawa, ekonomia i rekrutacja,
- cele misji i metadane scenariusza,
- trwałe odkrywanie pól i zasłanianie widoku przez teren.

## ZAL-010: Gdzie reguła żyje w kodzie

| Obszar      | Moduł                     |
| ----------- | ------------------------- |
| tury        | `client/src/core/turn.ts` |
| jednostki   | `client/src/core/units/`  |
| teren       | `client/src/core/map/terrain/` |
| ruch        | `client/src/core/map/movement.ts` |
| walka       | `client/src/core/combat.ts` |
| mgła wojny  | `client/src/core/vision.ts` |
| scenariusze | `client/src/core/scenario.ts` |
| SI wroga    | `client/src/si/`          |

## ZAL-011: Kampanie i samouczek

- Menu główne prowadzi do ekranu „Kampanie”.
- Ekran ma trzy wstążki: „Samouczek”, „Kampania 1”, „Kampania 2”.
- Samouczek ma sześć kafelków misji: „Pierwsze kroki”, „Ruch jednostek”,
  „Walka”, „Mgła wojny”, „Amunicja”, „Artyleria”.
- Każda kampania i każda misja ma osobny plik w `client/src/core/campaign/`;
  `index.ts` tylko scala dane.
- Pierwsza misja „Pierwsze kroki” jest grywalna: mapa 16×10, trzech
  niebieskich piechurów i jeden czerwony piechur ukryty w mgle wojny.
- Pozostałe kafelki są zapowiedziami — kliknięcie pokazuje komunikat
  „wkrótce”; nie mają jeszcze scenariusza ani uruchomienia.
- „Kampania 1” i „Kampania 2” nie mają kafelków do czasu dodania misji.

## ZAL-012: SI wroga

- Stronę przeciwną do wybranej przez gracza (`playerFaction`) prowadzi SI;
  gracz steruje wyłącznie swoją stroną.
- SI buduje zwykły `TurnPlan` przez `client/src/si/`, więc walidacja ruchu,
  ataku i wolumen obrażeń są takie same jak dla gracza.
- Reguły mają priorytet; wybierana jest pierwsza reguła, której
  `canBeUsed()` zwraca `true`.
- Pierwsza reguła: jeśli strona widzi wroga, jednostka podchodzi na odległość
  `attackRange` i atakuje; jeśli wroga nie widać, idzie w stronę przeciwną
  do miejsca, w którym się pojawiła (zwiększa odległość od pozycji startowej).
- Pozycje startowe są pamiętane w sesji scenariusza (mapa `unitId → heks`);
  nie trafiają do zapisanej mapy.
- Tura SI jest odtwarzana automatycznie tym samym playbackiem co tura
  gracza; gracz nie planuje akcji przeciwnika.
- Gracz widzi mapę zawsze ze swojej strony; mgła i odkryte pola nie
  przełączają się na widok SI.
