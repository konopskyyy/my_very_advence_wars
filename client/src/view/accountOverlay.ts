import { AuthError, login, register } from '../auth/api';
import { formatAccountDate } from '../auth/format';
import { authStore } from '../auth/store';

type AccountMode = 'login' | 'register';

export interface AccountOverlay {
  open(): void;
  close(): void;
  toggle(): void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;
const GENERIC_MESSAGE = 'Coś poszło nie tak. Spróbuj ponownie.';

let instance: AccountOverlay | null = null;

export function mountAccountOverlay(): AccountOverlay {
  if (!instance) {
    instance = createOverlay();
  }

  return instance;
}

export function toggleAccountOverlay(): void {
  instance?.toggle();
}

function query<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector(selector);

  if (!element) {
    throw new Error(`Brak elementu ${selector} w panelu konta`);
  }

  return element as T;
}

function createOverlay(): AccountOverlay {
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'account-overlay__trigger';
  trigger.textContent = 'KONTO';
  trigger.setAttribute('aria-haspopup', 'dialog');

  const modal = document.createElement('div');
  modal.className = 'account-overlay';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="account-overlay__backdrop" data-close></div>
    <section class="account-overlay__panel" role="dialog" aria-modal="true" aria-labelledby="account-overlay-title">
      <header class="account-overlay__header">
        <h2 id="account-overlay-title" class="account-overlay__title">Konto gracza</h2>
        <button type="button" class="account-overlay__close" data-close aria-label="Zamknij">×</button>
      </header>
      <form class="account-overlay__form" data-form>
        <label class="auth__field">
          <span class="auth__label">E-mail</span>
          <input class="auth__input" data-email type="email" autocomplete="email" placeholder="gracz@example.com" />
        </label>
        <label class="auth__field">
          <span class="auth__label">Hasło</span>
          <input class="auth__input" data-password type="password" autocomplete="current-password" placeholder="minimum 8 znaków" />
        </label>
        <p class="auth__message" data-message role="status" aria-live="polite"></p>
        <div class="account-overlay__actions">
          <button type="submit" class="auth__button auth__button--primary" data-login>Zaloguj się</button>
          <button type="button" class="auth__button auth__button--ghost" data-register>Zarejestruj się</button>
        </div>
      </form>
      <div class="account-overlay__session" data-session hidden>
        <p class="auth__label">Zalogowano jako</p>
        <p class="account-overlay__email" data-session-email></p>
        <p class="account-overlay__since" data-session-since></p>
        <button type="button" class="auth__button auth__button--ghost" data-logout>Wyloguj się</button>
      </div>
    </section>
  `;

  document.body.append(trigger, modal);

  const form = query<HTMLFormElement>(modal, '[data-form]');
  const emailInput = query<HTMLInputElement>(modal, '[data-email]');
  const passwordInput = query<HTMLInputElement>(modal, '[data-password]');
  const message = query<HTMLElement>(modal, '[data-message]');
  const loginButton = query<HTMLButtonElement>(modal, '[data-login]');
  const registerButton = query<HTMLButtonElement>(modal, '[data-register]');
  const sessionBlock = query<HTMLElement>(modal, '[data-session]');
  const sessionEmail = query<HTMLElement>(modal, '[data-session-email]');
  const sessionSince = query<HTMLElement>(modal, '[data-session-since]');
  const logoutButton = query<HTMLButtonElement>(modal, '[data-logout]');
  const closeButton = query<HTMLButtonElement>(modal, '.account-overlay__close');

  let busy = false;

  const setMessage = (text: string, kind: 'error' | 'success' = 'error'): void => {
    message.textContent = text;
    message.dataset.kind = kind;
  };

  const setBusy = (mode: AccountMode | null): void => {
    busy = mode !== null;
    loginButton.disabled = busy;
    registerButton.disabled = busy;
    emailInput.disabled = busy;
    passwordInput.disabled = busy;
    loginButton.textContent = mode === 'login' ? 'Logowanie…' : 'Zaloguj się';
    registerButton.textContent = mode === 'register' ? 'Rejestracja…' : 'Zarejestruj się';
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

    return null;
  };

  const submit = async (mode: AccountMode): Promise<void> => {
    if (busy) {
      return;
    }

    const error = validate();

    if (error) {
      setMessage(error);
      return;
    }

    setBusy(mode);
    setMessage('');

    try {
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const session = mode === 'register' ? await register(email, password) : await login(email, password);

      authStore.set(session);
      passwordInput.value = '';
    } catch (caught) {
      setMessage(caught instanceof AuthError ? caught.message : GENERIC_MESSAGE);
    } finally {
      setBusy(null);
    }
  };

  const render = (): void => {
    const session = authStore.session;

    trigger.classList.toggle('is-authenticated', session !== null);
    trigger.title = session ? session.user.email : 'Otwórz panel konta';
    form.hidden = session !== null;
    sessionBlock.hidden = session === null;

    if (session) {
      sessionEmail.textContent = session.user.email;
      const since = formatAccountDate(session.user.createdAt);
      sessionSince.textContent = since ? `Konto od ${since}` : '';
    }
  };

  const open = (): void => {
    modal.hidden = false;

    if (authStore.session) {
      closeButton.focus();
    } else {
      emailInput.focus();
    }
  };

  const close = (): void => {
    modal.hidden = true;
    trigger.focus();
  };

  trigger.addEventListener('click', () => {
    if (modal.hidden) {
      open();
    } else {
      close();
    }
  });

  for (const element of Array.from(modal.querySelectorAll<HTMLElement>('[data-close]'))) {
    element.addEventListener('click', close);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void submit('login');
  });

  registerButton.addEventListener('click', () => {
    void submit('register');
  });

  logoutButton.addEventListener('click', () => {
    authStore.clear();
    emailInput.value = '';
    passwordInput.value = '';
    setMessage('Wylogowano.', 'success');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) {
      close();
    }
  });

  authStore.subscribe(render);

  if (authStore.session) {
    void authStore.restore();
  }

  return {
    open,
    close,
    toggle: () => {
      if (modal.hidden) {
        open();
      } else {
        close();
      }
    },
  };
}
