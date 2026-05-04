import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import { reportAPI } from '../services/reportApi';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const ReportContext = createContext(null);

export const useReports = () => {
    const context = useContext(ReportContext);
    if (!context) {
        throw new Error('useReports must be used within a ReportProvider');
    }
    return context;
};

export const ReportProvider = ({ children }) => {
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    const generateReport = useCallback(async (boardId) => {
        try {
            setLoading(true);
            setError(null);
            await reportAPI.generateBoardReport(boardId);
            toast.success('Report generated successfully!');
            return { success: true };
        } catch (err) {
            console.error('Error generating report:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to generate report';
            setError(errorMsg);
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);
    const sendReport = useCallback(async (boardId, { toEmail, additionalMessage = '', pdfFile, reportTitle, ccEmails = [], bccEmails = [] }) => {
        if (!pdfFile) {
            const msg = 'PDF file is missing';
            toast.error(msg);
            return { success: false, error: msg };
        }

        if (!toEmail) {
            const msg = 'Recipient email is missing';
            toast.error(msg);
            return { success: false, error: msg };
        }

        try {
            setSending(true);
            setError(null);

            const result = await reportAPI.sendBoardReport(boardId, {
                toEmail,
                additionalMessage,
                pdfFile,
                reportTitle,
                ccEmails,    // 👈 add
                bccEmails,   // 👈 add                    

            });

            toast.success(result.message || 'Report sent successfully!');
            return { success: true, data: result };
        } catch (err) {
            console.error('Error sending report:', err);

            let errorMsg = 'Failed to send report';
            if (err.response) {
                errorMsg = err.response.data?.message || err.response.data?.title || `Server error: ${err.response.status}`;
            } else if (err.request) {
                errorMsg = 'No response from server. Please check your connection.';
            } else {
                errorMsg = err.message;
            }

            setError(errorMsg);
            toast.error(errorMsg);
            return { success: false, error: errorMsg }; // ✅ always returns an object
        } finally {
            setSending(false);
        }
    }, []);

    const fetchStatistics = useCallback(async (boardId) => {
        try {
            setLoading(true);
            setError(null);
            const data = await reportAPI.getBoardStatistics(boardId);
            setStatistics(data);
            return { success: true, data };
        } catch (err) {
            console.error('Error fetching statistics:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch statistics';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    const value = useMemo(() => ({
        statistics,
        loading,
        sending,
        error,
        generateReport,
        sendReport,
        fetchStatistics,
    }), [statistics, loading, sending, error, generateReport, sendReport, fetchStatistics]);

    return (
        <ReportContext.Provider value={value}>
            {children}
        </ReportContext.Provider>
    );
};