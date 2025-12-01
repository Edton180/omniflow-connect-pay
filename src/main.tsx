import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";
import { useGlobalTheme } from "./hooks/useGlobalTheme";

const queryClient = new QueryClient();

function AppWithTheme() {
  useGlobalTheme();
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AppWithTheme />
  </QueryClientProvider>
);
