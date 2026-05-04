import api from './api';

export const boardAPI = {
  // Get all boards for current user
  getAll: async () => {
    try {
      const response = await api.get('/Boards');
      return response;
    } catch (error) {
      console.error('Error fetching boards:', error.response?.data || error.message);
      throw error;
    }
  },

  // Create a new board
  create: async (boardData) => {
    try {
      const response = await api.post('/Boards', boardData);
      return response;
    } catch (error) {
      console.error('Error creating board:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update a board
  update: async (boardId, updates) => {
    try {
      const response = await api.put(`/Boards/${boardId}`, updates);
      return response;
    } catch (error) {
      console.error('Error updating board:', error.response?.data || error.message);
      throw error;
    }
  },

  // Reassign board users
  reassign: async (boardId, userIds) => {
    try {
      const response = await api.put(`/Boards/${boardId}/reassign`, userIds);
      return response;
    } catch (error) {
      console.error('Error reassigning board:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete a board
  delete: async (boardId) => {
    try {
      const response = await api.delete(`/Boards/${boardId}`);
      return response;
    } catch (error) {
      console.error('Error deleting board:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default boardAPI;