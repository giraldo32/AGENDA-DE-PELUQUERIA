import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Barbería Stiven",
  description: "Sistema de reservas y administración para Barbería Stiven con agenda diaria, historial de clientes y contraseña configurable.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
