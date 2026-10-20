import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useExperienceStore } from '../store/useExperienceStore'

/** Camera orbit on empty space + wheel/pinch zoom */
export function CameraRig() {
  const { camera, gl } = useThree()
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const pinch = useRef<number | null>(null)
  const target = useRef({ theta: 0.4, phi: Math.PI / 2.2 })
  const spherical = useRef(new THREE.Spherical(9, Math.PI / 2.2, 0.4))

  const zoom = useExperienceStore((s) => s.zoom)
  const zoomBy = useExperienceStore((s) => s.zoomBy)
  const scene = useExperienceStore((s) => s.scene)
  const dismissHint = useExperienceStore((s) => s.dismissHint)

  useEffect(() => {
    const el = gl.domElement

    const onWheel = (e: WheelEvent) => {
      if (useExperienceStore.getState().scene !== 'main') return
      e.preventDefault()
      zoomBy(e.deltaY * 0.01)
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        pinch.current = Math.hypot(dx, dy)
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinch.current != null) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const dist = Math.hypot(dx, dy)
        zoomBy((pinch.current - dist) * 0.025)
        pinch.current = dist
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch.current = null
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [gl, zoomBy])

  useFrame((_, dt) => {
    spherical.current.radius = THREE.MathUtils.damp(spherical.current.radius, zoom, 5, dt)
    spherical.current.theta = THREE.MathUtils.damp(
      spherical.current.theta,
      target.current.theta,
      5,
      dt,
    )
    spherical.current.phi = THREE.MathUtils.damp(spherical.current.phi, target.current.phi, 5, dt)
    camera.position.setFromSpherical(spherical.current)
    camera.lookAt(0, 0.15, 0)
  })

  return (
    <mesh
      scale={100}
      onPointerDown={(e) => {
        if (scene !== 'main') return
        e.stopPropagation()
        dragging.current = true
        last.current = { x: e.clientX, y: e.clientY }
        dismissHint()
      }}
      onPointerMove={(e) => {
        if (!dragging.current || useExperienceStore.getState().scene !== 'main') return
        e.stopPropagation()
        const dx = e.clientX - last.current.x
        const dy = e.clientY - last.current.y
        last.current = { x: e.clientX, y: e.clientY }
        target.current.theta -= dx * 0.0055
        target.current.phi = THREE.MathUtils.clamp(
          target.current.phi + dy * 0.0045,
          0.45,
          Math.PI - 0.45,
        )
      }}
      onPointerUp={(e) => {
        e.stopPropagation()
        dragging.current = false
      }}
      onPointerLeave={() => {
        dragging.current = false
      }}
      onPointerMissed={() => {
        dragging.current = false
      }}
    >
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial side={THREE.BackSide} transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}
