import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Image, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { Memory } from '../data/memories'
import { useExperienceStore } from '../store/useExperienceStore'

type PhotoCardProps = {
  memory: Memory
  index: number
  total: number
  appear: number
}

/** Even points on a unit sphere (Fibonacci / golden spiral). */
function fibonacciUnit(index: number, total: number, out: THREE.Vector3) {
  const n = Math.max(total, 1)
  const y = 1 - ((index + 0.5) / n) * 2
  const r = Math.sqrt(Math.max(0, 1 - y * y))
  const theta = Math.PI * (1 + Math.sqrt(5)) * index
  return out.set(Math.cos(theta) * r, y, Math.sin(theta) * r)
}

export function PhotoCard({ memory, index, total, appear }: PhotoCardProps) {
  const group = useRef<THREE.Group>(null)
  const { camera, gl } = useThree()
  const [hovered, setHovered] = useState(false)
  const dragging = useRef(false)
  const dragMoved = useRef(false)
  const pointerId = useRef<number | null>(null)
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const dragOffset = useRef(new THREE.Vector3())
  const targetPos = useMemo(() => new THREE.Vector3(), [])
  const fromPos = useMemo(() => new THREE.Vector3(), [])
  const unitDir = useMemo(() => fibonacciUnit(index, total, new THREE.Vector3()), [index, total])
  const spinDir = useMemo(() => new THREE.Vector3(), [])
  const basePos = useMemo(() => new THREE.Vector3(), [])
  const axisY = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const axisX = useMemo(() => new THREE.Vector3(1, 0, 0), [])
  const sphereCenter = useMemo(() => new THREE.Vector3(0, 0.12, 0), [])
  const spin = useRef(0)

  const isMobile = useExperienceStore((s) => s.isMobile)
  const isFreeMode = useExperienceStore((s) => s.isFreeMode)
  const orbitSpeed = useExperienceStore((s) => s.orbitSpeed)
  const orbitRadius = useExperienceStore((s) => s.orbitRadius)
  const reducedMotion = useExperienceStore((s) => s.reducedMotion)
  const photoOffset = useExperienceStore((s) => s.photoOffsets[memory.id])
  const setPhotoOffset = useExperienceStore((s) => s.setPhotoOffset)
  const openLightbox = useExperienceStore((s) => s.openLightbox)
  const dismissHint = useExperienceStore((s) => s.dismissHint)
  const scene = useExperienceStore((s) => s.scene)

  // Sphere shell around the heart (~heart extent 2); slider scales the ball
  const shellRadius = 4.55 * orbitRadius
  const localOffset = useRef(
    new THREE.Vector3(
      photoOffset?.[0] ?? 0,
      photoOffset?.[1] ?? 0,
      photoOffset?.[2] ?? 0,
    ),
  )
  const crowdScale = total > 40 ? 0.72 : total > 24 ? 0.84 : 1

  const placeOnSphere = (out: THREE.Vector3) => {
    spinDir.copy(unitDir).applyAxisAngle(axisY, spin.current).applyAxisAngle(axisX, spin.current * 0.35)
    out.copy(spinDir).multiplyScalar(shellRadius).add(sphereCenter).add(localOffset.current)
    return out
  }

  useFrame((_state, dt) => {
    if (!group.current) return
    if (!dragging.current && !isFreeMode && !reducedMotion && scene === 'main') {
      spin.current += orbitSpeed * dt * 0.55
    }

    placeOnSphere(targetPos)

    fromPos.copy(targetPos).sub(sphereCenter).multiplyScalar(2.35).add(sphereCenter)
    group.current.position.lerpVectors(fromPos, targetPos, appear)

    const s = (hovered || dragging.current ? 1.08 : 1) * crowdScale
    const cur = group.current.scale.x
    const next = THREE.MathUtils.damp(cur, s, 8, dt)
    group.current.scale.setScalar(next)
  })

  const onPointerDown = (e: any) => {
    if (scene !== 'main') return
    e.stopPropagation()
    dragging.current = true
    dragMoved.current = false
    pointerId.current = e.pointerId
    dismissHint()
    gl.domElement.setPointerCapture(e.pointerId)

    plane.setFromNormalAndCoplanarPoint(
      camera.getWorldDirection(new THREE.Vector3()).negate(),
      group.current!.position,
    )
    e.ray.intersectPlane(plane, hit)
    dragOffset.current.copy(group.current!.position).sub(hit)
  }

  const onPointerMove = (e: any) => {
    if (!dragging.current || !group.current) return
    e.stopPropagation()
    plane.setFromNormalAndCoplanarPoint(
      camera.getWorldDirection(new THREE.Vector3()).negate(),
      group.current.position,
    )
    if (!e.ray.intersectPlane(plane, hit)) return
    const next = hit.add(dragOffset.current)
    spinDir
      .copy(unitDir)
      .applyAxisAngle(axisY, spin.current)
      .applyAxisAngle(axisX, spin.current * 0.35)
    basePos.copy(spinDir).multiplyScalar(shellRadius).add(sphereCenter)
    localOffset.current.copy(next).sub(basePos)
    dragMoved.current = true
  }

  const endDrag = (e: any) => {
    if (!dragging.current) return
    e.stopPropagation()
    dragging.current = false
    if (pointerId.current != null) {
      try {
        gl.domElement.releasePointerCapture(pointerId.current)
      } catch {
        /* ignore */
      }
    }
    setPhotoOffset(memory.id, [
      localOffset.current.x,
      localOffset.current.y,
      localOffset.current.z,
    ])
    if (!dragMoved.current) {
      openLightbox(memory.id)
    }
  }

  return (
    <group
      ref={group}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'grab'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      <Billboard follow>
        <RoundedBox
          args={isMobile ? [1.15, 1.45, 0.05] : [1.35, 1.7, 0.06]}
          radius={0.04}
          smoothness={isMobile ? 2 : 4}
          position={[0, -0.05, -0.02]}
        >
          <meshBasicMaterial color="#fff8f2" toneMapped={false} />
        </RoundedBox>
        <Image
          url={memory.src}
          scale={isMobile ? [0.95, 1.05] : [1.15, 1.25]}
          position={[0, 0.12, 0.035]}
          transparent
          opacity={Math.max(0.15, appear)}
          toneMapped={false}
          segments={isMobile ? 1 : 4}
          onUpdate={(mesh) => {
            const mat = mesh.material as THREE.ShaderMaterial & {
              map?: THREE.Texture
              uniforms?: { map?: { value: THREE.Texture } }
            }
            const map = mat?.uniforms?.map?.value ?? mat?.map
            if (!map) return
            const next = isMobile ? 1 : 4
            if (map.anisotropy !== next) {
              map.anisotropy = next
              map.generateMipmaps = true
              map.minFilter = THREE.LinearMipmapLinearFilter
              map.needsUpdate = true
            }
          }}
        />
      </Billboard>
    </group>
  )
}
