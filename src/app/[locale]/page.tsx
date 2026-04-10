"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useWriteToken } from "@/lib/useWriteToken";
import { WriteGuard } from "@/components/WriteGuard";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Home() {
  const t = useTranslations("home");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const { token, authFetch } = useWriteToken();
  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const canWrite = !!token;

  async function handleCreate() {
    setIsCreating(true);
    try {
      const urls = rawText
        .split(/[\n\r]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await authFetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "My Links",
          urls: urls.length > 0 ? urls : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to create list");

      const { list } = await res.json();
      router.push(`/${list.id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsCreating(false);
    }
  }

  const howItWorks = [
    { step: "1", title: t("howItWorks.step1Title"), desc: t("howItWorks.step1Desc") },
    { step: "2", title: t("howItWorks.step2Title"), desc: t("howItWorks.step2Desc") },
    { step: "3", title: t("howItWorks.step3Title"), desc: t("howItWorks.step3Desc") },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-sand-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-display text-2xl text-sand-900 tracking-tight">
            Linkarium
          </span>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <WriteGuard />
            <a
              href="https://github.com/martapanc/linkarium"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-sand-500 hover:text-sand-700 transition-colors"
            >
              {tNav("github")}
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-6 pt-16 pb-24 md:pt-24">
        <div className="max-w-2xl w-full text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-sand-900 mb-4 tracking-tight leading-tight">
            {t("headline1")}
            <br />
            <span className="text-coral-500 italic">{t("headline2")}</span>
          </h1>
          <p className="text-lg text-sand-500 max-w-md mx-auto text-pretty">
            {t.rich("tagline", { br: () => <br /> })}
          </p>
        </div>

        {/* Create form */}
        <div className="max-w-2xl w-full">
          {!canWrite && (
            <div className="mb-8 text-center text-sm text-sand-400">
              {t("unlockHint")}
            </div>
          )}
          <div className={`bg-white rounded-2xl border border-sand-200 shadow-sm overflow-hidden ${!canWrite ? "opacity-50 pointer-events-none select-none" : ""}`}>
            <div className="border-b border-sand-100 px-5 py-3">
              <input
                type="text"
                placeholder={t("titlePlaceholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-lg font-medium text-sand-900 placeholder:text-sand-300 focus:outline-none"
                maxLength={100}
              />
            </div>

            <div className="px-5 py-4">
              <textarea
                placeholder={t("textareaPlaceholder")}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={8}
                className="w-full bg-transparent text-sand-800 placeholder:text-sand-300 text-[15px] leading-relaxed resize-none focus:outline-none font-mono"
              />
            </div>

            <div className="border-t border-sand-100 px-5 py-4 flex items-center justify-between">
              <span className="text-xs text-sand-400">
                {rawText.trim()
                  ? t("linksDetected", { count: rawText.split(/https?:\/\//).length - 1 })
                  : t("addLater")}
              </span>
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="
                  bg-coral-500 hover:bg-coral-600 active:bg-coral-600
                  text-white font-medium text-sm
                  px-6 py-2.5 rounded-xl
                  transition-all duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed
                  cursor-pointer
                "
              >
                {isCreating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t("creatingButton")}
                  </span>
                ) : (
                  t("createButton")
                )}
              </button>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {howItWorks.map((item) => (
              <div key={item.step}>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-coral-500/10 text-coral-500 font-display text-xl mb-3">
                  {item.step}
                </div>
                <h3 className="font-display text-xl text-sand-800 mb-1">{item.title}</h3>
                <p className="text-sm text-sand-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-sand-200 px-6 py-6 text-center text-xs text-sand-400">
        {t("footer")}
      </footer>
    </div>
  );
}
