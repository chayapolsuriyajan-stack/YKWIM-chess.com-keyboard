# YKWIM Chess.com Keyboard

"You know what I mean" keyboard input for [chess.com](https://www.chess.com/).
Type less, play faster: the extension figures out the move from a shorthand and,
when you mistype, suggests what you probably meant.

Based on [Chess Helper / Chess.com Keyboard](https://github.com/everyonesdesign/Chess-Helper)
by everyonesdesign (MIT).

## Install (no npm needed)

1. Download [`release/ykwim-chess-keyboard.zip`](release/ykwim-chess-keyboard.zip) and unzip it into a folder you keep.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and pick the unzipped folder.

## Using it

Press `C` to focus the move field, type a move, press `Enter`.
While you type, the resolved move is drawn as an arrow on the board.

Everything the original extension accepts still works the same way
(`Nf3`, `exd5`, `e2e4`, `0-0`, ...). Shorthands kick in only when the full notation
doesn't match a legal move, and a shorthand is played only if it matches exactly one move.

| Type     | Means                                                    | Example result |
|----------|----------------------------------------------------------|----------------|
| `e`      | the e-pawn one square forward (`e4` for two)             | `e3`           |
| `nf`     | the knight move to the f-file                            | `Nf3`          |
| `r1`     | the rook move to the 1st rank                            | `Rd1`          |
| `qxb`    | queen takes the **bishop** (with `x` the letter is a piece) | `Qxg4`      |
| `qxn`    | queen takes the knight                                   | `Qxd5`         |
| `nb`     | knight to the b-file (no `x`, so `b` is a file)          | `Nb3`          |
| `xq`     | whatever piece can take the queen                        | `Nxd5`         |
| `ed`/`exd` | e-pawn takes on the d-file                             | `exd5`         |
| `xf7`    | any capture on f7                                        | `Qxf7`         |
| `f7`     | any piece to f7 (if no pawn can go there)                | `Qxf7`         |

Notes:
- `qxb` prefers capturing a bishop; if there's no bishop to take it falls back to a capture on the b-file.
- Lowercase `b` at the start can be a bishop or the b-pawn; capital `B` is always the bishop.
- Shorthand pawn promotions promote to a queen. Type `e8=N` for anything else.

### Invalid move helper

If what you typed isn't legal, the extension looks for the move you most likely meant:
same piece, destination moved along the typed file (or rank), and only captures if you typed `x`.

Example: your rook is on b7 and you type `Rxb7`. The only rook capture on the b-file is b2,
so you get **"Did you mean Rxb2? Press Enter again to play it"** and an arrow on the board.
Press `Enter` again to play it. A suggestion is never played without that second `Enter`.

### Commands

Type `/` to see commands.

- `/rsg`: resign. It also confirms chess.com's "are you sure?" dialog, so it takes one step.
- `/n`: new game with the same time control (the "New ..." button after a game).
- `/re`: rematch.
- `/play 15:10`, `/play (3:2)`: look for a game with that time control
  (minutes:increment; `15+10`, `15|10` and `3` work too).
- `/draw`: offer a draw.
- `/blindfold`: toggle blindfold mode.
- `/confirm`, `/cancel`: confirm or cancel a daily move.

Other keys: `Ctrl`/`Cmd` + `←`/`→` go through moves, `Esc` clears the field.

## Development

```
npm i              # install (set CYPRESS_INSTALL_BINARY=0 to skip the Cypress download)
npm run build      # build app/build.js
npm run watch      # rebuild on change
npm test           # unit tests
npm run pack       # app.zip for the stores
```

After changing the code, refresh the committed pack:

```
npm run pack && mv app.zip release/ykwim-chess-keyboard.zip
```

Load it in Chrome: `chrome://extensions` → enable Developer mode → **Load unpacked** →
select the `app/` folder (after `npm run build`).

The YKWIM logic lives in `app/src/ykwim/`:
- `fuzzy-parse.ts`: turns shorthand like `qxb` into a loose move description
- `legal-moves.ts`: lists every legal move with the moving and captured piece
- `resolve.ts`: exact match first, then shorthands, then a suggestion

## License

MIT, see [LICENSE](LICENSE). Original work © Trambitckii Iurii (everyonesdesign).

The extension may contain bugs. Using it is at your own risk; it isn't meant
to break chess.com's terms of use.
