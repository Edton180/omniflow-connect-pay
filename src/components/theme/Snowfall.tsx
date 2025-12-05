import { ParticleSystem } from "./ParticleSystem";

export function Snowfall() {
  return (
    <ParticleSystem
      count={25}
      colors={["#FFFFFF", "#E0F2FE", "#BAE6FD", "#7DD3FC"]}
      shapes={["snow", "circle"]}
      gravity={0.02}
      wind={0.1}
      sizeRange={[8, 16]}
      speedRange={[0.3, 1.5]}
    />
  );
}
