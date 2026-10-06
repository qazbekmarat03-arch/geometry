import type { Metadata } from "next";
import { GeoMindLanding } from "@/components/landing/geomind-landing";

export const metadata: Metadata = {
  title: { absolute: "GeoMind — Геометрия. Жаңа өлшемде." },
  description: "Геометрияны жаттама — түсін. Қазақ тіліндегі видео сабақтар, интерактивті 3D модельдер және қадамдық практика.",
};
export default function HomePage() { return <GeoMindLanding />; }
