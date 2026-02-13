import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import { AppState } from 'react-native';
import api from '../api';
import { useAuth } from './AuthContext';
import NotificationToast from '../components/NotificationToast';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const { isAuthenticated, user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [toastMessage, setToastMessage] = useState(null);
    const [lastRequestCount, setLastRequestCount] = useState(0);

    // Polling interval ref
    const pollInterval = useRef(null);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        // Handle app state changes for efficient polling
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                if (isAuthenticated) checkNotifications(); // Immediate check on resume
            }
            appState.current = nextAppState;
        });

        return () => subscription.remove();
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            checkNotifications(); // Initial check
            startPolling();
        } else {
            stopPolling();
            setUnreadCount(0);
            setLastRequestCount(0);
        }

        return () => stopPolling();
    }, [isAuthenticated]);

    const startPolling = () => {
        stopPolling();
        pollInterval.current = setInterval(checkNotifications, 30000); // Poll every 30s
    };

    const stopPolling = () => {
        if (pollInterval.current) clearInterval(pollInterval.current);
    };

    const checkNotifications = async () => {
        if (!isAuthenticated) return;
        try {
            const res = await api.get('/friends/requests');
            const requests = res.data.requests || [];
            const count = requests.length;

            setUnreadCount(count);

            // If we have more requests than last time, show a toast
            if (count > lastRequestCount && count > 0) {
                const diff = count - lastRequestCount;
                const msg = diff === 1
                    ? `New friend request from ${requests[requests.length - 1]?.from?.username || 'someone'}!`
                    : `${diff} new friend requests!`;

                showToast(msg);
            }

            setLastRequestCount(count);
        } catch (e) {
            console.log('Notification poll error:', e.message);
        }
    };

    const showToast = (message) => {
        setToastMessage(message);
        // Toast component will handle auto-hide
    };

    const hideToast = () => {
        setToastMessage(null);
    };

    const refreshNotifications = () => {
        checkNotifications();
    };

    // Reset the "new" tracker when user opens the list
    const markAsViewed = () => {
        setLastRequestCount(unreadCount);
    };

    return (
        <NotificationContext.Provider value={{
            unreadCount,
            refreshNotifications,
            markAsViewed,
            showToast
        }}>
            {children}
            {toastMessage && (
                <NotificationToast
                    message={toastMessage}
                    onHide={hideToast}
                />
            )}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationProvider');
    return context;
}

export default NotificationContext;
