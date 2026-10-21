import {
  Canvas,
  type ThreeEvent,
  useFrame,
  useThree,
} from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  DoubleSide,
  type Group,
  MathUtils,
  type Mesh,
  PlaneGeometry,
  type Points as ThreePoints,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
} from "three";

import {
  getActiveSection,
  subscribeToActiveSection,
} from "#/active-section-store";
import type { GalleryItem } from "#/gallery-store";
import type { SectionId } from "#/sections";

const QUALITY_SETTINGS = {
  high: {
    dpr: [1, 2] as [number, number],
    particleCount: 2_600,
    gallery: true,
  },
  low: {
    dpr: [1, 1.25] as [number, number],
    particleCount: 900,
    gallery: false,
  },
} as const;

export type BackgroundQuality = keyof typeof QUALITY_SETTINGS;

/** A Project shown as a card in the hero gallery. */

const CAMERA_TARGETS: Record<SectionId, [number, number, number]> = {
  hero: [0, 0, 6],
  about: [0.35, 0.2, 6.4],
  highlights: [-0.4, 0.3, 6.8],
  skills: [0.4, -0.25, 6.3],
  experience: [-0.45, -0.1, 7],
  education: [0.2, 0.3, 6.5],
};

const CARD_WIDTH = 1.36;
const CARD_HEIGHT = 0.85;
const CARD_GAP = 0.2;
const MAX_CARDS = 8;
// The gallery shares the screen with the hero text, so it only appears once
// there is room for both side by side.
const GALLERY_MIN_WIDTH = 1024;
const TEXTURE_MAX_SIZE = 768;
const ORIGIN = new Vector3();

function readCssColor(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return new Color(value || fallback);
}

/* -------------------------------------------------------------------------- */
/* Particles                                                                   */
/* -------------------------------------------------------------------------- */

function createParticleGeometry(count: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const cyan = readCssColor("--electric-cyan", "#67e8f9");
  const violet = readCssColor("--electric-violet", "#a78bfa");
  const neutral = new Color("#94a3b8");

  for (let i = 0; i < count; i += 1) {
    const offset = i * 3;
    positions[offset] = (Math.random() - 0.5) * 22;
    positions[offset + 1] = (Math.random() - 0.5) * 14;
    positions[offset + 2] = -Math.random() * 14 + 1;

    const roll = Math.random();
    const color = roll < 0.18 ? cyan : roll < 0.32 ? violet : neutral;
    const brightness = color === neutral ? 0.26 : 0.5;
    colors[offset] = color.r * brightness;
    colors[offset + 1] = color.g * brightness;
    colors[offset + 2] = color.b * brightness;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return geometry;
}

function ParticleField({
  count,
  reducedMotion,
}: {
  count: number;
  reducedMotion: boolean;
}) {
  const pointsRef = useRef<ThreePoints>(null);
  const elapsedRef = useRef(0);
  const geometry = useMemo(() => createParticleGeometry(count), [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    if (reducedMotion) return;
    const points = pointsRef.current;
    if (!points) return;

    elapsedRef.current += delta;
    points.rotation.y += delta * 0.006;
    points.rotation.x = MathUtils.damp(
      points.rotation.x,
      state.pointer.y * 0.04,
      1.5,
      delta,
    );
    points.position.x = MathUtils.damp(
      points.position.x,
      state.pointer.x * -0.25,
      1.5,
      delta,
    );
    points.position.y = Math.sin(elapsedRef.current * 0.08) * 0.12;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.6}
        blending={AdditiveBlending}
        depthWrite={false}
        onBeforeCompile={(shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <color_fragment>",
            "#include <color_fragment>\nfloat particleRadius = length(gl_PointCoord - vec2(0.5));\ndiffuseColor.a *= 1.0 - smoothstep(0.18, 0.5, particleRadius);",
          );
        }}
      />
    </points>
  );
}

/* -------------------------------------------------------------------------- */
/* Camera                                                                      */
/* -------------------------------------------------------------------------- */

function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const sectionRef = useRef<SectionId>(getActiveSection());
  const lookAt = useRef(new Vector3());
  const { camera, invalidate } = useThree();

  useEffect(() => {
    const unsubscribe = subscribeToActiveSection(() => {
      sectionRef.current = getActiveSection();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!reducedMotion) return;
    camera.position.set(...CAMERA_TARGETS.hero);
    camera.lookAt(0, 0, 0);
    invalidate();
  }, [camera, invalidate, reducedMotion]);

  useFrame((state, delta) => {
    if (reducedMotion) return;
    const [x, y, z] = CAMERA_TARGETS[sectionRef.current];
    const damp = (current: number, target: number) =>
      MathUtils.damp(current, target, 2.4, delta);

    camera.position.set(
      damp(camera.position.x, x + state.pointer.x * 0.18),
      damp(camera.position.y, y + state.pointer.y * 0.12),
      damp(camera.position.z, z),
    );
    lookAt.current.set(
      damp(lookAt.current.x, x * 0.25),
      damp(lookAt.current.y, y * 0.25),
      0,
    );
    camera.lookAt(lookAt.current);
  });

  return null;
}

/* -------------------------------------------------------------------------- */
/* Hero gallery                                                                */
/* -------------------------------------------------------------------------- */

const cardVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const cardFragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uLoaded;
  uniform float uOpacity;
  uniform float uHover;
  uniform float uRadius;
  uniform vec2 uSize;
  uniform vec2 uUvScale;
  uniform vec3 uCyan;
  uniform vec3 uViolet;
  varying vec2 vUv;

  float roundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    float d = roundedBox(p, uSize * 0.5, uRadius);
    float aa = fwidth(d) * 1.5;
    float shape = 1.0 - smoothstep(-aa, 0.0, d);
    if (shape <= 0.0) discard;

    // Cover-fit the image, anchored to its top edge, and ease in on hover.
    // The far side of the ring shows mirrored, so flip it back.
    float zoom = 1.0 - 0.06 * uHover;
    float facing = gl_FrontFacing ? 1.0 : -1.0;
    vec2 uv = vec2(
      (vUv.x - 0.5) * facing * uUvScale.x * zoom + 0.5,
      1.0 - (1.0 - vUv.y) * uUvScale.y * zoom
    );
    vec3 image = texture2D(uMap, uv).rgb;
    vec3 placeholder = mix(uViolet, uCyan, vUv.x) * 0.16 + 0.03;
    vec3 color = mix(placeholder, image, uLoaded);
    color *= mix(0.6, 1.05, uHover);

    float rim = 1.0 - smoothstep(0.0, 0.028, abs(d));
    color += mix(uViolet, uCyan, vUv.y) * rim * mix(0.22, 1.0, uHover);

    // Cards on the far side of the ring recede into the background.
    float depth = gl_FrontFacing ? 1.0 : 0.22;
    gl_FragColor = vec4(color * depth, shape * uOpacity * mix(0.55, 1.0, depth));
    #include <colorspace_fragment>
  }
`;

type CardUniforms = {
  uMap: { value: CanvasTexture | null };
  uLoaded: { value: number };
  uOpacity: { value: number };
  uHover: { value: number };
  uRadius: { value: number };
  uSize: { value: Vector2 };
  uUvScale: { value: Vector2 };
  uCyan: { value: Color };
  uViolet: { value: Color };
};

/** A plane bent along the gallery's cylinder so cards follow its curve. */
function createCurvedCardGeometry(radius: number) {
  const geometry = new PlaneGeometry(CARD_WIDTH, CARD_HEIGHT, 32, 1);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const angle = position.getX(i) / radius;
    position.setXYZ(
      i,
      Math.sin(angle) * radius,
      position.getY(i),
      Math.cos(angle) * radius - radius,
    );
  }
  geometry.computeBoundingSphere();
  return geometry;
}

function createCardMaterial(cyan: Color, violet: Color) {
  const uniforms: CardUniforms = {
    uMap: { value: null },
    uLoaded: { value: 0 },
    uOpacity: { value: 0 },
    uHover: { value: 0 },
    uRadius: { value: 0.07 },
    uSize: { value: new Vector2(CARD_WIDTH, CARD_HEIGHT) },
    uUvScale: { value: new Vector2(1, 1) },
    uCyan: { value: cyan },
    uViolet: { value: violet },
  };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: cardVertexShader,
    fragmentShader: cardFragmentShader,
    transparent: true,
    side: DoubleSide,
    toneMapped: false,
  });
  return { material, uniforms };
}

/** Decodes an image and downsizes it so large screenshots stay cheap on the GPU. */
async function loadCardTexture(src: string) {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  await image.decode();

  const scale = Math.min(
    1,
    TEXTURE_MAX_SIZE / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, aspect: image.naturalWidth / image.naturalHeight };
}

/** Pointer input counts only when it lands on the page itself, not on UI. */
function isOpenSpace(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  if (document.querySelector('[role="dialog"]')) return false;
  return !target.closest(
    "a, button, input, select, textarea, [role='menu'], header, footer",
  );
}

function HeroGallery({
  items,
  reducedMotion,
  onHover,
  onOpen,
}: {
  items: GalleryItem[];
  reducedMotion: boolean;
  onHover: (item: GalleryItem | null) => void;
  onOpen: (item: GalleryItem) => void;
}) {
  const cards = items.slice(0, MAX_CARDS);
  const sourcesKey = cards.map(({ src }) => src).join("\n");
  const radius = Math.max(
    1.4,
    (cards.length * (CARD_WIDTH + CARD_GAP)) / (Math.PI * 2),
  );

  const groupRef = useRef<Group>(null);
  const ringRef = useRef<Group>(null);
  const meshRefs = useRef<Array<Mesh | null>>([]);
  const hoveredRef = useRef<number | null>(null);
  const spinRef = useRef(0.1);
  const fadeRef = useRef(0);
  const loadedRef = useRef<number[]>([]);
  const { invalidate } = useThree();

  const geometry = useMemo(() => createCurvedCardGeometry(radius), [radius]);
  const materials = useMemo(() => {
    const cyan = readCssColor("--electric-cyan", "#67e8f9");
    const violet = readCssColor("--electric-violet", "#a78bfa");
    return Array.from({ length: cards.length }, () =>
      createCardMaterial(cyan, violet),
    );
  }, [cards.length]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(
    () => () => {
      for (const { material } of materials) material.dispose();
    },
    [materials],
  );

  // Load card images one after another so decoding never competes with the
  // page's own work, then fade each card in as its texture arrives.
  useEffect(() => {
    let cancelled = false;
    const textures: CanvasTexture[] = [];
    const sources = sourcesKey ? sourcesKey.split("\n") : [];

    loadedRef.current = sources.map(() => 0);
    for (const { uniforms } of materials) uniforms.uLoaded.value = 0;

    void (async () => {
      for (const [index, src] of sources.entries()) {
        if (cancelled) return;
        try {
          const { texture, aspect } = await loadCardTexture(src);
          if (cancelled) {
            texture.dispose();
            return;
          }
          textures.push(texture);
          const { uniforms } = materials[index];
          const cardAspect = CARD_WIDTH / CARD_HEIGHT;
          uniforms.uMap.value = texture;
          uniforms.uUvScale.value.set(
            aspect > cardAspect ? cardAspect / aspect : 1,
            aspect > cardAspect ? 1 : aspect / cardAspect,
          );
          loadedRef.current[index] = 1;
          invalidate();
        } catch {
          // A card whose image fails keeps its gradient placeholder.
        }
      }
    })();

    return () => {
      cancelled = true;
      for (const texture of textures) texture.dispose();
    };
  }, [invalidate, materials, sourcesKey]);

  // Keep the cursor and the DOM caption in sync with the hovered card.
  const setHovered = (index: number | null) => {
    if (hoveredRef.current === index) return;
    hoveredRef.current = index;
    document.body.style.cursor = index === null ? "" : "pointer";
    onHover(index === null ? null : (cards[index] ?? null));
    invalidate();
  };

  // Judge a click by where the press began: pressing a dialog's backdrop
  // closes the dialog before the click lands, which would otherwise make the
  // same click open whichever card sits behind it.
  const pressedOpenSpaceRef = useRef(false);
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      pressedOpenSpaceRef.current = isOpenSpace(event.target);
    };
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
      document.body.style.cursor = "";
    };
  }, []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    const ring = ringRef.current;
    if (!group || !ring) return;

    const viewport = state.viewport.getCurrentViewport(state.camera, ORIGIN);
    const wide = state.size.width >= GALLERY_MIN_WIDTH;
    // Fade the gallery out over the first stretch of scrolling and carry it
    // up with the page so it feels attached to the hero.
    const scrolled = window.scrollY / Math.max(1, state.size.height);
    const visibility = wide ? MathUtils.clamp(1 - scrolled * 1.4, 0, 1) : 0;
    const settle = (current: number, target: number, lambda = 4) =>
      reducedMotion ? target : MathUtils.damp(current, target, lambda, delta);

    fadeRef.current = settle(fadeRef.current, visibility, 6);
    group.visible = fadeRef.current > 0.01;
    if (!group.visible && hoveredRef.current !== null) setHovered(null);

    group.position.set(
      viewport.width * 0.25,
      0.05 + scrolled * viewport.height * 0.85,
      -radius * 0.7,
    );

    if (!reducedMotion) {
      const hovering = hoveredRef.current !== null;
      spinRef.current = MathUtils.damp(
        spinRef.current,
        hovering ? 0 : 0.11,
        3,
        delta,
      );
      ring.rotation.y += delta * spinRef.current;
      group.rotation.x = settle(
        group.rotation.x,
        0.24 - state.pointer.y * 0.12,
        2.5,
      );
      group.rotation.y = settle(group.rotation.y, state.pointer.x * 0.2, 2.5);
      group.rotation.z = settle(group.rotation.z, -0.07, 2.5);
    } else {
      group.rotation.set(0.24, 0, -0.07);
    }

    meshRefs.current.forEach((mesh, index) => {
      if (!mesh) return;
      const { uniforms } = materials[index];
      const hover = hoveredRef.current === index ? 1 : 0;
      uniforms.uHover.value = settle(uniforms.uHover.value, hover, 8);
      uniforms.uLoaded.value = settle(
        uniforms.uLoaded.value,
        loadedRef.current[index] ?? 0,
        3,
      );
      // Placeholders show dimly until their image cross-fades in.
      uniforms.uOpacity.value =
        fadeRef.current * MathUtils.lerp(0.35, 1, uniforms.uLoaded.value);
      const angle = (index / cards.length) * Math.PI * 2;
      const lift = uniforms.uHover.value * 0.22;
      mesh.position.set(
        Math.sin(angle) * (radius + lift),
        0,
        Math.cos(angle) * (radius + lift),
      );
      mesh.scale.setScalar(1 + uniforms.uHover.value * 0.05);
    });
  });

  if (cards.length === 0) return null;

  return (
    <group ref={groupRef} visible={false}>
      <group ref={ringRef}>
        {cards.map((item, index) => {
          const angle = (index / cards.length) * Math.PI * 2;
          return (
            <mesh
              geometry={geometry}
              key={item.id}
              material={materials[index].material}
              onClick={(event: ThreeEvent<MouseEvent>) => {
                event.stopPropagation();
                if (fadeRef.current < 0.5 || !pressedOpenSpaceRef.current) {
                  return;
                }
                onOpen(item);
              }}
              onPointerMove={(event: ThreeEvent<PointerEvent>) => {
                event.stopPropagation();
                setHovered(
                  fadeRef.current > 0.5 && isOpenSpace(event.nativeEvent.target)
                    ? index
                    : null,
                );
              }}
              onPointerOut={() => {
                if (hoveredRef.current === index) setHovered(null);
              }}
              ref={(mesh) => {
                meshRefs.current[index] = mesh;
              }}
              rotation={[0, angle, 0]}
            />
          );
        })}
      </group>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Scene                                                                       */
/* -------------------------------------------------------------------------- */

/** Demand-rendered scenes still need a frame whenever the page scrolls. */
function InvalidateOnScroll() {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    const onScroll = () => invalidate();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [invalidate]);
  return null;
}

export default function BackgroundScene({
  quality,
  reducedMotion,
  galleryItems,
  onGalleryHover,
  onGalleryOpen,
}: {
  quality: BackgroundQuality;
  reducedMotion: boolean;
  galleryItems: GalleryItem[];
  onGalleryHover: (item: GalleryItem | null) => void;
  onGalleryOpen: (item: GalleryItem) => void;
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
      camera={{ position: CAMERA_TARGETS.hero, fov: 45 }}
      dpr={settings.dpr}
      // The canvas sits behind the page and ignores pointer events, so it
      // listens on the body instead; the gallery decides what counts as a hit.
      eventPrefix="client"
      eventSource={document.body}
      frameloop={reducedMotion ? "demand" : frameloop}
      gl={{
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      }}
    >
      <InvalidateOnScroll />
      <CameraRig reducedMotion={reducedMotion} />
      <ParticleField
        count={settings.particleCount}
        reducedMotion={reducedMotion}
      />
      {settings.gallery ? (
        <HeroGallery
          items={galleryItems}
          onHover={onGalleryHover}
          onOpen={onGalleryOpen}
          reducedMotion={reducedMotion}
        />
      ) : null}
    </Canvas>
  );
}
