import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
                    <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-500">
                        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 mb-2">
                            <AlertCircle className="h-10 w-10" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Something went wrong</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                An unexpected error occurred in the application. We've logged the incident and are looking into it.
                            </p>
                        </div>

                        {process.env.NODE_ENV === 'development' && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-left overflow-auto max-h-40">
                                <code className="text-[10px] text-red-500 font-mono break-all">
                                    {this.state.error?.toString()}
                                </code>
                            </div>
                        )}

                        <Button
                            onClick={this.handleReload}
                            className="w-full bg-slate-900 dark:bg-blue-600 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 h-12 rounded-xl text-white font-bold"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Reload Application
                        </Button>

                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                            FleetFlow v1.0.0
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
