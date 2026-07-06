import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 行业每日精选",
  description: "Xone 团队内部 AI 行业情报聚合平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
