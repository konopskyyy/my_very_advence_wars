type AuthTab = 'login' | 'register';

interface AuthScreenOptions {
  onEnterGame: () => void;
}

const DEMO_MESSAGE =
  'To wersja demo — logowanie i rejestracja zostaną podłączone później. Wybierz „Przejdź do gry”.';

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Brak elementu #${id} na stronie`);
  }

  return element as T;
}

export function mountAuthScreen({ onEnterGame }: AuthScreenOptions): void {
  const screen = requireElement<HTMLElement>('auth-screen');
  const app = requireElement<HTMLElement>('app');
  const form = requireElement<HTMLFormElement>('auth-form');
  const submit = requireElement<HTMLButtonElement>('auth-submit');
  const playButtons = [
    requireElement<HTMLButtonElement>('auth-play'),
    ...Array.from(document.querySelectorAll<HTMLButtonElement>('[data-play-game]')),
  ];
  const message = requireElement<HTMLElement>('auth-message');
  const confirmField = requireElement<HTMLElement>('auth-confirm-field');
  const confirmInput = requireElement<HTMLInputElement>('auth-confirm-input');
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tab]'));

  const selectTab = (tab: AuthTab): void => {
    for (const button of tabs) {
      const selected = button.dataset.tab === tab;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', String(selected));
    }

    const registering = tab === 'register';
    confirmField.hidden = !registering;
    confirmInput.disabled = !registering;
    submit.textContent = registering ? 'Zarejestruj się' : 'Zaloguj się';
    message.textContent = '';
  };

  for (const button of tabs) {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab;

      if (tab === 'login' || tab === 'register') {
        selectTab(tab);
      }
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    message.textContent = DEMO_MESSAGE;
  });

  for (const button of playButtons) {
    button.addEventListener('click', () => {
      screen.hidden = true;
      app.hidden = false;
      onEnterGame();
    });
  }
}
