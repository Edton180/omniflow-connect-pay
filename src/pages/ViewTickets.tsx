import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ViewTickets() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">📞 Ver Atendimentos</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            size="lg"
            className="h-32 text-lg"
            onClick={() => navigate("/tickets")}
          >
            📋 Visualização de Lista
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-32 text-lg"
            onClick={() => navigate("/tickets-improved")}
          >
            💬 Visualização de Chat
          </Button>
        </div>
      </div>
    </div>
  );
}
