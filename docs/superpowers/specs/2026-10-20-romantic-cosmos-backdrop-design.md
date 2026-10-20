# Romantic cosmos backdrop (Vietnamese Women’s Day)

## Choice
- Tone: **A** — deep black + soft rose/lavender nebula
- Approach: **1** — multi-layer starfield + nebula shader (no HDR skybox)

## Implementation
- `CosmosBackdrop`: inverted black void sphere, additive FBM nebula sphere, 3 star shells (far/mid/near) with different spin for parallax
- `HeartSpace`: clear `#03020A`, soft fog, `camera.far = 200`
- Near-field petal/sparkle counts reduced; CSS vignette softened so 3D space reads as infinite

## Constraints
- Mobile: fewer stars, milder nebula intensity
- `reducedMotion`: no nebula / no spin
- Nebula alpha kept low so heart + Polaroids remain dominant
