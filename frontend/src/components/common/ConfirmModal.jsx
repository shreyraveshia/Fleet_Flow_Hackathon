import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { AlertCircle, AlertTriangle, Info, HelpCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { cn } from '../../lib/utils';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false
}) {
    const icons = {
        danger: <AlertCircle className="h-10 w-10 text-red-500 mb-4" />,
        primary: <HelpCircle className="h-10 w-10 text-blue-500 mb-4" />,
        warning: <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />,
        info: <Info className="h-10 w-10 text-blue-500 mb-4" />,
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
            <DialogContent className="max-w-md p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <div className="flex flex-col items-center text-center">
                    {icons[variant] || icons.danger}

                    <DialogHeader className="items-center">
                        <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 mt-2">
                            {message}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <DialogFooter className="mt-8 flex gap-3 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 sm:flex-none"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'destructive' : 'default'}
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 sm:flex-none min-w-[100px]"
                    >
                        {isLoading ? <LoadingSpinner size="sm" color="white" /> : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
