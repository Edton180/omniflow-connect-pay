import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

interface HeartItem {
  id: number;
  left: number;
  animationDuration: number;
  size: number;
}

export function FloatingHearts() {
  const [hearts, setHearts] = useState<HeartItem[]>([]);

  useEffect(() => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 8 + Math.random() * 6,
      size: 16 + Math.random() * 16,
    }));
    setHearts(items);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="floating-heart absolute"
          style={{
            left: `${heart.left}%`,
            animationDuration: `${heart.animationDuration}s`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        >
          <Heart
            className="text-red-400 fill-red-400"
            style={{ width: `${heart.size}px`, height: `${heart.size}px` }}
          />
        </div>
      ))}
    </div>
  );
}
