import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useExperienceStore } from '../store/useExperienceStore'

/** Soft romantic nebula — 3 FBM octaves (was 5) for GPU budget */
function createNebulaMaterial(intensity = 1) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uRose: { value: new THREE.Color('#F26B9B') },
      uLavender: { value: new THREE.Color('#B69AFF') },
      uBlush: { value: new THREE.Color('#FFD6E5') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uIntensity;
      uniform vec3 uRose;
      uniform vec3 uLavender;
      uniform vec3 uBlush;
      varying vec3 vDir;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
              mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
              mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
          f.z
        );
      }

      float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 3; i++) {
          v += a * noise(p);
          p = p * 2.03 + vec3(1.7, 9.2, 2.3);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vDir);
        float t = uTime * 0.012;
        float band = fbm(dir * 2.1 + vec3(t, -t * 0.5, t * 0.35));
        float wisps = fbm(dir * 3.8 + vec3(-t * 0.6, t * 0.4, t));
        float veil = smoothstep(0.3, 0.7, band * 0.7 + wisps * 0.45);
        float horizonBias = pow(1.0 - abs(dir.y), 1.35);
        float edgeSoft = mix(0.35, 1.0, horizonBias);
        vec3 col = mix(uLavender, uRose, smoothstep(0.35, 0.75, band));
        col = mix(col, uBlush, wisps * 0.3);
        float alpha = veil * edgeSoft * 0.2 * uIntensity;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  })
}

function buildStarCloud(count: number, radiusMin: number, radiusMax: number) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const cFar = new THREE.Color('#E8E0FF')
  const cMid = new THREE.Color('#C9B8FF')
  const cNear = new THREE.Color('#FFD6E5')

  for (let i = 0; i < count; i++) {
    const u = Math.random()
    const v = Math.random()
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * v - 1)
    const r = radiusMin + Math.random() * (radiusMax - radiusMin)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)

    const depth = (r - radiusMin) / Math.max(radiusMax - radiusMin, 1)
    const col = depth > 0.66 ? cFar : depth > 0.33 ? cMid : cNear
    const dim = 0.55 + Math.random() * 0.45
    colors[i * 3] = col.r * dim
    colors[i * 3 + 1] = col.g * dim
    colors[i * 3 + 2] = col.b * dim
  }
  return { positions, colors }
}

/**
 * Lightweight romantic cosmos — one star Points + soft nebula.
 * (Previously 3 shader star layers ≈ 2.5k points + heavy FBM → lag)
 */
export function CosmosBackdrop() {
  const group = useRef<THREE.Group>(null)
  const starsRef = useRef<THREE.Points>(null)
  const nebulaRef = useRef<THREE.Mesh>(null)
  const isMobile = useExperienceStore((s) => s.isMobile)
  const reducedMotion = useExperienceStore((s) => s.reducedMotion)
  const frame = useRef(0)

  const starCount = isMobile ? 280 : 520
  const { positions, colors } = useMemo(
    () => buildStarCloud(starCount, 32, 100),
    [starCount],
  )

  const nebulaMat = useMemo(
    () => createNebulaMaterial(isMobile ? 0.65 : 0.9),
    [isMobile],
  )

  useEffect(() => () => nebulaMat.dispose(), [nebulaMat])

  useFrame((state, dt) => {
    frame.current++
    // Rotate slowly; skip nebula uniform every other frame on mobile
    if (group.current && !reducedMotion) {
      group.current.rotation.y += dt * 0.006
    }
    if (starsRef.current && !reducedMotion) {
      starsRef.current.rotation.y -= dt * 0.003
    }
    if (!reducedMotion && nebulaRef.current) {
      nebulaRef.current.rotation.y += dt * 0.005
      if (!isMobile || frame.current % 2 === 0) {
        nebulaMat.uniforms.uTime.value = state.clock.elapsedTime
      }
    }
  })

  return (
    <group ref={group}>
      <mesh renderOrder={-3}>
        <sphereGeometry args={[140, 24, 16]} />
        <meshBasicMaterial color="#03020A" side={THREE.BackSide} depthWrite={false} />
      </mesh>

      {!reducedMotion && (
        <mesh ref={nebulaRef} renderOrder={-2}>
          <sphereGeometry args={[118, isMobile ? 24 : 36, isMobile ? 16 : 24]} />
          <primitive object={nebulaMat} attach="material" />
        </mesh>
      )}

      <points ref={starsRef} frustumCulled={false} renderOrder={-1}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={starCount}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={starCount}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={isMobile ? 0.045 : 0.055}
          vertexColors
          transparent
          opacity={0.85}
          depthWrite={false}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
