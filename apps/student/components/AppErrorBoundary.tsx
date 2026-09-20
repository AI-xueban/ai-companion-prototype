import React from 'react';

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AI伴学V2.0] application error', error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
        <section className="max-w-md text-center space-y-5">
          <h1 className="text-2xl font-black">页面暂时无法显示</h1>
          <p className="text-sm leading-6 text-white/60">应用遇到了未处理的异常，请刷新后重试。</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-3 rounded-lg bg-white text-slate-950 text-sm font-bold"
          >
            刷新页面
          </button>
        </section>
      </main>
    );
  }
}
