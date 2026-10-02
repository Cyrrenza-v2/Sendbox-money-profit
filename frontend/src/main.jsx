import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

function ErrorBoundary({ children }) {
  const [error, setError] = React.useState(null);
  React.useEffect(() => {
    const onError = (event) => setError(event.error || new Error(event.message || "Frontend error"));
    const onRejection = (event) => setError(event.reason || new Error("Unhandled frontend error"));
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => { window.removeEventListener("error", onError); window.removeEventListener("unhandledrejection", onRejection); };
  }, []);
  if (error) return <div className="app-error"><div><b>VELTRION</b><h1>Frontend loaded with an error</h1><p>{error.message || "Unknown frontend error"}</p><button onClick={() => window.location.reload()}>RELOAD VELTRION</button></div></div>;
  return children;
}
const basename = import.meta.env.BASE_URL === "/" ? "/" : import.meta.env.BASE_URL.replace(/\/$/, "");
if ("serviceWorker" in navigator && import.meta.env.PROD) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
createRoot(document.getElementById("root")).render(<React.StrictMode><ErrorBoundary><BrowserRouter basename={basename}><App /></BrowserRouter></ErrorBoundary></React.StrictMode>);
