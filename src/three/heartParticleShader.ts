import * as THREE from 'three'

/**
 * Tiny sharp pink dots — NormalBlending so overlaps stay pink, not white.
 * Matches sand-art / stardust reference (no bloom blowout).
 */
export function createHeartParticleMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uPulse: { value: 0 },
      uBeat: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uScale: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aPhase;

      uniform float uTime;
      uniform float uPulse;
      uniform float uBeat;
      uniform float uPixelRatio;
      uniform float uScale;

      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        // Cap brightness so additive-like wash never happens
        vColor = min(aColor, vec3(1.0, 0.72, 0.88));

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float depth = -mvPosition.z;
        float depthFactor = clamp(7.0 / max(depth, 0.8), 0.55, 1.15);
        float pulseBoost = 1.0 + uPulse * 0.18 + uBeat * 0.08;
        float twinkle = 0.88 + 0.12 * sin(uTime * 2.1 + aPhase);

        // Small stardust dots — hard clamp prevents glare blobs
        gl_PointSize = aSize * 95.0 * uScale * uPixelRatio * depthFactor * pulseBoost;
        gl_PointSize = clamp(gl_PointSize, 1.0, 4.5);

        vAlpha = 0.72 * twinkle;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        // Crisp disc — almost no soft halo (avoids white mush)
        if (d > 0.48) discard;
        float edge = 1.0 - smoothstep(0.28, 0.48, d);
        float alpha = edge * vAlpha;
        // Keep hue pink; never brighten toward white
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
  })
}
