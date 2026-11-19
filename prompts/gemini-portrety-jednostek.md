# Prompty Gemini — portrety jednostek

Wklej **prompt bazowy** raz na początku rozmowy z Gemini, a potem po jednym promcie jednostki. Ustaw proporcje obrazu `1:1`. Wszystkie grafiki mają to samo tło: łąka, bez przezroczystości.

## Prompt bazowy

```text
Consistent art style for a set of unit portrait icons in a stylized turn-based strategy game (Advanced Wars-like, miniature toy-like military look). Stylized hand-painted 3D game icon, clean bold silhouette, simplified geometric forms, three-quarter view, soft cel shading, limited palette: olive drab, sand, steel grey, dark charcoal outlines, small warm highlights. Crisp edges, high contrast, readable at 150x150 px. Every unit stands on the SAME simple meadow background: muted olive-green grass, a few tiny wildflowers, soft warm sunlight, gentle shadow under the unit, slightly blurred and desaturated so the unit stays dominant, no horizon line and no sky. Square 1:1 composition, full-bleed background filling the entire frame, unit centered and fully visible with a small margin. No text, no numbers, no labels, no logos, no borders, no UI, no photographic realism. Use the same lighting, angle, background and proportions for every unit in this set.
```

## Prompty jednostek

### Piechota — `infantry.png`

```text
Unit: INFANTRY. One infantry soldier in a steel helmet and olive field uniform, holding a rifle across the chest, confident standing three-quarter pose, compact heroic proportions, full figure visible including boots. Same style, same muted meadow background, full-bleed square frame, no text.
```

### Zwiadowca — `scout.png`

```text
Unit: SCOUT. Light infantry scout in a green helmet and lightweight recon uniform, binoculars held to the eyes, carbine slung on the back, agile forward-leaning stance, sleeker and lighter than the standard infantry soldier. Same style, same muted meadow background, full-bleed square frame, no text.
```

### Żołnierz z bazooką — `bazooka.png`

```text
Unit: BAZOOKA SOLDIER. Infantry soldier in helmet and olive uniform with a large shoulder-fired bazooka tube resting on the shoulder, rocket launcher clearly visible, two-handed grip, sturdy stance. Same style, same muted meadow background, full-bleed square frame, no text.
```

### Czołg — `tank.png`

```text
Unit: TANK. Compact main battle tank in three-quarter front view, steel-grey armor with olive panels, short cannon, thick segmented tracks, small turret, toy-like miniature proportions, clean silhouette. Same style, same muted meadow background, full-bleed square frame, no text.
```

### Artyleria — `artillery.png`

```text
Unit: ARTILLERY. Self-propelled artillery vehicle in three-quarter view, long howitzer barrel angled upward, open-top turret, steel-grey hull with olive details, visible tracks, clearly distinct from the tank. Same style, same muted meadow background, full-bleed square frame, no text.
```

### Bombowiec — `bomber.png`

```text
Unit: BOMBER. Twin-engine heavy bomber aircraft in three-quarter top-down view, level wings, two radial engines, visible bomb bay under the fuselage, olive drab upper surfaces and grey belly, symmetrical readable silhouette. Same style, same muted meadow background, full-bleed square frame, no text.
```

### Śmigłowiec — `helicopter.png`

```text
Unit: HELICOPTER. Utility attack helicopter in three-quarter view, large main rotor and tail rotor, slim fuselage with dark canopy, skid landing gear, short weapon pylons, olive drab paint. Same style, same muted meadow background, full-bleed square frame, no text.
```

## Po wygenerowaniu

- Zapisz jako PNG w formacie 256×256 w `client/src/assets/ai/units/`, z tłem aż po krawędzie kadru.
- Nazwy plików są podane przy każdym prompcie.
- `client/src/view/recruitPortrait.ts` obecnie pod `scout` i `bazooka` podstawia portret piechura — po wygenerowaniu własnych grafik trzeba tam podmienić mapowanie.
