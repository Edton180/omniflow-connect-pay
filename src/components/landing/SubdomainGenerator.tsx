import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link2, Check, X, Loader2 } from "lucide-react";

interface SubdomainGeneratorProps {
  tenantId: string;
  currentSubdomain?: string;
}

export function SubdomainGenerator({ tenantId, currentSubdomain }: SubdomainGeneratorProps) {
  const { toast } = useToast();
  const [subdomain, setSubdomain] = useState(currentSubdomain || "");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const normalizeSubdomain = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^-+|-+$/g, "")
      .slice(0, 63);
  };

  const checkAvailability = async (value: string) => {
    if (value.length < 3) {
      setAvailable(null);
      return;
    }

    setChecking(true);
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", value)
        .neq("id", tenantId)
        .maybeSingle();

      if (error) throw error;
      setAvailable(data === null);
    } catch (error: any) {
      toast({
        title: "Erro ao verificar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleSubdomainChange = (value: string) => {
    const normalized = normalizeSubdomain(value);
    setSubdomain(normalized);
    
    if (normalized.length >= 3) {
      const timeoutId = setTimeout(() => checkAvailability(normalized), 500);
      return () => clearTimeout(timeoutId);
    } else {
      setAvailable(null);
    }
  };

  const handleSave = async () => {
    if (!available || subdomain.length < 3) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({ slug: subdomain })
        .eq("id", tenantId);

      if (error) throw error;

      toast({
        title: "Subdomínio configurado",
        description: `Sua landing page estará disponível em: ${subdomain}.seu-dominio.com`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Configurar Subdomínio
        </CardTitle>
        <CardDescription>
          Defina o endereço da sua landing page de catálogo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subdomain">Subdomínio</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="subdomain"
                value={subdomain}
                onChange={(e) => handleSubdomainChange(e.target.value)}
                placeholder="minha-loja"
                className="pr-10"
              />
              {checking && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!checking && available === true && (
                <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
              )}
              {!checking && available === false && (
                <X className="absolute right-3 top-3 h-4 w-4 text-red-500" />
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={!available || saving || subdomain.length < 3}
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Será:</span>
            <code className="px-2 py-1 bg-muted rounded">
              {subdomain || "seu-subdominio"}.seu-dominio.com
            </code>
          </div>
          {available === false && (
            <Badge variant="destructive" className="mt-2">
              Este subdomínio já está em uso
            </Badge>
          )}
          {available === true && (
            <Badge variant="outline" className="mt-2 border-green-500 text-green-600">
              Subdomínio disponível
            </Badge>
          )}
        </div>

        <div className="pt-4 border-t space-y-2">
          <h4 className="font-medium text-sm">Regras de Subdomínio</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Mínimo de 3 caracteres</li>
            <li>• Apenas letras, números e hífens</li>
            <li>• Não pode começar ou terminar com hífen</li>
            <li>• Máximo de 63 caracteres</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
