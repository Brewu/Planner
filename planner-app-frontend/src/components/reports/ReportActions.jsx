import React, { useState } from 'react';
import { useReports } from '../../contexts/ReportContext';
import { useAuth } from '../../contexts/AuthContext';  // Add this import
import { DocumentArrowDownIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import SendReportModal from './SendReportModal';
import ReportEditorModal from './ReportEditorModal';

const ReportActions = ({ boardId, tasks, boardName, recipients, onReportGenerated, board, statistics, currentUserName }) => {
    const { generateReport, loading } = useReports();
    const { user } = useAuth();  // Add this line to get user data
    const [showEditorModal, setShowEditorModal] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [editedPdfFile, setEditedPdfFile] = useState(null);
    const [reportTitle, setReportTitle] = useState('');

    const handleGenerateReport = async () => {
        const result = await generateReport(boardId);
        if (result.success && onReportGenerated) onReportGenerated();
    };

    const handleEditorDone = (pdfFile, reportTitle) => {
        setEditedPdfFile(pdfFile);
        setReportTitle(reportTitle);
        setShowEditorModal(false);
        setShowSendModal(true);
    };

    const emailRecipients = (recipients ?? []).filter(r => r.email);

    return (
        <>
            <div className="flex space-x-2">
                <button onClick={handleGenerateReport} disabled={loading} className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    {loading ? 'Generating...' : 'Download Report'}
                </button>
                {emailRecipients.length > 0 && (
                    <button onClick={() => setShowEditorModal(true)} className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        <EnvelopeIcon className="h-4 w-4 mr-2" />
                        Send Report
                    </button>
                )}
            </div>

            {showEditorModal && (
                <ReportEditorModal
                    isOpen={showEditorModal}
                    onClose={() => setShowEditorModal(false)}
                    onSendClick={handleEditorDone}
                    board={board}
                    tasks={tasks}
                    statistics={statistics}
                    currentUserName={currentUserName || 'Unknown'}
                    userRank={user?.position || user?.rank || 'Staff'}
                />
            )}

            {showSendModal && (
                <SendReportModal
                    boardId={boardId}
                    boardName={boardName}
                    recipients={emailRecipients}
                    pdfFile={editedPdfFile}
                    reportTitle={reportTitle}
                    onClose={() => setShowSendModal(false)}
                    onSent={onReportGenerated}
                />
            )}
        </>
    );
};

export default ReportActions;