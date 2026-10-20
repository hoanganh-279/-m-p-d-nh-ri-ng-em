import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { createHeartShellGeometry, sampleHeartShellParticles } from './heartMath'
import { createHeartParticleMaterial } from './heartParticleShader'
import { sampleTextParticles } from './sampleTextParticles'
import { useExperienceStore } from '../store/useExperienceStore'

const TEXT = 'Anh yêu em'

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Double-beat heartbeat envelope 0..1 over cycle */
function doubleBeat(t: number, period = 1.1) {
  const p = ((t % period) + period) % period
  const lub = Math.exp(-Math.pow((p - 0.12) / 0.05, 2))
  const dub = 0.55 * Math.exp(-Math.pow((p - 0.32) / 0.045, 2))
  return lub + dub
}

export function ParticleHeart() {
  const group = useRef<THREE.Group>(null)
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)

  const homeRef = useRef<Float32Array | null>(null)
  const textRef = useRef<Float32Array | null>(null)
  const workPos = useRef<Float32Array | null>(null)
  const velRef = useRef<Float32Array | null>(null)
  const phasesRef = useRef<Float32Array | null>(null)
  const layersRef = useRef<Float32Array | null>(null)

  const rotation = useRef({ x: 0.15, y: 0.2 })
  const targetRot = useRef({ x: 0.15, y: 0.2 })
  const dragging = useRef(false)
  const lastPtr = useRef({ x: 0, y: 0, t: 0 })
  const downPtr = useRef({ x: 0, y: 0 })
  const lastTap = useRef(0)
  const lastTapPos = useRef({ x: 0, y: 0 })
  const pendingPulse = useRef<number | null>(null)
  const pointerLocal = useRef(new THREE.Vector3(999, 999, 999))
  const pointerActive = useRef(false)
  const burstRef = useRef(0)
  const morphT = useRef(0)
  const morphClock = useRef(0)
  const resetToken = useRef(0)

  const tmp = useMemo(() => new THREE.Vector3(), [])
  const tmp2 = useMemo(() => new THREE.Vector3(), [])
  const planeNormal = useMemo(() => new THREE.Vector3(0, 0, 1), [])
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const pointerNDC = useMemo(() => new THREE.Vector2(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])

  const { camera, size } = useThree()

  const isMobile = useExperienceStore((s) => s.isMobile)
  const isFreeMode = useExperienceStore((s) => s.isFreeMode)
  const reducedMotion = useExperienceStore((s) => s.reducedMotion)
  const heartPulse = useExperienceStore((s) => s.heartPulse)
  const pulseHeart = useExperienceStore((s) => s.pulseHeart)
  const decayHeartPulse = useExperienceStore((s) => s.decayHeartPulse)
  const dismissHint = useExperienceStore((s) => s.dismissHint)
  const scene = useExperienceStore((s) => s.scene)
  const heartResetKey = useExperienceStore((s) => s.heartResetKey)

  const cloud = useMemo(
    () =>
      sampleHeartShellParticles({
        // Lower counts for smooth frame rate; still reads as dense outline
        rim: isMobile ? 2800 : 4800,
        shell: isMobile ? 120 : 220,
        drift: isMobile ? 450 : 800,
        scale: 0.1,
      }),
    [isMobile],
  )

  const textPos = useMemo(
    () => sampleTextParticles(TEXT, cloud.count, { worldScale: 0.0044 }),
    [cloud.count],
  )

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(cloud.homePos)
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aColor', new THREE.BufferAttribute(cloud.colors.slice(0), 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(cloud.sizes.slice(0), 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(cloud.phases.slice(0), 1))
    return geo
  }, [cloud])

  const material = useMemo(() => createHeartParticleMaterial(), [])
  const hitGeo = useMemo(() => createHeartShellGeometry(0.1), [])

  useEffect(() => {
    materialRef.current = material
    homeRef.current = cloud.homePos.slice(0)
    textRef.current = textPos
    workPos.current = cloud.homePos.slice(0)
    velRef.current = new Float32Array(cloud.count * 3)
    phasesRef.current = cloud.phases
    layersRef.current = cloud.layers
  }, [cloud, textPos, material])

  const clearPendingPulse = () => {
    if (pendingPulse.current != null) {
      window.clearTimeout(pendingPulse.current)
      pendingPulse.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearPendingPulse()
      geometry.dispose()
      material.dispose()
      hitGeo.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // External reset from ControlBar
  useEffect(() => {
    if (heartResetKey === 0) return
    resetToken.current += 1
    targetRot.current = { x: 0.15, y: 0.2 }
    rotation.current = { x: 0.15, y: 0.2 }
    morphT.current = 0
    morphClock.current = 0
    burstRef.current = 0
    if (velRef.current) velRef.current.fill(0)
    if (homeRef.current && workPos.current) {
      workPos.current.set(homeRef.current)
    }
  }, [heartResetKey])

  useEffect(() => {
    material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2)
  }, [material, size])

  const applyBurst = () => {
    pulseHeart()
    burstRef.current = 1
    dismissHint()
  }

  const onPointerDown = (e: any) => {
    if (scene !== 'main') return
    e.stopPropagation()
    dragging.current = true
    lastPtr.current = { x: e.clientX, y: e.clientY, t: performance.now() }
    downPtr.current = { x: e.clientX, y: e.clientY }
    pointerActive.current = true
    dismissHint()

    const now = performance.now()
    const tapDist = Math.hypot(e.clientX - lastTapPos.current.x, e.clientY - lastTapPos.current.y)
    if (now - lastTap.current < 320 && tapDist < 36) {
      clearPendingPulse()
      useExperienceStore.getState().resetHeart()
      lastTap.current = 0
    } else {
      lastTap.current = now
      lastTapPos.current = { x: e.clientX, y: e.clientY }
    }
  }

  const onPointerMove = (e: any) => {
    if (scene !== 'main') return
    // update pointer local for forces (even when not dragging)
    pointerNDC.set((e.clientX / size.width) * 2 - 1, -(e.clientY / size.height) * 2 + 1)
    raycaster.setFromCamera(pointerNDC, camera)
    if (group.current) {
      planeNormal.set(0, 0, 1).applyQuaternion(group.current.quaternion)
      plane.setFromNormalAndCoplanarPoint(planeNormal, group.current.position)
    }
    if (raycaster.ray.intersectPlane(plane, tmp) && group.current) {
      group.current.worldToLocal(tmp2.copy(tmp))
      pointerLocal.current.copy(tmp2)
      pointerActive.current = true
    }

    if (!dragging.current) return
    e.stopPropagation()
    const dx = e.clientX - lastPtr.current.x
    const dy = e.clientY - lastPtr.current.y
    lastPtr.current.x = e.clientX
    lastPtr.current.y = e.clientY
    targetRot.current.y += dx * 0.014
    targetRot.current.x = THREE.MathUtils.clamp(targetRot.current.x + dy * 0.012, -1.05, 1.05)
  }

  const onPointerUp = (e: any) => {
    if (!dragging.current) {
      pointerActive.current = false
      return
    }
    e.stopPropagation()
    const elapsed = performance.now() - lastPtr.current.t
    const moved =
      Math.hypot(e.clientX - downPtr.current.x, e.clientY - downPtr.current.y) > 10
    dragging.current = false
    if (elapsed < 320 && !moved) {
      // Delay pulse so a second tap can cancel it and reset instead
      clearPendingPulse()
      pendingPulse.current = window.setTimeout(() => {
        pendingPulse.current = null
        applyBurst()
      }, 280)
    }
    window.setTimeout(() => {
      if (!dragging.current) pointerActive.current = false
    }, 120)
  }

  useFrame((state, dt) => {
    const clampedDt = Math.min(dt, 0.05)
    decayHeartPulse(clampedDt)

    const home = homeRef.current
    const text = textRef.current
    const work = workPos.current
    const vel = velRef.current
    const phases = phasesRef.current
    const layers = layersRef.current
    if (!home || !text || !work || !vel || !phases || !layers || !pointsRef.current) return

    const t = state.clock.elapsedTime
    const count = cloud.count

    // Morph cycle
    if (!reducedMotion && scene === 'main') {
      morphClock.current += clampedDt
      const c = morphClock.current
      // 0-7 heart, 7-9 morph to text, 9-12.5 hold, 12.5-14.5 morph back, loop 14.5
      const cycle = 14.5
      const local = c % cycle
      if (local < 7) morphT.current = 0
      else if (local < 9) morphT.current = smoothstep(7, 9, local)
      else if (local < 12.5) morphT.current = 1
      else morphT.current = 1 - smoothstep(12.5, 14.5, local)
    } else if (reducedMotion) {
      morphT.current = 0
    }

    const m = morphT.current
    const morphEase = m * m * (3 - 2 * m)
    const readingText = morphEase > 0.55

    // Auto orbit (slower while text readable)
    if (!dragging.current && !isFreeMode && !reducedMotion) {
      const speed = readingText ? 0.08 : 0.38
      targetRot.current.y += clampedDt * speed
      targetRot.current.x = 0.12 + Math.sin(t * 0.35) * (readingText ? 0.06 : 0.16)
    }

    rotation.current.x = THREE.MathUtils.damp(rotation.current.x, targetRot.current.x, 5, clampedDt)
    rotation.current.y = THREE.MathUtils.damp(rotation.current.y, targetRot.current.y, 5, clampedDt)

    const beat = reducedMotion ? 0 : doubleBeat(t, 1.1)
    const clickPulse = heartPulse
    burstRef.current = Math.max(0, burstRef.current - clampedDt * 1.2)

    if (group.current) {
      group.current.rotation.x = rotation.current.x
      group.current.rotation.y = rotation.current.y
      const scale =
        1 +
        beat * 0.045 +
        clickPulse * 0.16 +
        (reducedMotion || isFreeMode ? 0 : Math.sin(t * 0.5) * 0.008)
      group.current.scale.setScalar(scale)
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = t
      materialRef.current.uniforms.uPulse.value = clickPulse
      materialRef.current.uniforms.uBeat.value = beat
      materialRef.current.uniforms.uScale.value = isMobile ? 0.9 : 1
    }

    const ptr = pointerLocal.current
    const ptrOn = pointerActive.current && scene === 'main' && morphEase < 0.7
    const influenceR = 1.35
    const influenceR2 = influenceR * influenceR
    const bursting = burstRef.current > 0
    const morphing = morphEase > 0.01
    // Cheap path when idle: no spring/vel — just sine offset from home
    const idle = !ptrOn && !bursting && !morphing

    if (idle) {
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const phase = phases[i]
        const layer = layers[i]
        const amp = reducedMotion ? 0 : layer === 2 ? 0.05 : layer === 1 ? 0.015 : 0.008
        work[i3] = home[i3] + Math.sin(t * 1.3 + phase) * amp
        work[i3 + 1] = home[i3 + 1] + Math.cos(t * 1.1 + phase * 1.3) * amp * 0.85
        work[i3 + 2] = home[i3 + 2] + Math.sin(t * 1.6 + phase * 0.7) * amp * 0.6
        vel[i3] = 0
        vel[i3 + 1] = 0
        vel[i3 + 2] = 0
      }
    } else {
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const phase = phases[i]
        const layer = layers[i]

        let tx = home[i3] * (1 - morphEase) + text[i3] * morphEase
        let ty = home[i3 + 1] * (1 - morphEase) + text[i3 + 1] * morphEase
        let tz = home[i3 + 2] * (1 - morphEase) + text[i3 + 2] * morphEase

        if (morphEase > 0.05 && morphEase < 0.95) {
          const w = Math.sin(morphEase * Math.PI)
          tx += Math.sin(t * 3 + phase) * 0.04 * w
          ty += Math.cos(t * 2.6 + phase) * 0.03 * w
        }

        if (!reducedMotion) {
          const amp = layer === 2 ? 0.06 : layer === 1 ? 0.02 : 0.012
          tx += Math.sin(t * 1.3 + phase) * amp
          ty += Math.cos(t * 1.1 + phase * 1.3) * amp * 0.85
          tz += Math.sin(t * 1.6 + phase * 0.7) * amp * 0.6
        }

        if (bursting) {
          const bx = home[i3]
          const by = home[i3 + 1]
          const bz = home[i3 + 2]
          const len = Math.hypot(bx, by, bz) || 1
          const push = burstRef.current * (0.35 + layer * 0.12)
          tx += (bx / len) * push
          ty += (by / len) * push
          tz += (bz / len) * push
        }

        if (ptrOn) {
          const dx = work[i3] - ptr.x
          const dy = work[i3 + 1] - ptr.y
          const dz = work[i3 + 2] - ptr.z
          const d2 = dx * dx + dy * dy + dz * dz
          if (d2 < influenceR2 && d2 > 1e-5) {
            const d = Math.sqrt(d2)
            const f = (1 - d / influenceR) * 1.8
            vel[i3] += (dx / d) * f * clampedDt
            vel[i3 + 1] += (dy / d) * f * clampedDt
            vel[i3 + 2] += (dz / d) * f * clampedDt * 0.6
          }
        }

        const stiffness = layer === 2 ? 4.5 : 7.5
        const damping = 5.5
        vel[i3] += (tx - work[i3]) * stiffness * clampedDt
        vel[i3 + 1] += (ty - work[i3 + 1]) * stiffness * clampedDt
        vel[i3 + 2] += (tz - work[i3 + 2]) * stiffness * clampedDt
        vel[i3] *= Math.exp(-damping * clampedDt)
        vel[i3 + 1] *= Math.exp(-damping * clampedDt)
        vel[i3 + 2] *= Math.exp(-damping * clampedDt)

        work[i3] += vel[i3] * clampedDt * 18
        work[i3 + 1] += vel[i3 + 1] * clampedDt * 18
        work[i3 + 2] += vel[i3 + 2] * clampedDt * 18
      }
    }

    const attr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    ;(attr.array as Float32Array).set(work)
    attr.needsUpdate = true
  })

  return (
    <group
      ref={group}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onPointerMissed={() => {
        dragging.current = false
        pointerActive.current = false
      }}
    >
      <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
      <mesh visible={false} geometry={hitGeo} scale={1.1}>
        <meshBasicMaterial />
      </mesh>
    </group>
  )
}
