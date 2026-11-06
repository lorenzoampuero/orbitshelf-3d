import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "../globals.css";
import { notFound } from "next/navigation";
import { isLocale, LOCALES } from "@/i18n/config";
import type { Locale } from "@/lib/types";
import { AuthHashRedirect } from "@/components/auth-hash-redirect";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale: Locale = locale;

  return (
    <html lang={typedLocale}>
      <body className="min-h-screen bg-bg text-fg antialiased">
        <AuthHashRedirect />
        {children}
      </body>
    </html>
  );
}
