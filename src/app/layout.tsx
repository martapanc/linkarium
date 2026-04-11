import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-sand-50 text-sand-900">
        {children}
      </body>
    </html>
  );
}
