import { BilingualText, HistoricReference, SchoolType } from "./index";

export interface QuizOption {
  textFr: string;
  textAr: string;
  isCorrect: boolean;
  feedbackFr: string;
  feedbackAr: string;
}

export interface QuizItem {
  id: string;
  questionFr: string;
  questionAr: string;
  options: QuizOption[];
  order: number;
}

export interface LessonMeta {
  id: string;
  slug: string;
  school: SchoolType;
  level: 1 | 2 | 3 | 4;
  order: number;
  title: BilingualText;
  summary: BilingualText;
  methodologyPrinciple: BilingualText;
  historicReference?: HistoricReference;
  authorId: string;
  reviewerId?: string;
  lastVerifiedAt: string;
}

export interface LessonContent extends LessonMeta {
  contentFr: string;
  contentAr?: string;
  quizzes: QuizItem[];
}
