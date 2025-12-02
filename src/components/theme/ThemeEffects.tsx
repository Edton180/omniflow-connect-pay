import { Snowfall } from "./Snowfall";
import { Confetti } from "./Confetti";
import { FloatingHearts } from "./FloatingHearts";
import { ParticleSystem } from "./ParticleSystem";
import { CursorTrail } from "./CursorTrail";

interface ThemeEffectsProps {
  themeSlug: string;
}

export function ThemeEffects({ themeSlug }: ThemeEffectsProps) {
  switch (themeSlug) {
    case "christmas":
      return (
        <>
          <Snowfall />
          <CursorTrail color="#7DD3FC" emoji="❄️" />
        </>
      );
    
    case "winter":
      return <Snowfall />;
    
    case "new-year":
      return (
        <>
          <Confetti />
          <CursorTrail color="#FFD93D" emoji="✨" />
        </>
      );
    
    case "carnival":
      return (
        <>
          <Confetti />
          <CursorTrail color="#F06292" emoji="🎭" />
        </>
      );
    
    case "valentines":
      return (
        <>
          <FloatingHearts />
          <CursorTrail color="#F87171" emoji="❤️" />
        </>
      );
    
    case "halloween":
      return (
        <>
          <ParticleSystem
            count={30}
            colors={["#1F1F1F", "#4B5563"]}
            shapes={["bat"]}
            gravity={0}
            wind={0.15}
            sizeRange={[20, 32]}
            speedRange={[0.5, 1.5]}
          />
          <CursorTrail color="#FB923C" emoji="🎃" />
        </>
      );
    
    case "easter":
      return (
        <>
          <ParticleSystem
            count={25}
            colors={["#FDE047", "#A78BFA", "#FB7185", "#6EE7B7", "#60A5FA"]}
            shapes={["egg"]}
            gravity={0.15}
            wind={0.02}
            sizeRange={[16, 28]}
            speedRange={[1, 3]}
          />
          <CursorTrail color="#FDE047" emoji="🐰" />
        </>
      );
    
    default:
      return null;
  }
}
