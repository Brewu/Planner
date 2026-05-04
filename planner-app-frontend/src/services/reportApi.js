import api from './api';

export const reportAPI = {
  // Generate and download PDF report
  generateBoardReport: async (boardId) => {
    try {
      const response = await api.get(`/Reports/board/${boardId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = `board_report_${new Date().toISOString().split('T')[0]}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  },

  sendBoardReport: async (boardId, { toEmail, additionalMessage, pdfFile, reportTitle, ccEmails = [], bccEmails = [] }) => {
    const formData = new FormData();
    formData.append('PdfFile', pdfFile);
    formData.append('ToEmail', toEmail);
    formData.append('Subject', reportTitle);
    if (additionalMessage) formData.append('AdditionalMessage', additionalMessage);
    ccEmails.forEach(email => formData.append('CcEmails', email));   // 👈
    bccEmails.forEach(email => formData.append('BccEmails', email));  // 👈

    const response = await api.post(
      `/Reports/board/${boardId}/send`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  // Get board statistics
  getBoardStatistics: async (boardId) => {
    try {
      const response = await api.get(`/Reports/board/${boardId}/statistics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  },
};

export default reportAPI;