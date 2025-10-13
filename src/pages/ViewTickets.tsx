import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, List, MessageCircle, PhoneCall } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ViewTickets() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Ver Atendimentos</h1>
              <p className="text-xs text-muted-foreground">Escolha o modo de visualização</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Escolha sua Visualização</h2>
            <p className="text-muted-foreground">Selecione o formato que melhor atende suas necessidades</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card 
              className="cursor-pointer hover:shadow-2xl transition-all hover:scale-105 hover:border-primary border-2 bg-gradient-to-br from-card to-card/50"
              onClick={() => navigate("/tickets")}
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                    <List className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Visualização de Lista</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Gestão completa</p>
                  </div>
                </div>
                <CardDescription className="text-base">
                  Gerencie seus atendimentos em formato de lista com filtros avançados, 
                  organização por status e visão geral de todos os tickets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">Filtros</span>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">Organização</span>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">Visão Geral</span>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-2xl transition-all hover:scale-105 hover:border-primary border-2 bg-gradient-to-br from-card to-card/50"
              onClick={() => navigate("/tickets-improved")}
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                    <MessageCircle className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Visualização de Chat</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Atendimento em tempo real</p>
                  </div>
                </div>
                <CardDescription className="text-base">
                  Visualize e responda mensagens em formato de chat em tempo real, 
                  com interface otimizada para conversas rápidas e eficientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">Tempo Real</span>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">Chat</span>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">Rápido</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
