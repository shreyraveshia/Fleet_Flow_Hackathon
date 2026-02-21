import { useEffect } from 'react';
import { useUIStore } from '../store/uiStore';

export const useDarkMode = () => {
    const { isDarkMode, toggleDarkMode, initDarkMode } = useUIStore();

    useEffect(() => {
        initDarkMode();
    }, [initDarkMode]);

    return {
        isDark: isDarkMode,
        toggle: toggleDarkMode,
        setDark: (value) => {
            if (value !== isDarkMode) toggleDarkMode();
        },
    };
};
