import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

/**
 * Returns the total number of pending requests the current user needs to act on:
 *   - incoming supervisor requests (someone wants them as their supervisor)
 *   - supervisee invitations (a supervisor invited them to report to them)
 */
const usePendingRequests = () => {
    const { user, isAuthenticated } = useAuth();
    const [pendingCount, setPendingCount] = useState(0);

    const fetchCount = useCallback(async () => {
        if (!isAuthenticated || !user?.id) return;
        try {
            const [inRes, inviteRes] = await Promise.all([
                api.get(`/Supervisors/requests/supervisor-incoming/${user.id}`),
                 api.get(`/Supervisors/requests/supervisee-incoming/${user.id}`)
            ]);
            const total = (inRes.data?.length ?? 0) + (inviteRes.data?.length ?? 0);
            setPendingCount(total);
        } catch {
            // Silently fail — badge just won't show
        }
    }, [user?.id, isAuthenticated]);

    useEffect(() => {
        fetchCount();
        // Re-check every 60 seconds so the badge stays fresh
        const interval = setInterval(fetchCount, 60_000);
        return () => clearInterval(interval);
    }, [fetchCount]);

    return pendingCount;
};

export default usePendingRequests;