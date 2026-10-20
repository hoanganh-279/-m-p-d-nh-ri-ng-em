type WomensDayFrameProps = {
  className?: string
  id?: string
}

/** Ornate floral + champagne ribbon frame (16:9); transparent center for camera. */
export function WomensDayFrame({ className, id }: WomensDayFrameProps) {
  return (
    <svg
      id={id}
      className={className}
      viewBox="0 0 640 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
    >
      <defs>
        <radialGradient id="wd-petal" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd6e5" />
          <stop offset="55%" stopColor="#f26b9b" />
          <stop offset="100%" stopColor="#c44a78" />
        </radialGradient>
        <linearGradient id="wd-ribbon" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f4d9a6" />
          <stop offset="50%" stopColor="#fff6fa" />
          <stop offset="100%" stopColor="#f4d9a6" />
        </linearGradient>
      </defs>

      {/* Paper mat with cutout window (evenodd) */}
      <path
        fillRule="evenodd"
        d="M6 6h628v348H6zM36 28h568v278H36z"
        fill="#fff6fa"
        opacity="0.98"
      />

      {/* Top ribbon */}
      <path
        d="M36 28 Q120 6 200 26 Q280 4 320 28 Q360 4 440 26 Q520 6 604 28"
        fill="none"
        stroke="url(#wd-ribbon)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M36 33 Q120 12 200 30 Q280 10 320 32 Q360 10 440 30 Q520 12 604 33"
        fill="none"
        stroke="#f26b9b"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Bottom ribbon */}
      <path
        d="M36 306 Q120 332 200 310 Q280 334 320 308 Q360 334 440 310 Q520 332 604 306"
        fill="none"
        stroke="url(#wd-ribbon)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <g>
        <Bloom cx={42} cy={32} r={16} />
        <Bloom cx={598} cy={32} r={16} />
        <Bloom cx={42} cy={302} r={14} />
        <Bloom cx={598} cy={302} r={14} />
        <Bloom cx={320} cy={22} r={18} />
        <Bloom cx={56} cy={168} r={10} />
        <Bloom cx={584} cy={168} r={10} />
        <Bloom cx={320} cy={328} r={13} />
      </g>

      <path
        d="M18 80 C10 120, 10 220, 18 270"
        fill="none"
        stroke="#f4d9a6"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M622 80 C630 120, 630 220, 622 270"
        fill="none"
        stroke="#f4d9a6"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <rect
        x="36"
        y="28"
        width="568"
        height="278"
        fill="none"
        stroke="#f26b9b"
        strokeWidth="2.5"
        opacity="0.55"
      />
      <rect
        x="42"
        y="34"
        width="556"
        height="266"
        fill="none"
        stroke="#f4d9a6"
        strokeWidth="1.25"
        opacity="0.7"
      />

      <text
        x="320"
        y="346"
        textAnchor="middle"
        fill="#1a1218"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="18"
        fontWeight="600"
        letterSpacing="0.14em"
      >
        8 · 3
      </text>
    </svg>
  )
}

function Bloom({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const petals = 5
  const petalR = r * 0.55
  return (
    <g>
      {Array.from({ length: petals }, (_, i) => {
        const a = (i / petals) * Math.PI * 2 - Math.PI / 2
        const px = cx + Math.cos(a) * r * 0.45
        const py = cy + Math.sin(a) * r * 0.45
        return (
          <circle
            key={i}
            cx={px}
            cy={py}
            r={petalR}
            fill="url(#wd-petal)"
            opacity={0.92}
          />
        )
      })}
      <circle cx={cx} cy={cy} r={r * 0.32} fill="#fff6fa" />
      <circle cx={cx} cy={cy} r={r * 0.16} fill="#f4d9a6" />
    </g>
  )
}

/** Camera window inside viewBox 0 0 640 360 (16:9) */
export const WOMENS_DAY_FRAME = {
  viewW: 640,
  viewH: 360,
  window: { x: 36, y: 28, w: 568, h: 278 },
} as const
