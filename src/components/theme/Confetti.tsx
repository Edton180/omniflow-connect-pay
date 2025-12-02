import { ParticleSystem } from "./ParticleSystem";

export function Confetti() {
  return (
    <ParticleSystem
      count={100}
      colors={["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#FFD93D", "#F06292", "#BA68C8"]}
      shapes={["circle", "star"]}
      gravity={0.08}
      wind={0.05}
      sizeRange={[6, 18]}
      speedRange={[2, 5]}
    />
  );
}
