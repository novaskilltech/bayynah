import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertCircle, AlertTriangle, CheckCircle2, Quote } from "lucide-react";

interface LessonContentProps {
  content: string;
  locale: string;
}

export default function LessonContent({ content, locale }: LessonContentProps) {
  const isArabic = locale === "ar";

  return (
    <div className="space-y-6">
      {/* Avertissement bilingue pour la locale arabe */}
      {isArabic && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 flex items-start gap-3 text-amber-900 text-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block font-arabic">
              الترجمة العربية الكاملة لنص الدرس قيد الإعداد والمراجعة العلمية
            </span>
            <span className="text-xs text-amber-700 block">
              Le texte intégral de la leçon est temporairement présenté ci-dessous dans sa version originale révisée.
            </span>
          </div>
        </div>
      )}

      {/* Rendu Markdown sécurisé avec react-markdown et remark-gfm */}
      <div
        className={`prose prose-sable max-w-none text-bleuNuit-950 ${
          isArabic ? "font-arabic" : ""
        }`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Titre H1 : stylisé sobrement avec séparateur
            h1: ({ children }) => (
              <h2 className="text-2xl sm:text-3xl font-bold text-bleuNuit-900 border-b border-sable-200 pb-3 mt-8 mb-4 first:mt-0">
                {children}
              </h2>
            ),
            // Titre H2
            h2: ({ children }) => (
              <h3 className="text-xl sm:text-2xl font-bold text-bleuNuit-850 mt-6 mb-3">
                {children}
              </h3>
            ),
            // Titre H3 : détection spéciale des pièges et règles de vérification
            h3: ({ children }) => {
              const textContent = String(children);

              if (textContent.includes("❌") || textContent.toLowerCase().includes("le piège")) {
                return (
                  <div className="flex items-center gap-2.5 text-base font-bold text-red-900 bg-red-50 px-4 py-2.5 rounded-xl border border-red-200 mt-6 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span>{children}</span>
                  </div>
                );
              }

              if (textContent.includes("✅") || textContent.toLowerCase().includes("la règle de vérification")) {
                return (
                  <div className="flex items-center gap-2.5 text-base font-bold text-emerald-900 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 mt-6 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span>{children}</span>
                  </div>
                );
              }

              return (
                <h4 className="text-lg font-bold text-bleuNuit-800 mt-5 mb-2">
                  {children}
                </h4>
              );
            },
            // Paragraphes
            p: ({ children }) => (
              <p className="text-base sm:text-lg text-sable-800 leading-relaxed my-3 font-normal">
                {children}
              </p>
            ),
            // Blockquotes
            blockquote: ({ children }) => (
              <div className="my-5 rounded-xl border-l-4 rtl:border-l-0 rtl:border-r-4 border-vertProfond-600 bg-ivoire-50 p-4 relative text-bleuNuit-900 leading-relaxed shadow-sm">
                <Quote className="w-4 h-4 text-vertProfond-500 mb-1 opacity-70" />
                <div className="italic font-normal">{children}</div>
              </div>
            ),
            // Listes à puces
            ul: ({ children }) => (
              <ul className="my-4 space-y-2 list-disc list-inside text-sable-800 leading-relaxed pl-2 rtl:pl-0 rtl:pr-2">
                {children}
              </ul>
            ),
            // Listes numérotées
            ol: ({ children }) => (
              <ol className="my-4 space-y-2 list-decimal list-inside text-sable-800 leading-relaxed pl-2 rtl:pl-0 rtl:pr-2">
                {children}
              </ol>
            ),
            // Éléments de liste
            li: ({ children }) => (
              <li className="text-base sm:text-lg text-sable-800">
                {children}
              </li>
            ),
            // Tableaux GFM
            table: ({ children }) => (
              <div className="overflow-x-auto my-6 rounded-xl border border-sable-200 shadow-sm">
                <table className="w-full text-start text-sm border-collapse bg-white">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="bg-sable-100/70 px-4 py-3 text-start font-bold text-bleuNuit-900 border-b border-sable-200">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-3 border-b border-sable-100 text-sable-700">
                {children}
              </td>
            ),
            // Séparateurs
            hr: () => <hr className="my-8 border-sable-200" />,
            // Gras
            strong: ({ children }) => (
              <strong className="font-bold text-bleuNuit-950">
                {children}
              </strong>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
