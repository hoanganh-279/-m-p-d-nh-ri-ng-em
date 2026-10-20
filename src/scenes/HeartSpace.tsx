import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { Heart } from '../three/Heart'
import { OrbitField } from '../three/OrbitField'
import { CameraRig } from '../three/CameraRig'
import { FloatingParticles, SparklesField } from '../three/Effects'
import { CosmosBackdrop } from '../three/CosmosBackdrop'
import { useExperienceStore } from '../store/useExperienceStore'

export function HeartSpace() {
  const isMobile = useExperienceStore((s) => s.isMobile)
  const entered = useExperienceStore((s) => s.entered)

  if (!entered) return null

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        dpr={[1, isMobile ? 1.1 : 1.35]}
        camera={{ position: [0, 1.2, 9], fov: 45, near: 0.1, far: 200 }}
        gl={{ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: '#03020A' }}
      >
        <color attach="background" args={['#03020A']} />
        <fog attach="fog" args={['#03020A', 45, 160]} />
        <ambientLight intensity={0.55} />
        <pointLight position={[4, 5, 4]} intensity={1.2} color="#F26B9B" />
        <pointLight position={[-5, -2, -3]} intensity={0.7} color="#B69AFF" />
        <spotLight
          position={[0, 8, 2]}
          angle={0.55}
          penumbra={0.85}
          intensity={1.35}
          color="#FFD6E5"
        />
        <hemisphereLight args={['#FFD6E5', '#03020A', 0.28]} />

        <Suspense fallback={null}>
          <CameraRig />
          <CosmosBackdrop />
          <FloatingParticles />
          <SparklesField />
          <Heart />
          <OrbitField />
        </Suspense>
      </Canvas>
    </div>
  )
}
