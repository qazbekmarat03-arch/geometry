export function CourseArtwork({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="200"
        cy="150"
        r="110"
        stroke="currentColor"
        strokeWidth=".7"
        opacity=".4"
      />
      <ellipse
        cx="200"
        cy="150"
        rx="150"
        ry="70"
        stroke="currentColor"
        strokeWidth=".7"
        opacity=".3"
        transform="rotate(-30 200 150)"
      />
      <path
        d="m114 218 78-181 111 184-189-3 158-108-80-76M272 110l31 111"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M30 150h340M200 15v270"
        stroke="currentColor"
        strokeWidth=".5"
        strokeDasharray="2 6"
        opacity=".3"
      />
      <circle cx="192" cy="37" r="3" fill="currentColor" />
      <circle cx="114" cy="218" r="3" fill="currentColor" />
      <circle cx="303" cy="221" r="3" fill="currentColor" />
      <circle cx="272" cy="110" r="3" fill="currentColor" />
      <path d="m127 188 20 9-10 23" stroke="currentColor" strokeWidth=".8" />
      <text
        x="288"
        y="269"
        fill="currentColor"
        fontSize="9"
        letterSpacing="2"
        opacity=".65"
      >
        D / GEOMETRY
      </text>
    </svg>
  );
}
