interface DesktopBridge {
  platform: string;
  closeWindow: () => void;
}

declare global {
  interface Window {
    electronAPI?: DesktopBridge;
  }
}

function bridge(): DesktopBridge | undefined {
  return window.electronAPI;
}

export const isDesktop = (): boolean => bridge() !== undefined;

export function closeGame(): void {
  const desktop = bridge();

  if (desktop) {
    desktop.closeWindow();
    return;
  }

  window.close();
}
