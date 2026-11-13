import { AuthError, login, register } from '../auth/api';
import { formatAccountDate } from '../auth/format';
import { authStore } from '../auth/store';

type AuthTab = 'login' | 'register';
type MessageKind = 'error' | 'success';

interface AuthScreenOptions {
  onEnterGame: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;
const GENERIC_MESSAGE = 'Coś poszło nie tak. Spróbuj ponownie.';

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Brak elementu #${id} na stronie`);
  }

  return element as T;
}

export function mountAuthScreen({ onEnterGame }: AuthScreenOptions): void {
  const form = requireElement<HTMLFormElement>('auth-form');
  const submit = requireElement<HTMLButtonElement>('auth-submit');
  const playButtons = [
    requireElement<HTMLButtonElement>('auth-play'),
    ...Array.from(document.querySelectorAll<HTMLButtonElement>('[data-play-game]')),
  ];
  const message = requireElement<HTMLElement>('auth-message');
  const confirmField = requireElement<HTMLElement>('auth-confirm-field');
  const confirmInput = requireElement<HTMLInputElement>('auth-confirm-input');
  const emailInput = requireElement<HTMLInputElement>('auth-email');
  const passwordInput = requireElement<HTMLInputElement>('auth-password');
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tab]'));
  const tabsBox = requireElement<HTMLElement>('auth-tabs');
  const note = requireElement<HTMLElement>('auth-note');
  const account = requireElement<HTMLElement>('auth-account');
  const accountEmail = requireElement<HTMLElement>('auth-account-email');
  const accountSince = requireElement<HTMLElement>('auth-account-since');
  const logout = requireElement<HTMLButtonElement>('auth-logout');

  let currentTab: AuthTab = 'login';
  let busy = false;

  const setMessage = (text: string, kind: MessageKind = 'error'): void => {
    message.textContent = text;
    message.dataset.kind = kind;
  };

  const setBusy = (value: boolean): void => {
    busy = value;
    submit.disabled = value;
    emailInput.disabled = value;
    passwordInput.disabled = value;
    confirmInput.disabled = value || currentTab !== 'register';
    submit.textContent = value
      ? currentTab === 'register'
        ? 'Rejestracja…'
        : 'Logowanie…'
      : currentTab === 'register'
        ? 'Zarejestruj się'
        : 'Zaloguj się';
  };

  const selectTab = (tab: AuthTab): void => {
    currentTab = tab;

    for (const button of tabs) {
      const selected = button.dataset.tab === tab;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', String(selected));
    }

    const registering = tab === 'register';
    confirmField.hidden = !registering;
    confirmInput.disabled = busy || !registering;
    passwordInput.autocomplete = registering ? 'new-password' : 'current-password';

    if (!busy) {
      submit.textContent = registering ? 'Zarejestruj się' : 'Zaloguj się';
    }

    setMessage('');
  };

  const render = (): void => {
    const session = authStore.session;
    const logged = session !== null;

    form.hidden = logged;
    tabsBox.hidden = logged;
    note.hidden = logged;
    account.hidden = !logged;

    if (session) {
      accountEmail.textContent = session.user.email;
      const since = formatAccountDate(session.user.createdAt);
      accountSince.textContent = since ? `Konto od ${since}` : '';
    }
  };

  const validate = (): string | null => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
      return 'Podaj adres e-mail.';
    }

    if (!EMAIL_PATTERN.test(email)) {
      return 'Podaj poprawny adres e-mail.';
    }

    if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
      return `Hasło musi mieć od ${PASSWORD_MIN} do ${PASSWORD_MAX} znaków.`;
    }

    if (currentTab === 'register' && confirmInput.value !== password) {
      return 'Hasła nie są takie same.';
    }

    return null;
  };

  const submitForm = async (): Promise<void> => {
    setBusy(true);
    setMessage('');

    try {
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const session =
        currentTab === 'register'
          ? await register(email, password)
          : await login(email, password);

      authStore.set(session);
      passwordInput.value = '';
      confirmInput.value = '';
    } catch (error) {
      setMessage(error instanceof AuthError ? error.message : GENERIC_MESSAGE);
    } finally {
      setBusy(false);
    }
  };

  for (const button of tabs) {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab;

      if ((tab === 'login' || tab === 'register') && !busy) {
        selectTab(tab);
      }
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (busy) {
      return;
    }

    const error = validate();

    if (error) {
      setMessage(error);
      return;
    }

    void submitForm();
  });

  logout.addEventListener('click', () => {
    authStore.clear();
    emailInput.value = '';
    passwordInput.value = '';
    confirmInput.value = '';
    setMessage('Wylogowano.', 'success');
  });

  for (const button of playButtons) {
    button.addEventListener('click', () => {
      onEnterGame();
    });
  }

  authStore.subscribe((session) => {
    render();

    if (!session) {
      selectTab(currentTab);
    }
  });

  if (authStore.session) {
    void authStore.restore();
  }
}
