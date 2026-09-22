"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  User,
  ShieldCheck,
  RefreshCw,
  Download,
  Trash2,
  LogOut,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from "lucide-react";
import {
  syncLocalProgressToServer,
  getLastSyncTimestamp,
  getServerAttestations,
  getCsrfTokenFromCookie,
} from "@/lib/progress-sync/client-sync";
import { AttestationData } from "@/types/skills";
import AttestationCard from "@/components/skills/AttestationCard";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export default function ComptePage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "fr";
  const isArabic = locale === "ar";

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [attestations, setAttestations] = useState<AttestationData[]>([]);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, startSyncTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  useEffect(() => {
    async function loadAccount() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setServiceUnavailable(true);
          return;
        }
        if (data?.user) {
          setUser(data.user);
          setLastSync(getLastSyncTimestamp());
          setAttestations(getServerAttestations());
        }
      } catch (err) {
        console.error("Erreur chargement compte:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAccount();
  }, []);

  const handleSync = () => {
    setSyncStatus(null);
    startSyncTransition(async () => {
      const result = await syncLocalProgressToServer();
      if (result) {
        setLastSync(result.syncTimestamp);
        setAttestations(result.attestations || []);
        setSyncStatus(
          isArabic
            ? `تمت المزامنة بنجاح! (${result.syncedAttemptsCount} محاولات مسجلة)`
            : `Synchronisation réussie (${result.syncedAttemptsCount} nouvelles tentatives enregistrées)`
        );
      } else {
        setSyncStatus(
          isArabic ? "تعذر إتمام المزامنة حالياً." : "Impossible de synchroniser pour le moment."
        );
      }
    });
  };

  const handleLogout = async () => {
    const csrf = getCsrfTokenFromCookie();
    const headers: Record<string, string> = {};
    if (csrf) headers["x-csrf-token"] = csrf;
    await fetch("/api/auth/logout", { method: "POST", headers });
    setUser(null);
    router.push(`/${locale}`);
    router.refresh();
  };

  const handleExport = () => {
    const link = document.createElement("a");
    link.href = "/api/account/export";
    link.setAttribute("download", `tabayyun-export-${user?.id || "data"}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const csrf = getCsrfTokenFromCookie();
      const headers: Record<string, string> = {};
      if (csrf) headers["x-csrf-token"] = csrf;
      const res = await fetch("/api/account/delete-account", { method: "POST", headers });
      if (res.ok) {
        alert(
          isArabic
            ? "تم حذف حسابك وجميع بياناتك نهائياً."
            : "Votre compte et vos données ont été définitivement effacés."
        );
        router.push(`/${locale}`);
        router.refresh();
      }
    } catch (err) {
      console.error("Erreur suppression compte:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-sable-500 font-medium">
        {isArabic ? "جاري تحميل بيانات الحساب..." : "Chargement de votre compte..."}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 bg-vertProfond-50 text-vertProfond-700 rounded-full flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-bleuNuit-900 font-arabic">
          {isArabic ? "حساب متعلم TABAYYUN" : "Espace Compte TABAYYUN"}
        </h1>
        <p className="text-sm text-sable-600 leading-relaxed">
          {isArabic
            ? "أنت تتصفح حالياً في «وضع الضيف» المحلي. يمكنك حفظ تقدمك، مزامنة إنجازاتك بين أجهزتك، واستصدار إفاداتك الرسمية المعتمدة عبر إنشاء حساب مجاني."
            : "Vous naviguez actuellement en « Mode invité » (données stockées localement sur votre navigateur). Créez un compte ou connectez-vous pour sécuriser votre progression et obtenir vos attestations certifiées."}
        </p>
        {serviceUnavailable && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            {isArabic
              ? "خدمة الحسابات والمزامنة غير متاحة حالياً. يمكنك متابعة التعلم في وضع الضيف، وسيبقى تقدمك محفوظاً في هذا المتصفح."
              : "Le service de comptes et de synchronisation est indisponible pour le moment. Vous pouvez continuer en mode invité ; votre progression reste conservée dans ce navigateur."}
          </div>
        )}
        <div className="pt-4 flex items-center justify-center gap-4">
          {!serviceUnavailable && (
            <button
              onClick={() => router.push(`/${locale}/connexion`)}
              className="px-6 py-3 rounded-xl bg-vertProfond-700 hover:bg-vertProfond-800 text-white font-bold text-sm shadow-md transition cursor-pointer"
            >
              {isArabic ? "تسجيل الدخول أو إنشاء حساب" : "Se connecter / Créer un compte"}
            </button>
          )}
          <button
            onClick={() => router.push(`/${locale}/parcours`)}
            className="px-6 py-3 rounded-xl border border-sable-300 bg-white text-bleuNuit-900 font-bold text-sm transition"
          >
            {isArabic ? "متابعة المسار محلياً" : "Continuer le parcours local"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* En-tête profil */}
      <div className="bg-white p-6 rounded-2xl border border-sable-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-vertProfond-100 text-vertProfond-800 rounded-2xl flex items-center justify-center font-bold text-xl">
            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-bleuNuit-900">
              {user.name || (isArabic ? "متعلم تَبَيُّن" : "Apprenant TABAYYUN")}
            </h1>
            <p className="text-xs text-sable-500">{user.email}</p>
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-sable-100 text-sable-700">
              {user.role}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-sable-300 text-sable-700 hover:bg-sable-50 text-xs font-semibold transition cursor-pointer self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          {isArabic ? "تسجيل الخروج" : "Se déconnecter"}
        </button>
      </div>

      {/* Bloc Synchronisation */}
      <div className="bg-white p-6 rounded-2xl border border-sable-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw className={`w-5 h-5 text-vertProfond-700 ${isSyncing ? "animate-spin" : ""}`} />
            <div>
              <h2 className="text-sm font-bold text-bleuNuit-900">
                {isArabic ? "المزامنة السحابية للتقدم" : "Synchronisation de l'apprentissage"}
              </h2>
              <p className="text-xs text-sable-500">
                {lastSync
                  ? `${isArabic ? "آخر مزامنة:" : "Dernière synchronisation :"} ${new Date(
                      lastSync
                    ).toLocaleString()}`
                  : isArabic
                  ? "لم تتم المزامنة بعد."
                  : "Aucune synchronisation récente enregistrée."}
              </p>
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-bleuNuit-900 hover:bg-bleuNuit-800 text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing
              ? isArabic ? "جاري المزامنة..." : "Synchronisation..."
              : isArabic ? "مزامنة الآن" : "Synchroniser maintenant"}
          </button>
        </div>

        {syncStatus && (
          <div className="p-3 rounded-lg bg-vertProfond-50 border border-vertProfond-200 text-vertProfond-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncStatus}</span>
          </div>
        )}
      </div>

      {/* Bloc Attestations Officielles */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-vertProfond-700" />
          <h2 className="text-lg font-bold text-bleuNuit-900 font-arabic">
            {isArabic ? "الإفادات المنهجية الرسمية المعتمدة" : "Attestations officielles certifiées"}
          </h2>
        </div>

        {attestations.length > 0 ? (
          <div className="space-y-6">
            {attestations.map((att) => (
              <AttestationCard key={att.attestationId} attestation={att} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-sable-200 text-center space-y-3">
            <p className="text-xs text-sable-600">
              {isArabic
                ? "لم تحصل بعد على إفادة معتمدة. يمكنك نيل إفادة المسار (≥ 75%) أو إفادة الإتقان المنهجي (≥ 85% مع معايير التنوع والاستقرار) عند اجتياز التقويم الختامي."
                : "Vous n'avez pas encore obtenu d'attestation certifiée. Passez l'évaluation finale pour débloquer l'Attestation de parcours (≥ 75%) ou l'Attestation de maîtrise méthodologique (≥ 85% + critères stricts)."}
            </p>
            <button
              onClick={() => router.push(`/${locale}/evaluation-finale`)}
              className="px-5 py-2.5 rounded-xl bg-vertProfond-700 hover:bg-vertProfond-800 text-white text-xs font-bold transition cursor-pointer inline-flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {isArabic ? "التوجه للتقويم الختامي" : "Accéder à l'Évaluation Finale"}
            </button>
          </div>
        )}
      </div>

      {/* Bloc Gouvernance des Données & RGPD */}
      <div className="bg-white p-6 rounded-2xl border border-sable-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sable-700">
          <ShieldCheck className="w-5 h-5 text-vertProfond-700" />
          <h2 className="text-sm font-bold text-bleuNuit-900 uppercase tracking-wider">
            {isArabic ? "حوكمة البيانات وحقوق المستخدم (RGPD)" : "Gouvernance des Données & RGPD"}
          </h2>
        </div>

        <p className="text-xs text-sable-600 leading-relaxed">
          {isArabic
            ? "وفقاً للائحة العامة لحماية البيانات (RGPD)، يحق لك استخراج نسخة كاملة من سجلاتك التدريبية بصيغة JSON، أو حذف حسابك وكافة محاولاتك نهائياً من خوادمنا دون أي احتفاظ."
            : "Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez du droit à la portabilité (export JSON complet de vos tentatives) et du droit à l'effacement immédiat et irréversible de votre compte."}
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sable-300 text-bleuNuit-900 hover:bg-sable-50 text-xs font-bold transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {isArabic ? "تصدير جميع بياناتي (JSON)" : "Exporter mes données (JSON)"}
          </button>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              {isArabic ? "حذف حسابي نهائياً" : "Supprimer mon compte"}
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 p-2 rounded-xl border border-red-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="text-red-800 font-medium">
                {isArabic ? "هل أنت متأكد من الحذف النهائي؟" : "Confirmer la suppression irréversible ?"}
              </span>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold cursor-pointer transition disabled:opacity-50"
              >
                {isDeleting ? "..." : isArabic ? "نعم، احذف" : "Oui, supprimer"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-sable-600 hover:text-bleuNuit-900 text-xs"
              >
                {isArabic ? "إلغاء" : "Annuler"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
