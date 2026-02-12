import { useState, useEffect } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  description?: string;
  duration?: number; // in ms, 0 = persistent
}

export const notificationContext = new EventTarget();

export function NotificationToast() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleAdd = (event: any) => {
      const notification = event.detail as Omit<Notification, 'id'>;
      const id = Date.now().toString();
      const newNotification: Notification = {
        ...notification,
        id,
        duration: notification.duration ?? 4000,
      };

      setNotifications(prev => [...prev, newNotification]);

      // Auto-remove after duration
      if (newNotification.duration && newNotification.duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, newNotification.duration);
      }
    };

    const handleRemove = (event: any) => {
      removeNotification(event.detail.id);
    };

    notificationContext.addEventListener('add-notification', handleAdd);
    notificationContext.addEventListener('remove-notification', handleRemove);

    return () => {
      notificationContext.removeEventListener('add-notification', handleAdd);
      notificationContext.removeEventListener('remove-notification', handleRemove);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`flex items-start gap-3 p-4 rounded-lg border shadow-md max-w-sm animate-slide-in ${getColors(notification.type)}`}
        >
          <span className="text-xl font-bold shrink-0">{getIcon(notification.type)}</span>
          <div className="flex-1">
            {notification.title && (
              <h4 className="font-inter font-semibold text-sm">{notification.title}</h4>
            )}
            <p className="font-inter text-sm">{notification.message}</p>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="shrink-0 text-xl font-bold hover:opacity-70 transition"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// Global notification helper
export function showNotification(notification: Omit<Notification, 'id'>) {
  notificationContext.dispatchEvent(
    new CustomEvent('add-notification', { detail: notification })
  );
}

// Specific notification types for convenience
export const Notification = {
  success: (title: string, message: string, duration = 4000) =>
    showNotification({ type: 'success', title, message, duration }),
  error: (title: string, message: string, duration = 5000) =>
    showNotification({ type: 'error', title, message, duration }),
  info: (title: string, message: string, duration = 4000) =>
    showNotification({ type: 'info', title, message, duration }),
  warning: (title: string, message: string, duration = 5000) =>
    showNotification({ type: 'warning', title, message, duration }),
};
