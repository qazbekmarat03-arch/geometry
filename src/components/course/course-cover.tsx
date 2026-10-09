/** Lightweight vector covers: crisp at every screen size, no image requests. */
export function CourseCover({ title }: { title: string }) {
  const normalized = title.toLocaleLowerCase("kk-KZ");
  const kind = normalized.includes("аналит")
    ? "analytic"
    : normalized.includes("алгеб") ? "algebra" : "geometry";
  const info = {
    algebra: { number: "01", formula: "y = x² + bx + c", caption: "САНДАРДАН — ЗАҢДЫЛЫҚҚА" },
    geometry: { number: "02", formula: "a² + b² = c²", caption: "СЫЗБАДАН — ТҮСІНІККЕ" },
    analytic: { number: "03", formula: "x² + y² = r²", caption: "КООРДИНАТАДАН — КЕҢІСТІККЕ" },
  }[kind];
  return (
    <div className={`course-cover course-cover--${kind}`}>
      <div className="course-cover-brand">DURYSTAP <span> / {info.number}</span></div>
      <svg className="course-cover-drawing" viewBox="0 0 360 300" fill="none" aria-hidden="true">
        <g stroke="currentColor" opacity=".12" strokeWidth="1">
          {[40, 80, 120, 160, 200, 240, 280, 320].map(n => <path key={n} d={`M${n} 0v300M0 ${n}h360`} />)}
        </g>
        {kind === "algebra" ? <>
          <path d="M32 212h298M174 24v258" stroke="currentColor" opacity=".5" />
          <path d="M60 40Q174 385 288 40" stroke="currentColor" strokeWidth="4" />
          <path d="m55 238 245-136" stroke="currentColor" strokeWidth="2" strokeDasharray="5 8" opacity=".5" />
          <circle cx="174" cy="212" r="7" fill="currentColor" />
          <circle cx="103" cy="147" r="5" fill="currentColor" />
          <circle cx="245" cy="147" r="5" fill="currentColor" />
        </> : kind === "geometry" ? <>
          <circle cx="183" cy="150" r="112" stroke="currentColor" opacity=".45" />
          <path d="m78 240 102-207 107 207Z" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity=".06" />
          <path d="M180 33v207M78 240l156-104M287 240 128 139" stroke="currentColor" opacity=".45" strokeDasharray="5 5" />
          <path d="M180 223h17v17" stroke="currentColor" strokeWidth="2" />
          <circle cx="180" cy="33" r="6" fill="currentColor" />
          <circle cx="78" cy="240" r="6" fill="currentColor" />
          <circle cx="287" cy="240" r="6" fill="currentColor" />
        </> : <>
          <path d="M58 232 300 88M177 273V22M31 92l291 166" stroke="currentColor" opacity=".5" strokeWidth="1.5" />
          <path d="m90 112 112-60 99 65-115 71Z" fill="currentColor" fillOpacity=".14" stroke="currentColor" strokeWidth="2" />
          <path d="m90 112 5 100 91 56 115-70V117M186 188v80" stroke="currentColor" strokeWidth="2" />
          <path d="M177 172 251 97m-20 4 20-4-5 20" stroke="currentColor" strokeWidth="4" />
          <ellipse cx="181" cy="168" rx="136" ry="57" transform="rotate(-30 181 168)" stroke="currentColor" opacity=".35" />
          <circle cx="251" cy="97" r="6" fill="currentColor" />
        </>}
      </svg>
      <div className="course-cover-copy">
        <span className="course-cover-caption">{info.caption}</span>
        <strong>{title}</strong>
        <span className="course-cover-formula">{info.formula}</span>
      </div>
    </div>
  );
}
