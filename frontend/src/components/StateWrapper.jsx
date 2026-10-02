import React from "react";

export default function StateWrapper({loading=false,error="",empty=false,onRetry,children}) {
  if (loading) return <div className="vel-panel vel-state" role="status">Loading system data from backend…</div>;
  if (error) return <div className="vel-panel vel-error" role="alert"><b>Unable to retrieve data</b><p>{error}</p>{onRetry && <button className="vel-button" onClick={onRetry}>Retry connection</button>}</div>;
  if (empty) return <div className="vel-panel vel-state">No records found in the active data stream.</div>;
  return children;
}
