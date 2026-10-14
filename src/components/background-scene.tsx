import { Canvas } from "@react-three/fiber";

export default function BackgroundScene() {
  return (
    <Canvas aria-hidden="true" dpr={1} gl={{ alpha: false, antialias: false }}>
      <color attach="background" args={["#09090b"]} />
    </Canvas>
  );
}
