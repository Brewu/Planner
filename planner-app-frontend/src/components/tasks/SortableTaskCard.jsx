import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';

const SortableTaskCard = ({ task, onTaskUpdate, isSupervisor, boardUsers }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard
                task={task}
                isDragging={isDragging}
                isSupervisor={isSupervisor}
                boardUsers={boardUsers}
                onTaskUpdate={onTaskUpdate}
            />
        </div>
    );
};

export default SortableTaskCard;