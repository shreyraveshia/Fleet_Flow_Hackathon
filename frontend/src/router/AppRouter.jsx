import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Placeholder — will be replaced by full router in next prompt
function PlaceholderPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-blue-600 mb-2">🚛 FleetFlow</h1>
                <p className="text-slate-500 dark:text-slate-400">Frontend setup complete. Routes coming next.</p>
            </div>
        </div>
    );
}

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="*" element={<PlaceholderPage />} />
            </Routes>
        </BrowserRouter>
    );
}
