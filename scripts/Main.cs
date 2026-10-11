using Godot;
using System.Collections.Generic;

/// <summary>
/// Ekran tytułowy. Rysuje napis "my very advance wars" własną czcionką pikselową
/// (siatka 5x7) bez żadnych zewnętrznych assetów — każdy "piksel" to kwadrat.
/// </summary>
public partial class Main : Node2D
{
	private const string Title = "my very advance wars";

	// Wymiary pojedynczego glifu w "pikselach" czcionki.
	private const int GlyphWidth = 5;
	private const int GlyphHeight = 7;

	// Odstęp między literami (w pikselach czcionki).
	private const int LetterSpacing = 1;

	private static readonly Color BackgroundColor = new("#1b2340");
	private static readonly Color TextColor = new("#f6c445");
	private static readonly Color ShadowColor = new("#7a3a12");

	// '#' = zapalony piksel, '.' = tło.
	private static readonly Dictionary<char, string[]> Glyphs = new()
	{
		[' '] = G(".....", ".....", ".....", ".....", ".....", ".....", "....."),
		['a'] = G(".....", ".....", ".###.", "....#", ".####", "#...#", ".####"),
		['c'] = G(".....", ".....", ".###.", "#...#", "#....", "#...#", ".###."),
		['d'] = G("....#", "....#", ".####", "#...#", "#...#", "#...#", ".####"),
		['e'] = G(".....", ".....", ".###.", "#...#", "#####", "#....", ".###."),
		['m'] = G(".....", ".....", "#####", "#.#.#", "#.#.#", "#.#.#", "#.#.#"),
		['n'] = G(".....", ".....", "####.", "#...#", "#...#", "#...#", "#...#"),
		['r'] = G(".....", ".....", "#.##.", "##..#", "#....", "#....", "#...."),
		['s'] = G(".....", ".....", ".####", "#....", ".###.", "....#", "####."),
		['v'] = G(".....", ".....", "#...#", "#...#", "#...#", ".#.#.", "..#.."),
		['w'] = G(".....", ".....", "#...#", "#...#", "#...#", "#.#.#", ".#.#."),
		['y'] = G(".....", ".....", "#...#", "#...#", ".#.#.", "..#..", ".#..."),
	};

	private static string[] G(params string[] rows) => rows;

	public override void _Ready()
	{
		// Napis jest wyśrodkowany względem viewportu — przerysuj przy zmianie rozmiaru.
		GetViewport().SizeChanged += QueueRedraw;
	}

	public override void _Draw()
	{
		Vector2 viewportSize = GetViewportRect().Size;
		DrawRect(new Rect2(Vector2.Zero, viewportSize), BackgroundColor);

		if (Title.Length == 0)
			return;

		int columns = Title.Length * (GlyphWidth + LetterSpacing) - LetterSpacing;

		// Skala dobierana tak, aby napis zajmował maksymalnie ~85% szerokości i ~50% wysokości.
		float pixel = Mathf.Floor(Mathf.Min(
			viewportSize.X * 0.85f / columns,
			viewportSize.Y * 0.5f / GlyphHeight));
		pixel = Mathf.Max(pixel, 1f);

		float textWidth = columns * pixel;
		float textHeight = GlyphHeight * pixel;
		Vector2 origin = new(
			(viewportSize.X - textWidth) / 2f,
			(viewportSize.Y - textHeight) / 2f);

		// Cień o jeden "piksel" w prawo i w dół, potem właściwy napis.
		DrawTitle(origin + new Vector2(pixel, pixel), pixel, ShadowColor);
		DrawTitle(origin, pixel, TextColor);
	}

	private void DrawTitle(Vector2 origin, float pixel, Color color)
	{
		for (int i = 0; i < Title.Length; i++)
		{
			if (!Glyphs.TryGetValue(Title[i], out string[] glyph))
				continue;

			float glyphX = origin.X + i * (GlyphWidth + LetterSpacing) * pixel;
			for (int row = 0; row < GlyphHeight; row++)
			{
				for (int col = 0; col < GlyphWidth; col++)
				{
					if (glyph[row][col] != '#')
						continue;

					DrawRect(new Rect2(glyphX + col * pixel, origin.Y + row * pixel, pixel, pixel), color);
				}
			}
		}
	}
}
