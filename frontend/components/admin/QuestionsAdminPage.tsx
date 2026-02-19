'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { useAuthStore } from '@/lib/stores/authStore';
import {
  createAdminQuestion,
  getAdminSession,
  listAdminQuestions,
  setAdminQuestionActivation,
  updateAdminQuestion,
} from '@/lib/api/admin';
import type { AdminQuestion } from '@/types/admin';

export function QuestionsAdminPage() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: 'capitals',
    difficulty: 'easy',
    question_type: 'multiple_choice',
    question_ar: '',
    correct_answer: '',
    options: '',
    hint: '',
  });

  const signInHref = useMemo(() => {
    const next = encodeURIComponent(pathname || `/${locale}/admin/questions`);
    return `/${locale}/auth/sign-in?next=${next}`;
  }, [locale, pathname]);

  const adminSession = useQuery({
    queryKey: ['admin-session'],
    queryFn: () => getAdminSession(accessToken!),
    enabled: Boolean(accessToken),
    retry: false,
  });

  const questionsQuery = useQuery({
    queryKey: ['admin-questions', search],
    queryFn: () => listAdminQuestions(accessToken!, { search }),
    enabled: Boolean(accessToken) && adminSession.isSuccess,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminQuestion(accessToken!, {
        ...form,
        options:
          form.question_type === 'multiple_choice'
            ? form.options.split(',').map((o) => o.trim()).filter(Boolean)
            : null,
        hint: form.hint || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      setForm({
        category: 'capitals',
        difficulty: 'easy',
        question_type: 'multiple_choice',
        question_ar: '',
        correct_answer: '',
        options: '',
        hint: '',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (question: AdminQuestion) =>
      updateAdminQuestion(accessToken!, question.id, {
        question_ar: question.question_ar,
        correct_answer: question.correct_answer,
        hint: question.hint,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      setEditingId(null);
    },
  });

  const activationMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setAdminQuestionActivation(accessToken!, id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
    },
  });

  if (!isInitialized) {
    return (
      <main className="max-w-6xl mx-auto p-4">
        <Card><CardContent>{t('common.loading')}</CardContent></Card>
      </main>
    );
  }

  if (!accessToken) {
    return (
      <main className="max-w-6xl mx-auto p-4">
        <Card>
          <CardHeader><CardTitle>{t('admin.title')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p>{t('admin.signInRequired')}</p>
            <Link href={signInHref}><Button>{t('auth.signIn')}</Button></Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (adminSession.isError) {
    return (
      <main className="max-w-6xl mx-auto p-4">
        <Card><CardContent className="text-error">{t('admin.forbidden')}</CardContent></Card>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader><CardTitle>{t('admin.title')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.search')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input value={form.question_ar} onChange={(e) => setForm((p) => ({ ...p, question_ar: e.target.value }))} placeholder={t('admin.questionAr')} />
            <Input value={form.correct_answer} onChange={(e) => setForm((p) => ({ ...p, correct_answer: e.target.value }))} placeholder={t('admin.correctAnswer')} />
            <Input value={form.options} onChange={(e) => setForm((p) => ({ ...p, options: e.target.value }))} placeholder={t('admin.optionsCsv')} />
            <Input value={form.hint} onChange={(e) => setForm((p) => ({ ...p, hint: e.target.value }))} placeholder={t('admin.hint')} />
          </div>
          <Button onClick={() => createMutation.mutate()} isLoading={createMutation.isPending}>{t('admin.create')}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t('admin.questions')}</CardTitle></CardHeader>
        <CardContent>
          {questionsQuery.isLoading ? (
            <p>{t('common.loading')}</p>
          ) : (
            <div className="space-y-2">
              {(questionsQuery.data?.items || []).map((question) => (
                <div key={question.id} className="border border-border rounded p-3 space-y-2">
                  <div className="text-xs text-text-secondary">{question.category} • {question.difficulty} • {question.question_type}</div>
                  <Input
                    value={question.question_ar}
                    onFocus={() => setEditingId(question.id)}
                    onChange={(e) => {
                      if (!questionsQuery.data) return;
                      questionsQuery.data.items = questionsQuery.data.items.map((item) =>
                        item.id === question.id ? { ...item, question_ar: e.target.value } : item
                      );
                      queryClient.setQueryData(['admin-questions', search], { ...questionsQuery.data });
                    }}
                  />
                  <Input
                    value={question.correct_answer}
                    onChange={(e) => {
                      if (!questionsQuery.data) return;
                      questionsQuery.data.items = questionsQuery.data.items.map((item) =>
                        item.id === question.id ? { ...item, correct_answer: e.target.value } : item
                      );
                      queryClient.setQueryData(['admin-questions', search], { ...questionsQuery.data });
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => activationMutation.mutate({ id: question.id, isActive: !question.is_active })}
                      isLoading={activationMutation.isPending}
                    >
                      {question.is_active ? t('admin.deactivate') : t('admin.activate')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateMutation.mutate(question)}
                      isLoading={updateMutation.isPending && editingId === question.id}
                    >
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
