import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const requirements = [
    { label: "Mínimo 8 caracteres", met: password.length >= 8 },
    { label: "Uma letra maiúscula", met: /[A-Z]/.test(password) },
    { label: "Uma letra minúscula", met: /[a-z]/.test(password) },
    { label: "Um número", met: /[0-9]/.test(password) },
    { label: "Um caractere especial", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const metCount = requirements.filter(r => r.met).length;
  const strength = metCount === 0 ? 0 : (metCount / requirements.length) * 100;

  const getStrengthColor = () => {
    if (strength === 0) return "bg-muted";
    if (strength < 40) return "bg-destructive";
    if (strength < 80) return "bg-warning";
    return "bg-success";
  };

  const getStrengthLabel = () => {
    if (strength === 0) return "";
    if (strength < 40) return "Fraca";
    if (strength < 80) return "Média";
    return "Forte";
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", getStrengthColor())}
            style={{ width: `${strength}%` }}
          />
        </div>
        {password && (
          <p className="text-xs text-muted-foreground">
            Força da senha: <span className="font-medium">{getStrengthLabel()}</span>
          </p>
        )}
      </div>
      
      {password && (
        <ul className="space-y-1">
          {requirements.map((req, index) => (
            <li key={index} className="flex items-center gap-2 text-xs">
              {req.met ? (
                <Check className="h-3 w-3 text-success" />
              ) : (
                <X className="h-3 w-3 text-muted-foreground" />
              )}
              <span className={cn(
                "transition-colors",
                req.met ? "text-success" : "text-muted-foreground"
              )}>
                {req.label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
