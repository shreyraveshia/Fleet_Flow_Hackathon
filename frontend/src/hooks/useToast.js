import { toast as shadcnToast } from '../components/ui/use-toast';

export const useToast = () => {
    const success = (message, title = 'Success') => {
        shadcnToast({
            title,
            description: message,
            variant: 'success',
            duration: 3000,
        });
    };

    const error = (message, title = 'Error') => {
        shadcnToast({
            title,
            description: message,
            variant: 'error',
            duration: 5000,
        });
    };

    const warning = (message, title = 'Warning') => {
        shadcnToast({
            title,
            description: message,
            variant: 'warning',
            duration: 4000,
        });
    };

    const info = (message, title = 'Info') => {
        shadcnToast({
            title,
            description: message,
            variant: 'info',
            duration: 3000,
        });
    };

    return { success, error, warning, info, toast: shadcnToast };
};
