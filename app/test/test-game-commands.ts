import jsDomGlobal from 'jsdom-global';
import assert from 'assert';

jsDomGlobal();

import {
  getPlayUrl,
  parseTimeControl,
} from '../src/ykwim/game-commands';
import {
  getCommandAction,
} from '../src/commands';

describe('parseTimeControl', function() {
  it('parses minutes and increment in different formats', function() {
    const expected = { base: 900, increment: 10 };
    assert.deepEqual(parseTimeControl('15:10'), expected);
    assert.deepEqual(parseTimeControl('(15:10)'), expected);
    assert.deepEqual(parseTimeControl('15+10'), expected);
    assert.deepEqual(parseTimeControl('15|10'), expected);
    assert.deepEqual(parseTimeControl('15 10'), expected);
  });

  it('treats a single number as minutes without increment', function() {
    assert.deepEqual(parseTimeControl('3'), { base: 180, increment: 0 });
  });

  it('rejects garbage', function() {
    assert.equal(parseTimeControl(''), null);
    assert.equal(parseTimeControl('blitz'), null);
    assert.equal(parseTimeControl('0:5'), null);
  });

  it('builds chess.com url', function() {
    assert.equal(
      getPlayUrl({ base: 180, increment: 2 }),
      'https://www.chess.com/play/online/new?action=createLiveChallenge&base=180&timeIncrement=2',
    );
  });
});

describe('getCommandAction', function() {
  it('finds commands with arguments', function() {
    assert.equal(getCommandAction('/play 3:2')!.name, 'play');
    assert.equal(getCommandAction('/play(15:10)')!.name, 'play');
    assert.equal(getCommandAction('/re')!.name, 're');
    assert.equal(getCommandAction('/n')!.name, 'n');
  });

  it('reports unknown commands', function() {
    assert.equal(getCommandAction('/nope')!.name, 'no-command-found');
    assert.equal(getCommandAction('e4'), null);
  });
});
