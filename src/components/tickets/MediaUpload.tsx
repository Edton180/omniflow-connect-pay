import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Image, FileText, Mic, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MediaUploadProps {
  onMediaSelect: (url: string, type: string) => void;
}

export function MediaUpload({ onMediaSelect }: MediaUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamanho (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('ticket-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data } = supabase.storage
        .from('ticket-media')
        .getPublicUrl(filePath);

      onMediaSelect(data.publicUrl, type);
      
      toast({
        title: "Arquivo enviado",
        description: "Mídia anexada com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" disabled={uploading}>
          <Paperclip className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="grid gap-2">
          <label className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded-md transition-colors">
            <Image className="h-4 w-4" />
            <span className="text-sm">Imagem</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e, 'image')}
            />
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded-md transition-colors">
            <FileText className="h-4 w-4" />
            <span className="text-sm">Documento</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              className="hidden"
              onChange={(e) => handleFileSelect(e, 'document')}
            />
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded-md transition-colors">
            <Mic className="h-4 w-4" />
            <span className="text-sm">Áudio</span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e, 'audio')}
            />
          </label>
        </div>
      </PopoverContent>
    </Popover>
  );
}