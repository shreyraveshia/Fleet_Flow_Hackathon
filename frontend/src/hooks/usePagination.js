import { useState, useCallback } from 'react';

export const usePagination = (initialLimit = 25) => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(initialLimit);

    const nextPage = useCallback(() => setPage((p) => p + 1), []);
    const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
    const reset = useCallback(() => setPage(1), []);

    return {
        page,
        limit,
        nextPage,
        prevPage,
        setPage,
        setLimit,
        reset,
        offset: (page - 1) * limit,
    };
};
