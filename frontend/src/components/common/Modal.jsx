import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '../ui/dialog';
import { cn } from '../../lib/utils';

export default function Modal({
    isOpen,
    onClose,
    title,
    description,
    size = 'md',
    children,
    footer
}) {
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[95vw] h-[95vh]',
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className={cn(
                "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-0 overflow-hidden flex flex-col",
                sizeClasses[size]
            )}>
                <DialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800 text-left">
                    <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription className="text-slate-500 dark:text-slate-400">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                    {children}
                </div>

                {footer && (
                    <DialogFooter className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        {footer}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
