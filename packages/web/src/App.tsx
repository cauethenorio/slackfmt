import { DualPaneEditor } from "./components/DualPaneEditor";
import { Header } from "./components/Header";

export function App() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden overscroll-none bg-surface font-display text-text antialiased pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <Header />
      <main className="flex-1 min-h-0 flex flex-col">
        <DualPaneEditor />
      </main>
    </div>
  );
}
