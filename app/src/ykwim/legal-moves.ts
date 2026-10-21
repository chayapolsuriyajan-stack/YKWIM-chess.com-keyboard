import {
  IChessboard,
  TArea,
  TFromTo,
  TPiece,
} from '../types';
import {
  ALL_AREAS,
} from '../utils';

export interface ILegalMove {
  piece: TPiece
  from: TArea
  to: TArea
  // type of the captured piece, if the move is a capture
  captured?: TPiece
}

/**
 * Get every legal move of the side to move,
 * annotated with the moving and the captured piece
 */
export function getAllLegalMoves(board: IChessboard) : ILegalMove[] {
  if (!board || !board.isPlayersMove()) {
    return [];
  }

  const pieces = Object.values(board.getPiecesSetup());
  const pieceAt: Record<TArea, { type: string, color: number }> = {};
  pieces.forEach((p) => {
    pieceAt[p.area] = p;
  });

  let pairs: TFromTo[];
  if (board.getAllLegalMoves) {
    pairs = board.getAllLegalMoves();
  } else {
    pairs = [];
    pieces.forEach((p) => {
      ALL_AREAS.forEach((to) => {
        if (to !== p.area && board.isLegalMove(p.area, to)) {
          pairs.push([p.area, to]);
        }
      });
    });
  }

  const result: ILegalMove[] = [];
  const seen: Record<string, boolean> = {};
  pairs.forEach(([from, to]) => {
    const mover = pieceAt[from];
    // promotion moves can be listed several times (one per promotion piece)
    if (!mover || seen[from + to]) {
      return;
    }
    seen[from + to] = true;

    const target = pieceAt[to];
    const move: ILegalMove = { piece: mover.type, from, to };
    if (target && target.color !== mover.color) {
      move.captured = target.type;
    } else if (!target && mover.type === 'p' && from[0] !== to[0]) {
      // en passant
      move.captured = 'p';
    }
    result.push(move);
  });

  return result;
}

/**
 * Is pawn move landing on the last rank
 */
export function isPromotion(move: ILegalMove) : boolean {
  return move.piece === 'p' && (move.to[1] === '1' || move.to[1] === '8');
}
