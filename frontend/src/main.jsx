import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import "./theme-contrast-fix.css";

class ErrorBoundary extends React.Component {
  state = { error: null, errorId: null };

  static getDerivedStateFromError(error) {
    return {
      error,
      errorId: globalThis.crypto?.randomUUID?.() || String(Date.now()),
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("VELTRION render error:", error, errorInfo);
  }

  render() {
    const { error, errorId } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="app-error" role="alert">
        <div className="app-error-card">
          <b>VELTRION</b>
          <h1>The application encountered a rendering error.</h1>
          <p>{error?.message || "Unexpected frontend error."}</p>
          <small>Error ID: {errorId || "unknown"}</small>
          <div className="app-error-actions">
            <button onClick={() => this.setState({ error: null, errorId: null })}>TRY AGAIN</button>
            <button onClick={() => window.location.reload()}>RELOAD VELTRION</button>
          </div>
        </div>
      </div>
    );
  }
}

function RuntimeErrorMonitor({ children }) {
  React.useEffect(() => {
    const onError = (event) => {
      if (event?.error) console.error("VELTRION window error:", event.error);
    };
    const onRejection = (event) => {
      console.error("VELTRION unhandled rejection:", event?.reason);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return children;
}

const basename =
  import.meta.env.BASE_URL === "/"
    ? "/"
    : import.meta.env.BASE_URL.replace(/\/$/, "");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister()))
      )
      .then(() => caches?.keys?.() || [])
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("veltrion-shell-"))
            .map((key) => caches.delete(key))
        )
      )
      .catch(() => {});
  });
}

const root = document.getElementById("root");
if (!root) throw new Error("VELTRION_ROOT_ELEMENT_MISSING");

createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RuntimeErrorMonitor>
        <BrowserRouter basename={basename}>
          <App />
        </BrowserRouter>
      </RuntimeErrorMonitor>
    </ErrorBoundary>
  </React.StrictMode>
);
