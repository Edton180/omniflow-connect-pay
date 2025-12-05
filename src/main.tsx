import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";
import { useGlobalTheme } from "./hooks/useGlobalTheme";
import { ThemeEffects } from "./components/theme/ThemeEffects";

const queryClient = new QueryClient();

function AppWithTheme() {
  const { activeTheme, effectsEnabled } = useGlobalTheme();
  
  return (
    <>
      {activeTheme && <ThemeEffects themeSlug={activeTheme.slug} enabled={effectsEnabled} />}
      <App />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AppWithTheme />
  </QueryClientProvider>
);
