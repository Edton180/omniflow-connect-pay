import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
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

  const shortcuts: ShortcutConfig[] = [
    {
      key: "d",
      description: "Ir para Dashboard",
      action: () => navigate("/dashboard"),
    },
    {
      key: "t",
      description: "Ir para Tickets",
      action: () => navigate("/tickets"),
    },
    {
      key: "c",
      description: "Ir para Contatos",
      action: () => navigate("/contacts"),
    },
    {
      key: "s",
      description: "Ir para Configurações",
      action: () => navigate("/settings"),
    },
    {
      key: "/",
      description: "Focar na busca",
      action: () => {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        searchInput?.focus();
      },
    },
    {
      key: "?",
      description: "Mostrar atalhos de teclado",
      action: () => setShowHelp(true),
    },
  ];

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorar se estiver digitando em um input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const shortcut = shortcuts.find((s) => {
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = s.ctrlKey === undefined || s.ctrlKey === e.ctrlKey;
        const metaMatch = s.metaKey === undefined || s.metaKey === e.metaKey;
        const shiftMatch = s.shiftKey === undefined || s.shiftKey === e.shiftKey;
        return keyMatch && ctrlMatch && metaMatch && shiftMatch;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [navigate, showHelp]);

  return { shortcuts, showHelp, setShowHelp };
};
