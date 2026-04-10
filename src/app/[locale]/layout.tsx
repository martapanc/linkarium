import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { routing } from "@/i18n/routing";
import "../globals.css";

export const metadata: Metadata = {
  title: "Linkarium — Create & share link lists instantly",
  description:
    "Paste your links, get a shareable page. No signup required. Search, sort, and organise your bookmarks.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "Linkarium — Create & share link lists instantly",
    description: "Paste your links, get a shareable page. No signup required.",
    type: "website",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-sand-50 text-sand-900">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "var(--color-sand-900)",
              color: "var(--color-sand-50)",
              border: "none",
            },
          }}
        />
      </body>
    </html>
  );
}
