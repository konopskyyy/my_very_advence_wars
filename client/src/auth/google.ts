export interface GoogleCredentialResponse {
  readonly credential: string;
}

export interface GoogleIdSdk {
  initialize(options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    use_fedcm_for_button: boolean;
  }): void;
  renderButton(
    container: HTMLElement,
    options: { theme: string; size: string; width: number; text: string },
  ): void;
}

export interface GoogleSdk {
  accounts: { id: GoogleIdSdk };
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const LOAD_ERROR = 'Nie udało się załadować logowania Google.';
const CONFIG_ERROR = 'Brak konfiguracji logowania Google.';

let sdkPromise: Promise<GoogleSdk> | null = null;

function loadSdk(): Promise<GoogleSdk> {
  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise<GoogleSdk>((resolve, reject) => {
    const existing = window.google;

    if (existing) {
      resolve(existing as GoogleSdk);
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      const sdk = window.google as GoogleSdk | undefined;

      if (sdk) {
        resolve(sdk);
      } else {
        sdkPromise = null;
        reject(new Error(LOAD_ERROR));
      }
    };
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error(LOAD_ERROR));
    };
    document.head.append(script);
  });

  return sdkPromise;
}

export async function mountGoogleSignIn(
  container: HTMLElement,
  onCredential: (credential: string) => void,
  onError: (message: string) => void,
  providedSdk?: GoogleSdk,
): Promise<void> {
  if (window.electronAPI?.googleLogin) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'auth__button auth__button--google';
    button.textContent = 'Zaloguj się z Google';
    button.addEventListener('click', () => {
      button.disabled = true;
      void window.electronAPI!.googleLogin()
        .then(onCredential)
        .catch((error: unknown) => {
          onError(error instanceof Error ? error.message : LOAD_ERROR);
        })
        .finally(() => {
          button.disabled = false;
        });
    });
    container.append(button);
    return;
  }

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    onError(CONFIG_ERROR);
    return;
  }

  try {
    const sdk = providedSdk ?? (await loadSdk());
    sdk.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => onCredential(response.credential),
      use_fedcm_for_button: true,
    });
    sdk.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      width: 320,
      text: 'signin_with',
    });
  } catch (error) {
    onError(error instanceof Error ? error.message : LOAD_ERROR);
  }
}

declare global {
  interface Window {
    google?: GoogleSdk;
  }
}
