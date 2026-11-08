import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Proyéctate | Grupo 10",
  description: "Convierte ideas en proyectos y colabora con tu comunidad.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
