import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    DndContext,
    pointerWithin,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    useDroppable,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import SortableTaskCard from './SortableTaskCard';
import { useTasks } from '../../contexts/TaskContext';

// ─── Column drop zone ─────────────────────────────────────────────────────────
const DroppableColumn = ({ id, config, taskIds, tasks, onTaskUpdate, isSupervisor, boardUsers }) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`${config.color} rounded-xl p-4 min-h-[600px] border-2 transition-colors duration-150 ${isOver ? config.overBorderColor : config.borderColor
                }`}
        >
            <div className={`${config.headerColor} rounded-lg p-4 mb-4 flex items-center justify-between border-b-2 ${config.borderColor}`}>
                <div className="flex items-center space-x-2">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                        <h3 className={`font-semibold ${config.textColor}`}>{config.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            {taskIds.length} {taskIds.length === 1 ? 'task' : 'tasks'}
                        </p>
                    </div>
                </div>
                <span className={`bg-white px-3 py-1 rounded-full text-sm font-medium border ${config.borderColor} ${config.textColor}`}>
                    {taskIds.length}
                </span>
            </div>

            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 min-h-[500px]">
                    {taskIds.map((taskId) => {
                        const task = tasks.find((t) => t.id === taskId);
                        if (!task) return null;
                        return (
                            <SortableTaskCard
                                key={task.id}
                                task={task}
                                onTaskUpdate={onTaskUpdate}
                                isSupervisor={isSupervisor}
                                boardUsers={boardUsers}
                            />
                        );
                    })}

                    {taskIds.length === 0 && (
                        <div
                            className={`text-center py-12 bg-white bg-opacity-50 rounded-lg border-2 border-dashed transition-colors duration-150 ${isOver ? config.overBorderColor : 'border-gray-300'
                                } min-h-[120px] flex items-center justify-center`}
                        >
                            <div>
                                <p className="text-sm text-gray-400">No tasks here</p>
                                <p className="text-xs text-gray-300 mt-1">Drop tasks here</p>
                            </div>
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
};

// ─── Column definitions ───────────────────────────────────────────────────────
const COLUMN_CONFIG = {
    pending: {
        title: 'To Do',
        color: 'bg-gray-50',
        headerColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        icon: '📝',
        borderColor: 'border-gray-200',
        overBorderColor: 'border-gray-400',
    },
    'in-progress': {
        title: 'In Progress',
        color: 'bg-blue-50',
        headerColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        icon: '⚡',
        borderColor: 'border-blue-200',
        overBorderColor: 'border-blue-500',
    },
    completed: {
        title: 'Completed',
        color: 'bg-green-50',
        headerColor: 'bg-green-100',
        textColor: 'text-green-700',
        icon: '✅',
        borderColor: 'border-green-200',
        overBorderColor: 'border-green-500',
    },
};

const COLUMN_IDS = ['pending', 'in-progress', 'completed'];
const columnToCompleted = (columnId) => columnId === 'completed';

const taskToColumn = (task) => {
    if (task.isCompleted) return 'completed';
    const status = task.status?.toLowerCase() ?? 'pending';
    if (status === 'in-progress') return 'in-progress';
    return 'pending';
};

// ─── Board ────────────────────────────────────────────────────────────────────
const TaskBoard = ({ tasks, onTaskUpdate, isSupervisor, boardUsers }) => {
    const { moveTask } = useTasks();
    const [activeId, setActiveId] = useState(null);
    const isDraggingRef = useRef(false);
    const lastFingerprintRef = useRef('');

    const buildColumns = useCallback(
        (taskList) =>
            Object.fromEntries(
                COLUMN_IDS.map((id) => [
                    id,
                    taskList.filter((t) => taskToColumn(t) === id).map((t) => t.id),
                ])
            ),
        []
    );

    const [columns, setColumns] = useState(() => buildColumns(tasks));

    // Update columns when tasks change
    useEffect(() => {
        if (isDraggingRef.current) return;

        const fingerprint = tasks
            .map(t => `${t.id}:${t.status ?? ''}:${String(t.isCompleted ?? '')}`)
            .join('|');

        if (fingerprint !== lastFingerprintRef.current) {
            lastFingerprintRef.current = fingerprint;
            setColumns(buildColumns(tasks));
        }
    }, [tasks, buildColumns]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const findContainer = useCallback(
        (id) => {
            if (id in columns) return id;
            return Object.keys(columns).find((colId) => columns[colId].includes(id)) ?? null;
        },
        [columns]
    );

    const handleDragStart = ({ active }) => {
        isDraggingRef.current = true;
        setActiveId(active.id);
    };

    const handleDragOver = useCallback(
        ({ active, over }) => {
            if (!over) return;
            const activeContainer = findContainer(active.id);
            const overContainer = findContainer(over.id) ?? over.id;
            if (!activeContainer || !overContainer || activeContainer === overContainer) return;

            setColumns((prev) => {
                const activeItems = [...prev[activeContainer]];
                const overItems = [...(prev[overContainer] ?? [])];
                const activeIndex = activeItems.indexOf(active.id);
                const overIndex = overItems.includes(over.id)
                    ? overItems.indexOf(over.id)
                    : overItems.length;
                activeItems.splice(activeIndex, 1);
                overItems.splice(overIndex, 0, active.id);
                return { ...prev, [activeContainer]: activeItems, [overContainer]: overItems };
            });
        },
        [findContainer]
    );

    const handleDragEnd = async ({ active, over }) => {
        isDraggingRef.current = false;
        setActiveId(null);

        if (!over) { setColumns(buildColumns(tasks)); return; }

        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(over.id) ?? over.id;
        if (!activeContainer || !overContainer) return;

        if (activeContainer === overContainer) {
            const taskIds = columns[activeContainer];
            const activeIndex = taskIds.indexOf(active.id);
            const overIndex = taskIds.indexOf(over.id);
            if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
                setColumns((prev) => ({
                    ...prev,
                    [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex),
                }));
            }
        } else {
            const newIsCompleted = columnToCompleted(overContainer);
            await moveTask(active.id, newIsCompleted, overContainer);
            if (onTaskUpdate) onTaskUpdate();
        }
    };

    const handleDragCancel = () => {
        isDraggingRef.current = false;
        setActiveId(null);
        setColumns(buildColumns(tasks));
    };

    const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {COLUMN_IDS.map((columnId) => (
                    <DroppableColumn
                        key={columnId}
                        id={columnId}
                        config={COLUMN_CONFIG[columnId]}
                        taskIds={columns[columnId] ?? []}
                        tasks={tasks}
                        onTaskUpdate={onTaskUpdate}
                        isSupervisor={isSupervisor}
                        boardUsers={boardUsers}
                    />
                ))}
            </div>

            <DragOverlay dropAnimation={null}>
                {activeTask && (
                    <div className="opacity-80 rotate-2 scale-105 shadow-xl pointer-events-none">
                        <TaskCard
                            task={activeTask}
                            isDragging={true}
                            isSupervisor={isSupervisor}
                            boardUsers={boardUsers}
                        />
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
};

export default TaskBoard;