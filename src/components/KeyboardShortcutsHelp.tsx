import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const shortcuts = [
    { keys: ["⌘/Ctrl", "K"], description: "Abrir Command Palette" },
    { keys: ["G", "D"], description: "Ir para Dashboard" },
    { keys: ["G", "T"], description: "Ir para Tickets" },
    { keys: ["G", "C"], description: "Ir para Contatos" },
    { keys: ["G", "S"], description: "Ir para Configurações" },
    { keys: ["/"], description: "Focar na busca" },
    { keys: ["?"], description: "Mostrar esta ajuda" },
    { keys: ["Esc"], description: "Fechar dialogs" },
    { keys: ["⌘/Ctrl", "Enter"], description: "Enviar mensagem" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atalhos de Teclado
          </DialogTitle>
          <DialogDescription>
            Use estes atalhos para navegar mais rapidamente
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <kbd
                    key={keyIndex}
                    className="px-2 py-1 text-xs font-semibold bg-muted rounded border"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
