import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "幫我選午餐",
  description: "隨機幫你選一家附近的高評分餐廳",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
