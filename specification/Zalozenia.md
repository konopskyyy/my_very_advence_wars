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

| `UnitKind`  | Etykieta  | Cena | Max HP | Ruch | Atak | Obrona | Zasięg wzroku | Zasięg strzału | Amunicja |
| ----------- | --------- | ---: | -----: | ---: | ---: | -----: | ------------: | -------------: | -------: |
| `infantry`  | Piechota  |  100 |     10 |    4 |    5 |      4 |             2 |              2 |        — |
| `tank`      | Czołg     |  300 |     20 |    3 |    9 |      7 |             3 |              1 |        6 |
| `artillery` | Artyleria |  250 |     14 |    2 |   12 |      3 |    cała mapa |     cała mapa |        6 |
| `scout`     | Zwiadowca |  150 |      8 |    6 |    3 |      2 |    cała mapa |              1 |        — |
| `bomber`    | Bombowiec | 250 | 10 | 2 | 25 | 2 | cała mapa | cała mapa | 1 |
| `helicopter` | Śmigłowiec | 300 | 12 | 5 | 18 | 3 | 4 | 2 | 6 |

- `cost` to cena zakupu jednostki w oknie `KUP`; budżet scenariusza
  i limity zakupów opisuje ADR-046.
- Cenę całkowitą powiększają dopłaty za wybrane uzbrojenie: broń podstawowa
  to karabin (0), bazooka (+100) albo snajperka (+75), a dodatkowa pistolet (0)
  albo granaty (+30). Domyślny zestaw karabin + pistolet nie zmienia ceny
  bazowej. Wybór broni nie zmienia statystyk jednostki opisanych w tabeli;
  zwiadowca nie wybiera broni i zawsze płaci cenę bazową.

- `moveRange` to budżet ruchu na turę, `visionRange` — promień widzenia,
  a `attackRange` — maksymalna odległość ataku.
- Zwiadowca widzi całą mapę, tak jak artyleria; od artylerii odróżnia go
  ruch (6 zamiast 2) i rola jednostki rozpoznawczej. Na mapie używa sylwetki
  żołnierza, a w rekrutacji własnego portretu `scout.jpg`; nie wybiera broni,
  więc cena zakupu nie ma dopłat za uzbrojenie.
- `defense` jest zapisane, ale nie zmniejsza obrażeń; walka korzysta wyłącznie
  z `attack` atakującego. Jednostka może mieć `attackOverride` w danych
  (`UnitBase`), które zastępuje atak z tabeli — używa go specjalny piechur
  z bazooką w drugim samouczku. Helper `unitAttack()` z `core/units` jest
  jedynym źródłem obrażeń w `combat.ts`, `volley.ts` i `timeline.ts`.
- Czołg i artyleria mają zapas strzałów (`ammo`); piechota i zwiad nie mają
  pola amunicji i nie zużywają pocisków — ich strzał kosztuje 1 punkt ruchu.
  Bieżąca liczba strzałów wynika z pozostałego ruchu: pełny `moveRange` daje
  `ammo` strzałów, a każdy wydany punkt ruchu proporcjonalnie zmniejsza zapas.
  Jednostka nie przechowuje osobnego licznika amunicji.
- Jednostka zajmuje jeden heks; na jednym heksie stoi najwyżej jedna jednostka.
- Czołg ma `capacity: 3` i `carries: ['infantry', 'scout']` — może przewieźć
  trzech pasażerów: piechurów albo zwiadowców. Zwiadowca jest pieszym zwiadem,
  a nie pojazdem, więc sam nie ma ładowni i nie może nikogo zabrać. Załadowany pasażer znika z mapy i jest trzymany
  w `UnitBase.cargo` jako pełna jednostka; nie zajmuje heksu, nie blokuje
  ruchu, nie strzela i nie może zostać zaatakowany.
- Strony jednostek to `blue`, `red` i `neutral`; edytor i rozgrywka używają
  niebieskiej i czerwonej.
- Piechota ma w danych broń `RIFLE` (karabin), która wskazuje dźwięk wystrzału.
  Wybór broni głównej w oknie `KUP` nie zmienia tej danej — zmienia tylko portret
  i cenę. Czołg, artyleria i zwiad nie mają jeszcze własnej broni i do czasu jej
  dodania korzystają z domyślnego dźwięku wystrzału.
- Dźwięk ruchu jest właściwością definicji jednostki (`UnitStats.moveSound`):
  piechota, zwiadowca i czołg mają `'step'`, a artyleria pozostaje cicha. Podczas odtwarzania tury dźwięk odtwarza się raz na każdy
  pokonany heks.
- Dźwięk śmierci jest właściwością definicji jednostki (`UnitStats.deathSound`):
  piechota ma `'death'`, a czołg, artyleria i zwiad nie mają dźwięku śmierci.
- Bombowiec (`bomber`) ma jeden strzał w turze: `ammo: 1` i ruch 2, więc strzał
  kosztuje cały budżet ruchu i ustawia `hasActed`. Zasięg wzroku i strzału obejmuje
  całą mapę (stała `FULL_MAP_RANGE`), a atak 25 niszczy czołg jednym trafieniem.
  Nalot nie jest nową akcją planu — patrz ADR-049.
- Śmigłowiec (`helicopter`) jest szybką jednostką wsparcia z zapasem sześciu
  strzałów, zasięgiem strzału 2 i wzrokiem 4. Na razie porusza się według tych
  samych zasad terenu co jednostki lądowe; jego rolą w danych i rekrutacji jest
  zapowiedź przeciwnika z dymka drugiej misji.

## ZAL-005: Ruch

- Jednostka aktywnej strony z `movesLeft > 0` i bez `hasActed` porusza się
  po najtańszej trasie przez sąsiednie heksy.
- Koszt trasy to suma kosztów terenu odwiedzanych pól; nie może przekroczyć
  `movesLeft`.
- Teren nieprzechodni i zajęte heksy są wykluczone; w planie wyjątkiem jest
  heks opuszczony w tej samej turze przez inną jednostkę. Ukryta jednostka
  nadal zajmuje heks i blokuje ruch.
- Droga kosztuje 0,5 punktu ruchu, więc ułamkowy `movesLeft` jest normalnym
  stanem.
- Po ruchu odejmowany jest koszt każdego pokonanego heksa, a `hasActed`
  pojawia się dopiero przy zerowym ruchu. Jednostka może więc wykonać kilka
  odcinków ruchu w turze, aż wyczerpie budżet.
- Ruch planuje się w planerze: klik wybranej jednostki i heksa ustala trasę,
  a akcje wszystkich jednostek strony wykonują się dopiero po przycisku
  „WYKONAJ TURĘ”. Planowanie nie zmienia stanu gry.
- Plan pozwala zakończyć ruch na heksie zajętym na początku tury, jeśli jego
  jednostka w tej samej turze się z niego rusza. Trasa jest liczona względem
  docelowych pozycji wcześniej zaplanowanych jednostek, a heksy końcowe planów
  muszą być unikalne. Przelot przez ten sam heks jest dozwolony.
- Jednostki poruszają się równolegle. Oś czasu wyrównuje koniec akcji:
  jednostka z krótszym planem startuje później, a wszystkie ruchy i ataki
  kończą się w tym samym momencie.
- Zaplanowany ruch jest wiążący — jednostka nie zatrzymuje się po odkryciu
  wroga i nie reaguje ogniem w trakcie tury.
- Piechota i zwiadowca mogą wsiąść do własnego czołgu, jeśli jest on osiągalny
  w pozostałym budżecie ruchu i ma wolne miejsce. Wybrana jednostka widzi
  nad osiągalnym pojazdem małą ikonę wsiadania (`↓`); kliknięcie planuje akcję `board`
  bez drugiego potwierdzenia. Wsiadanie liczy trasę do pozycji startowej
  pojazdu, kończy turę pasażera i jest akcją `board` w planie. Plan rozlicza
  pasażera przed ruchem pojazdu, więc kolejność kliknięć nie zmienia
  wyniku: pojazd zabiera pasażera ze sobą, także wtedy, gdy jego trasę
  zaplanowano wcześniej. Pasażer zostaje w pojeździe do ręcznego wyładunku:
  wybrany pojazd z ładunkiem i bez zaplanowanych akcji pokazuje ikonę
  wysiadania (`↑`) na wolnych sąsiednich heksach, a kliknięcie planuje akcję
  `unload`, która stawia pasażera na wskazanym heksie i kończy turę
  pojazdu oraz pasażera. Początek tury nie wyładowuje ładowni.
- Brak stref kontroli i dodatkowych zasad wejścia na heks.

## ZAL-006: Walka

- Atakuje jednostka aktywnej strony, która nie ma `hasActed`, ma w budżecie
  ruchu co najmniej koszt strzału i ma cel w zasięgu `attackRange`.
- W scenariuszu kliknąć można tylko widocznego wroga; ukryta jednostka nie
  ujawnia się przez próbę ataku.
- Obrażenia są równe `attack` atakującego i odejmowane od `hp` celu; obrona
  celu i terenu nie zmniejszają obrażeń.
- Cel z `hp <= 0` znika ze stanu gry, a jego token jest usuwany.
- Liczba dostępnych pocisków wynika z `movesLeft`: pełny ruch daje `ammo`
  strzałów, a każdy wydany punkt ruchu proporcjonalnie zmniejsza zapas.
  Piechota i zwiad nie mają pocisków; ich strzał kosztuje 1 punkt ruchu.
- Każdy strzał odejmuje od `movesLeft` koszt ruchu: czołg i artyleria
  `moveRange / ammo`, piechota i zwiad 1 punkt. `hasActed` pojawia się
  dopiero po wyczerpaniu ruchu, więc resztka pozwala iść dalej.
- Artyleria widzi i atakuje każdy heks mapy. Każdy jej strzał odejmuje od
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
- Bombowiec strzela na całą mapę jednym strzałem w turze (`ammo: 1`). Strzał
  kosztuje jego cały ruch, więc po ataku jednostka ma `hasActed`. Obrażenia 25
  wchodzą do zwykłego wolumenu z ADR-040 — nalot nie dodaje osobnej fazy ani
  nowego `PlanAction` (ADR-049).

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
- zaopatrzenie, naprawa i trwała ekonomia między misjami; płatna rekrutacja
  z okna `KUP` w budżecie scenariusza jest w zakresie (ADR-046),
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
- Samouczek ma sześć misji: „To był zwykły spacer na grzyby”,
  „Ruch jednostek”, „Walka”, „Mgła wojny”, „Amunicja”, „Artyleria”.
  Menu kampanii pokazuje tylko misje aktywne — świeży gracz widzi samą
  pierwszą, a kolejne pojawiają się po ukończeniu poprzedniej; ukończone
  zostają widoczne. Zablokowane i zapowiedzi „WKRÓTCE” są ukryte, a pełną
  listę ze statusami daje menu „Zadania” (INTERF-011).
- Każda kampania i każda misja ma osobny plik w `client/src/core/campaign/`;
  `index.ts` tylko scala dane.
- Pierwsza misja (plik `pierwsze-kroki.ts`) jest grywalna i prowadzi gracza
  pierwszym aktem: mapa 16×10 startuje bez niebieskich jednostek, a jedyny
  czerwony piechur stoi od początku ukryty w mgle wojny. Gracz ma 150
  kredytów i może kupić tylko zwiadowcę. Po zakupie dostaje 300 kredytów na
  trzech piechurów, a zwiadowca odsłania wroga. Kolejne dymki tłumaczą
  rekrutację, nagrodę, planowanie ruchu i atak (także możliwość ruchu po
  ataku); dymki znikają po pierwszym wykonanym ataku. Jednostki wychodzą
  z bazy na heksie `(2, 5)`, która sama ma zasięg wzroku 3. Zabicie
  ostatniego wroga kończy misję i pokazuje ekran wyniku.
- Druga misja (plik `ruch-jednostek.ts`) uczy ruchu i transportu na poligonie:
  mapa 16×10 ma drogę, las, bagno, góry, miasto i wodę, a gracz dostaje dwóch
  piechurów i zwiadowcę wokół bazy. Misja ma flagę `sandbox`, więc start bez
  wroga nie kończy jej po turze. Pierwsze cztery dymki tłumaczą punkty ruchu,
  koszt góry i bagna, zatwierdzanie trasy oraz miasto; po nich gracz dostaje
  300 kredytów i odblokowany czołg, a piąty dymek prowadzi do zakupu. Zakup nie
  kończy misji: kolejne kroki wymagają wsiadania piechura do czołgu, dojechania
  czołgiem na prawą stronę mapy i przetrwania ognia dwóch czerwonych
  karabinierów, którzy pojawiają się dopiero po wykonaniu tej tury. Czołg ma
  20 HP, więc dwa strzały po 5 obrażeń go nie niszczą. Karabinierzy po tym
  ostrzale wycofują się, a gracz wraca czołgiem do bazy na heksie `(2, 5)`.
  Przy bazie pojawia się czerwony piechur z bazooką (`UnitKind` pozostaje
  `infantry`, a `attackOverride` podnosi jego atak do 15) i w pierwszej turze
  wroga trafia czołg pociskiem za 15 obrażeń. Dymek potwierdzenia przypomina, że to nie
  jedyne zagrożenie dla czołgu — równie groźne są inne czołgi, śmigłowce
  i artyleria. Dopiero dymek z przyciskiem `ROZUMIEM` pozwala zakończyć misję. Misja odblokowuje się po ukończeniu pierwszej, a postęp jest
  zapisywany trwale w przeglądarce.
- Trzecia misja (plik `walka.ts`, identyfikator `tutorial-walka`) uczy walki
  i nalotu na poligonie 16×10 bez mgły wojny. Gracz startuje z czołgiem, dwiema
  piechotami i zwiadowcą przy bazie `(2, 5)`, a pierwszy czerwony piechur stoi na
  `(6, 5)`. Cztery dymki prowadzą od pierwszego strzału przez dwóch nowych
  piechurów i wspólny wolumen do zakupu bombera i nalotu. Po trzecim kroku gracz
  dostaje 250 kredytów i dostęp do bombera; misja kończy się po skrypcie, bez
  osobnego modalu.
- Misje „Mgła wojny”, „Amunicja” i „Artyleria” są zapowiedziami — nie mają
  jeszcze scenariusza ani uruchomienia, więc w menu kampanii są ukryte.
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
