import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
const displayFont = localFont({
  src: "../../public/fonts/noto-sans-variable.woff2",
  variable: "--font-heading",
  display: "swap",
  weight: "100 900",
});
const bodyFont = localFont({
  src: "../../public/fonts/inter-variable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});
export const metadata: Metadata = {
  title: {
    default: "DURYSTAP Geometry — Геометрияны түсініп үйрен",
    template: "%s | DURYSTAP Geometry",
  },
  description:
    "Геометрияны қазақ тілінде түсініп үйренуге арналған онлайн видеокурс.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="kk" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <a
          href="#main"
          className="fixed left-4 top-4 z-50 -translate-y-32 rounded-xl bg-brand px-4 py-3 text-white focus:translate-y-0"
        >
          Мазмұнға өту
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
