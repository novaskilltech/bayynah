"use client";

import React, { useState, useSyncExternalStore, useMemo, useRef } from "react";
import { CheckCircle2, XCircle, HelpCircle, Award, RotateCcw, Check } from "lucide-react";
import { usePedagogicalTracker } from "@/lib/usePedagogicalTracker";
import type { LessonSlug } from "@/lib/telemetry-contract";

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
  lessonSlug: LessonSlug;
  locale: string;
}

interface StoredLessonProgress {
  completed: boolean;
  completedAt?: string;
  correctQuizIds: string[];
}

const STORAGE_KEY = "tabayyun.lessonProgress";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("tabayyun-progress-updated", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("tabayyun-progress-updated", callback);
  };
}

function getSnapshot() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot() {
  return null;
}

export default function LessonQuiz({ quizzes, lessonSlug, locale }: LessonQuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const isArabic = locale === "ar";
  const hasTrackedCompletionRef = useRef(false);

  const { trackLessonComplete } = usePedagogicalTracker({
    resourceType: "lesson",
    resourceId: lessonSlug,
    autoTrackOpen: true,
  });

  const rawProgress = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const validatedQuizzes = useMemo(() => {
    if (!rawProgress) return new Set<string>();
    try {
      const data: Record<string, StoredLessonProgress> = JSON.parse(rawProgress);
      const progress = data[lessonSlug];
      if (progress && Array.isArray(progress.correctQuizIds)) {
        return new Set(progress.correctQuizIds);
      }
    } catch {
      // ignore
    }
    return new Set<string>();
  }, [rawProgress, lessonSlug]);

  if (!quizzes || quizzes.length === 0) {
    return null;
  }

  const handleSelectOption = (quizId: string, optionIndex: number) => {
    const targetQuiz = quizzes.find((q) => q.id === quizId);
    if (!targetQuiz) return;

    const option = targetQuiz.options[optionIndex];
    setSelectedAnswers((prev) => ({
      ...prev,
      [quizId]: optionIndex,
    }));

    if (option.isCorrect) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const allProgress: Record<string, StoredLessonProgress> = raw ? JSON.parse(raw) : {};
        const currentCorrect = new Set(allProgress[lessonSlug]?.correctQuizIds || []);
        currentCorrect.add(quizId);
        const isAllCompleted = quizzes.every((q) => q.id === quizId || currentCorrect.has(q.id));

        allProgress[lessonSlug] = {
          completed: isAllCompleted,
          completedAt: isAllCompleted ? new Date().toISOString() : allProgress[lessonSlug]?.completedAt,
          correctQuizIds: Array.from(currentCorrect),
        };

        if (isAllCompleted && !hasTrackedCompletionRef.current) {
          hasTrackedCompletionRef.current = true;
          trackLessonComplete({
            quizScorePercent: 100,
            passed: true,
          });
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
        window.dispatchEvent(new Event("tabayyun-progress-updated"));
      } catch {
        // Erreur silencieuse de stockage local
      }
    }
  };

  const handleReset = (quizId: string) => {
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[quizId];
      return next;
    });
  };

  const isAllValidated = quizzes.every((q) => validatedQuizzes.has(q.id));

  return (
    <div className="rounded-2xl border-2 border-vertProfond-700/20 bg-white p-6 sm:p-8 shadow-sm space-y-8 my-10">
      {/* En-tête du Quiz */}
      <div className="flex flex-wrap items-center justify-between border-b border-sable-200 pb-4 gap-3">
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
                : "Évaluez votre réflexe critique avant de poursuivre votre progression"}
            </p>
          </div>
        </div>

        {/* Indicateur de validation */}
        {isAllValidated ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-fadeIn">
            <Check className="w-4 h-4" />
            <span>
              {isArabic ? "تم تثبيت الوعي المنهجي" : "Réflexe méthodologique validé"}
            </span>
          </span>
        ) : (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sable-100 text-sable-700">
            {quizzes.length} {isArabic ? "سؤال" : quizzes.length > 1 ? "questions" : "question"}
          </span>
        )}
      </div>

      {/* Questions */}
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

              {/* Options */}
              <div className="space-y-3 pt-2" role="radiogroup" aria-label={quiz.questionFr}>
                {quiz.options.map((option, optIdx) => {
                  const isSelected = selectedIdx === optIdx;
                  let optionStyles =
                    "border-sable-200 bg-white hover:border-vertProfond-400 hover:bg-vertProfond-50/20 text-bleuNuit-900 focus:ring-2 focus:ring-vertProfond-500 focus:outline-none";

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
                      data-testid={`lesson-quiz-${qIndex}-option-${optIdx}`}
                      className={`w-full text-start p-4 rounded-xl border-2 transition flex items-start gap-3 ${optionStyles}`}
                      aria-label={`${isArabic && option.textAr ? option.textAr : option.textFr} - ${
                        hasAnswered && option.isCorrect
                          ? isArabic ? "إجابة صحيحة" : "Bonne réponse"
                          : hasAnswered && isSelected
                          ? isArabic ? "إجابة غير صحيحة" : "Réponse incorrecte"
                          : ""
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
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

              {/* Feedback didactique explicite */}
              {hasAnswered && selectedOption && (
                <div
                  className={`rounded-xl p-4 border text-sm leading-relaxed space-y-2 mt-4 transition animate-fadeIn ${
                    selectedOption.isCorrect
                      ? "bg-emerald-50/80 border-emerald-300 text-emerald-900"
                      : "bg-red-50/80 border-red-300 text-red-900"
                  }`}
                  role="alert"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold">
                      {selectedOption.isCorrect ? (
                        <>
                          <Award className="w-4 h-4 text-emerald-600" />
                          <span>
                            {isArabic
                              ? "إجابة صحيحة — تم تثبيت الوعي المنهجي"
                              : "Bonne réponse — Réflexe méthodologique validé"}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>
                            {isArabic
                              ? "إجابة غير صحيحة — تنبيه منهجي"
                              : "Réponse incorrecte — Attention à l'écueil méthodologique"}
                          </span>
                        </>
                      )}
                    </div>

                    {!selectedOption.isCorrect && (
                      <button
                        type="button"
                        onClick={() => handleReset(quiz.id)}
                        className="inline-flex items-center gap-1 text-xs text-red-700 hover:text-red-900 font-semibold underline focus:ring-2 focus:ring-red-400 rounded px-1"
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
