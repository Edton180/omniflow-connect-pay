import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StickerPickerProps {
  onStickerSelect: (sticker: string) => void;
}

// Figurinhas populares organizadas por categoria
const STICKERS = {
  emojis: ["👍", "❤️", "😂", "😊", "🎉", "🔥", "⭐", "✅", "👏", "🙏", "💯", "🚀"],
  reactions: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😉", "😊", "😇"],
  gestures: ["👋", "🤚", "✋", "🖐️", "👌", "✌️", "🤞", "🤟", "🤘", "👍", "👎", "✊"],
  symbols: ["💙", "💚", "💛", "🧡", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💝"],
};

export function StickerPicker({ onStickerSelect }: StickerPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (sticker: string) => {
    onStickerSelect(sticker);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <Tabs defaultValue="emojis">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="emojis">😊</TabsTrigger>
            <TabsTrigger value="reactions">😂</TabsTrigger>
            <TabsTrigger value="gestures">👋</TabsTrigger>
            <TabsTrigger value="symbols">❤️</TabsTrigger>
          </TabsList>
          
          {Object.entries(STICKERS).map(([category, stickers]) => (
            <TabsContent key={category} value={category} className="mt-4">
              <div className="grid grid-cols-6 gap-2">
                {stickers.map((sticker) => (
                  <Button
                    key={sticker}
                    variant="ghost"
                    className="h-12 w-12 text-2xl hover:scale-110 transition-transform"
                    onClick={() => handleSelect(sticker)}
                  >
                    {sticker}
                  </Button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
