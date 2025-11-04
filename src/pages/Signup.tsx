import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Zap } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const signupSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  fullName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  companyName: z.string().min(2, "Nome da empresa é obrigatório"),
  cnpjCpf: z.string().min(11, "CPF/CNPJ é obrigatório"),
  address: z.string().min(5, "Endereço completo é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().length(2, "Estado deve ter 2 caracteres (UF)"),
  zipCode: z.string().min(8, "CEP é obrigatório"),
  planId: z.string().min(1, "Selecione um plano"),
});

const Signup = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    companyName: "",
    cnpjCpf: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    planId: "",
  });
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
    loadPlans();
  }, [user, navigate]);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .order("price");

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error("Error loading plans:", error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate input
      const validatedData = signupSchema.parse(formData);

      // Create auth user
      const { data: authData, error: authError } = await signUp(
        validatedData.email,
        validatedData.password,
        validatedData.fullName
      );

      if (authError) throw authError;

      // Create tenant with additional info
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: validatedData.companyName,
          slug: validatedData.companyName.toLowerCase().replace(/\s+/g, "-"),
          cnpj_cpf: validatedData.cnpjCpf,
          address: validatedData.address,
          city: validatedData.city,
          state: validatedData.state,
          zip_code: validatedData.zipCode,
          plan_id: validatedData.planId,
          subscription_status: "trial",
          is_active: true,
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Assign user to tenant as admin
      if (authData.user && tenant) {
        await supabase.from("user_roles").insert({
          user_id: authData.user.id,
          tenant_id: tenant.id,
          role: "tenant_admin",
        });

        await supabase.from("profiles").update({
          tenant_id: tenant.id,
        }).eq("id", authData.user.id);
      }

      toast({
        title: "Cadastro realizado!",
        description: "Sua conta foi criada com sucesso.",
      });
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Erro ao criar conta",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">OmniFlow</span>
          </div>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle>Criar Nova Conta</CardTitle>
            <CardDescription>
              Preencha os dados para começar sua experiência
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-6">
              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Dados Pessoais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                      placeholder="Seu nome"
                    />
                    {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="seu@email.com"
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
              </div>

              {/* Dados da Empresa */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm">Dados da Empresa</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nome da Empresa *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleChange("companyName", e.target.value)}
                      placeholder="Minha Empresa LTDA"
                    />
                    {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpjCpf">CPF/CNPJ *</Label>
                    <Input
                      id="cnpjCpf"
                      value={formData.cnpjCpf}
                      onChange={(e) => handleChange("cnpjCpf", e.target.value)}
                      placeholder="00.000.000/0000-00"
                    />
                    {errors.cnpjCpf && <p className="text-sm text-destructive">{errors.cnpjCpf}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço Completo *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Rua, número, bairro"
                  />
                  {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      placeholder="São Paulo"
                    />
                    {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado (UF) *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleChange("state", e.target.value.toUpperCase())}
                      placeholder="SP"
                      maxLength={2}
                    />
                    {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP *</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleChange("zipCode", e.target.value)}
                      placeholder="00000-000"
                    />
                    {errors.zipCode && <p className="text-sm text-destructive">{errors.zipCode}</p>}
                  </div>
                </div>
              </div>

              {/* Seleção de Plano */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm">Escolha seu Plano</h3>
                <div className="space-y-2">
                  <Label htmlFor="planId">Plano *</Label>
                  <Select value={formData.planId} onValueChange={(value) => handleChange("planId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - R$ {plan.price}/{plan.billing_period === "monthly" ? "mês" : "ano"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.planId && <p className="text-sm text-destructive">{errors.planId}</p>}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/auth")}
                >
                  Voltar
                </Button>
                <Button type="submit" className="flex-1 gradient-primary" disabled={loading}>
                  {loading ? "Criando conta..." : "Criar Conta"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
