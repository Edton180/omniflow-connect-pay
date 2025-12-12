import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, BookOpen, HelpCircle, FileText, Lightbulb, Search, Loader2 } from "lucide-react";

interface KnowledgeItem {
  id: string;
  type: 'faq' | 'document' | 'example' | 'instruction';
  title: string | null;
  question: string | null;
  answer: string | null;
  content: string | null;
  category: string | null;
  tags: string[];
  is_active: boolean;
  priority: number;
  created_at: string;
}

interface KnowledgeBaseTabProps {
  tenantId: string;
}

export function KnowledgeBaseTab({ tenantId }: KnowledgeBaseTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [form, setForm] = useState({
    type: 'faq' as 'faq' | 'document' | 'example' | 'instruction',
    title: '',
    question: '',
    answer: '',
    content: '',
    category: '',
    tags: '',
    is_active: true,
    priority: 0
  });

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_knowledge_base')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems((data as unknown as KnowledgeItem[]) || []);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      toast.error('Erro ao carregar base de conhecimento');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (item?: KnowledgeItem) => {
    if (item) {
      setEditingItem(item);
      setForm({
        type: item.type,
        title: item.title || '',
        question: item.question || '',
        answer: item.answer || '',
        content: item.content || '',
        category: item.category || '',
        tags: item.tags?.join(', ') || '',
        is_active: item.is_active,
        priority: item.priority
      });
    } else {
      setEditingItem(null);
      setForm({
        type: 'faq',
        title: '',
        question: '',
        answer: '',
        content: '',
        category: '',
        tags: '',
        is_active: true,
        priority: 0
      });
    }
    setDialogOpen(true);
  };

  const saveItem = async () => {
    if (form.type === 'faq' && (!form.question.trim() || !form.answer.trim())) {
      toast.error('Preencha a pergunta e a resposta');
      return;
    }
    if (form.type !== 'faq' && !form.content.trim() && !form.title.trim()) {
      toast.error('Preencha o título e o conteúdo');
      return;
    }

    setSaving(true);
    try {
      const itemData = {
        tenant_id: tenantId,
        type: form.type,
        title: form.title || null,
        question: form.question || null,
        answer: form.answer || null,
        content: form.content || null,
        category: form.category || null,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        is_active: form.is_active,
        priority: form.priority
      };

      if (editingItem) {
        const { error } = await supabase
          .from('ai_knowledge_base')
          .update(itemData)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Item atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('ai_knowledge_base')
          .insert(itemData);
        if (error) throw error;
        toast.success('Item adicionado com sucesso!');
      }

      setDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    
    try {
      const { error } = await supabase
        .from('ai_knowledge_base')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Item excluído!');
      loadData();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const toggleActive = async (item: KnowledgeItem) => {
    try {
      const { error } = await supabase
        .from('ai_knowledge_base')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);
      if (error) throw error;
      loadData();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = !searchTerm || 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'faq': return <HelpCircle className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'example': return <Lightbulb className="h-4 w-4" />;
      case 'instruction': return <BookOpen className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'faq': return 'FAQ';
      case 'document': return 'Documento';
      case 'example': return 'Exemplo';
      case 'instruction': return 'Instrução';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com explicação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Base de Conhecimento da IA
          </CardTitle>
          <CardDescription>
            Treine sua IA com informações específicas da sua empresa. Adicione FAQs, documentos e exemplos
            para que o chatbot responda com mais precisão e contexto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">FAQs</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Perguntas e respostas frequentes sobre seu negócio
                </p>
                <p className="text-2xl font-bold mt-2">
                  {items.filter(i => i.type === 'faq').length}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Documentos</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Políticas, regras e informações detalhadas
                </p>
                <p className="text-2xl font-bold mt-2">
                  {items.filter(i => i.type === 'document').length}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Exemplos</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Modelos de respostas para situações específicas
                </p>
                <p className="text-2xl font-bold mt-2">
                  {items.filter(i => i.type === 'example').length}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Instruções</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Diretrizes de comportamento para a IA
                </p>
                <p className="text-2xl font-bold mt-2">
                  {items.filter(i => i.type === 'instruction').length}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Filtros e ações */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="faq">FAQs</SelectItem>
                <SelectItem value="document">Documentos</SelectItem>
                <SelectItem value="example">Exemplos</SelectItem>
                <SelectItem value="instruction">Instruções</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhum item na base de conhecimento</p>
              <p className="text-sm">Adicione FAQs, documentos e exemplos para treinar sua IA</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Título / Pergunta</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        {getTypeIcon(item.type)}
                        {getTypeLabel(item.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {item.type === 'faq' ? item.question : item.title}
                        </p>
                        {item.type === 'faq' && item.answer && (
                          <p className="text-sm text-muted-foreground truncate max-w-md">
                            {item.answer.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.category ? (
                        <Badge variant="secondary">{item.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={() => toggleActive(item)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Item' : 'Novo Item'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select 
                  value={form.type} 
                  onValueChange={(value: 'faq' | 'document' | 'example' | 'instruction') => 
                    setForm({ ...form, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faq">FAQ (Pergunta/Resposta)</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                    <SelectItem value="example">Exemplo de Resposta</SelectItem>
                    <SelectItem value="instruction">Instrução para IA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  placeholder="Ex: Vendas, Suporte, Financeiro..."
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
            </div>

            {form.type === 'faq' ? (
              <>
                <div className="space-y-2">
                  <Label>Pergunta *</Label>
                  <Textarea
                    placeholder="Qual é a pergunta frequente?"
                    value={form.question}
                    onChange={(e) => setForm({ ...form, question: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Resposta *</Label>
                  <Textarea
                    placeholder="Qual é a resposta para essa pergunta?"
                    value={form.answer}
                    onChange={(e) => setForm({ ...form, answer: e.target.value })}
                    rows={4}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    placeholder="Título do documento/instrução..."
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conteúdo *</Label>
                  <Textarea
                    placeholder={
                      form.type === 'instruction' 
                        ? "Instruções de como a IA deve se comportar..."
                        : form.type === 'example'
                        ? "Exemplo de resposta ideal para uma situação..."
                        : "Conteúdo do documento..."
                    }
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={6}
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tags (separadas por vírgula)</Label>
                <Input
                  placeholder="produto, preço, pagamento..."
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridade (0-100)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="item-active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label htmlFor="item-active">Item ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveItem} disabled={saving}>
              {saving ? 'Salvando...' : editingItem ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
