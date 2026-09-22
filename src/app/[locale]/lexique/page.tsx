import { Metadata } from "next";
import GlossaryClientView from "./GlossaryClientView";
import { getAllGlossaryTerms } from "@/lib/glossary-data";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";
  return {
    title: isArabic ? "المعجم المنهجي — تَبَيُّن" : "Lexique Méthodologique — TABAYYUN",
    description: isArabic
      ? "قاموس المصطلحات الأصولية والحديثية والنقدية المعتمدة في منصة تبين."
      : "Dictionnaire des termes d'uṣūl al-ḥadīth, d'uṣūl al-fiqh et d'épistémologie critique de TABAYYUN.",
  };
}

export default async function GlossaryPage({ params }: PageProps) {
  const { locale } = await params;
  const terms = getAllGlossaryTerms();

  return <GlossaryClientView terms={terms} locale={locale} />;
}
