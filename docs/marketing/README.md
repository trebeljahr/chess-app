# Marketing assets

Screenshots and GitHub social preview cards for Online Chess. Everything here is
a capture of the real app or is built from those captures with typeset fonts.
Nothing is generated or mocked. `manifest.json` lists each file with its size,
SHA-256 hash and source.

The images are © Rico Trebeljahr, all rights reserved. The chess pieces they
show are by Uray M. János under CC BY-SA 3.0 (see the README's License section).

## Screenshots

Captured on 2026-11-06 from a local dev server at app commit `cd56c18`, with a
throwaway database. Two browser contexts, `mira` (White) and `jonas` (Black),
play eleven moves of an Italian Game; `lena` and `kofi` each open a game that
waits for a second player.

| File | Pixels | Shows |
| --- | --- | --- |
| `screenshots/game-desktop.jpg` | 3200×2078 (1600-px page at 2×) | White's view of the game: board, clocks, match status, actions, latest moves. README hero. |
| `screenshots/game-desktop-black.jpg` | 3200×2078 | The same moment from Black's side: the board turned round. |
| `screenshots/game-mobile.jpg` | 1170×2532 (390×844 at 3×) | White's view on a phone. |
| `screenshots/lobby-open-games.jpg` | 3200×1000 | The lobby's "new" tab: one running game to spectate, two waiting to be joined. |

## Social preview cards

1280×640 PNG, each under 400 KiB, key content inside a 64 px margin. Built from
`social-preview/template.html` (Fraunces and Space Grotesk, the app's own fonts
and colours) and the screenshots above.

| File | Idea |
| --- | --- |
| `social-preview/social-preview-a.png` | Screenshot-led: wordmark and one line on the app's cream background, beside the desktop game capture. |
| `social-preview/social-preview-b.png` | Typographic: the lobby's slate-to-teal gradient, a large wordmark and a checkerboard in the board colours. No screenshot. |
| `social-preview/social-preview-c.png` | Dark: White's and Black's screens of one game side by side. |

None is uploaded to GitHub yet; the repository owner picks one.

## og:image cards

1200×630 PNG, the Open Graph size, built from card A of the same template. The
card is laid out at 1280×672 (the same 1.91:1 shape), shot at 2× and scaled
down to exactly 1200×630 with ImageMagick.

| File | Shows |
| --- | --- |
| `social-preview/og-wordmark.png` | Card A: wordmark, one line and the URL beside the desktop game capture. |
| `social-preview/og-clean.png` | No text: the same game crop, larger, centred on the cream background. |

## Rebuilding

Both scripts need Playwright with a Chromium. It is not a dependency of this
repo: install it globally, or point `PLAYWRIGHT_MODULE` at any Playwright
package folder and, if its own browser is missing, `CHROMIUM_PATH` at a
Chromium binary. The og:image cards also need ImageMagick (`magick`).

```bash
# 1. App on a fresh, throwaway database (the script registers its players).
CHESS_DB_FILE=/tmp/chess-capture/chess.db API_PORT=<free port> PORT=<free port> pnpm dev

# 2. Screenshots into docs/marketing/screenshots/
BASE_URL=http://127.0.0.1:<PORT> pnpm marketing:screenshots

# 3. Cards into docs/marketing/social-preview/ (needs network for Google Fonts).
#    REVIEW_DIR=<folder> also writes copies and a labelled review-sheet.jpg there.
pnpm marketing:social-preview
# Only the two og:image cards (leaves the 1280x640 cards alone):
pnpm marketing:social-preview --og
```

If the game page layout changes, check the `data-crop` boxes in
`social-preview/template.html`: they are CSS-pixel rectangles of the 1600-px
page.
