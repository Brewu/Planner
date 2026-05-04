import api from './api';
import * as signalR from '@microsoft/signalr';

class NotificationService {
    constructor() {
        this.connection = null;
        this.listeners = [];
    }

    async startConnection(userId) {
        if (this.connection) return;

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${process.env.REACT_APP_API_URL?.replace('/api', '')}/notifications`, {
                accessTokenFactory: () => localStorage.getItem('token')
            })
            .withAutomaticReconnect()
            .build();

        try {
            await this.connection.start();
            console.log('SignalR Connected');

            this.connection.on('ReceiveNotification', (notification) => {
                this.listeners.forEach(listener => listener(notification));
            });
        } catch (err) {
            console.error('SignalR Connection Error:', err);
        }
    }

    onNotificationReceived(callback) {
        this.listeners.push(callback);
    }

    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    async stopConnection() {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
        }
    }

    // API calls
    async getNotifications(userId) {
        const response = await api.get(`/Notifications/${userId}`);
        return response.data;
    }

    async markAsRead(notificationId) {
        const response = await api.put(`/Notifications/${notificationId}/read`);
        return response.data;
    }

    async markAllAsRead(userId) {
        const response = await api.put(`/Notifications/user/${userId}/read-all`);
        return response.data;
    }

    async clearAll(userId) {
        const response = await api.delete(`/Notifications/user/${userId}`);
        return response.data;
    }

    async deleteNotification(notificationId) {
        const response = await api.delete(`/Notifications/${notificationId}`);
        return response.data;
    }

    async subscribeToPush(subscription) {
        const response = await api.post('/Notifications/subscribe', subscription);
        return response.data;
    }
}

export default new NotificationService();