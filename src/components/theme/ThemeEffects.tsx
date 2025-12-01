import { Snowfall } from "./Snowfall";
import { Confetti } from "./Confetti";
import { FloatingHearts } from "./FloatingHearts";

interface ThemeEffectsProps {
  themeSlug: string;
}

export function ThemeEffects({ themeSlug }: ThemeEffectsProps) {
  switch (themeSlug) {
    case "christmas":
    case "winter":
      return <Snowfall />;
    
    case "new-year":
    case "carnival":
      return <Confetti />;
    
    case "valentines":
      return <FloatingHearts />;
    
    default:
      return null;
  }
}
