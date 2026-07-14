export interface Question {
  id: number;
  text: string;
  image?: string;           // картинка к вопросу
  options: string[];
  optionImages?: string[];  // картинки к вариантам ответов (опционально)
  correct: number[];
  hint: string;
}

export interface Subject {
  id: string;
  name: string;
  questions: Question[];
}

export interface TestAttempt {
  subjectId: string;
  answers: (number | null)[];
  currentQuestion: number;
  lastUpdated: Date;
}

export interface TestResult {
  id?: number;
  subjectId: string;
  correctCount: number;
  errorCount: number;
  percentage: number;
  date: Date;
  answers?: (number | null)[];
}

export interface SubjectStats {
  subjectId: string;
  attempts: number;
  bestResult: number;
  previousResult: number;
  lastResult: number;
}