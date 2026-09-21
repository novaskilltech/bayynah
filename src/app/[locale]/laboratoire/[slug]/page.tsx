import { notFound } from "next/navigation";
import { getInquiryBySlug } from "@/lib/inquiry-service";
import InquiryEngine from "@/components/laboratory/InquiryEngine";
import PrerequisiteAlert from "@/components/skills/PrerequisiteAlert";

interface InquiryPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export default async function InquiryPage({ params }: InquiryPageProps) {
  const { locale, slug } = await params;
  const inquiry = getInquiryBySlug(slug);

  if (!inquiry) {
    notFound();
  }

  return (
    <div className="py-6 sm:py-10 max-w-5xl mx-auto">
      <PrerequisiteAlert inquirySlug={slug} locale={locale} />
      <InquiryEngine inquiry={inquiry} locale={locale} />
    </div>
  );
}
