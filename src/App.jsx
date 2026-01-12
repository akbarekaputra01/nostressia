import React from "react";
import AuthGate from "./components/AuthGate";
import Router from "./router";

function App() {
  return (
    <AuthGate>
      <Router />
    </AuthGate>
  );
}

export default App;
