import {
  postMessage,
} from './utils';
import {
  toggleBlindfoldMode,
} from './blindfold';
import {
  Command,
  Nullable,
} from './types';
import { i18n } from './i18n';
import {
  getNewGameButton,
  getRematchButton,
  getPlayUrl,
  navigate,
  parseTimeControl,
} from './ykwim/game-commands';

const RESIGN_BUTTON_SELECTOR = `
  .resign-button-component,
  button[aria-label="Resign"],
  [data-cy="resign-button"]
`;
const RESIGN_CONFIRM_TEXT = /^(yes|resign|confirm)$/i;
const RESIGN_CONFIRM_TIMEOUT = 3000;

function getResignButton() : Nullable<HTMLElement> {
  return document.querySelector(RESIGN_BUTTON_SELECTOR);
}

/**
 * Find "Yes" button of the resign confirmation dialog
 */
function getResignConfirmButton(resignButton: HTMLElement) : Nullable<HTMLElement> {
  const buttons = <HTMLElement[]>Array.from(document.querySelectorAll('button, [role="button"]'));
  return buttons.find((button) => (
    button !== resignButton &&
    !resignButton.contains(button) &&
    button.offsetParent !== null &&
    RESIGN_CONFIRM_TEXT.test((button.textContent || '').trim())
  )) || null;
}

/**
 * Resign in one step: press resign and confirm the dialog chess.com shows
 */
export function resign() {
  const resignButton = getResignButton();
  if (!resignButton) {
    return;
  }
  resignButton.click();

  const tryConfirm = () : boolean => {
    const confirmButton = getResignConfirmButton(resignButton);
    if (confirmButton) {
      confirmButton.click();
      return true;
    }
    return false;
  };

  if (tryConfirm()) {
    return;
  }

  const observer = new MutationObserver(() => {
    if (tryConfirm()) {
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), RESIGN_CONFIRM_TIMEOUT);
}

export const commands : Command[] = [
  {
    name: 'blindfold',
    isAvailable: () => true,
    act: toggleBlindfoldMode,
  },
  {
    name: 'rsg',
    isAvailable: () => Boolean(getResignButton()),
    act: resign,
  },
  {
    name: 'draw',
    isAvailable: () => Boolean(document.querySelector('.draw-button-component')),
    act: () => {
      const drawButton = <Nullable<HTMLButtonElement>>document.querySelector('.draw-button-component');
      drawButton && drawButton.click();
    },
  },
  {
    name: 'cancel',
    isAvailable: () => Boolean(document.querySelector('.daily-confirm-move-buttons .cc-button-secondary')),
    act: () => {
      const cancelButton = <Nullable<HTMLButtonElement>>document.querySelector('.daily-confirm-move-buttons .cc-button-secondary');
      cancelButton && cancelButton.click();
    },
  },
  {
    name: 'n',
    isAvailable: () => Boolean(getNewGameButton()),
    act: () => {
      const newGameButton = getNewGameButton();
      newGameButton && newGameButton.click();
    },
  },
  {
    name: 're',
    isAvailable: () => Boolean(getRematchButton()),
    act: () => {
      const rematchButton = getRematchButton();
      rematchButton && rematchButton.click();
    },
  },
  {
    name: 'play',
    isAvailable: () => true,
    act: (args: string) => {
      const timeControl = parseTimeControl(args);
      if (timeControl) {
        navigate(getPlayUrl(timeControl));
      } else {
        postMessage(i18n('playUsage'));
      }
    },
  },
  {
    name: 'confirm',
    isAvailable: () => Boolean(document.querySelector('.daily-confirm-move-buttons .cc-button-primary')),
    act: () => {
      const confirmButton = <Nullable<HTMLButtonElement>>document.querySelector('.daily-confirm-move-buttons .cc-button-primary');
      confirmButton && confirmButton.click();
    },
  }
];

/**
 * Parse command text (or return null if not a command)
 */
export function getCommandAction(input: string) : Command | null {
  if (input[0] === '/') {
    // "/play 15:10" and "/play(15:10)" -> name "play", args "15:10"
    const [, name, args] = /^\/([a-z]*)(.*)$/i.exec(input.trim()) || ['', '', ''];
    const command = commands.find(c => c.name === name.toLowerCase());

    if (command) {
      return {
        ...command,
        act: () => command.act(args.trim().replace(/^\((.*)\)$/, '$1')),
      };
    }

    return {
      name: 'no-command-found',
      isAvailable: () => true,
      act: () => {
        postMessage(i18n('commandNotFound', { command: input }));
      },
    };
  }

  return null;
}
