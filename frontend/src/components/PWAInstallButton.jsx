import { useEffect, useState } from "react";

export default function PWAInstallButton() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(() => window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true);

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function installApp() {
    if (!promptEvent) {
      alert("If Install is not offered automatically, open your browser menu and choose “Add to Home screen” or “Install app”.");
      return;
    }
    promptEvent.prompt();
    const result = await promptEvent.userChoice;
    if (result?.outcome === "accepted") setPromptEvent(null);
  }

  return <button className="vel-install-button" onClick={installApp} aria-label="Install VELTRION app">Install VELTRION</button>;
}
