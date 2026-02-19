export interface AdminQuestion {
  id: string;
  category: string;
  difficulty: string;
  question_type: string;
  question_ar: string;
  correct_answer: string;
  options: string[] | null;
  hint: string | null;
  image_url: string | null;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminQuestionListResponse {
  items: AdminQuestion[];
  total: number;
  skip: number;
  limit: number;
}

export interface AdminQuestionCreatePayload {
  category: string;
  difficulty: string;
  question_type: string;
  question_ar: string;
  correct_answer: string;
  options?: string[] | null;
  hint?: string | null;
  image_url?: string | null;
  tags?: string[] | null;
  is_active?: boolean;
}

export type AdminQuestionUpdatePayload = Partial<AdminQuestionCreatePayload>;
