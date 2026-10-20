type HeartParticleProps = {
  className?: string
}

/** Small accent heart used as a flying particle from Stitch's hand. */
export function HeartParticle({ className }: HeartParticleProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden
      focusable="false"
    >
      <path
        fill="var(--accent)"
        d="M12 21s-7.2-4.35-9.6-8.4C.6 9.3 1.8 5.7 5.1 4.5c1.95-.7 4.05.15 5.1 1.8 1.05-1.65 3.15-2.5 5.1-1.8 3.3 1.2 4.5 4.8 2.7 8.1C19.2 16.65 12 21 12 21z"
      />
      <path
        fill="var(--blush)"
        opacity="0.55"
        d="M8.2 7.1c.9-.4 1.9-.15 2.5.7l.3.5.05-.1c.55-.9 1.6-1.25 2.55-.9-.7-.55-1.65-.7-2.55-.35-.55.2-1 .6-1.25 1.1-.25-.55-.7-.95-1.25-1.15-.1-.03-.2-.05-.35-.05z"
      />
    </svg>
  )
}
