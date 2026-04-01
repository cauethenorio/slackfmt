import { DualPaneEditor } from "./components/DualPaneEditor";
import { Header } from "./components/Header";

export function App() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface font-display text-text antialiased">
      <Header />
      <main className="flex-1 min-h-0">
        <DualPaneEditor />
      </main>
    </div>
  );
}
