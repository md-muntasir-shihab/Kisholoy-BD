import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  moduleName?: string;
  isBn?: boolean;
  onRetry?: () => void;
  currentPath?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorDetails = {
      path: this.props.currentPath || (typeof window !== 'undefined' ? window.location.pathname : 'unknown'),
      moduleName: this.props.moduleName || 'Admin Sub-Page',
      errorMessage: error.message,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    };

    console.error('🚨 [Admin Sub-Page Navigation Error caught by Boundary]:', errorDetails);
    this.setState({ errorInfo });
  }

  public componentDidUpdate(prevProps: Props) {
    // Automatically reset error boundary if the user navigated to a different sub-route
    if (prevProps.currentPath && this.props.currentPath && prevProps.currentPath !== this.props.currentPath && this.state.hasError) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  private handleRetry = () => {
    console.info(`🔄 [Admin Sub-Page] User triggered retry for module: ${this.props.moduleName || 'Sub-page'}`);
    
    if (this.props.onRetry) {
      this.props.onRetry();
    }

    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  private handleHardReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      const isBn = this.props.isBn;
      const moduleName = this.props.moduleName || (isBn ? 'অ্যাডমিন সাব-পেজ' : 'Admin Sub-Page');

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 mb-2">
                {moduleName}
              </span>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white font-serif">
                {this.props.fallbackTitle || (isBn ? `${moduleName} লোড করতে ত্রুটি হয়েছে` : `Failed to load ${moduleName}`)}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                {isBn
                  ? 'এই সাব-পেজটির কম্পোনেন্ট বা ডেটা লোড করার সময় একটি ত্রুটি ধরা পড়েছে। পুনরায় চেষ্টা করুন অথবা ড্যাশবোর্ডে ফিরে যান।'
                  : 'A runtime error occurred while loading this specific sub-page. Click Retry to attempt reloading this module.'}
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 text-left font-mono text-[11px] text-rose-600 dark:text-rose-400 max-h-28 overflow-y-auto break-all">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 active:scale-[0.98] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isBn ? 'পুনরায় চেষ্টা করুন (Retry)' : 'Retry'}</span>
              </button>
              <a
                href="/admin"
                className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 text-xs font-semibold shadow-2xs flex items-center justify-center gap-2 transition-colors text-center"
              >
                <Home className="w-3.5 h-3.5" />
                <span>{isBn ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

