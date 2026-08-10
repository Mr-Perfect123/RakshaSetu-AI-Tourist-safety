import React from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React ErrorBoundary caught an exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/30">
              <AlertOctagon className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">Something Went Wrong</h2>
              <p className="text-xs text-slate-400">
                RakshaSetu encountered a temporary rendering exception. Your location & safety state remain protected.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-950 text-red-400 font-mono text-[11px] text-left border border-slate-800 overflow-x-auto">
                {this.state.error.toString()}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={this.handleReset}
                className="py-3 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Retry Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="py-3 rounded-xl bg-[#0D47A1] hover:bg-blue-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Home className="w-4 h-4" /> Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
