import { useEffect, useState } from "react";

interface TrailParticle {
  id: number;
  x: number;
  y: number;
  timestamp: number;
  color: string;
}

interface CursorTrailProps {
  color: string;
  emoji?: string;
}

export function CursorTrail({ color, emoji }: CursorTrailProps) {
  const [particles, setParticles] = useState<TrailParticle[]>([]);

  useEffect(() => {
    let particleId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const newParticle: TrailParticle = {
        id: particleId++,
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
        color,
      };
      setParticles((prev) => [...prev, newParticle].slice(-15));
    };

    const handleClick = (e: MouseEvent) => {
      const burst = Array.from({ length: 12 }, (_, i) => ({
        id: particleId++,
        x: e.clientX + (Math.random() - 0.5) * 100,
        y: e.clientY + (Math.random() - 0.5) * 100,
        timestamp: Date.now(),
        color,
      }));
      setParticles((prev) => [...prev, ...burst]);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);

    const cleanup = setInterval(() => {
      const now = Date.now();
      setParticles((prev) => prev.filter((p) => now - p.timestamp < 800));
    }, 50);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      clearInterval(cleanup);
    };
  }, [color]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {particles.map((particle) => {
        const age = Date.now() - particle.timestamp;
        const opacity = Math.max(0, 1 - age / 800);
        const scale = 1 - age / 1600;

        return (
          <div
            key={particle.id}
            style={{
              position: "absolute",
              left: particle.x,
              top: particle.y,
              width: emoji ? "20px" : "8px",
              height: emoji ? "20px" : "8px",
              borderRadius: emoji ? "0" : "50%",
              backgroundColor: emoji ? "transparent" : particle.color,
              opacity,
              transform: `translate(-50%, -50%) scale(${scale})`,
              transition: "opacity 0.3s, transform 0.3s",
              fontSize: "16px",
            }}
          >
            {emoji}
          </div>
        );
      })}
    </div>
  );
}
