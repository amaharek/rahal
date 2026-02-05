/**
 * TDD Tests for QuestionCard Component
 * 
 * This component displays a quiz question with its number, category, difficulty,
 * and question text. It should support both Arabic and English, with proper RTL handling.
 * 
 * Tests use data-testid and semantic queries to be locale-agnostic.
 * EXPECTED TO FAIL - Component not yet implemented
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import QuestionCard from '@/components/quiz/QuestionCard'

describe('QuestionCard', () => {
  const mockQuestion = {
    id: '123',
    question_key: 'quiz.questions.egypt_capital',
    category: 'capitals',
    difficulty: 'easy' as const,
    question_type: 'multiple_choice' as const,
    points: 10,
  }

  it('should render question number and total', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        currentQuestion={1}
        totalQuestions={10}
        locale="ar"
      />
    )

    // Use data-testid for stable element selection
    expect(screen.getByTestId('question-number')).toHaveTextContent(/1/)
    expect(screen.getByTestId('total-questions')).toHaveTextContent(/10/)
  })

  it('should display question text with RTL for Arabic', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        currentQuestion={1}
        totalQuestions={10}
        locale="ar"
      />
    )

    const questionText = screen.getByTestId('question-text')
    expect(questionText).toBeInTheDocument()
    expect(questionText).toHaveAttribute('dir', 'rtl')
  })

  it('should display question text with LTR for English', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        currentQuestion={1}
        totalQuestions={10}
        locale="en"
      />
    )

    const questionText = screen.getByTestId('question-text')
    expect(questionText).toBeInTheDocument()
    expect(questionText).toHaveAttribute('dir', 'ltr')
  })

  it('should display category badge', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        currentQuestion={1}
        totalQuestions={10}
        locale="ar"
      />
    )

    // Use data-testid for category
    const categoryBadge = screen.getByTestId('question-category')
    expect(categoryBadge).toBeInTheDocument()
    expect(categoryBadge).toHaveTextContent('capitals')
  })

  it('should display difficulty indicator', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        currentQuestion={1}
        totalQuestions={10}
        locale="ar"
      />
    )

    // Use data-testid for difficulty
    const difficultyBadge = screen.getByTestId('question-difficulty')
    expect(difficultyBadge).toBeInTheDocument()
    expect(difficultyBadge).toHaveAttribute('data-difficulty', 'easy')
  })

  it('should show correct difficulty color', () => {
    const { rerender } = render(
      <QuestionCard
        question={{ ...mockQuestion, difficulty: 'easy' }}
        currentQuestion={1}
        totalQuestions={10}
        locale="ar"
      />stId('question-difficulty')
    expect(badge).toHaveAttribute('data-difficulty', 'easy')
    expect(badge).toHaveClass(/green|success|easy/)

    rerender(
      <QuestionCard
        question={{ ...mockQuestion, difficulty: 'medium' }}
        currentQuestion={1}
        totalQuestions={10}
        locale="ar"
      />
    )

    badge = screen.getByTestId('question-difficulty')
    expect(badge).toHaveAttribute('data-difficulty', 'medium')
    expect(badge).toHaveClass(/yellow|warning|medium/)

    rerender(
      <QuestionCard
        question={{ ...mockQuestion, difficulty: 'hard' }}
        currentQuestion={1}
        totalQuestions={10}
        locale="ar"
      />
    )

    badge = screen.getByTestId('question-difficulty')
    expect(badge).toHaveAttribute('data-difficulty', 'hard')
    expect(badge).toHaveClass(/red|error|hard/)
  })

  it('should display points value', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        currentQuestion={1}
        totalQuestions={10}
        locale="ar"
      />
    )

    const points = screen.getByTestId('question-points')
    expect(points).toHaveTextContent('10'
    )

    expect(screen.getByText(/10.*points|نقطة/i)).toBeInTheDocument()
  })

  it('should have proper ARIA labels for accessibility', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        currentQuestion={1}
        totalQuestions={10}
        locale="ar"
      />
    )

    const questionCard = screen.getByRole('article')
    expect(questionCard).toHaveAttribute('aria-label', expect.stringContaining('question'))
  })

  it('should support keyboard focus', () => {
    const { container } = render(
      <QuestionCard
        question={mockQuestion}
        currentQuestion={1}
        totalQuestions={10}
        locale="ar"
      />
    )

    const questionCard = container.firstChild as HTMLElement
    expect(questionCard).toHaveAttribute('tabindex', '0')
  })
})
