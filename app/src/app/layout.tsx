import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider, Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TalentOS - AI 驱动的职业发展平台",
  description:
    "上传简历，获得 AI 深度分析与岗位匹配，开启你的职业进化之路。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="zh-CN">
        <body className={`${inter.className} antialiased`}>
          <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <Link
                href="/"
                className="text-xl font-bold tracking-tight text-gray-900"
              >
                Talent<span className="text-blue-600">OS</span>
              </Link>

              <nav className="flex items-center gap-4">
                <Show when="signed-out">
                  <Link
                    href="/sign-in"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    登录
                  </Link>
                  <Link
                    href="/sign-up"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    注册
                  </Link>
                </Show>

                <Show when="signed-in">
                  <Link
                    href="/dashboard"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    工作台
                  </Link>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "h-9 w-9",
                      },
                    }}
                  />
                </Show>
              </nav>
            </div>
          </header>

          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
