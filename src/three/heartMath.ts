import * as THREE from 'three'

/**
 * Classic parametric heart curve (cardioid-style).
 * Recognizable silhouette: two upper lobes + pointed tip.
 */
export function heartCurve(t: number, scale = 1) {
  const x = 16 * Math.pow(Math.sin(t), 3)
  const y =
    13 * Math.cos(t) -
    5 * Math.cos(2 * t) -
    2 * Math.cos(3 * t) -
    Math.cos(4 * t)
  return { x: x * scale, y: y * scale }
}

function heartTangent(t: number): { x: number; y: number } {
  const eps = 1e-3
  const a = heartCurve(t - eps, 1)
  const b = heartCurve(t + eps, 1)
  let x = b.x - a.x
  let y = b.y - a.y
  const len = Math.hypot(x, y) || 1
  return { x: x / len, y: y / len }
}

function heartNormal2D(t: number): { x: number; y: number } {
  const tan = heartTangent(t)
  const mid = heartCurve(t, 1)
  let nx = -tan.y
  let ny = tan.x
  if (nx * mid.x + ny * mid.y < 0) {
    nx = -nx
    ny = -ny
  }
  return { x: nx, y: ny }
}

export function createHeartShellGeometry(scale = 0.1): THREE.BufferGeometry {
  const shape = new THREE.Shape()
  const steps = 192
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const { x, y } = heartCurve(t, 1)
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 5.5,
    bevelEnabled: true,
    bevelThickness: 0.45,
    bevelSize: 0.35,
    bevelSegments: 3,
    curveSegments: 96,
  })

  geometry.center()
  geometry.scale(scale * 1.02, scale * 0.98, scale * 0.55)
  geometry.computeVertexNormals()
  return geometry
}

export type HeartParticleData = {
  homePos: Float32Array
  colors: Float32Array
  sizes: Float32Array
  phases: Float32Array
  layers: Float32Array // 0 rim, 1 shell, 2 halo/drift
  count: number
}

/**
 * Reference-style particle heart:
 * - Dense inner outline of tiny pink dots
 * - Sparse outer halo with a small black gap
 * - Mostly dark / empty center
 */
export function sampleHeartShellParticles(options?: {
  rim?: number
  shell?: number
  drift?: number
  scale?: number
}): HeartParticleData {
  const rimN = options?.rim ?? 7200
  const shellN = options?.shell ?? 400
  const driftN = options?.drift ?? 2200
  const scale = options?.scale ?? 0.1
  const max = rimN + shellN + driftN

  const homePos = new Float32Array(max * 3)
  const colors = new Float32Array(max * 3)
  const sizes = new Float32Array(max)
  const phases = new Float32Array(max)
  const layers = new Float32Array(max)

  // Saturated bubblegum pinks only — no near-white
  const hot = new THREE.Color('#FF4F9A')
  const rose = new THREE.Color('#F03A7A')
  const mid = new THREE.Color('#E85A9A')

  // Outline centering (match ExtrudeGeometry center)
  const outlineSteps = 720
  let cx = 0
  let cy = 0
  for (let i = 0; i < outlineSteps; i++) {
    const p = heartCurve((i / outlineSteps) * Math.PI * 2, 1)
    cx += p.x
    cy += p.y
  }
  cx /= outlineSteps
  cy /= outlineSteps

  const sx = scale * 1.02
  const sy = scale * 0.98
  const zHalf = 0.12 // thin volume — reads as crisp 2.5D outline

  let i = 0

  const writePink = (idx: number, brightness = 1) => {
    const pick = Math.random()
    const col = pick > 0.55 ? hot : pick > 0.2 ? rose : mid
    colors[idx * 3] = col.r * brightness
    colors[idx * 3 + 1] = col.g * brightness
    colors[idx * 3 + 2] = col.b * brightness
  }

  // Dense stroke along outline (inner band)
  for (let n = 0; n < rimN && i < max; n++) {
    const t = Math.random() * Math.PI * 2
    const raw = heartCurve(t, 1)
    const n2 = heartNormal2D(t)
    const tan = heartTangent(t)
    // Tight stroke width
    const radial = (Math.random() - 0.5) * 0.55
    const along = (Math.random() - 0.5) * 0.15

    const x = (raw.x - cx + n2.x * radial + tan.x * along) * sx
    const y = (raw.y - cy + n2.y * radial + tan.y * along) * sy
    const z = (Math.random() - 0.5) * zHalf * 2

    homePos[i * 3] = x
    homePos[i * 3 + 1] = y
    homePos[i * 3 + 2] = z

    writePink(i, 0.92 + Math.random() * 0.08)
    sizes[i] = 0.028 + Math.random() * 0.016
    phases[i] = Math.random() * Math.PI * 2
    layers[i] = 0
    i++
  }

  // Very sparse inner mist (a few stray dots in the hollow — like reference)
  for (let n = 0; n < shellN && i < max; n++) {
    const t = Math.random() * Math.PI * 2
    const raw = heartCurve(t, 1)
    // Pull toward center: 0.15–0.55 of outline radius
    const inward = 0.15 + Math.random() * 0.4
    const x = (raw.x - cx) * sx * inward
    const y = (raw.y - cy) * sy * inward
    const z = (Math.random() - 0.5) * zHalf

    homePos[i * 3] = x
    homePos[i * 3 + 1] = y
    homePos[i * 3 + 2] = z

    writePink(i, 0.55 + Math.random() * 0.25)
    sizes[i] = 0.02 + Math.random() * 0.012
    phases[i] = Math.random() * Math.PI * 2
    layers[i] = 1
    i++
  }

  // Outer halo — starts after a small black gap, then fades out
  for (let n = 0; n < driftN && i < max; n++) {
    const t = Math.random() * Math.PI * 2
    const raw = heartCurve(t, 1)
    const n2 = heartNormal2D(t)
    // Gap ~1.06–1.12 then halo out to ~1.55
    const expand = 1.1 + Math.pow(Math.random(), 0.7) * 0.5

    const x = (raw.x - cx) * sx * expand + n2.x * (Math.random() - 0.5) * 0.08
    const y = (raw.y - cy) * sy * expand + n2.y * (Math.random() - 0.5) * 0.08
    const z = (Math.random() - 0.5) * zHalf * 1.6

    homePos[i * 3] = x
    homePos[i * 3 + 1] = y
    homePos[i * 3 + 2] = z

    const fade = THREE.MathUtils.clamp(1.65 - expand, 0.25, 0.85)
    writePink(i, fade)
    sizes[i] = 0.022 + Math.random() * 0.014
    phases[i] = Math.random() * Math.PI * 2
    layers[i] = 2
    i++
  }

  return {
    homePos: homePos.subarray(0, i * 3),
    colors: colors.subarray(0, i * 3),
    sizes: sizes.subarray(0, i),
    phases: phases.subarray(0, i),
    layers: layers.subarray(0, i),
    count: i,
  }
}
