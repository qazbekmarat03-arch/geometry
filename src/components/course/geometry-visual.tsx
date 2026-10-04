"use client";
import { useRef } from "react";
export function GeometryVisual() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className="geometry-stage"
      onPointerMove={(event) => {
        if (
          event.pointerType !== "mouse" ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          return;
        const box = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - 0.5;
        const y = (event.clientY - box.top) / box.height - 0.5;
        const art = ref.current?.querySelector("svg");
        if (art)
          art.style.transform = `rotateX(${-y * 5}deg) rotateY(${x * 7}deg)`;
      }}
      onPointerLeave={() => {
        const art = ref.current?.querySelector("svg");
        if (art) art.style.transform = "";
      }}
    >
      <span className="geometry-coordinate">
        FIG. 01 — КӨРІНБЕЙТІН БАЙЛАНЫСТАР
      </span>
      <svg
        viewBox="0 0 600 600"
        role="img"
        aria-label="Шеңберлер, үшбұрыш және координаталардан құралған геометриялық композиция"
        style={{ transition: "transform .6s ease-out" }}
      >
        <defs>
          <linearGradient id="geo-plane" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#fafff6" stopOpacity=".9" />
            <stop offset="1" stopColor="#ceddbc" stopOpacity=".3" />
          </linearGradient>
          <linearGradient id="geo-solid" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#31674b" />
            <stop offset="1" stopColor="#122c22" />
          </linearGradient>
          <pattern
            id="geo-grid"
            width="42"
            height="42"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M42 0H0v42"
              fill="none"
              stroke="#8eab89"
              strokeWidth=".5"
              opacity=".2"
            />
          </pattern>
        </defs>
        <rect x="40" y="65" width="520" height="480" fill="url(#geo-grid)" />
        <path
          d="M0 300H600M300 20v560"
          stroke="#71846b"
          strokeWidth=".7"
          opacity=".3"
        />
        <path
          d="M45 480 530 145M68 150 535 460"
          stroke="#82947b"
          strokeWidth=".5"
          strokeDasharray="3 7"
          opacity=".4"
        />
        <g className="orbit">
          <circle
            cx="300"
            cy="300"
            r="238"
            fill="none"
            stroke="#8d9d80"
            strokeWidth=".8"
          />
          <circle cx="300" cy="62" r="5" fill="#244e35" />
          <circle cx="300" cy="538" r="3" fill="#9eae8b" />
          <path d="M62 300h12M526 300h12" stroke="#5a7558" />
        </g>
        <g className="orbit-reverse">
          <ellipse
            cx="300"
            cy="300"
            rx="192"
            ry="222"
            fill="none"
            stroke="#637b5f"
            strokeWidth=".8"
            strokeDasharray="1 8"
          />
          <path
            d="M300 78a222 222 0 0 1 214 163"
            fill="none"
            stroke="#567253"
            strokeWidth="2"
          />
        </g>
        <g className="floating-plane">
          <path
            d="m155 127 305 49 53 252-310 8Z"
            fill="url(#geo-plane)"
            stroke="#fff"
            strokeWidth="1.5"
          />
          <path
            d="m155 127 305 49M203 436l310-8"
            stroke="#a9b99b"
            strokeWidth=".7"
          />
          <path
            d="m197 388 82-213 178 227Z"
            fill="url(#geo-solid)"
            fillOpacity=".96"
          />
          <path
            className="construction"
            d="m197 388 82-213 178 227-260-14 158-90-76-123M355 298l102 104"
            fill="none"
            stroke="#92b381"
            strokeWidth="1.2"
          />
          <path
            d="m197 388 17-44 24 17-14 29M430 369q-29 7-35 29"
            fill="none"
            stroke="#d0e6ba"
            strokeWidth="1"
          />
          <circle cx="279" cy="175" r="4" fill="#d3e8b9" />
          <circle cx="197" cy="388" r="4" fill="#d3e8b9" />
          <circle cx="457" cy="402" r="4" fill="#d3e8b9" />
          <circle cx="355" cy="298" r="4" fill="#d3e8b9" />
          <g fill="#294730" fontFamily="serif" fontSize="21" fontStyle="italic">
            <text x="266" y="153">
              A
            </text>
            <text x="177" y="416">
              B
            </text>
            <text x="467" y="424">
              C
            </text>
          </g>
          <text x="395" y="377" fill="#d4e6c1" fontSize="17" fontStyle="italic">
            α
          </text>
        </g>
        <g stroke="#6a8161" strokeWidth=".7">
          <path d="M88 90v12m-6-6h12M497 490v12m-6-6h12" />
        </g>
        <g fill="#77876f" fontFamily="monospace" fontSize="9">
          <text x="24" y="291">
            x
          </text>
          <text x="310" y="30">
            y
          </text>
          <text x="513" y="541">
            48° / 132°
          </text>
          <text x="43" y="541">
            O (0, 0)
          </text>
        </g>
      </svg>
      <div className="geometry-caption">
        <span className="mb-2 block text-[8px] tracking-[.18em] text-muted">
          ТҮСІНУДЕН БАСТАЛАДЫ
        </span>
        <span className="font-display text-xl tracking-tight text-brand-dark">
          Әр сызықтың мәні бар.
        </span>
      </div>
    </div>
  );
}
