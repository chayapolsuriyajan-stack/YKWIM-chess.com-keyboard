import {
  TLocaleSet,
} from '../../src/types';

const translations : TLocaleSet = {
  inputHint: 'Enter your move or type / to see commands...',
  focusHint: 'Press C to focus move field...',
  focusHintFromOther: 'Press Esc + C to focus move field...',
  ambiguousMove: 'Ambiguous move: $move',
  incorrectMove: 'Incorrect move: $move',
  illegalMove: 'Move $move is illegal',
  commandNotFound: "Can't find command $command",
  didYouMean: 'Did you mean $move? Press Enter again to play it',
  blindFoldPeekHint: 'Hover here or hold $key to peek',
  blindFoldOn: 'Blindfold mode is on',
  blindfoldToggleHint: 'Click here or type /blindfold to toggle',
  playUsage: 'Usage: /play 15:10 (minutes:increment)',
  _test: 'Test content',
  _test_1_placeholder: 'Test content $name1',
  _test_2_placeholders: 'Test content $name1 $name2',
};

export default translations;
