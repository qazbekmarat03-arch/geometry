import type { Metadata } from "next";
import { DURYSTAPLanding } from "@/components/landing/geomind-landing";

export const metadata: Metadata = {
  title: { absolute: "DURYSTAP — Геометрия. Жаңа өлшемде." },
  description:
    "Геометрияны жаттама — түсін. Қазақ тіліндегі видео сабақтар, интерактивті 3D модельдер және қадамдық практика.",
};
export default function HomePage() {
  return <DURYSTAPLanding />;
}
