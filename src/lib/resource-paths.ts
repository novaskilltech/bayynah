import { isLessonSlug } from "@/lib/telemetry-contract";

export function getLessonPath(locale: string, lessonSlug: string): string {
  if (!isLessonSlug(lessonSlug)) return `/${locale}/ecoles`;
  const school = lessonSlug.split("-", 1)[0];
  return `/${locale}/ecoles/${school}/${lessonSlug}`;
}
