import { notFound } from "next/navigation";
import { getInquiryBySlug } from "@/lib/inquiry-service";
import InquiryEngine from "@/components/laboratory/InquiryEngine";

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
    <div className="py-6 sm:py-10">
      <InquiryEngine inquiry={inquiry} locale={locale} />
    </div>
  );
}
