import { EditorialStatus, HistoricReference, SchoolType } from "./index";

export interface QuizOption {
  textFr: string;
  textAr?: string;
  isCorrect: boolean;
  feedbackFr: string;
  feedbackAr?: string;
}

export interface QuizItem {
  id: string;
  questionFr: string;
  questionAr?: string;
  options: QuizOption[];
  order: number;
}

export interface LessonMeta {
  id: string;
  slug: string;
  school: SchoolType;
  level: 1 | 2 | 3 | 4;
  order: number;
  editorialStatus: EditorialStatus;
  titleFr: string;
  titleAr: string;
  summaryFr: string;
  summaryAr: string;
  methodologyPrincipleFr: string;
  methodologyPrincipleAr: string;
  historicReference?: HistoricReference;
  authorId: string;
  reviewerId?: string;
  reviewedAt?: string;
  lastVerifiedAt?: string;
  quizzes?: QuizItem[];
}

export interface LessonContent extends LessonMeta {
  contentFr: string;
  contentAr?: string;
}
