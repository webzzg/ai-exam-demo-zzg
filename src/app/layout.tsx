import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "万能导入 - 多模板自动导入下单系统",
  description: "支持多种 Excel 模板的自动识别与导入，完成批量下单流程",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 py-8">
          {children}
        </div>
      </body>
    </html>
  );
}
