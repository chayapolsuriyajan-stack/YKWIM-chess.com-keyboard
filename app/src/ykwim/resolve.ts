import {
  IChessboard,
  IMove,
  IMoveTemplate,
} from '../types';
import {
  parseMoveInput,
} from '../parse-move';
import {
  getAllLegalMoves,
  isPromotion,
  ILegalMove,
} from './legal-moves';
import {
  parseFuzzyInput,
  IFuzzyIntent,
} from './fuzzy-parse';

export type TResolveSource = 'exact' | 'fuzzy' | 'suggestion';

export interface IResolveResult {
  moves: IMove[]
  source: TResolveSource
}

type TGetExactMoves = (board: IChessboard, templates: IMoveTemplate[]) => IMove[];

/**
 * Turn user input into moves ("you know what I mean" mode):
 * 1. exact notation (Nf3, e2e4) - the original behaviour
 * 2. shorthands (nf, qxb, exd, xq, ...) - see parseFuzzyInput
 * 3. a single suggestion for a mistyped move (Rxb7 -> Rxb2)
 */
export function resolveInput(
  board: IChessboard,
  input: string,
  getExactMoves: TGetExactMoves,
) : IResolveResult {
  const templates = parseMoveInput(input);
  const exactMoves = getExactMoves(board, templates);
  if (exactMoves.length || !board || !board.isPlayersMove()) {
    return { moves: exactMoves, source: 'exact' };
  }

  const legalMoves = getAllLegalMoves(board);

  const fuzzyMoves = getFuzzyMoves(legalMoves, parseFuzzyInput(input));
  if (fuzzyMoves.length) {
    return { moves: fuzzyMoves, source: 'fuzzy' };
  }

  const suggestion = getSuggestion(legalMoves, templates, /x/i.test(input));
  if (suggestion) {
    return { moves: [suggestion], source: 'suggestion' };
  }

  return { moves: [], source: 'exact' };
}

function matchesIntent(move: ILegalMove, intent: IFuzzyIntent) : boolean {
  return (
    (!intent.piece || move.piece === intent.piece) &&
    (!intent.fromFile || move.from[0] === intent.fromFile) &&
    (!intent.to || move.to === intent.to) &&
    (!intent.toFile || move.to[0] === intent.toFile) &&
    (!intent.toRank || move.to[1] === intent.toRank) &&
    (!intent.capture || Boolean(move.captured)) &&
    (!intent.target || move.captured === intent.target) &&
    (!intent.oneStep || Math.abs(move.to.charCodeAt(1) - move.from.charCodeAt(1)) === 1)
  );
}

function toMove(move: ILegalMove) : IMove {
  const result: IMove = {
    piece: move.piece,
    from: move.from,
    to: move.to,
  };
  if (isPromotion(move)) {
    result.promotionPiece = 'q';
  }
  return result;
}

/**
 * Moves matching the highest tier of intents having any matches
 */
export function getFuzzyMoves(legalMoves: ILegalMove[], intents: IFuzzyIntent[]) : IMove[] {
  const tiers = Array.from(new Set(intents.map(i => i.tier))).sort((a, b) => a - b);

  for (const tier of tiers) {
    const tierIntents = intents.filter(i => i.tier === tier);
    const matching = legalMoves.filter(m => tierIntents.some(i => matchesIntent(m, i)));
    if (matching.length) {
      return matching.map(toMove);
    }
  }

  return [];
}

/**
 * Guess the intended move for an illegal input
 * The typed piece is kept, the destination is moved along the typed file
 * (or rank, if nothing found on the file); if "x" was typed only captures count.
 * Returns a move only if there's a single best guess.
 */
export function getSuggestion(
  legalMoves: ILegalMove[],
  templates: IMoveTemplate[],
  isCapture: boolean,
) : IMove | null {
  type TCandidate = { move: ILegalMove, score: number };
  const candidates: TCandidate[] = [];

  templates.forEach((template) => {
    const typedTo = template.to;
    legalMoves.forEach((move) => {
      if (template.piece !== '.' && move.piece !== template.piece) {
        return;
      }
      if (isCapture && !move.captured) {
        return;
      }
      if (template.from && !new RegExp(`^${template.from}$`).test(move.from)) {
        return;
      }

      const sameFile = move.to[0] === typedTo[0];
      const sameRank = move.to[1] === typedTo[1];
      if (move.to === typedTo || (!sameFile && !sameRank)) {
        return;
      }

      // captures are rare, so typed "x" is a stronger hint than closeness
      const distance = sameFile
        ? Math.abs(move.to.charCodeAt(1) - typedTo.charCodeAt(1))
        : Math.abs(move.to.charCodeAt(0) - typedTo.charCodeAt(0));
      const score = (sameFile ? 0 : 100) + (isCapture ? 0 : distance);
      candidates.push({ move, score });
    });
  });

  const unique: Record<string, TCandidate> = {};
  candidates.forEach((c) => {
    const key = c.move.from + c.move.to;
    if (!unique[key] || unique[key].score > c.score) {
      unique[key] = c;
    }
  });
  const sorted = Object.values(unique).sort((a, b) => a.score - b.score);

  if (sorted.length === 1 || (sorted.length > 1 && sorted[0].score < sorted[1].score)) {
    return toMove(sorted[0].move);
  }

  return null;
}
