"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();

  const firstName = user?.firstName || "there";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          你好，{isLoaded ? firstName : "..."}
        </h1>
        <p className="mt-1 text-gray-500">
          欢迎回到 TalentOS，开始你的职业分析之旅
        </p>
      </div>

      {/* CTA Card */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-lg shadow-blue-600/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">上传你的第一份简历</h2>
            <p className="mt-2 max-w-md text-blue-100">
              AI 将为你分析简历结构、关键词覆盖率，并给出针对性的优化建议
            </p>
            <Link
              href="/dashboard/upload"
              className="mt-6 inline-flex items-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow transition hover:bg-blue-50"
            >
              选择文件上传
              <svg
                className="ml-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
          <div className="hidden sm:block">
            <svg
              className="h-24 w-24 text-blue-200/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">最近分析</h2>
        </div>
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <svg
            className="mx-auto h-10 w-10 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
            />
          </svg>
          <p className="mt-3 text-sm text-gray-500">
            还没有分析记录，上传简历即可开始
          </p>
        </div>
      </section>

      {/* Job Matches */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">岗位匹配</h2>
        </div>
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <svg
            className="mx-auto h-10 w-10 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
          <p className="mt-3 text-sm text-gray-500">
            上传简历后，AI 会自动为你匹配最适合的岗位
          </p>
        </div>
      </section>
    </div>
  );
}
