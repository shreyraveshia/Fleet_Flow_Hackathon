import { useState } from 'react';
import { useToast } from './useToast';

export const useDownload = () => {
    const [isDownloading, setIsDownloading] = useState(false);
    const { error } = useToast();

    const downloadFile = (blob, filename) => {
        try {
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
            error('Failed to download file');
        }
    };

    const downloadCSV = async (apiCall, filename) => {
        setIsDownloading(true);
        try {
            const response = await apiCall();
            downloadFile(response, filename);
        } catch (err) {
            error(err.message || 'Failed to download CSV');
        } finally {
            setIsDownloading(false);
        }
    };

    const downloadPDF = async (apiCall, filename) => {
        setIsDownloading(true);
        try {
            const response = await apiCall();
            downloadFile(response, filename);
        } catch (err) {
            error(err.message || 'Failed to download PDF');
        } finally {
            setIsDownloading(false);
        }
    };

    return { downloadCSV, downloadPDF, isDownloading };
};
