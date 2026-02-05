/**
 * E2E tests for complete quiz flow
 * Tests the full user journey through a quiz session
 */

import { test, expect } from '@playwright/test';

test.describe('Quiz Flow - Complete Session', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ar/quiz');
  });

  test('should complete a full quiz session with 10 questions', async ({ page }) => {
    // Start quiz session
    await page.click('button:has-text("ابدأ اختبار")'); // Start Quiz

    // Wait for first question to load
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();

    // Verify initial state
    await expect(page.locator('[data-testid="quiz-progress"]')).toContainText('1/10');
    await expect(page.locator('[data-testid="timer"]')).toBeVisible();

    // Answer all 10 questions
    for (let i = 1; i <= 10; i++) {
      // Verify current question number
      await expect(page.locator('[data-testid="quiz-progress"]')).toContainText(`${i}/10`);

      // Select an answer (first option for simplicity)
      const answerOption = page.locator('[data-testid="answer-option"]').first();
      await answerOption.click();

      // Submit answer
      await page.click('button:has-text("تأكيد")'); // Confirm

      // Wait for feedback
      await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible();

      // Continue to next question (unless it's the last one)
      if (i < 10) {
        await page.click('button:has-text("التالي")'); // Next
      }
    }

    // Verify quiz completion
    await expect(page.locator('[data-testid="quiz-complete"]')).toBeVisible();
    await expect(page.locator('[data-testid="final-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="quiz-summary"]')).toBeVisible();
  });

  test('should display timer and countdown during quiz', async ({ page }) => {
    await page.click('button:has-text("ابدأ اختبار")');
    
    // Timer should be visible
    const timer = page.locator('[data-testid="timer"]');
    await expect(timer).toBeVisible();

    // Get initial time
    const initialTime = await timer.textContent();
    
    // Wait 2 seconds
    await page.waitForTimeout(2000);
    
    // Time should have decreased
    const currentTime = await timer.textContent();
    expect(currentTime).not.toBe(initialTime);

    // Timer should be in format MM:SS
    expect(currentTime).toMatch(/\d{1,2}:\d{2}/);
  });

  test('should calculate and display score correctly', async ({ page }) => {
    await page.click('button:has-text("ابدأ اختبار")');
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();

    // Answer first question correctly (assuming first option is correct)
    await page.locator('[data-testid="answer-option"]').first().click();
    await page.click('button:has-text("تأكيد")');

    // Check score feedback
    const feedback = page.locator('[data-testid="answer-feedback"]');
    await expect(feedback).toBeVisible();
    
    // Should show points earned
    await expect(page.locator('[data-testid="points-earned"]')).toBeVisible();
    
    // Total score should be updated
    const scoreElement = page.locator('[data-testid="current-score"]');
    await expect(scoreElement).toBeVisible();
    const score = await scoreElement.textContent();
    expect(parseInt(score || '0')).toBeGreaterThan(0);
  });

  test('should allow skipping questions', async ({ page }) => {
    await page.click('button:has-text("ابدأ اختبار")');
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();

    // Question 1
    await expect(page.locator('[data-testid="quiz-progress"]')).toContainText('1/10');

    // Skip button should be visible
    const skipButton = page.locator('button:has-text("تخطي")');
    await expect(skipButton).toBeVisible();

    // Skip question
    await skipButton.click();

    // Should move to question 2
    await expect(page.locator('[data-testid="quiz-progress"]')).toContainText('2/10');
    
    // Skipped questions should count as incorrect
    await expect(page.locator('[data-testid="quiz-progress"]')).toBeVisible();
  });

  test('should handle quiz timeout', async ({ page }) => {
    // Mock very short time limit for testing
    await page.route('**/api/quiz/session', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      json.time_limit_seconds = 3; // 3 seconds for testing
      await route.fulfill({ json });
    });

    await page.click('button:has-text("ابدأ اختبار")');
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();

    // Wait for timeout
    await page.waitForTimeout(4000);

    // Should show timeout message
    await expect(page.locator('[data-testid="quiz-timeout"]')).toBeVisible();
    await expect(page.locator('text=انتهى الوقت')).toBeVisible(); // Time's up
  });

  test('should show progress bar updating', async ({ page }) => {
    await page.click('button:has-text("ابدأ اختبار")');
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();

    // Check initial progress (10%)
    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toHaveAttribute('aria-valuenow', '10');

    // Answer and move to next
    await page.locator('[data-testid="answer-option"]').first().click();
    await page.click('button:has-text("تأكيد")');
    await page.click('button:has-text("التالي")');

    // Progress should update (20%)
    await expect(progressBar).toHaveAttribute('aria-valuenow', '20');
  });

  test('should display question categories', async ({ page }) => {
    await page.click('button:has-text("ابدأ اختبار")');
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();

    // Category badge should be visible
    const categoryBadge = page.locator('[data-testid="question-category"]');
    await expect(categoryBadge).toBeVisible();

    // Should contain valid category
    const category = await categoryBadge.textContent();
    expect(['العواصم', 'الأعلام', 'الجغرافيا', 'المعالم', 'الحدود']).toContain(category);
  });

  test('should display difficulty indicator', async ({ page }) => {
    await page.click('button:has-text("ابدأ اختبار")');
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();

    // Difficulty indicator should be visible
    const difficultyBadge = page.locator('[data-testid="question-difficulty"]');
    await expect(difficultyBadge).toBeVisible();

    // Should contain valid difficulty
    const difficulty = await difficultyBadge.textContent();
    expect(['سهل', 'متوسط', 'صعب']).toContain(difficulty);
  });

  test('should show correct/incorrect feedback with explanations', async ({ page }) => {
    await page.click('button:has-text("ابدأ اختبار")');
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();

    // Select answer
    await page.locator('[data-testid="answer-option"]').first().click();
    await page.click('button:has-text("تأكيد")');

    // Feedback should appear
    const feedback = page.locator('[data-testid="answer-feedback"]');
    await expect(feedback).toBeVisible();

    // Should show correct answer
    await expect(page.locator('[data-testid="correct-answer"]')).toBeVisible();

    // Should show explanation (if available)
    const explanation = page.locator('[data-testid="answer-explanation"]');
    if (await explanation.isVisible()) {
      expect(await explanation.textContent()).not.toBe('');
    }
  });

  test('should allow reviewing answers at end', async ({ page }) => {
    // Mock shorter quiz for faster test
    await page.route('**/api/quiz/session', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      json.questions = json.questions.slice(0, 3); // Only 3 questions
      json.total_questions = 3;
      await route.fulfill({ json });
    });

    await page.click('button:has-text("ابدأ اختبار")');

    // Answer all 3 questions quickly
    for (let i = 0; i < 3; i++) {
      await expect(page.locator('[data-testid="question-card"]')).toBeVisible();
      await page.locator('[data-testid="answer-option"]').first().click();
      await page.click('button:has-text("تأكيد")');
      if (i < 2) {
        await page.click('button:has-text("التالي")');
      }
    }

    // Should show review button
    await expect(page.locator('button:has-text("مراجعة الإجابات")')).toBeVisible();
    await page.click('button:has-text("مراجعة الإجابات")');

    // Review screen should show all questions
    await expect(page.locator('[data-testid="quiz-review"]')).toBeVisible();
    
    // Should show 3 reviewed questions
    const reviewItems = page.locator('[data-testid="review-item"]');
    await expect(reviewItems).toHaveCount(3);
  });
});

test.describe('Quiz Flow - Question Types', () => {
  test('should handle multiple choice questions', async ({ page }) => {
    await page.goto('/ar/quiz');
    
    // Start quiz with multiple choice filter
    await page.click('button:has-text("اختر نوع السؤال")');
    await page.click('text=اختيار من متعدد');
    await page.click('button:has-text("ابدأ اختبار")');

    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();

    // Should show 4 options
    const options = page.locator('[data-testid="answer-option"]');
    await expect(options).toHaveCount(4);

    // Each option should have text
    for (let i = 0; i < 4; i++) {
      const option = options.nth(i);
      expect(await option.textContent()).not.toBe('');
    }
  });

  test('should handle autocomplete questions', async ({ page }) => {
    await page.goto('/ar/quiz');
    
    // Start quiz with autocomplete filter
    await page.click('button:has-text("اختر نوع السؤال")');
    await page.click('text=إكمال تلقائي');
    await page.click('button:has-text("ابدأ اختبار")');

    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();

    // Should show autocomplete input
    const autocompleteInput = page.locator('[data-testid="autocomplete-input"]');
    await expect(autocompleteInput).toBeVisible();

    // Should accept text input
    await autocompleteInput.fill('مصر');
    expect(await autocompleteInput.inputValue()).toBe('مصر');

    // Should show suggestions
    await expect(page.locator('[data-testid="autocomplete-suggestions"]')).toBeVisible();
  });
});

test.describe('Quiz Flow - Score Calculation', () => {
  test('should reduce score for hints used', async ({ page }) => {
    await page.goto('/ar/quiz');
    await page.click('button:has-text("ابدأ اختبار")');
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();

    // Use hint
    await page.click('button:has-text("تلميح")'); // Hint
    await expect(page.locator('[data-testid="hint-content"]')).toBeVisible();

    // Answer correctly
    await page.locator('[data-testid="answer-option"]').first().click();
    await page.click('button:has-text("تأكيد")');

    // Score should be reduced (indicated in feedback)
    const feedback = page.locator('[data-testid="answer-feedback"]');
    await expect(feedback).toContainText('نقاط'); // Points
    
    // Should show hint penalty
    const pointsText = await page.locator('[data-testid="points-earned"]').textContent();
    expect(pointsText).toContain('-3'); // Hint penalty
  });

  test('should show final score breakdown', async ({ page }) => {
    // Mock shorter quiz
    await page.route('**/api/quiz/session', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      json.questions = json.questions.slice(0, 2);
      json.total_questions = 2;
      await route.fulfill({ json });
    });

    await page.goto('/ar/quiz');
    await page.click('button:has-text("ابدأ اختبار")');

    // Complete quiz
    for (let i = 0; i < 2; i++) {
      await page.locator('[data-testid="answer-option"]').first().click();
      await page.click('button:has-text("تأكيد")');
      if (i < 1) {
        await page.click('button:has-text("التالي")');
      }
    }

    // Check final score breakdown
    await expect(page.locator('[data-testid="quiz-complete"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="correct-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="accuracy-percentage"]')).toBeVisible();
  });
});

test.describe('Quiz Flow - Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/ar/quiz');
    await page.click('button:has-text("ابدأ اختبار")');
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();

    // Tab to first option
    await page.keyboard.press('Tab');
    
    // Space to select
    await page.keyboard.press('Space');

    // Tab to confirm button
    await page.keyboard.press('Tab');
    
    // Enter to submit
    await page.keyboard.press('Enter');

    // Should show feedback
    await expect(page.locator('[data-testid="answer-feedback"]')).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/ar/quiz');
    await page.click('button:has-text("ابدأ اختبار")');
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();

    // Progress bar
    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toHaveAttribute('role', 'progressbar');
    await expect(progressBar).toHaveAttribute('aria-label');

    // Timer
    const timer = page.locator('[data-testid="timer"]');
    await expect(timer).toHaveAttribute('aria-label');

    // Answer options
    const options = page.locator('[data-testid="answer-option"]');
    const firstOption = options.first();
    await expect(firstOption).toHaveAttribute('role', 'button');
  });
});
