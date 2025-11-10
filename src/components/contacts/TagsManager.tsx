import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TagsManagerProps {
  contactId: string;
  currentTags?: string[];
  onTagsChange?: () => void;
}

export function TagsManager({ contactId, currentTags = [], onTagsChange }: TagsManagerProps) {
  const [tags, setTags] = useState<string[]>(currentTags);
  const [newTag, setNewTag] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setTags(currentTags);
  }, [currentTags]);

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    const tagToAdd = newTag.trim().toLowerCase();
    if (tags.includes(tagToAdd)) {
      toast({
        title: "Tag já existe",
        variant: "destructive",
      });
      return;
    }

    const updatedTags = [...tags, tagToAdd];

    try {
      const { error } = await supabase
        .from("contacts")
        .update({ tags: updatedTags })
        .eq("id", contactId);

      if (error) throw error;

      setTags(updatedTags);
      setNewTag("");
      toast({
        title: "Tag adicionada",
      });
      onTagsChange?.();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar tag",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove);

    try {
      const { error } = await supabase
        .from("contacts")
        .update({ tags: updatedTags })
        .eq("id", contactId);

      if (error) throw error;

      setTags(updatedTags);
      toast({
        title: "Tag removida",
      });
      onTagsChange?.();
    } catch (error: any) {
      toast({
        title: "Erro ao remover tag",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1">
          {tag}
          <button
            onClick={() => handleRemoveTag(tag)}
            className="hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-6">
            <Plus className="h-3 w-3 mr-1" />
            Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="flex gap-2">
            <Input
              placeholder="Nova tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button size="sm" onClick={handleAddTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
