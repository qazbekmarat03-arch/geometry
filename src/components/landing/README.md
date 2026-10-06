# DURYSTAP public landing

The public route uses the existing Next.js App Router. Authentication, Supabase, student routes and admin routes are unchanged. Landing styles are scoped to `.geomind`; the font assets are served locally.

- `course-program.ts`: the supplied Kazakh syllabus in four sections, with all topics and subtopics. Public syllabus only; does not create private course records.
- `geomind-landing.tsx`: Kazakh-first page, optional Russian/English UI, theme preference, curriculum/FAQ disclosures, real-time geometry formulas, and contact form. Lessons remain in Kazakh in every locale.
- `geometry-scene.tsx`: lazy Three.js renderer. Lower mobile pixel ratio/particle count; render loops stop outside the viewport, on hidden tabs, on user pause, and for reduced motion. Geometry/material resources are disposed on unmount. SVG remains when WebGL is unavailable.
- `landing-motion.tsx`: optional lazy GSAP/ScrollTrigger and Lenis; effect cleanup restores native scrolling. Page content does not depend on animation loading.
- `src/app/(public)/geomind.css`: responsive dark/light design, with a mobile navigation and keyboard focus states.

The confirmed course price is **50,000 KZT**. No access period or payment provider is assumed. The contact form validates required fields and opens a prefilled WhatsApp message to `+7 775 585 12 03` (`https://wa.me/77755851203`); it does not send messages, accept payments, or claim a request was submitted. Teacher biography and course inclusions were supplied by the owner. The portrait is pending an uploaded image. Testimonials remain pending authentic student feedback; fabricated endorsements must not be presented as real. The separate free pricing tier has been removed; the paid course includes the stated 10 free foundation lessons.

Browser checks: 390px mobile and desktop views, mobile menu, theme, language switch, and geometry controls. Lint, TypeScript and production build are required before release. A Lighthouse score and 60 FPS are performance targets, not certified measurements; profile the deployed production build on representative devices before claiming them.
