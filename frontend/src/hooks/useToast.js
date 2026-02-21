import * as React from 'react';
import { toast as shadcnToast } from '../components/ui/use-toast';

export const useToast = () => {
    const success = React.useCallback((message, title = 'Success') => {
        shadcnToast({
            title,
            description: message,
            variant: 'success',
            duration: 3000,
        });
    }, []);

    const error = React.useCallback((message, title = 'Error') => {
        shadcnToast({
            title,
            description: message,
            variant: 'error',
            duration: 5000,
        });
    }, []);

    const warning = React.useCallback((message, title = 'Warning') => {
        shadcnToast({
            title,
            description: message,
            variant: 'warning',
            duration: 4000,
        });
    }, []);

    const info = React.useCallback((message, title = 'Info') => {
        shadcnToast({
            title,
            description: message,
            variant: 'info',
            duration: 3000,
        });
    }, []);

    return React.useMemo(() => ({
        success,
        error,
        warning,
        info,
        toast: shadcnToast
    }), [success, error, warning, info]);
};
