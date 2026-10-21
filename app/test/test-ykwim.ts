import jsDomGlobal from 'jsdom-global';
import assert from 'assert';

jsDomGlobal();

import {
  getLegalMoves,
  go,
} from '../src/chess';
import {
  resolveInput,
} from '../src/ykwim/resolve';
import {
  parseFuzzyInput,
} from '../src/ykwim/fuzzy-parse';
import {
  IChessboard,
  TArea,
  TFromTo,
} from '../src/types';

const WHITE = 1;
const BLACK = 2;

interface IPiece { color: number, type: string, area: string };

const getBoard = (pieces: IPiece[], legalMoves: TFromTo[]) => {
  const setup: Record<string, IPiece> = {};
  pieces.forEach((p, i) => {
    setup[i] = p;
  });
  const madeMoves: TFromTo[] = [];

  const board: IChessboard = {
    isLegalMove: (from: TArea, to: TArea) => legalMoves.some(([f, t]) => f === from && t === to),
    isPlayersMove: () => true,
    getPiecesSetup: () => setup,
    getElement: () => document.createElement('div'),
    getRelativeContainer: () => document.createElement('div'),
    makeMove: (fromSq: TArea, toSq: TArea) => { madeMoves.push([fromSq, toSq]); },
    markArrow: () => {},
    unmarkArrow: () => {},
    clearMarkedArrows: () => {},
    markArea: () => {},
    unmarkArea: () => {},
    clearMarkedAreas: () => {},
    clearAllMarkings: () => {},
    submitDailyMove: () => {},
  };

  return { board, madeMoves };
};

const resolve = (board: IChessboard, input: string) => {
  const { moves, source } = resolveInput(board, input, getLegalMoves);
  return { source, moves: moves.map(m => m.from + m.to) };
};

describe('parseFuzzyInput', function() {
  it('ignores complete moves and garbage', function() {
    assert.deepEqual(parseFuzzyInput('Nf3'), []);
    assert.deepEqual(parseFuzzyInput('hello'), []);
    assert.deepEqual(parseFuzzyInput('e'), []);
  });

  it('treats letter after x as a captured piece, file as a fallback', function() {
    assert.deepEqual(parseFuzzyInput('qxb'), [
      { piece: 'q', target: 'b', capture: true, tier: 0 },
      { piece: 'q', toFile: 'b', capture: true, tier: 1 },
    ]);
  });

  it('treats capital B as bishop only', function() {
    assert.deepEqual(parseFuzzyInput('Bc'), [
      { piece: 'b', toFile: 'c', capture: false, tier: 0 },
    ]);
  });
});

describe('resolveInput', function() {
  const startPieces: IPiece[] = [
    { color: WHITE, type: 'n', area: 'g1' },
    { color: WHITE, type: 'n', area: 'b1' },
  ];

  it('nf: the only knight move to f-file', function() {
    const { board } = getBoard(startPieces, [['g1', 'f3'], ['g1', 'h3'], ['b1', 'c3']]);
    assert.deepEqual(resolve(board, 'nf'), { source: 'fuzzy', moves: ['g1f3'] });
  });

  it('nf: ambiguous if two knight moves land on f-file', function() {
    const { board } = getBoard(startPieces, [['g1', 'f3'], ['b1', 'd2'], ['b1', 'f1']]);
    assert.deepEqual(resolve(board, 'nf').moves, ['g1f3', 'b1f1']);
  });

  it('r1: rook to the 1st rank', function() {
    const { board } = getBoard(
      [{ color: WHITE, type: 'r', area: 'a8' }],
      [['a8', 'a1'], ['a8', 'b8']],
    );
    assert.deepEqual(resolve(board, 'r1').moves, ['a8a1']);
  });

  it('keeps exact notation untouched', function() {
    const { board } = getBoard(startPieces, [['g1', 'f3'], ['g1', 'h3']]);
    assert.deepEqual(resolve(board, 'Nh3'), { source: 'exact', moves: ['g1h3'] });
  });

  describe('captures by piece type', function() {
    const pieces: IPiece[] = [
      { color: WHITE, type: 'q', area: 'd1' },
      { color: BLACK, type: 'b', area: 'g4' },
      { color: BLACK, type: 'n', area: 'd5' },
      { color: BLACK, type: 'p', area: 'b3' },
    ];
    const legal: TFromTo[] = [['d1', 'g4'], ['d1', 'd5'], ['d1', 'b3'], ['d1', 'd2']];

    it('qxb: queen takes bishop', function() {
      const { board } = getBoard(pieces, legal);
      assert.deepEqual(resolve(board, 'qxb').moves, ['d1g4']);
    });

    it('qxn: queen takes knight', function() {
      const { board } = getBoard(pieces, legal);
      assert.deepEqual(resolve(board, 'qxn').moves, ['d1d5']);
    });

    it('qxb: falls back to capture on b-file without a bishop to take', function() {
      const { board } = getBoard(pieces.filter(p => p.type !== 'b'), [['d1', 'd5'], ['d1', 'b3']]);
      assert.deepEqual(resolve(board, 'qxb').moves, ['d1b3']);
    });

    it('nb without x means b-file, not bishop', function() {
      const { board } = getBoard(
        [{ color: WHITE, type: 'n', area: 'd2' }, { color: BLACK, type: 'b', area: 'f3' }],
        [['d2', 'f3'], ['d2', 'b3']],
      );
      assert.deepEqual(resolve(board, 'nb').moves, ['d2b3']);
    });

    it('xq: anything takes the queen', function() {
      const { board } = getBoard(
        [
          { color: WHITE, type: 'n', area: 'c3' },
          { color: WHITE, type: 'r', area: 'a1' },
          { color: BLACK, type: 'q', area: 'd5' },
          { color: BLACK, type: 'p', area: 'a7' },
        ],
        [['c3', 'd5'], ['a1', 'a7'], ['a1', 'a2']],
      );
      assert.deepEqual(resolve(board, 'xq').moves, ['c3d5']);
    });
  });

  describe('pawn shorthands', function() {
    const pieces: IPiece[] = [
      { color: WHITE, type: 'p', area: 'e4' },
      { color: WHITE, type: 'p', area: 'c4' },
      { color: BLACK, type: 'p', area: 'd5' },
    ];
    const legal: TFromTo[] = [['e4', 'e5'], ['e4', 'd5'], ['c4', 'c5'], ['c4', 'd5']];

    it('exd and ed: e-pawn takes on d-file', function() {
      const { board } = getBoard(pieces, legal);
      assert.deepEqual(resolve(board, 'exd').moves, ['e4d5']);
      assert.deepEqual(resolve(board, 'ed').moves, ['e4d5']);
    });

    it('bare square falls back to any piece', function() {
      const { board } = getBoard(
        [{ color: WHITE, type: 'q', area: 'h5' }, { color: BLACK, type: 'p', area: 'f7' }],
        [['h5', 'f7'], ['h5', 'h6']],
      );
      assert.deepEqual(resolve(board, 'f7'), { source: 'fuzzy', moves: ['h5f7'] });
      assert.deepEqual(resolve(board, 'xf7').moves, ['h5f7']);
    });

    it('promotes to queen by default', function() {
      const { board } = getBoard(
        [{ color: WHITE, type: 'p', area: 'b7' }, { color: BLACK, type: 'r', area: 'a8' }],
        [['b7', 'a8'], ['b7', 'b8']],
      );
      const { moves } = resolveInput(board, 'xr', getLegalMoves);
      assert.deepEqual(moves, [{ piece: 'p', from: 'b7', to: 'a8', promotionPiece: 'q' }]);
    });
  });

  describe('invalid move helper', function() {
    const pieces: IPiece[] = [
      { color: WHITE, type: 'r', area: 'b7' },
      { color: BLACK, type: 'p', area: 'b2' },
      { color: BLACK, type: 'n', area: 'f7' },
    ];
    const legal: TFromTo[] = [
      ['b7', 'b6'], ['b7', 'b5'], ['b7', 'b4'], ['b7', 'b3'], ['b7', 'b2'],
      ['b7', 'b8'], ['b7', 'c7'], ['b7', 'd7'], ['b7', 'e7'], ['b7', 'f7'],
    ];

    it('Rxb7 with own rook on b7 suggests Rxb2', function() {
      const { board } = getBoard(pieces, legal);
      assert.deepEqual(resolve(board, 'Rxb7'), { source: 'suggestion', moves: ['b7b2'] });
    });

    it('without x picks the closest square on the typed file', function() {
      const { board } = getBoard(pieces, legal);
      assert.deepEqual(resolve(board, 'Rb1'), { source: 'suggestion', moves: ['b7b2'] });
    });

    it('does not guess when there are several equally good options', function() {
      const { board } = getBoard(pieces, legal);
      // b6 and b8 are equally close to b7
      assert.deepEqual(resolve(board, 'Rb7').moves, []);
    });

    it('plays the suggestion only on the second Enter', function() {
      const { board, madeMoves } = getBoard(pieces, legal);
      assert.equal(go(board, 'Rxb7'), false);
      assert.deepEqual(madeMoves, []);
      assert.equal(go(board, 'Rxb7'), true);
      assert.deepEqual(madeMoves, [['b7', 'b2']]);
    });

    it('forgets the suggestion after other input', function() {
      const { board, madeMoves } = getBoard(pieces, legal);
      go(board, 'Rxb7');
      go(board, 'Qd1');
      assert.equal(go(board, 'Rxb7'), false);
      assert.deepEqual(madeMoves, []);
    });
  });
});
