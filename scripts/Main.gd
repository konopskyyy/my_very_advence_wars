extends Node2D

## Ekran tytułowy. Rysuje napis "my very advance wars" własną czcionką pikselową
## (siatka 5x7) bez żadnych zewnętrznych assetów — każdy "piksel" to kwadrat.

const TITLE := "my very advance wars"

# Wymiary pojedynczego glifu w "pikselach" czcionki.
const GLYPH_WIDTH := 5
const GLYPH_HEIGHT := 7

# Odstęp między literami (w pikselach czcionki).
const LETTER_SPACING := 1

const BACKGROUND_COLOR := Color("#1b2340")
const TEXT_COLOR := Color("#f6c445")
const SHADOW_COLOR := Color("#7a3a12")

# '#' = zapalony piksel, '.' = tło.
const GLYPHS := {
	" ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
	"a": [".....", ".....", ".###.", "....#", ".####", "#...#", ".####"],
	"c": [".....", ".....", ".###.", "#...#", "#....", "#...#", ".###."],
	"d": ["....#", "....#", ".####", "#...#", "#...#", "#...#", ".####"],
	"e": [".....", ".....", ".###.", "#...#", "#####", "#....", ".###."],
	"m": [".....", ".....", "#####", "#.#.#", "#.#.#", "#.#.#", "#.#.#"],
	"n": [".....", ".....", "####.", "#...#", "#...#", "#...#", "#...#"],
	"r": [".....", ".....", "#.##.", "##..#", "#....", "#....", "#...."],
	"s": [".....", ".....", ".####", "#....", ".###.", "....#", "####."],
	"v": [".....", ".....", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
	"w": [".....", ".....", "#...#", "#...#", "#...#", "#.#.#", ".#.#."],
	"y": [".....", ".....", "#...#", "#...#", ".#.#.", "..#..", ".#..."],
}


func _ready() -> void:
	# Napis jest wyśrodkowany względem viewportu — przerysuj przy zmianie rozmiaru.
	get_viewport().size_changed.connect(queue_redraw)


func _draw() -> void:
	var viewport_size: Vector2 = get_viewport_rect().size
	draw_rect(Rect2(Vector2.ZERO, viewport_size), BACKGROUND_COLOR)

	if TITLE.length() == 0:
		return

	var columns: int = TITLE.length() * (GLYPH_WIDTH + LETTER_SPACING) - LETTER_SPACING

	# Skala dobierana tak, aby napis zajmował maksymalnie ~85% szerokości i ~50% wysokości.
	var pixel: float = floor(minf(
		viewport_size.x * 0.85 / columns,
		viewport_size.y * 0.5 / GLYPH_HEIGHT))
	pixel = maxf(pixel, 1.0)

	var text_width: float = columns * pixel
	var text_height: float = GLYPH_HEIGHT * pixel
	var origin := Vector2(
		(viewport_size.x - text_width) / 2.0,
		(viewport_size.y - text_height) / 2.0)

	# Cień o jeden "piksel" w prawo i w dół, potem właściwy napis.
	_draw_title(origin + Vector2(pixel, pixel), pixel, SHADOW_COLOR)
	_draw_title(origin, pixel, TEXT_COLOR)


func _draw_title(origin: Vector2, pixel: float, color: Color) -> void:
	for i in TITLE.length():
		var ch := TITLE[i]
		if not GLYPHS.has(ch):
			continue

		var glyph: Array = GLYPHS[ch]
		var glyph_x: float = origin.x + i * (GLYPH_WIDTH + LETTER_SPACING) * pixel
		for row in GLYPH_HEIGHT:
			for col in GLYPH_WIDTH:
				if glyph[row][col] != "#":
					continue
				draw_rect(Rect2(glyph_x + col * pixel, origin.y + row * pixel, pixel, pixel), color)
