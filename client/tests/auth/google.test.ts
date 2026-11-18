import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountGoogleSignIn, type GoogleSdk } from '../../src/auth/google';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('logowanie Google', () => {
  it('inicjalizuje GIS i przekazuje credential z callbacku', async () => {
    vi.stubGlobal('window', {});
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'web-client-id');
    const initialize = vi.fn();
    const renderButton = vi.fn();
    const sdk = { accounts: { id: { initialize, renderButton } } } as unknown as GoogleSdk;
    const onCredential = vi.fn();
    const onError = vi.fn();

    await mountGoogleSignIn({} as HTMLElement, onCredential, onError, sdk);

    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 'web-client-id', use_fedcm_for_button: true }),
    );
    expect(renderButton).toHaveBeenCalled();
    const callback = initialize.mock.calls[0]![0].callback as (response: { credential: string }) => void;
    callback({ credential: 'google-token' });
    expect(onCredential).toHaveBeenCalledWith('google-token');
    expect(onError).not.toHaveBeenCalled();
  });

  it('używa IPC w Electronie zamiast GIS', async () => {
    const button = {
      type: '',
      className: '',
      textContent: '',
      disabled: false,
      addEventListener: vi.fn(),
    };
    const container = { append: vi.fn() };
    const googleLogin = vi.fn(async () => 'desktop-token');
    vi.stubGlobal('window', { electronAPI: { googleLogin } });
    vi.stubGlobal('document', { createElement: () => button });
    const onCredential = vi.fn();

    await mountGoogleSignIn(container as unknown as HTMLElement, onCredential, vi.fn());

    expect(container.append).toHaveBeenCalledWith(button);
    const click = button.addEventListener.mock.calls[0]![1] as () => void;
    click();
    await Promise.resolve();
    expect(googleLogin).toHaveBeenCalled();
    expect(onCredential).toHaveBeenCalledWith('desktop-token');
  });

  it('zgłasza brak konfiguracji', async () => {
    vi.stubGlobal('window', {});
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    const onError = vi.fn();

    await mountGoogleSignIn({} as HTMLElement, vi.fn(), onError);

    expect(onError).toHaveBeenCalledWith('Brak konfiguracji logowania Google.');
  });
});
