import { useEffect, useState } from 'react';

/** True when the app is running as an installed / standalone app window. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mm = (q: string) => typeof window.matchMedia === 'function' && window.matchMedia(q).matches;
  return (
    mm('(display-mode: standalone)') ||
    mm('(display-mode: window-controls-overlay)') ||
    mm('(display-mode: minimal-ui)') ||
    mm('(display-mode: fullscreen)') ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.startsWith('android-app://')
  );
}

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallWindow extends Window {
  __installPromptEvent?: InstallPromptEvent | null;
}

const installWindow = () => window as InstallWindow;

/**
 * Desktop / mobile install flow: exposes whether the browser offered an
 * install prompt and triggers it on demand. The raw event is captured in
 * index.html before React mounts, so the button is available immediately.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(
    () => installWindow().__installPromptEvent ?? null
  );
  const [installed, setInstalled] = useState<boolean>(() => isStandalone());

  useEffect(() => {
    const w = installWindow();

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const evt = e as InstallPromptEvent;
      w.__installPromptEvent = evt;
      setDeferred(evt);
    };
    const onAvailable = () => {
      if (w.__installPromptEvent) setDeferred(w.__installPromptEvent);
    };
    const onInstalled = () => {
      w.__installPromptEvent = null;
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('installpromptavailable', onAvailable);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('installpromptavailable', onAvailable);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferred) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    installWindow().__installPromptEvent = null;
    setDeferred(null);
    return choice.outcome === 'accepted';
  };

  return { canInstall: !!deferred && !installed, installed, promptInstall };
}
