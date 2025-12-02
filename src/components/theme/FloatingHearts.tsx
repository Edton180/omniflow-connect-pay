import { ParticleSystem } from "./ParticleSystem";

export function FloatingHearts() {
  return (
    <ParticleSystem
      count={40}
      colors={["#F87171", "#FB7185", "#FDA4AF", "#FCA5A5", "#FE7C9B"]}
      shapes={["heart"]}
      gravity={-0.03}
      wind={0.08}
      sizeRange={[16, 32]}
      speedRange={[0.8, 2.5]}
    />
  );
}
