import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoards } from '../../contexts/BoardContext';
import api from '../../services/api';
import {
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CalendarDaysIcon,
    PlusIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';

const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
];

const BOARD_COLORS = [
    'bg-blue-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500',
    'bg-teal-500', 'bg-fuchsia-500', 'bg-indigo-500', 'bg-orange-500',
];

const buildGrid = (year, month) => {
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    const days  = [];
    for (let i = 0; i < first.getDay(); i++)
        days.push(new Date(year, month, 1 - (first.getDay() - i)));
    for (let d = 1; d <= last.getDate(); d++)
        days.push(new Date(year, month, d));
    while (days.length < 42)
        days.push(new Date(year, month + 1, days.length - last.getDate() - first.getDay() + 1));
    return days;
};

const BoardPill = ({ board, colorClass, isStart, isEnd, onClick }) => (
    <button
        onClick={e => { e.stopPropagation(); onClick(board); }}
        title={board.name}
        className={`
            w-full text-left text-xs font-medium py-0.5 truncate text-white
            transition-all duration-150 hover:brightness-110
            ${colorClass}
            ${isStart ? 'rounded-l-full pl-2' : 'pl-0.5'}
            ${isEnd   ? 'rounded-r-full pr-2' : 'pr-0.5'}
            ${isStart && isEnd ? 'rounded-full px-2' : ''}
        `}
    >
        {isStart ? board.name : '\u00A0'}
    </button>
);

const CalendarModal = ({ onClose }) => {
    const navigate  = useNavigate();
    const { boards } = useBoards();
    const today = new Date();

    const [viewYear,  setViewYear]  = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [boardTaskMap, setBoardTaskMap] = useState({});
    const [loading, setLoading] = useState(true);

    // Fetch tasks for every board ONCE when modal opens
    useEffect(() => {
        if (!boards.length) { setLoading(false); return; }

        let cancelled = false;
        const fetchAll = async () => {
            try {
                setLoading(true);
                const results = await Promise.all(
                    boards.map(async b => {
                        try {
                            const res = await api.get(`/Tasks/board/${b.id}`);
                            const tasks = res.data || [];
                            const dueDates = tasks.filter(t => t.dueDate).map(t => new Date(t.dueDate).getTime());
                            const latestDue = dueDates.length ? new Date(Math.max(...dueDates)) : null;
                            const allComplete = tasks.length > 0 && tasks.every(t => t.isCompleted || t.status === 'completed');
                            return [b.id, { latestDue, allComplete }];
                        } catch {
                            return [b.id, { latestDue: null, allComplete: false }];
                        }
                    })
                );
                if (!cancelled) setBoardTaskMap(Object.fromEntries(results));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchAll();
        return () => { cancelled = true; };
    }, []); // ← empty deps: fetch once on mount, never again

    const activeBoards = useMemo(() =>
        boards.filter(b => {
            if (b.isCompleted) return false;
            const info = boardTaskMap[b.id];
            return !info?.allComplete;
        }),
        [boards, boardTaskMap]
    );

    const colorMap = useMemo(() => {
        const map = {};
        activeBoards.forEach((b, i) => { map[b.id] = BOARD_COLORS[i % BOARD_COLORS.length]; });
        return map;
    }, [activeBoards]);

    const grid = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth]);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
        else setViewMonth(m => m + 1);
    };

    const getBoardRange = b => {
        const start = b.createdAt ? startOfDay(new Date(b.createdAt)) : startOfDay(today);
        const info  = boardTaskMap[b.id];
        const end   = info?.latestDue ? startOfDay(info.latestDue) : start;
        return { start, end };
    };

    const getBoardsForDay = day => {
        const d = startOfDay(day);
        return activeBoards.filter(b => {
            const { start, end } = getBoardRange(b);
            return d >= start && d <= end;
        });
    };

    const isSpanStart = (b, day) => {
        const { start } = getBoardRange(b);
        return isSameDay(startOfDay(day), start) || day.getDay() === 0;
    };

    const isSpanEnd = (b, day) => {
        const { end } = getBoardRange(b);
        return isSameDay(startOfDay(day), end) || day.getDay() === 6;
    };

    const handleBoardClick = board => { onClose(); navigate(`/boards/${board.id}/tasks`); };
    const handleEmptyClick = day => {
        if (getBoardsForDay(day).length === 0) {
            onClose();
            navigate('/boards', { state: { openCreateModal: true } });
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="pointer-events-auto w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                    style={{ maxHeight: '90vh' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
                        <div className="flex items-center gap-3">
                            <CalendarDaysIcon className="h-6 w-6 text-white" />
                            <div>
                                <h2 className="text-lg font-bold text-white">Board Calendar</h2>
                                <p className="text-xs text-blue-100">Active boards · Click a board to view tasks · Click empty date to create</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={prevMonth} className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors">
                                <ChevronLeftIcon className="h-4 w-4" />
                            </button>
                            <span className="text-white font-semibold text-sm min-w-[140px] text-center">
                                {MONTHS[viewMonth]} {viewYear}
                            </span>
                            <button onClick={nextMonth} className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors">
                                <ChevronRightIcon className="h-4 w-4" />
                            </button>
                            <div className="w-px h-5 bg-white/30 mx-1" />
                            <button onClick={onClose} className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors">
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Legend */}
                    {activeBoards.length > 0 && (
                        <div className="flex items-center gap-3 flex-wrap px-6 py-2 bg-gray-50 border-b border-gray-100">
                            {activeBoards.map(b => (
                                <button key={b.id} onClick={() => handleBoardClick(b)}
                                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900">
                                    <span className={`h-2.5 w-2.5 rounded-full ${colorMap[b.id]}`} />
                                    {b.name}
                                    {b.assignedUsers?.length > 0 && (
                                        <span className="flex items-center gap-0.5 text-gray-400">
                                            <UsersIcon className="h-3 w-3" />{b.assignedUsers.length}
                                        </span>
                                    )}
                                </button>
                            ))}
                            <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                                <PlusIcon className="h-3.5 w-3.5" />Click empty date to create board
                            </div>
                        </div>
                    )}

                    {/* Grid */}
                    <div className="flex-1 overflow-auto">
                        <div className="grid grid-cols-7 border-b border-gray-100">
                            {DAYS.map(d => (
                                <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">{d}</div>
                            ))}
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm text-gray-400">Loading boards…</span>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-7">
                                {grid.map((day, idx) => {
                                    const isCurrentMonth = day.getMonth() === viewMonth;
                                    const isToday        = isSameDay(day, today);
                                    const dayBoards      = getBoardsForDay(day);
                                    const isEmpty        = dayBoards.length === 0;
                                    const MAX_VISIBLE    = 3;

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => handleEmptyClick(day)}
                                            className={`
                                                min-h-[110px] border-b border-r border-gray-100 p-1.5 flex flex-col gap-1
                                                transition-colors duration-100
                                                ${isEmpty && isCurrentMonth ? 'cursor-pointer hover:bg-blue-50/60 group' : 'cursor-default'}
                                                ${!isCurrentMonth ? 'bg-gray-50/60' : 'bg-white'}
                                            `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                                                    ${isToday ? 'bg-blue-600 text-white' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                                                    {day.getDate()}
                                                </span>
                                                {isEmpty && isCurrentMonth && (
                                                    <PlusIcon className="h-3.5 w-3.5 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-0.5 flex-1">
                                                {dayBoards.slice(0, MAX_VISIBLE).map(board => (
                                                    <BoardPill
                                                        key={board.id}
                                                        board={board}
                                                        colorClass={colorMap[board.id]}
                                                        isStart={isSpanStart(board, day)}
                                                        isEnd={isSpanEnd(board, day)}
                                                        onClick={handleBoardClick}
                                                    />
                                                ))}
                                                {dayBoards.length > MAX_VISIBLE && (
                                                    <span className="text-xs text-gray-400 pl-1">
                                                        +{dayBoards.length - MAX_VISIBLE} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default CalendarModal;