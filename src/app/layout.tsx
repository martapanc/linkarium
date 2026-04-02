import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkDrop — Create & share link lists instantly",
  description:
    "Paste your links, get a shareable page. No signup required. Search, sort, and organise your bookmarks.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "LinkDrop — Create & share link lists instantly",
    description:
      "Paste your links, get a shareable page. No signup required.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-sand-50 text-sand-900">
        {children}
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
