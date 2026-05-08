import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyFactory ERP",
  description: "Industrial ERP for plastic factory operations"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
