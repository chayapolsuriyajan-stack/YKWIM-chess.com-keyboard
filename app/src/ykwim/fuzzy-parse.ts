import {
  TArea,
  TPiece,
} from '../types';

/**
 * A loose description of a move, e.g. "a knight going to the f-file"
 * Every defined field narrows down the set of matching legal moves
 */
export interface IFuzzyIntent {
  piece?: TPiece
  fromFile?: string
  to?: TArea
  toFile?: string
  toRank?: string
  capture?: boolean
  // type of the piece which has to be captured
  target?: TPiece
  // intents of lower tiers are only tried if higher ones match nothing
  tier: number
}

type TMover = Pick<IFuzzyIntent, 'piece' | 'fromFile'>;

/**
 * Who is moving, based on the first letter of the input
 */
function parseMover(letter: string) : TMover[] | null {
  if (!letter) {
    return [{}];
  } else if (letter === 'B') {
    // capital B always means bishop
    return [{ piece: 'b' }];
  }

  const lower = letter.toLowerCase();
  if (lower === 'b') {
    // either a bishop or a pawn on b-file
    return [{ piece: 'b' }, { piece: 'p', fromFile: 'b' }];
  } else if ('nrqkp'.includes(lower)) {
    return [{ piece: lower }];
  } else if ('acdefgh'.includes(lower)) {
    return [{ piece: 'p', fromFile: lower }];
  }

  return null;
}

/**
 * Parse shorthand input which isn't a complete move:
 *   nf    - knight to f-file
 *   r1    - rook to 1st rank
 *   qxb   - queen captures bishop (or captures on b-file if there's no bishop to take)
 *   xq    - anything captures queen
 *   exd   - e-pawn captures on d-file (same as "ed")
 *   xf7   - any piece captures on f7
 *   f7    - any piece goes to f7
 */
export function parseFuzzyInput(input: string) : IFuzzyIntent[] {
  const moveString = input.replace(/[\s+#!?=\-]+/g, '');
  // full square goes first, so "f7" isn't read as "f-pawn to 7th rank"
  const match = /^()([xX]?)([a-hA-H][1-8])$/.exec(moveString)
    || /^([a-hA-HpPnNrRqQkK]?)([xX]?)([a-hA-H1-8pPnNrRqQkK])$/.exec(moveString);
  if (!match) {
    return [];
  }

  const [, moverLetter, captureSign, rest] = match;
  const movers = parseMover(moverLetter);
  if (!movers) {
    return [];
  }

  const capture = Boolean(captureSign);
  const what = rest.toLowerCase();
  const intents: IFuzzyIntent[] = [];
  const addForEachMover = (intent: IFuzzyIntent) => {
    movers.forEach((mover) => {
      intents.push({ ...mover, ...intent });
    });
  };

  if (what.length === 2) {
    // full square is only fuzzy without a piece specified
    if (!moverLetter) {
      addForEachMover({ to: what, capture, tier: 0 });
    }
  } else if (/[1-8]/.test(what)) {
    if (moverLetter) {
      addForEachMover({ toRank: what, capture, tier: 0 });
    }
  } else {
    const isPieceLetter = 'pnbrq'.includes(what);
    const isFileLetter = /[a-h]/.test(what);

    if (capture && isPieceLetter) {
      addForEachMover({ target: what, capture, tier: 0 });
      if (isFileLetter) {
        addForEachMover({ toFile: what, capture, tier: 1 });
      }
    } else if (isFileLetter && moverLetter) {
      addForEachMover({ toFile: what, capture, tier: 0 });
    }
  }

  return intents;
}
