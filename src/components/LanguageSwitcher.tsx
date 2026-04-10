"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  it: "IT",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(next: string) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <div className="flex items-center gap-1">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`
            text-xs font-medium px-1.5 py-0.5 rounded transition-colors cursor-pointer
            ${locale === loc
              ? "text-coral-500"
              : "text-sand-400 hover:text-sand-600"}
          `}
        >
          {LOCALE_LABELS[loc] ?? loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
