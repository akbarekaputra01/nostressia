import Router from "./router";

function App() {
  return (
    <div className="relative min-h-screen bg-surface text-text-primary dark:bg-surface dark:text-text-primary">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-80 dark:dark-page-grid"></div>
      <div className="relative z-10">
        <Router />
      </div>
    </div>
  );
}

export default App;
