import React, { createContext, useState, useContext, useCallback, useMemo, useRef } from 'react';
import { boardAPI } from '../services/boardApi';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const BoardContext = createContext(null);

export const useBoards = () => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoards must be used within a BoardProvider');
  }
  return context;
};

export const BoardProvider = ({ children }) => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  // Cache for boards data
  const boardsCache = useRef(new Map());
  const ongoingRequests = useRef(new Map());

  const fetchBoards = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'all-boards';
    
    // Check cache first
    if (!forceRefresh && boardsCache.current.has(cacheKey)) {
      console.log('Using cached boards');
      setBoards(boardsCache.current.get(cacheKey));
      return boardsCache.current.get(cacheKey);
    }

    // Check for ongoing request
    if (ongoingRequests.current.has(cacheKey)) {
      console.log('Boards request already in progress');
      return ongoingRequests.current.get(cacheKey);
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching boards from API');
      
      const requestPromise = (async () => {
        const response = await boardAPI.getAll();
        
        // Process boards data
        const processedBoards = response.data.map(board => ({
          ...board,
          isSupervisor: board.supervisorId === user?.id,
          isAssigned: board.assignedUsers?.some(u => u.id === user?.id) || false
        }));
        
        // Update cache
        boardsCache.current.set(cacheKey, processedBoards);
        setBoards(processedBoards);
        
        return processedBoards;
      })();

      ongoingRequests.current.set(cacheKey, requestPromise);
      const result = await requestPromise;
      ongoingRequests.current.delete(cacheKey);
      
      return result;
    } catch (err) {
      console.error('Error fetching boards:', err);
      const errorMsg = err.response?.data?.title || err.message || 'Failed to load boards';
      setError(errorMsg);
      toast.error(errorMsg);
      ongoingRequests.current.delete(cacheKey);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createBoard = useCallback(async (boardData) => {
    try {
      setError(null);
      const response = await boardAPI.create(boardData);
      
      if (response.data) {
        const newBoard = {
          ...response.data,
          isSupervisor: response.data.supervisorId === user?.id,
          isAssigned: response.data.assignedUsers?.some(u => u.id === user?.id) || false
        };
        
        setBoards(prev => [...prev, newBoard]);
        
        // Invalidate cache
        boardsCache.current.delete('all-boards');
        
        toast.success('Board created successfully!');
        return { success: true, data: newBoard };
      }
      
      throw new Error('Invalid response from server');
    } catch (err) {
      console.error('Error creating board:', err);
      const errorMessage = err.response?.data?.title || err.message || 'Failed to create board';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [user?.id]);

  const updateBoard = useCallback(async (boardId, updates) => {
    try {
      setError(null);
      const response = await boardAPI.update(boardId, updates);
      
      if (response.data) {
        setBoards(prev => prev.map(board => 
          board.id === boardId ? { ...board, ...response.data } : board
        ));
        
        // Invalidate cache
        boardsCache.current.delete('all-boards');
        
        toast.success('Board updated successfully!');
        return { success: true, data: response.data };
      }
    } catch (err) {
      console.error('Error updating board:', err);
      const errorMessage = err.response?.data?.title || err.message || 'Failed to update board';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const reassignBoard = useCallback(async (boardId, newAssignedUserIds) => {
    try {
      setError(null);
      const response = await boardAPI.reassign(boardId, newAssignedUserIds);
      
      if (response.data) {
        setBoards(prev => prev.map(board => 
          board.id === boardId ? { ...board, ...response.data } : board
        ));
        
        // Invalidate cache
        boardsCache.current.delete('all-boards');
        
        toast.success('Board reassigned successfully!');
        return { success: true, data: response.data };
      }
    } catch (err) {
      console.error('Error reassigning board:', err);
      const errorMessage = err.response?.data?.title || err.message || 'Failed to reassign board';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const deleteBoard = useCallback(async (boardId) => {
    try {
      setError(null);
      await boardAPI.delete(boardId);
      
      setBoards(prev => prev.filter(board => board.id !== boardId));
      
      // Invalidate cache
      boardsCache.current.delete('all-boards');
      
      toast.success('Board deleted successfully!');
      return { success: true };
    } catch (err) {
      console.error('Error deleting board:', err);
      const errorMessage = err.response?.data?.title || err.message || 'Failed to delete board';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const value = useMemo(() => ({
    boards,
    loading,
    error,
    fetchBoards,
    createBoard,
    updateBoard,
    reassignBoard,
    deleteBoard,
  }), [boards, loading, error, fetchBoards, createBoard, updateBoard, reassignBoard, deleteBoard]);

  return (
    <BoardContext.Provider value={value}>
      {children}
    </BoardContext.Provider>
  );
};