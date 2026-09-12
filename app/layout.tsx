import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "1.000 từ & cụm giao tiếp • Everyday English",
  description: "Học 1.000 từ và cụm giao tiếp, lưu tiến độ, quiz, test và ôn tập.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
