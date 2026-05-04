import React, { createContext, useState, useContext, useCallback, useMemo, useRef } from 'react';
import { taskAPI } from '../services/taskApi';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const TaskContext = createContext(null);

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  // Cache for tasks by boardId
  const tasksCache = useRef(new Map());
  const ongoingRequests = useRef(new Map());

  const fetchTasksByBoard = useCallback(async (boardId, forceRefresh = false) => {
    if (!boardId) return [];
    
    // Check cache first
    if (!forceRefresh && tasksCache.current.has(boardId)) {
      console.log(`Using cached tasks for board ${boardId}`);
      setTasks(tasksCache.current.get(boardId));
      return tasksCache.current.get(boardId);
    }

    // Check for ongoing request
    if (ongoingRequests.current.has(boardId)) {
      console.log(`Request already in progress for board ${boardId}`);
      return ongoingRequests.current.get(boardId);
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching tasks for board ${boardId} from API`);
      
      const requestPromise = (async () => {
        const response = await taskAPI.getByBoard(boardId);

        const tasksWithStatus = response.data.map(task => ({
          ...task,
          id: task.id,
          title: task.title,
          description: task.description,
          boardId: task.boardId,
          assignedUserId: task.assignedUserId,
          assignedUser: task.assignedUser,
          isCompleted: task.isCompleted ?? false,
          status: task.isCompleted 
            ? 'completed' 
            : (task.status?.toLowerCase() ?? 'pending'),
          dueDate: task.dueDate,
          reminderFrequency: task.reminderFrequency,
          createdAt: task.createdAt,
          isAssignedToMe: task.assignedUserId === user?.id
        }));

        // Update cache
        tasksCache.current.set(boardId, tasksWithStatus);
        setTasks(tasksWithStatus);
        
        return tasksWithStatus;
      })();

      ongoingRequests.current.set(boardId, requestPromise);
      const result = await requestPromise;
      ongoingRequests.current.delete(boardId);
      
      return result;
    } catch (err) {
      console.error('Error fetching tasks:', err);
      const errorMsg = err.response?.data?.title || err.message || 'Failed to load tasks';
      setError(errorMsg);
      ongoingRequests.current.delete(boardId);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createTask = useCallback(async (taskData) => {
    try {
      setError(null);
      const response = await taskAPI.create(taskData);
      
      if (response.data && response.data.id) {
        const newTask = { 
          ...response.data, 
          status: 'pending',
          isAssignedToMe: response.data.assignedUserId === user?.id
        };
        
        setTasks(prev => [...prev, newTask]);
        
        // Invalidate cache for this board
        tasksCache.current.delete(taskData.boardId);
        
        toast.success('Task created successfully!');
        return { success: true, data: newTask };
      }
      throw new Error('Invalid response from server');
    } catch (err) {
      console.error('Error creating task:', err);
      const errorMessage = err.response?.data?.title || err.message || 'Failed to create task';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [user?.id]);

  const updateTask = useCallback(async (taskId, taskData) => {
    let previousTasks;
    setTasks(prev => {
      previousTasks = prev;
      return prev.map(t => t.id === taskId ? { ...t, ...taskData } : t);
    });

    try {
      setError(null);
      const response = await taskAPI.update(taskId, taskData);
      
      if (response.data) {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, ...response.data } : t
        ));
        
        // Find the boardId to invalidate cache
        const task = previousTasks.find(t => t.id === taskId);
        if (task?.boardId) {
          tasksCache.current.delete(task.boardId);
        }
        
        toast.success('Task updated successfully!');
        return { success: true, data: response.data };
      }
    } catch (err) {
      // Revert on error
      setTasks(previousTasks);
      console.error('Error updating task:', err);
      const errorMessage = err.response?.data?.title || err.message || 'Failed to update task';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const moveTask = useCallback(async (taskId, newIsCompleted, newStatus) => {
    let previousTasks;
    setTasks(prev => {
      previousTasks = prev;
      return prev.map(task =>
        task.id === taskId
          ? { 
              ...task, 
              isCompleted: newIsCompleted, 
              status: newStatus ?? (newIsCompleted ? 'completed' : 'pending') 
            }
          : task
      );
    });

    try {
      const payload = { isCompleted: newIsCompleted, status: newStatus };
      const response = await taskAPI.update(taskId, payload);
      
      if (response.status === 200 || response.status === 204) {
        const toastMap = {
          'in-progress': 'Task moved to In Progress ⚡',
          completed: 'Task completed! 🎉',
          pending: 'Task moved to To Do 📝',
        };
        
        // Find the task to get boardId
        const task = previousTasks.find(t => t.id === taskId);
        if (task?.boardId) {
          tasksCache.current.delete(task.boardId);
        }
        
        toast.success(toastMap[newStatus] ?? 'Task updated');
        return { success: true };
      } else {
        throw new Error('Server returned unexpected status');
      }
    } catch (err) {
      setTasks(previousTasks);
      console.error('[moveTask] PUT failed:', err);
      toast.error('Failed to move task — changes reverted');
      return { success: false, error: err.message };
    }
  }, []);

  const reassignTask = useCallback(async (taskId, newUserId) => {
    let previousTasks;
    setTasks(prev => {
      previousTasks = prev;
      return prev.map(task =>
        task.id === taskId 
          ? { ...task, assignedUserId: newUserId, isAssignedToMe: newUserId === user?.id } 
          : task
      );
    });

    try {
      setError(null);
      const response = await taskAPI.reassign(taskId, newUserId);
      
      if (response.data) {
        // Find the task to get boardId
        const task = previousTasks.find(t => t.id === taskId);
        if (task?.boardId) {
          tasksCache.current.delete(task.boardId);
        }
        
        toast.success('Task reassigned successfully!');
        return { success: true, data: response.data };
      }
    } catch (err) {
      setTasks(previousTasks);
      console.error('Error reassigning task:', err);
      const errorMessage = err.response?.data?.title || err.message || 'Failed to reassign task';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [user?.id]);

  const deleteTask = useCallback(async (taskId) => {
    let previousTasks;
    setTasks(prev => {
      previousTasks = prev;
      return prev.filter(task => task.id !== taskId);
    });

    try {
      setError(null);
      await taskAPI.delete(taskId);
      
      // Find the task to get boardId
      const task = previousTasks.find(t => t.id === taskId);
      if (task?.boardId) {
        tasksCache.current.delete(task.boardId);
      }
      
      toast.success('Task deleted successfully!');
      return { success: true };
    } catch (err) {
      setTasks(previousTasks);
      console.error('Error deleting task:', err);
      const errorMessage = err.response?.data?.title || err.message || 'Failed to delete task';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const value = useMemo(() => ({
    tasks,
    loading,
    error,
    fetchTasksByBoard,
    createTask,
    updateTask,
    moveTask,
    reassignTask,
    deleteTask,
  }), [tasks, loading, error, fetchTasksByBoard, createTask, updateTask, moveTask, reassignTask, deleteTask]);

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};