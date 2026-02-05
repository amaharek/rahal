'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[MapErrorBoundary] Map failed to load:', error);
    console.error('[MapErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="relative w-full aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden border border-border flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-warning mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            تعذر تحميل الخريطة
          </h3>
          <p className="text-sm text-text-secondary mb-4 max-w-xs">
            حدث خطأ أثناء تحميل الخريطة. يمكنك الاستمرار في اللعب بدون الخريطة أو
            المحاولة مرة أخرى.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </Button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 text-xs text-text-secondary text-left w-full max-w-md">
              <summary className="cursor-pointer">تفاصيل الخطأ (للمطورين)</summary>
              <pre className="mt-2 p-2 bg-gray-200 rounded overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
