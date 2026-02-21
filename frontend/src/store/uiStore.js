import { create } from 'zustand';

export const useUIStore = create((set) => ({
    isDarkMode: false,
    sidebarOpen: true,
    activeModal: null,
    modalData: null,

    toggleDarkMode: () => {
        set((state) => {
            const newValue = !state.isDarkMode;
            if (newValue) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('fleetflow-theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('fleetflow-theme', 'light');
            }
            return { isDarkMode: newValue };
        });
    },

    initDarkMode: () => {
        const savedTheme = localStorage.getItem('fleetflow-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
            set({ isDarkMode: true });
        } else {
            document.documentElement.classList.remove('dark');
            set({ isDarkMode: false });
        }
    },

    setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),

    openModal: (name, data = null) => set({ activeModal: name, modalData: data }),

    closeModal: () => set({ activeModal: null, modalData: null }),
}));
