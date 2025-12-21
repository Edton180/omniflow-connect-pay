import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, Zap, Globe } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export function LovableAICard() {
  const { t } = useLanguage();

  const models = [
    { name: "Gemini 2.5 Flash", description: t('chatbot.modelBalanced'), recommended: true },
    { name: "Gemini 2.5 Pro", description: t('chatbot.modelQuality') },
    { name: "GPT-5", description: t('chatbot.modelPowerful') },
    { name: "GPT-5 Mini", description: t('chatbot.modelCostEffective') },
  ];

  return (
    <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Lovable AI
          <Badge className="ml-2 bg-primary">{t('chatbot.recommended')}</Badge>
        </CardTitle>
        <CardDescription>
          {t('chatbot.lovableAIDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <Check className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              {t('chatbot.autoConfigured')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('chatbot.readyToUse')}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('chatbot.availableModels')}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {models.map((model) => (
              <div
                key={model.name}
                className={`p-2 rounded-lg border ${
                  model.recommended
                    ? "border-primary/50 bg-primary/5"
                    : "border-border"
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">{model.name}</span>
                  {model.recommended && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {t('chatbot.default')}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{model.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <Zap className="h-4 w-4 text-primary mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">{t('chatbot.advantages')}:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>{t('chatbot.noExternalCost')}</li>
              <li>{t('chatbot.optimizedLatency')}</li>
              <li>{t('chatbot.alwaysUpdated')}</li>
              <li>{t('chatbot.autoFallback')}</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
