import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Telepase - Gestion de Facturas",
  description: "Gestion de facturas y pasadas de Telepase",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
