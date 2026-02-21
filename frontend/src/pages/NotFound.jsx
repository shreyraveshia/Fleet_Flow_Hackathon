import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoveLeft, Truck } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative inline-block">
                    <h1 className="text-[150px] font-black text-slate-200 dark:text-slate-900 leading-none">404</h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Truck className="h-20 w-20 text-blue-600 animate-bounce" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Route Lost in Transit</h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        The page you are looking for has been redirected or doesn't exist.
                        Let's get you back to the main hub.
                    </p>
                </div>

                <Button
                    variant="primary"
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 gap-2"
                    onClick={() => navigate('/')}
                >
                    <MoveLeft className="h-4 w-4" />
                    Return to Dashboard
                </Button>
            </div>
        </div>
    );
}
