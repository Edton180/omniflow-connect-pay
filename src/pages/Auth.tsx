import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Zap } from "lucide-react";
import { z } from "zod";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const authSchema = z.object({
    email: z.string().email(t('auth.invalidEmail')).min(1, t('auth.emailRequired')),
    password: z.string().min(6, t('auth.passwordMin')),
    fullName: z.string().min(2, t('auth.nameMin')).optional(),
  });

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validatedData = authSchema.parse({ email, password, fullName });

      const { error } = await signUp(validatedData.email, validatedData.password, validatedData.fullName || "");
      
      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: t('auth.emailAlreadyRegistered'),
            variant: "destructive",
          });
        } else {
          toast({
            title: t('auth.signupError'),
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t('auth.accountCreated'),
          description: t('auth.autoAuthenticated'),
        });
        navigate("/dashboard");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validatedData = authSchema.omit({ fullName: true }).parse({ email, password });

      const { error } = await signIn(validatedData.email, validatedData.password);
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: t('auth.invalidCredentials'),
            variant: "destructive",
          });
        } else {
          toast({
            title: t('auth.loginError'),
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t('auth.welcomeBack'),
        });
        navigate("/dashboard");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      {/* Language Selector - Fixed Position with high visibility */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector variant="solid" showLabel />
      </div>

      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">OmniFlow</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={() => window.location.href = '/force-logout'}
            variant="outline"
            className="w-full"
          >
            🔄 {t('auth.clearSession')}
          </Button>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle>{t('auth.welcome')}</CardTitle>
            <CardDescription>
              {t('auth.loginSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">{t('auth.login')}</TabsTrigger>
                <TabsTrigger value="signup">{t('auth.createAccount')}</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">{t('auth.email')}</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">{t('auth.password')}</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder={t('auth.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-primary"
                    disabled={loading}
                  >
                    {loading ? t('auth.signingIn') : t('auth.signIn')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t('auth.fullSignup')}:
                  </p>
                  <Button
                    className="w-full gradient-primary"
                    onClick={() => navigate("/signup")}
                  >
                    {t('auth.fullSignup')}
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">{t('auth.quickSignup')}</span>
                    </div>
                  </div>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">{t('auth.fullName')}</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder={t('auth.fullNamePlaceholder')}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                      {errors.fullName && (
                        <p className="text-sm text-destructive">{errors.fullName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t('auth.email')}</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder={t('auth.emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t('auth.password')}</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder={t('auth.passwordPlaceholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      {errors.password && (
                        <p className="text-sm text-destructive">{errors.password}</p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      variant="outline"
                      disabled={loading}
                    >
                      {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
