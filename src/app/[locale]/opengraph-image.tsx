import { createSocialImage, socialImageSize } from "./social-image";

export const size = socialImageSize;
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return createSocialImage(locale);
}
