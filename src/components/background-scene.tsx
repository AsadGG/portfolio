import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  type Points as ThreePoints,
} from "three";

const DEFAULT_PARTICLE_COUNT = 3_200;

type ParticleFieldProps = {
  count: number;
};

function ParticleField({ count }: ParticleFieldProps) {
  const pointsRef = useRef<ThreePoints>(null);
  const elapsedRef = useRef(0);
  const geometry = useMemo(() => createParticleGeometry(count), [count]);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    if (!points) return;

    elapsedRef.current += delta;
    points.rotation.y += delta * 0.004;
    points.rotation.x += delta * 0.0015;
    points.position.y = Math.sin(elapsedRef.current * 0.08) * 0.12;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.045}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.52}
        blending={AdditiveBlending}
        depthWrite={false}
        onBeforeCompile={(shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <color_fragment>",
            "#include <color_fragment>\nfloat particleRadius = length(gl_PointCoord - vec2(0.5));\ndiffuseColor.a *= 1.0 - smoothstep(0.22, 0.5, particleRadius);",
          );
        }}
      />
    </points>
  );
}

function createParticleGeometry(count: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const accent = new Color(getAccentColor());
  const neutral = new Color("#94a3b8");

  for (let i = 0; i < count; i += 1) {
    const offset = i * 3;
    positions[offset] = (Math.random() - 0.5) * 20;
    positions[offset + 1] = (Math.random() - 0.5) * 12;
    positions[offset + 2] = -Math.random() * 12;

    const color = Math.random() < 0.28 ? accent : neutral;
    const brightness = color === accent ? 0.48 : 0.27;
    colors[offset] = color.r * brightness;
    colors[offset + 1] = color.g * brightness;
    colors[offset + 2] = color.b * brightness;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return geometry;
}

function getAccentColor() {
  return getComputedStyle(document.documentElement)
    .getPropertyValue("--electric-cyan")
    .trim();
}

export default function BackgroundScene({
  particleCount = DEFAULT_PARTICLE_COUNT,
}: {
  particleCount?: number;
}) {
  return (
    <Canvas aria-hidden="true" dpr={1} gl={{ alpha: false, antialias: false }}>
      <color attach="background" args={["#09090b"]} />
      <ParticleField count={particleCount} />
    </Canvas>
  );
}
