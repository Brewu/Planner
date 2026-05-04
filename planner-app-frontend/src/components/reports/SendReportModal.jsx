import React, { useState, useEffect } from 'react';
import { useReports } from '../../contexts/ReportContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { XMarkIcon, EnvelopeIcon, ChevronDownIcon, UsersIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SendReportModal = ({ boardId, boardName, reportTitle, pdfFile, onClose, onSent }) => {
    const { sendReport, sending } = useReports();
    const { user } = useAuth();
    
    const [recipients, setRecipients] = useState([]);
    const [loadingRecipients, setLoadingRecipients] = useState(true);
    
    // To, CC, BCC selections
    const [selectedTo, setSelectedTo] = useState([]);
    const [selectedCc, setSelectedCc] = useState([]);
    const [selectedBcc, setSelectedBcc] = useState([]);
    
    const [message, setMessage] = useState('');
    const [searchTo, setSearchTo] = useState('');
    const [searchCc, setSearchCc] = useState('');
    const [searchBcc, setSearchBcc] = useState('');
    const [showToDropdown, setShowToDropdown] = useState(false);
    const [showCcDropdown, setShowCcDropdown] = useState(false);
    const [showBccDropdown, setShowBccDropdown] = useState(false);

    useEffect(() => {
        fetchRecipients();
    }, [user?.id]);

    const fetchRecipients = async () => {
        try {
            setLoadingRecipients(true);
            // Use the correct endpoint - either /api/recipients or /api/recipients/user/{userId}/recipients
            const response = await api.get(`/recipients`);
            setRecipients(response.data || []);
        } catch (error) {
            console.error('Error fetching recipients:', error);
            toast.error('Failed to load recipients');
            // If the above fails, try the alternative endpoint
            try {
                const altResponse = await api.get(`/recipients/user/${user?.id}/recipients`);
                setRecipients(altResponse.data || []);
            } catch (altError) {
                console.error('Alternative endpoint also failed:', altError);
            }
        } finally {
            setLoadingRecipients(false);
        }
    };

    const getFilteredRecipients = (type, searchTerm) => {
        const available = recipients.filter(r => r.type === type);
        const selectedIds = [...selectedTo, ...selectedCc, ...selectedBcc].map(s => s.id);
        return available
            .filter(r => !selectedIds.includes(r.id))
            .filter(r => 
                r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
    };

    const handleAddRecipient = (type, recipient) => {
        switch(type) {
            case 'TO':
                setSelectedTo([...selectedTo, recipient]);
                setSearchTo('');
                setShowToDropdown(false);
                break;
            case 'CC':
                setSelectedCc([...selectedCc, recipient]);
                setSearchCc('');
                setShowCcDropdown(false);
                break;
            case 'BCC':
                setSelectedBcc([...selectedBcc, recipient]);
                setSearchBcc('');
                setShowBccDropdown(false);
                break;
        }
    };

    const handleRemoveRecipient = (type, recipientId) => {
        switch(type) {
            case 'TO':
                setSelectedTo(selectedTo.filter(r => r.id !== recipientId));
                break;
            case 'CC':
                setSelectedCc(selectedCc.filter(r => r.id !== recipientId));
                break;
            case 'BCC':
                setSelectedBcc(selectedBcc.filter(r => r.id !== recipientId));
                break;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedTo.length === 0) {
            toast.error('Please select at least one TO recipient');
            return;
        }

        if (!pdfFile) {
            toast.error('No PDF file found. Please go back and try again.');
            return;
        }

        // Get emails for each type
        const toEmails = selectedTo.map(r => r.email);
        const ccEmails = selectedCc.map(r => r.email);
        const bccEmails = selectedBcc.map(r => r.email);

        const result = await sendReport(boardId, {
            toEmail: toEmails[0], // First TO recipient as primary
            additionalMessage: message,
            pdfFile,
            reportTitle,
            ccEmails,
            bccEmails,
        });

        if (result?.success) {
            onSent?.();
            onClose();
        }
    };

    const inputClass = "block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const helpTextClass = "mt-1 text-xs text-gray-500";

    if (loadingRecipients) {
        return (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading recipients...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white z-10">
                    <div className="flex items-center space-x-2">
                        <EnvelopeIcon className="h-5 w-5 text-green-700" />
                        <h3 className="text-base font-semibold text-gray-900">
                            Send Report — {boardName}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                    {/* Report title */}
                    {reportTitle && (
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-500">
                            <span className="font-medium text-gray-700">Subject: </span>
                            <span className="font-mono text-green-700">{reportTitle}</span>
                        </div>
                    )}

                    {/* No recipients message */}
                    {recipients.length === 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                    <UsersIcon className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-yellow-800">No recipients added yet</p>
                                    <p className="text-xs text-yellow-700 mt-1">
                                        Please go to your Profile → Recipients tab to add email recipients for reports.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TO Recipients */}
                    <div>
                        <label className={labelClass}>
                            TO <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md bg-white min-h-[42px]">
                                {selectedTo.map(recipient => (
                                    <span key={recipient.id} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                        {recipient.name}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRecipient('TO', recipient.id)}
                                            className="hover:text-blue-600"
                                        >
                                            <XMarkIcon className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    value={searchTo}
                                    onChange={(e) => {
                                        setSearchTo(e.target.value);
                                        setShowToDropdown(true);
                                    }}
                                    onFocus={() => setShowToDropdown(true)}
                                    placeholder={selectedTo.length === 0 ? "Search recipients..." : ""}
                                    className="flex-1 outline-none text-sm min-w-[120px]"
                                    disabled={recipients.length === 0}
                                />
                            </div>
                            {showToDropdown && getFilteredRecipients('TO', searchTo).length > 0 && (
                                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    {getFilteredRecipients('TO', searchTo).map(r => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => handleAddRecipient('TO', r)}
                                            className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b last:border-b-0"
                                        >
                                            <p className="text-sm font-medium text-gray-900">{r.name}</p>
                                            <p className="text-xs text-gray-500">{r.email}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className={helpTextClass}>Main recipients who will receive the report</p>
                    </div>

                    {/* CC Recipients */}
                    <div>
                        <label className={labelClass}>CC <span className="text-gray-400 font-normal">(optional)</span></label>
                        <div className="relative">
                            <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md bg-white min-h-[42px]">
                                {selectedCc.map(recipient => (
                                    <span key={recipient.id} className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                        {recipient.name}
                                        <button type="button" onClick={() => handleRemoveRecipient('CC', recipient.id)} className="hover:text-green-600">
                                            <XMarkIcon className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    value={searchCc}
                                    onChange={(e) => {
                                        setSearchCc(e.target.value);
                                        setShowCcDropdown(true);
                                    }}
                                    onFocus={() => setShowCcDropdown(true)}
                                    placeholder="Search recipients..."
                                    className="flex-1 outline-none text-sm min-w-[120px]"
                                    disabled={recipients.length === 0}
                                />
                            </div>
                            {showCcDropdown && getFilteredRecipients('CC', searchCc).length > 0 && (
                                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    {getFilteredRecipients('CC', searchCc).map(r => (
                                        <button key={r.id} type="button" onClick={() => handleAddRecipient('CC', r)} className="w-full text-left px-4 py-2 hover:bg-green-50 border-b last:border-b-0">
                                            <p className="text-sm font-medium text-gray-900">{r.name}</p>
                                            <p className="text-xs text-gray-500">{r.email}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className={helpTextClass}>Copy recipients - visible to everyone</p>
                    </div>

                    {/* BCC Recipients */}
                    <div>
                        <label className={labelClass}>BCC <span className="text-gray-400 font-normal">(optional)</span></label>
                        <div className="relative">
                            <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md bg-white min-h-[42px]">
                                {selectedBcc.map(recipient => (
                                    <span key={recipient.id} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                                        {recipient.name}
                                        <button type="button" onClick={() => handleRemoveRecipient('BCC', recipient.id)} className="hover:text-purple-600">
                                            <XMarkIcon className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    value={searchBcc}
                                    onChange={(e) => {
                                        setSearchBcc(e.target.value);
                                        setShowBccDropdown(true);
                                    }}
                                    onFocus={() => setShowBccDropdown(true)}
                                    placeholder="Search recipients..."
                                    className="flex-1 outline-none text-sm min-w-[120px]"
                                    disabled={recipients.length === 0}
                                />
                            </div>
                            {showBccDropdown && getFilteredRecipients('BCC', searchBcc).length > 0 && (
                                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    {getFilteredRecipients('BCC', searchBcc).map(r => (
                                        <button key={r.id} type="button" onClick={() => handleAddRecipient('BCC', r)} className="w-full text-left px-4 py-2 hover:bg-purple-50 border-b last:border-b-0">
                                            <p className="text-sm font-medium text-gray-900">{r.name}</p>
                                            <p className="text-xs text-gray-500">{r.email}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className={helpTextClass}>Hidden recipients - others won't see them</p>
                    </div>

                    {/* Additional Message */}
                    <div>
                        <label className={labelClass}>Additional Message <span className="text-gray-400 font-normal">(optional)</span></label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                            className={inputClass}
                            placeholder="Add a personal note to your report..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={selectedTo.length === 0 || sending || recipients.length === 0} 
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-700 hover:bg-green-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending ? 'Sending...' : 'Send Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SendReportModal;