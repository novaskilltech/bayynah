"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface LanguageSwitcherProps {
  currentLocale: string;
}

export default function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const targetLocale = currentLocale === "fr" ? "ar" : "fr";
  const targetLabel = currentLocale === "fr" ? "العربية" : "Français";

  // Remplacer la locale courante dans le chemin
  const targetPath = pathname.replace(`/${currentLocale}`, `/${targetLocale}`);

  return (
    <Link
      href={targetPath}
      className="px-3 py-1.5 rounded-md text-xs font-semibold border border-sable-300 bg-white/70 hover:bg-sable-100 text-vertProfond-700 transition flex items-center gap-1.5 shadow-sm"
      title={currentLocale === "fr" ? "Passer en arabe" : "Changer en français"}
    >
      <span className="font-arabic">{targetLabel}</span>
    </Link>
  );
}
