/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ElectronApi {
  googleLogin(): Promise<string>;
  platform: string;
  versions: {
    electron: string;
    chrome: string;
    node: string;
  };
}

interface Window {
  electronAPI?: ElectronApi;
}
