import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MenuMediaUploadProps {
  onMediaSelected: (url: string, type: string) => void;
  tenantId: string;
}

export function MenuMediaUpload({ onMediaSelected, tenantId }: MenuMediaUploadProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${tenantId}/${Math.random()}.${fileExt}`;
      const filePath = `menu-media/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("ticket-media")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("ticket-media")
        .getPublicUrl(filePath);

      const mediaType = selectedFile.type.startsWith("image/")
        ? "image"
        : selectedFile.type.startsWith("video/")
        ? "video"
        : selectedFile.type.startsWith("audio/")
        ? "audio"
        : "document";

      onMediaSelected(urlData.publicUrl, mediaType);
      
      toast({
        title: "Upload concluído",
        description: "Arquivo enviado com sucesso!",
      });

      setSelectedFile(null);
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExternalUrl = () => {
    if (!externalUrl.trim()) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida",
        variant: "destructive",
      });
      return;
    }

    const mediaType = externalUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      ? "image"
      : externalUrl.match(/\.(mp4|mov|avi|webm)$/i)
      ? "video"
      : externalUrl.match(/\.(mp3|wav|ogg)$/i)
      ? "audio"
      : "document";

    onMediaSelected(externalUrl, mediaType);
    setExternalUrl("");
  };

  return (
    <Tabs defaultValue="upload" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="upload">
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </TabsTrigger>
        <TabsTrigger value="url">
          <LinkIcon className="h-4 w-4 mr-2" />
          URL Externa
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="space-y-4">
        <div>
          <Label htmlFor="file-upload">Selecionar Arquivo</Label>
          <Input
            id="file-upload"
            type="file"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            disabled={loading}
          />
          {selectedFile && (
            <p className="text-xs text-muted-foreground mt-1">
              Arquivo: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>
        <Button onClick={handleFileUpload} disabled={!selectedFile || loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Fazer Upload
        </Button>
      </TabsContent>

      <TabsContent value="url" className="space-y-4">
        <div>
          <Label htmlFor="external-url">URL da Mídia</Label>
          <Input
            id="external-url"
            type="url"
            placeholder="https://exemplo.com/imagem.jpg"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Formatos: JPG, PNG, GIF, MP4, MP3, PDF, etc.
          </p>
        </div>
        <Button onClick={handleExternalUrl} disabled={!externalUrl.trim()} className="w-full">
          Usar URL
        </Button>
      </TabsContent>
    </Tabs>
  );
}
