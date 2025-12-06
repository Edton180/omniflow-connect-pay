import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface ShortcutConfig {
  keys: string[];
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsReturn {
  shortcuts: ShortcutConfig[];
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
}

export const useKeyboardShortcuts = (): UseKeyboardShortcutsReturn => {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [lastKeyTime, setLastKeyTime] = useState(0);

  const shortcuts: ShortcutConfig[] = [
    {
      keys: ["g", "d"],
      description: "Ir para Dashboard",
      action: () => navigate("/dashboard"),
    },
    {
      keys: ["g", "t"],
      description: "Ir para Tickets",
      action: () => navigate("/view-tickets"),
    },
    {
      keys: ["g", "c"],
      description: "Ir para Contatos",
      action: () => navigate("/contacts"),
    },
    {
      keys: ["g", "s"],
      description: "Ir para Configurações",
      action: () => navigate("/tenant/settings"),
    },
    {
      keys: ["/"],
      description: "Focar na busca",
      action: () => {
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="Pesquisar"], input[placeholder*="Buscar"]') as HTMLInputElement;
        searchInput?.focus();
      },
    },
    {
      keys: ["?"],
      description: "Mostrar atalhos de teclado",
      action: () => setShowHelp(true),
    },
  ];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignorar se estiver digitando em um input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    const key = e.key.toLowerCase();
    const now = Date.now();

    // Atalhos de tecla única
    if (key === "/" && !e.shiftKey) {
      e.preventDefault();
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="Pesquisar"], input[placeholder*="Buscar"]') as HTMLInputElement;
      searchInput?.focus();
      return;
    }

    if (key === "?" || (key === "/" && e.shiftKey)) {
      e.preventDefault();
      setShowHelp(true);
      return;
    }

    // Atalhos combinados (G + tecla) - dentro de 500ms
    if (key === "g") {
      setLastKey("g");
      setLastKeyTime(now);
      return;
    }

    // Verificar se é uma combinação G + tecla
    if (lastKey === "g" && now - lastKeyTime < 500) {
      e.preventDefault();
      
      switch (key) {
        case "d":
          navigate("/dashboard");
          break;
        case "t":
          navigate("/view-tickets");
          break;
        case "c":
          navigate("/contacts");
          break;
        case "s":
          navigate("/tenant/settings");
          break;
      }
      
      setLastKey(null);
      return;
    }

    setLastKey(null);
  }, [navigate, lastKey, lastKeyTime]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts, showHelp, setShowHelp };
};
