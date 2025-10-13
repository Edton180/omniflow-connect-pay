import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, LogOut } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ChannelList } from "@/components/channels/ChannelList";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Channels() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white shadow-glow">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Canais</h1>
              <p className="text-xs text-muted-foreground">Conecte seus canais de atendimento</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Link to="/tickets-improved">
              <Button variant="outline" size="sm">
                Ver Atendimentos
              </Button>
            </Link>
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <ChannelList />
      </div>
    </div>
  );
}
