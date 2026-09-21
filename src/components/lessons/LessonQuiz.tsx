"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, HelpCircle, Award, RotateCcw } from "lucide-react";

interface QuizOption {
  textFr: string;
  textAr?: string;
  isCorrect: boolean;
  feedbackFr: string;
  feedbackAr?: string;
}

interface QuizItem {
  id: string;
  questionFr: string;
  questionAr?: string;
  options: QuizOption[];
  order: number;
}

interface LessonQuizProps {
  quizzes: QuizItem[];
  locale: string;
}

export default function LessonQuiz({ quizzes, locale }: LessonQuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const isArabic = locale === "ar";

  if (!quizzes || quizzes.length === 0) {
    return null;
  }

  const handleSelectOption = (quizId: string, optionIndex: number) => {
    // Si l'utilisateur a déjà répondu correctement, on ne bloque pas mais on met à jour
    setSelectedAnswers((prev) => ({
      ...prev,
      [quizId]: optionIndex,
    }));
  };

  const handleReset = (quizId: string) => {
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[quizId];
      return next;
    });
  };

  return (
    <div className="rounded-2xl border-2 border-vertProfond-700/20 bg-white p-6 sm:p-8 shadow-sm space-y-8 my-10">
      <div className="flex items-center justify-between border-b border-sable-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-vertProfond-100 flex items-center justify-center text-vertProfond-700">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-bleuNuit-900">
              {isArabic ? "اختبار التثبت المنهجي" : "Exercice d'application méthodologique"}
            </h3>
            <p className="text-xs text-sable-500">
              {isArabic
                ? "قس مهاراتك في التفكير النقدي قبل الانتقال للمستوى الموالي"
                : "Évaluez votre réflexe critique avant de passer à l'étape suivante"}
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sable-100 text-sable-700">
          {quizzes.length} {isArabic ? "سؤال" : quizzes.length > 1 ? "questions" : "question"}
        </span>
      </div>

      <div className="space-y-8">
        {quizzes.map((quiz, qIndex) => {
          const selectedIdx = selectedAnswers[quiz.id];
          const hasAnswered = selectedIdx !== undefined;
          const selectedOption = hasAnswered ? quiz.options[selectedIdx] : null;

          return (
            <div
              key={quiz.id}
              className="rounded-xl border border-sable-200 bg-ivoire-50/50 p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-bleuNuit-900 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {qIndex + 1}
                </span>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-bleuNuit-950">
                    {isArabic && quiz.questionAr ? quiz.questionAr : quiz.questionFr}
                  </h4>
                  {isArabic && (
                    <p className="text-xs text-sable-600 font-arabic leading-relaxed">
                      {quiz.questionFr}
                    </p>
                  )}
                </div>
              </div>

              {/* Liste des options */}
              <div className="space-y-3 pt-2">
                {quiz.options.map((option, optIdx) => {
                  const isSelected = selectedIdx === optIdx;
                  let optionStyles =
                    "border-sable-200 bg-white hover:border-vertProfond-400 hover:bg-vertProfond-50/20 text-bleuNuit-900";

                  if (hasAnswered) {
                    if (option.isCorrect) {
                      optionStyles =
                        "border-emerald-500 bg-emerald-50 text-emerald-950 font-medium";
                    } else if (isSelected && !option.isCorrect) {
                      optionStyles = "border-red-400 bg-red-50 text-red-950";
                    } else {
                      optionStyles = "border-sable-200 bg-white/60 text-sable-500 opacity-70";
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(quiz.id, optIdx)}
                      className={`w-full text-start p-4 rounded-xl border-2 transition flex items-start gap-3 ${optionStyles}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {hasAnswered && option.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : hasAnswered && isSelected && !option.isCorrect ? (
                          <XCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-semibold ${
                              isSelected
                                ? "border-vertProfond-600 bg-vertProfond-600 text-white"
                                : "border-sable-400 text-sable-600"
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <p className="text-sm leading-relaxed">
                          {isArabic && option.textAr ? option.textAr : option.textFr}
                        </p>
                        {isArabic && option.textFr && option.textAr && (
                          <p className="text-xs text-sable-500 italic">{option.textFr}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Feedback didactique après sélection */}
              {hasAnswered && selectedOption && (
                <div
                  className={`rounded-xl p-4 border text-sm leading-relaxed space-y-2 mt-4 transition animate-fadeIn ${
                    selectedOption.isCorrect
                      ? "bg-emerald-50/80 border-emerald-300 text-emerald-900"
                      : "bg-red-50/80 border-red-300 text-red-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold">
                      {selectedOption.isCorrect ? (
                        <>
                          <Award className="w-4 h-4 text-emerald-600" />
                          <span>
                            {isArabic ? "أحسنت! إجابة موفقة ومنهجية" : "Excellent réflexe méthodologique !"}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>
                            {isArabic ? "تنبيه منهجي" : "Attention à l'écueil méthodologique"}
                          </span>
                        </>
                      )}
                    </div>

                    {!selectedOption.isCorrect && (
                      <button
                        onClick={() => handleReset(quiz.id)}
                        className="inline-flex items-center gap-1 text-xs text-red-700 hover:text-red-900 font-semibold underline"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isArabic ? "إعادة المحاولة" : "Réessayer"}</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm">
                    {isArabic && selectedOption.feedbackAr
                      ? selectedOption.feedbackAr
                      : selectedOption.feedbackFr}
                  </p>
                  {isArabic && selectedOption.feedbackFr && selectedOption.feedbackAr && (
                    <p className="text-xs text-sable-600 italic">
                      {selectedOption.feedbackFr}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
