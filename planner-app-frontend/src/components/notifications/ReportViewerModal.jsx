import React, { useState } from 'react';
import { XMarkIcon, DocumentArrowDownIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useReports } from '../../contexts/ReportContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ReportViewerModal = ({ report, onClose }) => {
    const navigate = useNavigate();
    const { generateReport } = useReports();
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        setDownloading(true);
        const result = await generateReport(report.boardId);
        if (!result.success) {
            toast.error('Failed to download report');
        }
        setDownloading(false);
    };

    const handleGoToBoard = () => {
        navigate(`/boards/${report.boardId}/tasks`);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 text-xl">📊</span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                            Report Received
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">{report.message}</p>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mt-4">
                        <p className="text-xs text-gray-500 mb-1">Report Name</p>
                        <p className="text-sm font-medium text-gray-900 mb-3 break-all">
                            {report.name}
                        </p>
                        
                        <p className="text-xs text-gray-500 mb-1">What would you like to do?</p>
                        
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <button
                                onClick={handleDownload}
                                disabled={downloading}
                                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                {downloading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Downloading...
                                    </>
                                ) : (
                                    <>
                                        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                        Download Again
                                    </>
                                )}
                            </button>
                            
                            <button
                                onClick={handleGoToBoard}
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <EnvelopeIcon className="h-4 w-4 mr-2" />
                                Go to Board
                            </button>
                        </div>
                    </div>

                    {/* Info Note */}
                    <div className="mt-4 text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
                        <p className="font-medium text-blue-700 mb-1">📌 About this report</p>
                        <p>The report contains complete board statistics and all task details. You can download it again or go to the board to see the latest updates.</p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportViewerModal;