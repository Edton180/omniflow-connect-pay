import { Moon, Sun, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [effectsEnabled, setEffectsEnabled] = useState(() => {
    const stored = localStorage.getItem("theme-effects-enabled");
    return stored !== "false";
  });

  useEffect(() => {
    localStorage.setItem("theme-effects-enabled", String(effectsEnabled));
    // Dispatch event for useGlobalTheme to listen
    window.dispatchEvent(new CustomEvent("theme-effects-toggle", { detail: effectsEnabled }));
  }, [effectsEnabled]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-primary/10">
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={toggleTheme}>
          {theme === "light" ? (
            <>
              <Moon className="mr-2 h-4 w-4" />
              Modo Escuro
            </>
          ) : (
            <>
              <Sun className="mr-2 h-4 w-4" />
              Modo Claro
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setEffectsEnabled(!effectsEnabled)}>
          <Sparkles className="mr-2 h-4 w-4" />
          {effectsEnabled ? "Desativar Efeitos" : "Ativar Efeitos"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
