import '@testing-library/jest-dom'
import { cleanup, configure } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Configure testing-library to work with fake timers
configure({
  asyncUtilTimeout: 5000,
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock next-intl - Returns translation keys for locale-agnostic testing
// This prevents tests from breaking when translations change
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, any>) => {
    // Return the translation key instead of translated text
    // This makes tests locale-agnostic and prevents breaking on translation updates
    return key
  },
  useLocale: () => 'ar',
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/ar',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as any

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any
