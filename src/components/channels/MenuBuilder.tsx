import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Settings, MessageSquare, GitBranch, Bot, Webhook, FileText } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Menu {
  id: string;
  name: string;
  description: string;
  level: number;
  greeting_message: string;
  timeout_message: string;
  offline_message: string;
  timeout_seconds: number;
  is_active: boolean;
}

interface MenuItem {
  id: string;
  option_key: string;
  option_label: string;
  action_type: "send_message" | "send_file" | "forward_to_agent" | "forward_to_queue" | "forward_to_bot" | "send_evaluation" | "assistant_gpt" | "assistant_gemini" | "assistant_grok" | "submenu" | "end_conversation";
  target_id: string | null;
  target_data: any;
  position: number;
  is_active: boolean;
  media_url?: string;
  media_type?: string;
  evaluation_message?: string;
  evaluation_options?: string;
  assistant_prompt?: string;
}

export function MenuBuilder({ channelId }: { channelId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [queues, setQueues] = useState<any[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: string }>({
    open: false,
    type: "",
    id: "",
  });

  useEffect(() => {
    loadMenus();
    loadQueues();
  }, [channelId]);

  useEffect(() => {
    if (selectedMenu) {
      loadMenuItems(selectedMenu.id);
    }
  }, [selectedMenu]);

  const loadQueues = async () => {
    try {
      const { data, error } = await supabase
        .from("queues")
        .select("id, name, color")
        .eq("is_active", true);

      if (error) throw error;
      setQueues(data || []);
    } catch (error: any) {
      console.error("Error loading queues:", error);
    }
  };

  const loadMenus = async () => {
    try {
      const { data, error } = await supabase
        .from("channel_menus")
        .select("*")
        .eq("channel_id", channelId)
        .order("position");

      if (error) throw error;
      setMenus(data || []);
      if (data && data.length > 0 && !selectedMenu) {
        setSelectedMenu(data[0]);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar menus",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadMenuItems = async (menuId: string) => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("menu_id", menuId)
        .order("position");

      if (error) throw error;
      setMenuItems((data || []) as MenuItem[]);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar itens",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createMenu = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("channel_menus")
        .insert({
          channel_id: channelId,
          name: "Novo Menu",
          description: "",
          level: 1,
          greeting_message: "Olá! Como posso ajudar?",
          timeout_message: "Tempo esgotado. Por favor, tente novamente.",
          offline_message: "Desculpe, estamos fora do horário de atendimento.",
          timeout_seconds: 60,
          is_active: true,
          position: menus.length,
        })
        .select()
        .single();

      if (error) throw error;
      toast({ title: "Menu criado com sucesso!" });
      loadMenus();
      setSelectedMenu(data);
    } catch (error: any) {
      toast({
        title: "Erro ao criar menu",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMenu = async (menu: Partial<Menu>) => {
    if (!selectedMenu) return;

    try {
      const { error } = await supabase
        .from("channel_menus")
        .update(menu)
        .eq("id", selectedMenu.id);

      if (error) throw error;
      toast({ title: "Menu atualizado!" });
      loadMenus();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar menu",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteMenu = async (menuId: string) => {
    try {
      const { error } = await supabase.from("channel_menus").delete().eq("id", menuId);

      if (error) throw error;
      toast({ title: "Menu excluído!" });
      setSelectedMenu(null);
      loadMenus();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir menu",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addMenuItem = async () => {
    if (!selectedMenu) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .insert({
          menu_id: selectedMenu.id,
          option_key: String(menuItems.length + 1),
          option_label: "Nova Opção",
          action_type: "send_message",
          position: menuItems.length,
          is_active: true,
          target_data: { message: "Mensagem padrão" },
        })
        .select()
        .single();

      if (error) throw error;
      toast({ title: "Item adicionado!" });
      loadMenuItems(selectedMenu.id);
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar item",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMenuItem = async (itemId: string, updates: Partial<MenuItem>) => {
    try {
      // Validar target_data antes de salvar
      const validUpdates = { ...updates };
      
      // Se mudou o action_type, limpar target_data anterior
      if (validUpdates.action_type) {
        validUpdates.target_data = null;
        validUpdates.target_id = null;
      }
      
      const { error } = await supabase.from("menu_items").update(validUpdates).eq("id", itemId);

      if (error) throw error;
      
      toast({ title: "Item atualizado!" });
      loadMenuItems(selectedMenu!.id);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteMenuItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from("menu_items").delete().eq("id", itemId);

      if (error) throw error;
      toast({ title: "Item excluído!" });
      loadMenuItems(selectedMenu!.id);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "forward_to_queue":
        return <MessageSquare className="h-4 w-4" />;
      case "assistant_gpt":
      case "assistant_gemini":
      case "assistant_grok":
        return <Bot className="h-4 w-4" />;
      case "submenu":
        return <GitBranch className="h-4 w-4" />;
      case "send_evaluation":
        return <Webhook className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Menu List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Menus do Canal
              </CardTitle>
              <CardDescription>Gerencie os menus e fluxos de atendimento</CardDescription>
            </div>
            <Button onClick={createMenu} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Menu
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {menus.map((menu) => (
              <Button
                key={menu.id}
                variant={selectedMenu?.id === menu.id ? "default" : "outline"}
                onClick={() => setSelectedMenu(menu)}
              >
                {menu.name}
                {!menu.is_active && <Badge className="ml-2">Inativo</Badge>}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Menu Configuration */}
      {selectedMenu && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Configurações do Menu</CardTitle>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    setDeleteDialog({ open: true, type: "menu", id: selectedMenu.id })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Menu</Label>
                  <Input
                    value={selectedMenu.name}
                    onChange={(e) => setSelectedMenu({ ...selectedMenu, name: e.target.value })}
                    onBlur={() => updateMenu({ name: selectedMenu.name })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timeout (segundos)</Label>
                  <Input
                    type="number"
                    value={selectedMenu.timeout_seconds}
                    onChange={(e) =>
                      setSelectedMenu({
                        ...selectedMenu,
                        timeout_seconds: parseInt(e.target.value) || 60,
                      })
                    }
                    onBlur={() => updateMenu({ timeout_seconds: selectedMenu.timeout_seconds })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={selectedMenu.description}
                  onChange={(e) =>
                    setSelectedMenu({ ...selectedMenu, description: e.target.value })
                  }
                  onBlur={() => updateMenu({ description: selectedMenu.description })}
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem de Saudação</Label>
                <Textarea
                  value={selectedMenu.greeting_message}
                  onChange={(e) =>
                    setSelectedMenu({ ...selectedMenu, greeting_message: e.target.value })
                  }
                  onBlur={() => updateMenu({ greeting_message: selectedMenu.greeting_message })}
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem de Timeout</Label>
                <Textarea
                  value={selectedMenu.timeout_message}
                  onChange={(e) =>
                    setSelectedMenu({ ...selectedMenu, timeout_message: e.target.value })
                  }
                  onBlur={() => updateMenu({ timeout_message: selectedMenu.timeout_message })}
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem Fora de Horário</Label>
                <Textarea
                  value={selectedMenu.offline_message}
                  onChange={(e) =>
                    setSelectedMenu({ ...selectedMenu, offline_message: e.target.value })
                  }
                  onBlur={() => updateMenu({ offline_message: selectedMenu.offline_message })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={selectedMenu.is_active}
                  onCheckedChange={(checked) => {
                    setSelectedMenu({ ...selectedMenu, is_active: checked });
                    updateMenu({ is_active: checked });
                  }}
                />
                <Label>Menu Ativo</Label>
              </div>
            </CardContent>
          </Card>

          {/* Menu Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Opções do Menu</CardTitle>
                <Button onClick={addMenuItem} disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Opção
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {menuItems.map((item, index) => (
                <Card key={item.id}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getActionIcon(item.action_type)}
                        <Badge>{item.action_type}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setDeleteDialog({ open: true, type: "item", id: item.id })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tecla/Opção</Label>
                        <Input
                          value={item.option_key}
                          onChange={(e) =>
                            updateMenuItem(item.id, { option_key: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Texto da Opção</Label>
                        <Input
                          value={item.option_label}
                          onChange={(e) =>
                            updateMenuItem(item.id, { option_label: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Ação</Label>
                      <Select
                        value={item.action_type}
                        onValueChange={async (value: any) => {
                          // Atualizar imediatamente no state local
                          const updatedItems = menuItems.map(i => 
                            i.id === item.id ? { ...i, action_type: value, target_data: null, target_id: null } : i
                          );
                          setMenuItems(updatedItems as MenuItem[]);
                          
                          // Salvar no banco
                          await updateMenuItem(item.id, { action_type: value });
                        }}
                      >
                         <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                         <SelectContent>
                          <SelectItem value="send_message">Enviar Mensagem</SelectItem>
                          <SelectItem value="send_file">Enviar Arquivo</SelectItem>
                          <SelectItem value="forward_to_agent">Encaminhar para Agente</SelectItem>
                          <SelectItem value="forward_to_queue">Encaminhar para Fila</SelectItem>
                          <SelectItem value="forward_to_bot">Encaminhar para Bot</SelectItem>
                          <SelectItem value="send_evaluation">Enviar Avaliação</SelectItem>
                          <SelectItem value="assistant_gpt">Assistente GPT</SelectItem>
                          <SelectItem value="assistant_gemini">Assistente Gemini</SelectItem>
                          <SelectItem value="assistant_grok">Assistente Grok</SelectItem>
                          <SelectItem value="submenu">Submenu</SelectItem>
                          <SelectItem value="end_conversation">Encerrar Conversa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {item.action_type === "forward_to_queue" && (
                      <div className="space-y-2">
                        <Label>Fila de Destino</Label>
                        <Select
                          value={item.target_id || ""}
                          onValueChange={(value) =>
                            updateMenuItem(item.id, { target_id: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a fila" />
                          </SelectTrigger>
                          <SelectContent>
                            {queues.map((queue) => (
                              <SelectItem key={queue.id} value={queue.id}>
                                {queue.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {item.action_type === "forward_to_agent" && (
                      <div className="space-y-2">
                        <Label>Agente de Destino</Label>
                        <Input
                          value={item.target_data?.agent_name || ""}
                          onChange={(e) =>
                            updateMenuItem(item.id, {
                              target_data: { ...item.target_data, agent_name: e.target.value },
                            })
                          }
                          placeholder="Nome do agente (opcional - deixe vazio para qualquer agente disponível)"
                        />
                      </div>
                    )}

                    {item.action_type === "submenu" && (
                      <div className="space-y-2">
                        <Label>Submenu de Destino</Label>
                        <Select
                          value={item.target_id || ""}
                          onValueChange={(value) =>
                            updateMenuItem(item.id, { target_id: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o submenu" />
                          </SelectTrigger>
                          <SelectContent>
                            {menus
                              .filter(m => m.id !== selectedMenu?.id)
                              .map((menu) => (
                                <SelectItem key={menu.id} value={menu.id}>
                                  {menu.name} (Nível {menu.level})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Redireciona para outro menu quando o usuário seleciona esta opção
                        </p>
                      </div>
                    )}

                    {(item.action_type === "assistant_gpt" || item.action_type === "assistant_gemini" || item.action_type === "assistant_grok") && (
                      <div className="space-y-2">
                        <Label>Prompt do Assistente</Label>
                        <Textarea
                          value={item.target_data?.prompt || ""}
                          onChange={(e) =>
                            updateMenuItem(item.id, {
                              target_data: { ...item.target_data, prompt: e.target.value },
                            })
                          }
                          placeholder="Digite o prompt para o assistente virtual"
                        />
                      </div>
                    )}

                    {item.action_type === "send_message" && (
                      <div className="space-y-2">
                        <Label>Mensagem</Label>
                        <Textarea
                          value={item.target_data?.message || ""}
                          onChange={(e) =>
                            updateMenuItem(item.id, {
                              target_data: { ...item.target_data, message: e.target.value },
                            })
                          }
                          placeholder="Digite a mensagem a ser enviada"
                        />
                      </div>
                    )}

                    {item.action_type === "send_evaluation" && (
                      <div className="space-y-2">
                        <Label>URL do Webhook</Label>
                        <Input
                          value={item.target_data?.webhook_url || ""}
                          onChange={(e) =>
                            updateMenuItem(item.id, {
                              target_data: {
                                ...item.target_data,
                                webhook_url: e.target.value,
                              },
                            })
                          }
                          placeholder="https://..."
                        />
                      </div>
                    )}

                    {item.action_type === "send_file" && (
                      <div className="space-y-2">
                        <Label>URL do Arquivo/Mídia</Label>
                        <Input
                          value={item.target_data?.media_url || ""}
                          onChange={(e) =>
                            updateMenuItem(item.id, {
                              target_data: {
                                ...item.target_data,
                                media_url: e.target.value,
                              },
                            })
                          }
                          placeholder="https://... ou URL do Supabase Storage"
                        />
                        <Label>Tipo de Mídia</Label>
                        <Select
                          value={item.target_data?.media_type || "document"}
                          onValueChange={(value) =>
                            updateMenuItem(item.id, {
                              target_data: { ...item.target_data, media_type: value },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image">Imagem</SelectItem>
                            <SelectItem value="video">Vídeo</SelectItem>
                            <SelectItem value="audio">Áudio</SelectItem>
                            <SelectItem value="document">Documento</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={(checked) =>
                          updateMenuItem(item.id, { is_active: checked })
                        }
                      />
                      <Label>Opção Ativa</Label>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {menuItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma opção criada. Clique em "Adicionar Opção" para começar.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este {deleteDialog.type === "menu" ? "menu" : "item"}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialog.type === "menu") {
                  deleteMenu(deleteDialog.id);
                } else {
                  deleteMenuItem(deleteDialog.id);
                }
                setDeleteDialog({ open: false, type: "", id: "" });
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
