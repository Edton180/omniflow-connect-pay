import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Calendar } from "lucide-react";

interface BusinessHours {
  [day: string]: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Segunda-feira" },
  { key: "tuesday", label: "Terça-feira" },
  { key: "wednesday", label: "Quarta-feira" },
  { key: "thursday", label: "Quinta-feira" },
  { key: "friday", label: "Sexta-feira" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

export function BusinessHoursConfig({ channelId }: { channelId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hours, setHours] = useState<BusinessHours>(() => {
    const defaultHours: BusinessHours = {};
    DAYS_OF_WEEK.forEach((day) => {
      defaultHours[day.key] = {
        enabled: day.key !== "saturday" && day.key !== "sunday",
        start: "08:00",
        end: "18:00",
      };
    });
    return defaultHours;
  });

  useEffect(() => {
    loadBusinessHours();
  }, [channelId]);

  const loadBusinessHours = async () => {
    try {
      const { data, error } = await supabase
        .from("channels")
        .select("business_hours")
        .eq("id", channelId)
        .single();

      if (error) throw error;
      if (data?.business_hours && Object.keys(data.business_hours).length > 0) {
        setHours(data.business_hours as BusinessHours);
      }
    } catch (error: any) {
      console.error("Error loading business hours:", error);
    }
  };

  const saveBusinessHours = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("channels")
        .update({ business_hours: hours })
        .eq("id", channelId);

      if (error) throw error;
      toast({ title: "Horários salvos com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar horários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDay = (day: string, field: string, value: any) => {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const copyToAll = (sourceDay: string) => {
    const sourceDayData = hours[sourceDay];
    const newHours = { ...hours };
    DAYS_OF_WEEK.forEach((day) => {
      if (day.key !== sourceDay) {
        newHours[day.key] = { ...sourceDayData };
      }
    });
    setHours(newHours);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <div>
            <CardTitle>Horário de Atendimento</CardTitle>
            <CardDescription>
              Configure os horários em que o canal estará disponível para atendimento
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day.key} className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="flex items-center space-x-2 w-40">
              <Switch
                checked={hours[day.key]?.enabled}
                onCheckedChange={(checked) => updateDay(day.key, "enabled", checked)}
              />
              <Label className="cursor-pointer">{day.label}</Label>
            </div>

            <div className="flex items-center gap-4 flex-1">
              <div className="space-y-1 flex-1">
                <Label className="text-xs">Início</Label>
                <Input
                  type="time"
                  value={hours[day.key]?.start || "08:00"}
                  onChange={(e) => updateDay(day.key, "start", e.target.value)}
                  disabled={!hours[day.key]?.enabled}
                />
              </div>

              <div className="space-y-1 flex-1">
                <Label className="text-xs">Fim</Label>
                <Input
                  type="time"
                  value={hours[day.key]?.end || "18:00"}
                  onChange={(e) => updateDay(day.key, "end", e.target.value)}
                  disabled={!hours[day.key]?.enabled}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToAll(day.key)}
                disabled={!hours[day.key]?.enabled}
              >
                Copiar para todos
              </Button>
            </div>
          </div>
        ))}

        <Button onClick={saveBusinessHours} disabled={loading} className="w-full">
          {loading ? "Salvando..." : "Salvar Horários"}
        </Button>
      </CardContent>
    </Card>
  );
}
