import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import html2pdf from 'html2pdf.js';
import { useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Date Helpers
// ---------------------------------------------------------------------------

const getWeekStartDate = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - (day === 0 ? 6 : day - 1);
    const monday = new Date(now.setDate(diff));
    return monday;
};

const getWeekEndDate = (startDate) => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return endDate;
};

const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
};

const formatDateRange = (startDate, endDate) => {
    const startDay = startDate.getDate();
    const startMonth = startDate.toLocaleString('en-GB', { month: 'long' });
    const endDay = endDate.getDate();
    const endMonth = endDate.toLocaleString('en-GB', { month: 'long' });
    const year = startDate.getFullYear();
    
    return `${startDay}${getOrdinalSuffix(startDay)} ${startMonth} – ${endDay}${getOrdinalSuffix(endDay)} ${endMonth}, ${year}`;
};

const getWeekStartDateString = () => {
    const startDate = getWeekStartDate();
    const yyyy = startDate.getFullYear();
    const mm = String(startDate.getMonth() + 1).padStart(2, '0');
    const dd = String(startDate.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
};

// ---------------------------------------------------------------------------
// Name Formatting
// ---------------------------------------------------------------------------

const formatReportName = (fullName) => {
    if (!fullName) return 'Unknown';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const surname = parts[parts.length - 1];
    const initials = parts.slice(0, parts.length - 1).map(p => p[0]?.toUpperCase() || '').join('');
    return `${surname}${initials}`;
};

const buildReportTitle = (fullName) =>
    `${formatReportName(fullName)}_WeeklyReport_${getWeekStartDateString()}`;

// ---------------------------------------------------------------------------
// Convert image to base64 (with timeout and CORS handling)
// ---------------------------------------------------------------------------

const loadImageAsBase64 = (imageUrl, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        const timeoutId = setTimeout(() => {
            reject(new Error(`Image load timeout after ${timeout}ms`));
        }, timeout);
        
        img.onload = () => {
            clearTimeout(timeoutId);
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL('image/png');
                resolve(dataURL);
            } catch (err) {
                reject(new Error(`Canvas conversion failed: ${err.message}`));
            }
        };
        
        img.onerror = (err) => {
            clearTimeout(timeoutId);
            reject(new Error(`Failed to load image: ${imageUrl}`));
        };
        
        img.src = imageUrl;
    });
};

// SVG logo as fallback (embedded, no external dependency)
const getKnustLogoSVG = () => {
    return `data:image/svg+xml;base64,${btoa(`
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <style>
                    .knust-gold { fill: #D4AF37; }
                    .knust-green { fill: #006400; }
                </style>
            </defs>
            <circle cx="50" cy="50" r="48" class="knust-gold" stroke="#006400" stroke-width="2"/>
            <circle cx="50" cy="50" r="42" class="knust-green"/>
            <text x="50" y="60" font-family="Georgia, serif" font-size="24" font-weight="bold" fill="#D4AF37" text-anchor="middle">K</text>
        </svg>
    `)}`
};

// ---------------------------------------------------------------------------
// HTML Template
// ---------------------------------------------------------------------------

const buildReportHtml = (board, tasks, statistics, generatedBy, userRank, logoBase64) => {
    const startDate = getWeekStartDate();
    const endDate = getWeekEndDate(startDate);
    const dateRange = formatDateRange(startDate, endDate);
    const displayName = generatedBy || 'Unknown';
    const rank = userRank || 'Staff';
    
    // Use provided logo (always set by the component)
    const logoSrc = logoBase64;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Weekly Report</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Calibri', 'Arial', sans-serif; 
                    padding: 40px; 
                    background: white; 
                    color: #2d3748;
                    line-height: 1.4;
                }
                .header { text-align: center; margin-bottom: 30px; }
                .logo-container { text-align: center; margin-bottom: 15px; }
                .logo { 
                    max-width: 80px; 
                    height: auto; 
                }
                .university-name { 
                    font-size: 22px; 
                    font-weight: bold; 
                    color: #006400; 
                    margin-bottom: 5px;
                }
                .division-name { 
                    font-size: 16px; 
                    font-weight: bold; 
                    color: #006400; 
                    margin-bottom: 3px;
                }
                .report-type { 
                    font-size: 15px; 
                    font-weight: 600; 
                    color: #1e3a5f; 
                    margin-top: 5px;
                }
                .reporting-period { 
                    font-size: 13px; 
                    margin: 20px 0 15px 0; 
                    padding-top: 10px; 
                    border-top: 1px solid #a0aec0;
                }
                .person-reporting { 
                    font-size: 13px; 
                    margin-bottom: 5px;
                }
                .rank { 
                    font-size: 12px; 
                    color: #718096; 
                    margin-left: 40px; 
                    margin-bottom: 20px; 
                    font-style: italic;
                }
                .board-name { 
                    font-size: 16px; 
                    font-weight: bold; 
                    margin: 15px 0 20px 0; 
                    padding-bottom: 10px; 
                    border-bottom: 1px solid #a0aec0;
                }
                .section-title { 
                    font-size: 14px; 
                    font-weight: bold; 
                    color: #006400; 
                    text-transform: uppercase; 
                    margin: 25px 0 12px 0; 
                    padding-bottom: 5px; 
                    border-bottom: 2px solid #006400;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 20px; 
                }
                th { 
                    border: 1px solid #a0aec0; 
                    padding: 10px 12px; 
                    font-size: 12px; 
                    font-weight: bold; 
                    text-align: left; 
                    background-color: #1e3a5f; 
                    color: white; 
                }
                td { 
                    border: 1px solid #a0aec0; 
                    padding: 8px 12px; 
                    font-size: 12px; 
                    vertical-align: top; 
                }
                .stat-table td { text-align: center; padding: 12px 8px; }
                .stat-value { font-size: 24px; font-weight: bold; }
                .status-badge { 
                    display: inline-block; 
                    padding: 2px 8px; 
                    border-radius: 10px; 
                    font-size: 11px; 
                    font-weight: 600; 
                }
                .status-completed { background-color: #c6f6d5; color: #276749; }
                .signature-line { 
                    margin-top: 40px; 
                    padding-top: 20px; 
                    border-top: 1px solid #a0aec0; 
                    font-size: 12px;
                }
                .signature-line div { margin-bottom: 8px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo-container">
                    <img src="${logoSrc}" class="logo" alt="KNUST Logo" />
                </div>
                <div class="university-name">KWAME NKRUMAH UNIVERSITY OF SCIENCE AND TECHNOLOGY</div>
                <div class="division-name">UNIVERSITY INFORMATION TECHNOLOGY SERVICES</div>
                <div class="division-name">Software Development Division</div>
                <div class="report-type">WEEKLY REPORT</div>
            </div>

            <div class="reporting-period">
                <strong>Reporting Period:</strong> ${dateRange}
            </div>

            <div class="person-reporting">
                <strong>NAME OF PERSON REPORTING:</strong> ......${displayName}......
            </div>

            <div class="rank">
                <strong>Rank:</strong> ${rank}
            </div>

            <div class="board-name">
                ${board?.name || 'Planner App'}
            </div>

            <!-- Statistics Section -->
            <div class="section-title">Summary Statistics</div>
            <table class="stat-table">
                <thead>
                    <tr>
                        <th>Total Tasks</th>
                        <th>Completed</th>
                        <th>In Progress</th>
                        <th>Pending</th>
                        <th>Overdue</th>
                        <th>Completion %</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><div class="stat-value">${statistics?.totalTasks ?? 0}</div></td>
                        <td><div class="stat-value" style="color:#276749">${statistics?.completed ?? 0}</div></td>
                        <td><div class="stat-value" style="color:#2a69ac">${statistics?.inProgress ?? 0}</div></td>
                        <td><div class="stat-value" style="color:#975a16">${statistics?.pending ?? 0}</div></td>
                        <td><div class="stat-value">0</div></td>
                        <td><div class="stat-value" style="color:#553c9a">${statistics?.completionPercentage ?? 0}%</div></td>
                    </tr>
                </tbody>
            </table>

            <!-- Task Details Section -->
            <div class="section-title">Task Details</div>
            <table>
                <thead>
                    <tr>
                        <th style="width:5%">No.</th>
                        <th style="width:30%">Task Category</th>
                        <th style="width:65%">Remark</th>
                    </tr>
                </thead>
                <tbody>
                    ${tasks?.length > 0 ? tasks.map((t, i) => `
                        <tr>
                            <td style="text-align:center">${i + 1}</td>
                            <td>
                                <strong>${t.title ?? '—'}</strong>
                                ${t.assignedTo ? `<div style="font-size:11px;color:#718096;margin-top:3px">Assigned to: ${t.assignedTo}</div>` : ''}
                                ${t.dueDate ? `<div style="font-size:11px;color:#718096;margin-top:2px">Due: ${new Date(t.dueDate).toLocaleDateString('en-GB')}</div>` : ''}
                            </td>
                            <td>
                                ${t.description || '(No description)'}
                                ${t.isCompleted ? '<div style="margin-top:8px"><span class="status-badge status-completed">✓ COMPLETED</span></div>' : ''}
                            </td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td colspan="3" style="text-align:center;color:#a0aec0">No tasks found</td>
                        </tr>
                    `}
                </tbody>
            </table>

            <!-- Signature Line -->
            <div class="signature-line">
                <div><strong>Submitted by:</strong> ${displayName}</div>
                <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <div><strong>Signature:</strong> _________________________</div>
            </div>
        </body>
        </html>
    `;
};

// ---------------------------------------------------------------------------
// Toolbar Button
// ---------------------------------------------------------------------------

const ToolbarButton = ({ onClick, active, title, children }) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        className={`px-2 py-1 rounded text-sm border transition-colors ${active
            ? 'bg-green-700 text-white border-green-800'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
        }`}
    >
        {children}
    </button>
);

const Divider = () => <div className="w-px bg-gray-300 mx-1 self-stretch" />;

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const ReportEditorModal = ({ isOpen, onClose, onSendClick, board, tasks, statistics, currentUserName, userRank }) => {
    const editorRef = useRef(null);
    const [logoBase64, setLogoBase64] = useState(null);

    // Load logo when modal opens
    useEffect(() => {
        if (isOpen) {
            setLogoBase64(null);
            
            // Use embedded SVG logo by default (always works)
            // This is reliable and doesn't depend on external URLs
            const svgLogo = getKnustLogoSVG();
            setLogoBase64(svgLogo);
            console.log('Using embedded SVG logo');
            
            // Optionally, try to load external logo in background and update if successful
            const logoUrls = [
                'https://res.cloudinary.com/deao7edpe/image/upload/v1774278836/WPS_Photos_1_mbofao.png',
                'https://upload.wikimedia.org/wikipedia/en/thumb/9/9c/KNUST_Logo.png/200px-KNUST_Logo.png',
            ];
            
            const tryLoadLogo = (index) => {
                if (index >= logoUrls.length) {
                    console.log('No external logo URLs available. Keeping SVG fallback.');
                    return;
                }
                
                loadImageAsBase64(logoUrls[index], 3000)
                    .then(base64 => {
                        setLogoBase64(base64);
                        console.log(`Logo upgraded from external URL: ${logoUrls[index]}`);
                    })
                    .catch(err => {
                        console.warn(`Failed to load logo from ${logoUrls[index]}:`, err.message);
                        tryLoadLogo(index + 1);
                    });
            };
            
            // Try external logos in the background, non-blocking
            tryLoadLogo(0);
        }
    }, [isOpen]);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
        ],
        content: '<p>Loading report...</p>',
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none min-h-[500px] p-6 focus:outline-none',
            },
        },
    });

    // Populate content when ready
    useEffect(() => {
        if (editor && board && statistics && isOpen && logoBase64) {
            try {
                const html = buildReportHtml(board, tasks, statistics, currentUserName, userRank, logoBase64);
                editor.commands.setContent(html);
                console.log('Report content set with logo:', logoBase64.substring(0, 50) + '...');
            } catch (err) {
                console.error('Failed to set content:', err);
            }
        }
    }, [editor, board, tasks, statistics, currentUserName, userRank, isOpen, logoBase64]);

    // Cleanup editor on unmount
    useEffect(() => {
        return () => editor?.destroy();
    }, [editor]);

    const exportToPdfBlob = () =>
        new Promise((resolve, reject) => {
            const content = editorRef.current?.querySelector('.ProseMirror');
            if (!content) return reject(new Error('Editor content not found'));

            html2pdf()
                .set({
                    margin: [10, 10, 10, 10],
                    filename: `board_report_${new Date().toISOString().split('T')[0]}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                })
                .from(content)
                .outputPdf('blob')
                .then(resolve)
                .catch(reject);
        });

    const handleSend = async () => {
        try {
            const blob = await exportToPdfBlob();
            const reportTitle = buildReportTitle(currentUserName);
            const pdfFile = new File([blob], `${reportTitle}.pdf`, { type: 'application/pdf' });
            onSendClick(pdfFile, reportTitle);
        } catch (err) {
            console.error('PDF export failed:', err);
        }
    };

    if (!isOpen || !editor) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Edit Report</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Make any changes before sending — formatting, notes, or task details.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none" title="Close">
                        ✕
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-b bg-gray-50 shrink-0">
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><b>B</b></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><i>I</i></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><s>S</s></ToolbarButton>

                    <Divider />

                    {[1, 2, 3].map(level => (
                        <ToolbarButton
                            key={level}
                            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
                            active={editor.isActive('heading', { level })}
                            title={`Heading ${level}`}
                        >
                            H{level}
                        </ToolbarButton>
                    ))}

                    <Divider />

                    <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">• List</ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">1. List</ToolbarButton>

                    <Divider />

                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Left">⬅</ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center">☰</ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Right">➡</ToolbarButton>

                    <Divider />

                    <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">↩</ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">↪</ToolbarButton>

                    <Divider />

                    <ToolbarButton
                        onClick={() => {
                            const html = buildReportHtml(board, tasks, statistics, currentUserName, userRank, logoBase64);
                            editor.commands.setContent(html);
                        }}
                        title="Reset to original"
                    >
                        ↺ Reset
                    </ToolbarButton>
                </div>

                {/* Editor Content */}
                <div className="overflow-y-auto flex-1" ref={editorRef}>
                    <EditorContent editor={editor} />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 shrink-0">
                    <p className="text-xs text-gray-400">
                        Changes are not saved — the edited content will be exported as a PDF when you continue.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleSend} className="px-4 py-2 text-sm rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors">
                            Continue to Send →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportEditorModal;