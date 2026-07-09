import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Error Boundary Caught]', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-accounting-paper flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border-2 border-accounting-red p-8 rounded-sm shadow-lg text-center perforated-top perforated-bottom">
            <AlertOctagon className="w-12 h-12 text-accounting-red mx-auto mb-4" />
            <h1 className="font-serif text-xl font-bold text-accounting-indigo mb-2">
              Inconsistencia de Renderizado
            </h1>
            <p className="text-xs text-accounting-graphite font-sans leading-relaxed mb-6">
              El sistema ha detectado una inconsistencia crítica en el libro de cuentas digital. Por favor recargue la aplicación.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="
                px-4 py-2 bg-accounting-indigo text-accounting-paper text-xs font-mono font-bold rounded-sm
                hover:bg-accounting-indigo/90 focus:outline-none transition-colors
              "
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
