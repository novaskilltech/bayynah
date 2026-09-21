import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { CSRF_COOKIE_NAME, generateCsrfToken } from "@/lib/csrf";
import { getCanonicalScientificContent } from "@/lib/canonical-content";
import ReviewEditor from "./ReviewEditor";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    locale: string;
    type: string;
    slug: string;
  }>;
}

export default async function AdminReviewPage({ params }: PageProps) {
  const { locale, type, slug } = await params;
  const isArabic = locale === "ar";

  // 1. Contrôle d'accès RBAC : seuls REVIEWER et ADMIN sont autorisés
  const user = await getCurrentUser();

  if (!user || (user.role !== "REVIEWER" && user.role !== "ADMIN")) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4" dir={isArabic ? "rtl" : "ltr"}>
        <div className="p-4 rounded-full bg-red-100 text-red-700 w-16 h-16 mx-auto flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-bleuNuit-900 font-arabic">
          {isArabic ? "منطقة مراجعة علمية مقيدة" : "Accès Réservé aux Relecteurs & Administrateurs"}
        </h1>
        <p className="text-xs text-sable-600 max-w-md mx-auto leading-relaxed">
          {isArabic
            ? "هذه الصفحة مخصصة لأعضاء اللجنة العلمية المعتمدين لمراجعة المتون والأدلة. يتطلب الدخول حساباً بصلاحية REVIEWER أو ADMIN."
            : "Cette interface est strictement réservée au collège de révision scientifique de TABAYYUN. Votre rôle actuel ne vous autorise pas à inspecter ou proposer des modifications sur ce dossier."}
        </p>
        <div className="pt-4">
          <Link
            href={`/${locale}/connexion`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bleuNuit-900 text-white text-xs font-bold hover:bg-bleuNuit-800 transition"
          >
            <span>{isArabic ? "تسجيل الدخول بحساب relecteur" : "Se connecter avec un compte habilité"}</span>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Chargement du contenu scientifique canonique
  if (type !== "lesson" && type !== "inquiry") {
    notFound();
  }

  let canonical;
  try {
    canonical = getCanonicalScientificContent(type, slug);
  } catch (err: unknown) {
    console.error("Erreur chargement contenu canonique:", err);
    notFound();
  }

  const originalContent = canonical.content;
  const baseCommitSha = canonical.contentHash;

  // 3. Récupération ou génération du token CSRF
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get(CSRF_COOKIE_NAME)?.value || generateCsrfToken();

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6" dir={isArabic ? "rtl" : "ltr"}>
      {/* Lien retour */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${locale}/admin`}
          className="inline-flex items-center gap-2 text-xs font-bold text-sable-600 hover:text-bleuNuit-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isArabic ? "العودة إلى لوحة المراجعة العلمية" : "Retour au tableau d'audit"}</span>
        </Link>

        <span className="px-2.5 py-1 rounded-full bg-sable-100 border border-sable-200 text-sable-700 text-[11px] font-bold">
          Connecté en tant que : <span className="text-bleuNuit-900">{user.email}</span> ({user.role})
        </span>
      </div>

      {/* Titre & En-tête */}
      <div className="bg-white p-6 rounded-2xl border border-sable-200 shadow-xs space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-vertProfond-100 text-vertProfond-800">
            {type === "lesson" ? (isArabic ? "درس منهجي" : "LEÇON") : (isArabic ? "تحقيق منهجي" : "ENQUÊTE")}
          </span>
          <h1 className="text-xl font-bold text-bleuNuit-900 font-arabic">
            {isArabic
              ? (originalContent.titleAr as string) || (originalContent.title as { ar?: string })?.ar || slug
              : (originalContent.titleFr as string) || (originalContent.title as { fr?: string })?.fr || slug}
          </h1>
        </div>
        <p className="text-xs text-sable-500 font-mono">
          Fichier source : content/{type === "lesson" ? "lessons" : "inquiries"}/{slug}.{type === "lesson" ? "md" : "json"}
        </p>
      </div>

      {/* Composant éditeur interactif */}
      <ReviewEditor
        type={type as "lesson" | "inquiry"}
        slug={slug}
        initialContent={originalContent}
        baseCommitSha={baseCommitSha}
        locale={locale}
        csrfToken={csrfToken}
        userRole={user.role}
      />
    </div>
  );
}
