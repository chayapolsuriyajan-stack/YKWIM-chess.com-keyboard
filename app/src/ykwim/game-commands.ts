import {
  Nullable,
} from '../types';

/**
 * Find a visible button by its text, e.g. "Rematch" or "New 10 min"
 */
export function findButtonByText(text: RegExp) : Nullable<HTMLElement> {
  const buttons = <HTMLElement[]>Array.from(document.querySelectorAll('button, [role="button"], a.cc-button-component'));
  return buttons.find((button) => (
    button.offsetParent !== null &&
    text.test((button.textContent || '').replace(/\s+/g, ' ').trim())
  )) || null;
}

// "New 10 min", "New 3 | 2", "New Game"
const NEW_GAME_TEXT = /^new\b/i;
const REMATCH_TEXT = /^rematch$/i;

export function getNewGameButton() : Nullable<HTMLElement> {
  return findButtonByText(NEW_GAME_TEXT);
}

export function getRematchButton() : Nullable<HTMLElement> {
  return findButtonByText(REMATCH_TEXT);
}

export interface ITimeControl {
  // seconds
  base: number
  // seconds
  increment: number
}

/**
 * Parse time control in minutes and seconds of increment:
 * "15:10", "(15:10)", "15+10", "15|10", "15 10", "3"
 */
export function parseTimeControl(input: string) : ITimeControl | null {
  const match = /^\(?\s*(\d+(?:\.\d+)?)\s*(?:[:+|\s]\s*(\d+))?\s*\)?$/.exec(input.trim());
  if (!match) {
    return null;
  }

  const base = Math.round(parseFloat(match[1]) * 60);
  const increment = match[2] ? parseInt(match[2], 10) : 0;
  if (!base) {
    return null;
  }

  return { base, increment };
}

/**
 * Chess.com page seeking a live game with the given time control
 */
export function getPlayUrl({ base, increment }: ITimeControl) : string {
  return `https://www.chess.com/play/online/new?action=createLiveChallenge&base=${base}&timeIncrement=${increment}`;
}

export function navigate(url: string) {
  try {
    (window.top || window).location.href = url;
  } catch (e) {
    // cross-origin frame
    window.location.href = url;
  }
}
