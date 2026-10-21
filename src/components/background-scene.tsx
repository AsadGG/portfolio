import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  IcosahedronGeometry,
  MathUtils,
  type Mesh,
  MeshStandardMaterial,
  type Points as ThreePoints,
  Vector3,
} from "three";

import {
  getActiveSection,
  subscribeToActiveSection,
} from "#/active-section-store";
import type { SectionId } from "#/sections";
import { SECTION_IDS } from "#/sections";

const QUALITY_SETTINGS = {
  high: { dpr: [1, 2] as [number, number], particleCount: 3_200 },
  low: { dpr: [1, 1.25] as [number, number], particleCount: 1_000 },
} as const;

export type BackgroundQuality = keyof typeof QUALITY_SETTINGS;
const SHAPE_TARGETS: Record<SectionId, ShapeTarget> = {
  hero: {
    morph: 0.08,
    hue: 0,
    camera: [0, 0, 5],
    lookAt: [0, 0, 0],
    position: [2.15, 0.05, 0],
  },
  about: {
    morph: 0.22,
    hue: 0.08,
    camera: [0.18, 0.12, 5.2],
    lookAt: [0, 0.05, 0],
    position: [2.25, -0.1, 0],
  },
  highlights: {
    morph: 0.72,
    hue: 0.17,
    camera: [-0.28, 0.16, 5.45],
    lookAt: [-0.08, 0.05, 0],
    position: [2.2, 0.05, 0],
  },
  skills: {
    morph: 0.42,
    hue: 0.28,
    camera: [0.25, -0.18, 5.1],
    lookAt: [0.04, -0.05, 0],
    position: [2.3, 0.1, 0],
  },
  experience: {
    morph: 0.88,
    hue: 0.38,
    camera: [-0.32, -0.08, 5.6],
    lookAt: [-0.08, 0, 0],
    position: [2.2, -0.05, 0],
  },
  education: {
    morph: 0.14,
    hue: 0.42,
    camera: [0.12, 0.24, 5.25],
    lookAt: [0, 0.08, 0],
    position: [2.25, 0.15, 0],
  },
};

type ShapeTarget = {
  morph: number;
  hue: number;
  camera: [number, number, number];
  lookAt: [number, number, number];
  position: [number, number, number];
};

const SHAPE_GEOMETRY = new IcosahedronGeometry(1.08, 4);

type MorphShader = {
  uniforms: { uMorph: { value: number } };
};

type ParticleFieldProps = {
  count: number;
};

function ParticleField({
  count,
  reducedMotion,
}: ParticleFieldProps & { reducedMotion: boolean }) {
  const pointsRef = useRef<ThreePoints>(null);
  const elapsedRef = useRef(0);
  const geometry = useMemo(() => createParticleGeometry(count), [count]);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!reducedMotion) return;
    const points = pointsRef.current;
    if (!points) return;
    elapsedRef.current = 0;
    points.rotation.set(0, 0, 0);
    points.position.y = 0;
    invalidate();
  }, [invalidate, reducedMotion]);

  useFrame((_, delta) => {
    if (reducedMotion) return;
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

function HeroShape({ reducedMotion }: { reducedMotion: boolean }) {
  const shapeRef = useRef<Mesh>(null);
  const shaderRef = useRef<MorphShader | null>(null);
  const activeSectionRef = useRef(getActiveSection());
  const morphRef = useRef(SHAPE_TARGETS.hero.morph);
  const color = useMemo(() => getAccentColorObject(), []);
  const targetColors = useMemo(
    () =>
      Object.fromEntries(
        SECTION_IDS.map((id) => [id, getTargetColor(SHAPE_TARGETS[id].hue)]),
      ) as Record<SectionId, Color>,
    [],
  );
  const material = useMemo(() => {
    const next = new MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.22,
      metalness: 0.45,
      roughness: 0.32,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
    });
    next.onBeforeCompile = (shader) => {
      shader.uniforms.uMorph = { value: morphRef.current };
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform float uMorph;",
        )
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nfloat shapeWave = sin(position.x * 4.0 + position.y * 2.7) * cos(position.z * 3.2);\ntransformed += normal * shapeWave * uMorph * 0.2;",
        );
      shaderRef.current = shader as unknown as MorphShader;
    };
    next.customProgramCacheKey = () => "section-reactive-icosahedron-v1";
    return next;
  }, [color]);
  const currentPosition = useRef(new Vector3(...SHAPE_TARGETS.hero.position));
  const targetLookAt = useRef(new Vector3(...SHAPE_TARGETS.hero.lookAt));
  const { camera, invalidate, size } = useThree();

  useEffect(() => {
    const unsubscribe = subscribeToActiveSection(() => {
      if (!reducedMotion) activeSectionRef.current = getActiveSection();
    });
    return () => {
      unsubscribe();
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      const hero = SHAPE_TARGETS.hero;
      const responsive = size.width < 640;
      activeSectionRef.current = "hero";
      camera.position.set(...hero.camera);
      targetLookAt.current.set(...hero.lookAt);
      camera.lookAt(targetLookAt.current);
      currentPosition.current.set(
        responsive ? 2 : hero.position[0],
        responsive ? 2.25 : hero.position[1],
        hero.position[2],
      );
      if (shapeRef.current) {
        shapeRef.current.position.copy(currentPosition.current);
        shapeRef.current.rotation.set(0, 0, 0);
        shapeRef.current.scale.setScalar(responsive ? 0.62 : 1);
      }
      morphRef.current = hero.morph;
      if (shaderRef.current)
        shaderRef.current.uniforms.uMorph.value = hero.morph;
      color.copy(targetColors.hero);
      material.color.copy(color);
      material.emissive.copy(color);
      material.opacity = responsive ? 0.11 : 0.52;
    } else {
      activeSectionRef.current = getActiveSection();
    }
    invalidate();
  }, [
    camera,
    color,
    invalidate,
    material,
    reducedMotion,
    size.width,
    targetColors,
  ]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ camera, size }, delta) => {
    if (reducedMotion) return;
    const target = SHAPE_TARGETS[activeSectionRef.current];
    const responsive = size.width < 640;
    const alpha = 1 - Math.exp(-3.2 * delta);
    const damp = (current: number, next: number) =>
      MathUtils.damp(current, next, 3.2, delta);

    camera.position.set(
      damp(camera.position.x, target.camera[0]),
      damp(camera.position.y, target.camera[1]),
      damp(camera.position.z, target.camera[2]),
    );
    targetLookAt.current.set(
      damp(targetLookAt.current.x, target.lookAt[0]),
      damp(targetLookAt.current.y, target.lookAt[1]),
      damp(targetLookAt.current.z, target.lookAt[2]),
    );
    camera.lookAt(targetLookAt.current);

    const shape = shapeRef.current;
    if (!shape) return;
    const nextX = responsive ? 2 : target.position[0];
    const nextY = responsive ? 2.25 : target.position[1];
    currentPosition.current.set(
      damp(currentPosition.current.x, nextX),
      damp(currentPosition.current.y, nextY),
      damp(currentPosition.current.z, target.position[2]),
    );
    shape.position.copy(currentPosition.current);
    const scale = responsive ? 0.62 : 1;
    shape.scale.setScalar(damp(shape.scale.x, scale));
    material.opacity = damp(material.opacity, responsive ? 0.11 : 0.52);
    color.lerp(targetColors[activeSectionRef.current], alpha);
    material.color.copy(color);
    material.emissive.copy(color);

    morphRef.current = damp(morphRef.current, target.morph);
    if (shaderRef.current)
      shaderRef.current.uniforms.uMorph.value = morphRef.current;
    shape.rotation.x += delta * 0.08;
    shape.rotation.y += delta * 0.12;
  });

  return (
    <mesh ref={shapeRef} geometry={SHAPE_GEOMETRY} material={material}></mesh>
  );
}

function getAccentColorObject() {
  const value = getAccentColor();
  return new Color(value || "#22d3ee");
}

function getTargetColor(hueOffset: number) {
  const accent = getAccentColorObject();
  const hsl = accent.getHSL({ h: 0, s: 0, l: 0 });
  return new Color().setHSL(
    (hsl.h + hueOffset) % 1,
    Math.max(hsl.s, 0.52),
    hsl.l,
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
  quality,
  reducedMotion,
}: {
  quality: BackgroundQuality;
  reducedMotion: boolean;
}) {
  const [frameloop, setFrameloop] = useState<"always" | "never">(() =>
    document.visibilityState === "hidden" ? "never" : "always",
  );
  const settings = QUALITY_SETTINGS[quality];

  useEffect(() => {
    const updateVisibility = () =>
      setFrameloop(document.visibilityState === "hidden" ? "never" : "always");
    document.addEventListener("visibilitychange", updateVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  return (
    <Canvas
      aria-hidden="true"
      dpr={settings.dpr}
      frameloop={reducedMotion ? "demand" : frameloop}
      gl={{ alpha: false, antialias: false }}
    >
      <color attach="background" args={["#09090b"]} />
      <ambientLight intensity={0.65} />
      <directionalLight intensity={1.2} position={[3, 3, 4]} />
      <HeroShape reducedMotion={reducedMotion} />
      <ParticleField
        count={settings.particleCount}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}
