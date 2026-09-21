"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { LogIn, UserPlus, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { syncLocalProgressToServer } from "@/lib/progress-sync/client-sync";

export default function ConnexionPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "fr";
  const isArabic = locale === "ar";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload = mode === "login" ? { email, password } : { email, password, name };

    startTransition(async () => {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || (isArabic ? "حدث خطأ أثناء المعالجة." : "Une erreur est survenue."));
          return;
        }

        setSuccess(
          mode === "login"
            ? (isArabic ? "تم تسجيل الدخول بنجاح! جاري مزامنة بياناتك..." : "Connexion réussie ! Synchronisation de vos données...")
            : (isArabic ? "تم إنشاء الحساب بنجاح! جاري حفظ بياناتك..." : "Compte créé avec succès ! Synchronisation de vos données...")
        );

        // Mémorisation et migration non destructive de la progression locale vers le compte
        await syncLocalProgressToServer();

        setTimeout(() => {
          router.push(`/${locale}/compte`);
          router.refresh();
        }, 1200);
      } catch (err) {
        console.error("Erreur connexion/inscription:", err);
        setError(isArabic ? "تعذر الاتصال بالخادم." : "Impossible de joindre le serveur.");
      }
    });
  };

  return (
    <div className="max-w-md mx-auto py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-bleuNuit-900 font-arabic">
          {mode === "login"
            ? isArabic ? "تسجيل الدخول" : "Connexion à votre compte"
            : isArabic ? "إنشاء حساب جديد" : "Créer un compte TABAYYUN"}
        </h1>
        <p className="text-sm text-sable-600">
          {isArabic
            ? "احفظ تقدمك المنهجي وأفاداتك المعتمدة عبر مختلف أجهزتك."
            : "Sauvegardez votre progression méthodologique et vos attestations sur tous vos appareils."}
        </p>
      </div>

      {/* Onglets de sélection Mode */}
      <div className="flex rounded-xl bg-sable-100 p-1 border border-sable-200 text-sm font-semibold">
        <button
          type="button"
          onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
          className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
            mode === "login" ? "bg-white text-bleuNuit-900 shadow-xs" : "text-sable-600 hover:text-bleuNuit-900"
          }`}
        >
          <LogIn className="w-4 h-4" />
          {isArabic ? "تسجيل الدخول" : "Se connecter"}
        </button>
        <button
          type="button"
          onClick={() => { setMode("register"); setError(null); setSuccess(null); }}
          className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
            mode === "register" ? "bg-white text-bleuNuit-900 shadow-xs" : "text-sable-600 hover:text-bleuNuit-900"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          {isArabic ? "حساب جديد" : "Créer un compte"}
        </button>
      </div>

      {/* Messages de retour */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-sable-200 shadow-xs space-y-4">
        {mode === "register" && (
          <div>
            <label className="block text-xs font-bold text-sable-700 uppercase tracking-wider mb-1">
              {isArabic ? "الاسم أو اللقب (اختياري، يظهر في الإفادة)" : "Nom ou pseudo (affiché sur l'attestation)"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isArabic ? "أحمد بن عبد الله" : "Ex: Zayd Ibn Ali"}
              className="w-full px-4 py-2.5 rounded-xl border border-sable-300 focus:outline-hidden focus:ring-2 focus:ring-vertProfond-500 text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-sable-700 uppercase tracking-wider mb-1">
            {isArabic ? "البريد الإلكتروني" : "Adresse email"}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="exemple@domaine.com"
            className="w-full px-4 py-2.5 rounded-xl border border-sable-300 focus:outline-hidden focus:ring-2 focus:ring-vertProfond-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-sable-700 uppercase tracking-wider mb-1">
            {isArabic ? "كلمة المرور (8 أحرف على الأقل)" : "Mot de passe (8 caractères minimum)"}
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-sable-300 focus:outline-hidden focus:ring-2 focus:ring-vertProfond-500 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 rounded-xl bg-vertProfond-700 hover:bg-vertProfond-800 text-white font-bold text-sm shadow-md transition disabled:opacity-50 mt-2 cursor-pointer"
        >
          {isPending
            ? (isArabic ? "جاري المعالجة..." : "Traitement en cours...")
            : mode === "login"
            ? (isArabic ? "دخول" : "Se connecter")
            : (isArabic ? "تسجيل الحساب" : "Créer mon compte")}
        </button>
      </form>

      {/* Règle déontologique et RGPD */}
      <div className="p-4 rounded-xl border border-sable-200 bg-sable-50 text-xs text-sable-600 space-y-1.5 flex items-start gap-3">
        <Shield className="w-5 h-5 text-vertProfond-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-bleuNuit-900">
            {isArabic ? "حماية الخصوصية وميثاق النزاهة" : "Protection des données & Éthique"}
          </p>
          <p>
            {isArabic
              ? "بياناتك مخصصة حصراً لقياس كفاءات التثبت والتدريب المنهجي. لا يتم استنتاج أي أحكام شخصية أو فكرية، ويمكنك تصدير بياناتك أو حذف حسابك بضغطة زر واحدة وفق معايير RGPD."
              : "Vos données servent exclusivement à mesurer votre progression méthodologique. Aucune inférence doctrinale ni analyse de foi. Vous conservez le contrôle total (export et suppression immédiate selon le RGPD)."}
          </p>
        </div>
      </div>
    </div>
  );
}
