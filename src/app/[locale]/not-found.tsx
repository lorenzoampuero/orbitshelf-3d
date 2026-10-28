import Link from "next/link";
import { getDictionary } from "@/i18n/get-dictionary";

export default function NotFoundPage() {
  const dict = getDictionary("en");
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-3xl font-bold">{dict.notFound.title}</h1>
      <p className="max-w-md text-sm text-muted">{dict.notFound.text}</p>
      <Link href="/" className="rounded-xl bg-mint px-4 py-2 text-sm font-semibold text-bg">
        {dict.notFound.home}
      </Link>
    </main>
  );
}
