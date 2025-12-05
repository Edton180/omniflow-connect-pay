import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
  shape: "circle" | "star" | "heart" | "snow" | "bat" | "egg";
}

interface ParticleSystemProps {
  count: number;
  colors: string[];
  shapes: ("circle" | "star" | "heart" | "snow" | "bat" | "egg")[];
  gravity?: number;
  wind?: number;
  sizeRange?: [number, number];
  speedRange?: [number, number];
}

export function ParticleSystem({
  count,
  colors,
  shapes,
  gravity = 0.05,
  wind = 0,
  sizeRange = [8, 24],
  speedRange = [1, 3],
}: ParticleSystemProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const initialParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 50,
      vx: (Math.random() - 0.5) * speedRange[1] * 0.2,
      vy: speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]),
      size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      opacity: 0.6 + Math.random() * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }));
    setParticles(initialParticles);

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev.map((p) => {
          let newX = p.x + p.vx + wind;
          let newY = p.y + p.vy;
          let newVy = p.vy + gravity;
          let newRotation = p.rotation + p.rotationSpeed;

          // Reset particle if it goes off screen
          if (newY > 110) {
            newY = -10;
            newX = Math.random() * 100;
            newVy = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);
          }

          // Wrap horizontally
          if (newX > 105) newX = -5;
          if (newX < -5) newX = 105;

          return {
            ...p,
            x: newX,
            y: newY,
            vy: newVy,
            rotation: newRotation,
          };
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, [count, colors, shapes, gravity, wind, sizeRange, speedRange]);

  const renderShape = (particle: Particle) => {
    const style = {
      left: `${particle.x}%`,
      top: `${particle.y}%`,
      width: `${particle.size}px`,
      height: `${particle.size}px`,
      opacity: particle.opacity,
      transform: `rotate(${particle.rotation}deg)`,
      position: "absolute" as const,
      pointerEvents: "none" as const,
    };

    switch (particle.shape) {
      case "circle":
        return (
          <div
            key={particle.id}
            style={{
              ...style,
              borderRadius: "50%",
              backgroundColor: particle.color,
            }}
          />
        );
      case "star":
        return (
          <div
            key={particle.id}
            style={style}
            className="text-center"
          >
            <svg viewBox="0 0 24 24" fill={particle.color} width="100%" height="100%">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        );
      case "heart":
        return (
          <div
            key={particle.id}
            style={style}
            className="text-center"
          >
            <svg viewBox="0 0 24 24" fill={particle.color} width="100%" height="100%">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        );
      case "snow":
        return (
          <div
            key={particle.id}
            style={{
              ...style,
              color: particle.color,
              fontSize: `${particle.size}px`,
              fontFamily: "sans-serif",
            }}
          >
            ❄
          </div>
        );
      case "bat":
        return (
          <div
            key={particle.id}
            style={{
              ...style,
              color: particle.color,
              fontSize: `${particle.size}px`,
            }}
          >
            🦇
          </div>
        );
      case "egg":
        return (
          <div
            key={particle.id}
            style={{
              ...style,
              borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
              backgroundColor: particle.color,
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-40">
      {particles.map(renderShape)}
    </div>
  );
}
