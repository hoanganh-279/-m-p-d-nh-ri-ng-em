import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useExperienceStore } from '../store/useExperienceStore'

function makePetalPositions(count: number) {
  const pos = new Float32Array(count * 3)
  const speed = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 14
    pos[i * 3 + 1] = Math.random() * 10 - 2
    pos[i * 3 + 2] = (Math.random() - 0.5) * 14
    speed[i] = 0.3 + Math.random() * 0.7
  }
  return { pos, speed }
}

/** Near-field petals — kept very light; cosmos handles ambient sparkle */
export function FloatingParticles() {
  const points = useRef<THREE.Points>(null)
  const isMobile = useExperienceStore((s) => s.isMobile)
  const fxOn = useExperienceStore((s) => s.fxOn)
  const reducedMotion = useExperienceStore((s) => s.reducedMotion)
  const count = isMobile ? 18 : 36
  const { pos, speed } = useMemo(() => makePetalPositions(count), [count])
  const tick = useRef(0)

  useFrame((_, dt) => {
    if (!points.current || !fxOn || reducedMotion) return
    tick.current++
    // Update every other frame on mobile to cut CPU
    if (isMobile && tick.current % 2 === 1) return
    const arr = points.current.geometry.attributes.position.array as Float32Array
    const step = isMobile ? dt * 2 : dt
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= speed[i] * step * 0.55
      arr[i * 3] += Math.sin(arr[i * 3 + 1] + i) * step * 0.15
      if (arr[i * 3 + 1] < -4) {
        arr[i * 3 + 1] = 6 + Math.random() * 3
        arr[i * 3] = (Math.random() - 0.5) * 14
        arr[i * 3 + 2] = (Math.random() - 0.5) * 14
      }
    }
    points.current.geometry.attributes.position.needsUpdate = true
  })

  if (!fxOn || reducedMotion) return null

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={pos} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={isMobile ? 0.05 : 0.065}
        color="#FFD6E5"
        transparent
        opacity={0.5}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

/** Static-ish sparkles — rotate group only, no per-particle CPU */
export function SparklesField() {
  const fxOn = useExperienceStore((s) => s.fxOn)
  const reducedMotion = useExperienceStore((s) => s.reducedMotion)
  const isMobile = useExperienceStore((s) => s.isMobile)
  const count = isMobile ? 20 : 40
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 16
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10
      arr[i * 3 + 2] = (Math.random() - 0.5) * 16
    }
    return arr
  }, [count])
  const ref = useRef<THREE.Points>(null)

  useFrame((state) => {
    if (!ref.current || reducedMotion) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.015
  })

  if (!fxOn || reducedMotion) return null

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#F4D9A6"
        transparent
        opacity={0.35}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
