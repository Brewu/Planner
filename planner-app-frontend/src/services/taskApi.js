import api from './api';

export const taskAPI = {
  // Get tasks for a board
  getByBoard: async (boardId) => {
    try {
      const response = await api.get(`/Tasks/board/${boardId}`);
      return response;
    } catch (error) {
      console.error('Error fetching tasks:', error.response?.data || error.message);
      throw error;
    }
  },

  // Create a new task
  create: async (taskData) => {
    try {
      const response = await api.post('/Tasks', taskData);
      return response;
    } catch (error) {
      console.error('Error creating task:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update a task (for completion, status changes, etc.)
  update: async (taskId, updates) => {
    try {
      // You need to add this endpoint to your backend
      const response = await api.put(`/Tasks/${taskId}`, updates);
      return response;
    } catch (error) {
      console.error('Error updating task:', error.response?.data || error.message);
      throw error;
    }
  },

  // Reassign task to another user
  reassign: async (taskId, newUserId) => {
    try {
      const response = await api.put(`/Tasks/${taskId}/reassign`, newUserId);
      return response;
    } catch (error) {
      console.error('Error reassigning task:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete a task
  delete: async (taskId) => {
    try {
      const response = await api.delete(`/Tasks/${taskId}`);
      return response;
    } catch (error) {
      console.error('Error deleting task:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default taskAPI;