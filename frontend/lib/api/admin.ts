import { get, post, patch } from './client';
import type {
  AdminQuestion,
  AdminQuestionCreatePayload,
  AdminQuestionListResponse,
  AdminQuestionUpdatePayload,
} from '@/types/admin';

export async function getAdminSession(token: string): Promise<{ is_admin: boolean }> {
  return get('/api/admin/session', token);
}

export async function listAdminQuestions(
  token: string,
  params?: {
    category?: string;
    difficulty?: string;
    question_type?: string;
    is_active?: boolean;
    search?: string;
    skip?: number;
    limit?: number;
  }
): Promise<AdminQuestionListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set('category', params.category);
  if (params?.difficulty) searchParams.set('difficulty', params.difficulty);
  if (params?.question_type) searchParams.set('question_type', params.question_type);
  if (params?.is_active !== undefined) searchParams.set('is_active', String(params.is_active));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  return get(`/api/admin/questions${query ? `?${query}` : ''}`, token);
}

export async function createAdminQuestion(
  token: string,
  payload: AdminQuestionCreatePayload
): Promise<AdminQuestion> {
  return post('/api/admin/questions', payload, token);
}

export async function updateAdminQuestion(
  token: string,
  questionId: string,
  payload: AdminQuestionUpdatePayload
): Promise<AdminQuestion> {
  return patch(`/api/admin/questions/${questionId}`, payload, token);
}

export async function setAdminQuestionActivation(
  token: string,
  questionId: string,
  is_active: boolean
): Promise<AdminQuestion> {
  return post(`/api/admin/questions/${questionId}/activation`, { is_active }, token);
}
