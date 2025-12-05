import { Snowfall } from "./Snowfall";
import { Confetti } from "./Confetti";
import { FloatingHearts } from "./FloatingHearts";
import { ParticleSystem } from "./ParticleSystem";

interface ThemeEffectsProps {
  themeSlug: string;
  enabled?: boolean;
}

export function ThemeEffects({ themeSlug, enabled = true }: ThemeEffectsProps) {
  if (!enabled) return null;

  switch (themeSlug) {
    case "christmas":
      return <Snowfall />;
    
    case "winter":
      return <Snowfall />;
    
    case "new-year":
      return <Confetti />;
    
    case "carnival":
      return <Confetti />;
    
    case "valentines":
      return <FloatingHearts />;
    
    case "halloween":
      return (
        <ParticleSystem
          count={15}
          colors={["#1F1F1F", "#4B5563"]}
          shapes={["bat"]}
          gravity={0}
          wind={0.15}
          sizeRange={[16, 24]}
          speedRange={[0.3, 1]}
        />
      );
    
    case "easter":
      return (
        <ParticleSystem
          count={15}
          colors={["#FDE047", "#A78BFA", "#FB7185", "#6EE7B7", "#60A5FA"]}
          shapes={["egg"]}
          gravity={0.15}
          wind={0.02}
          sizeRange={[12, 20]}
          speedRange={[0.5, 2]}
        />
      );
    
    default:
      return null;
  }
}
