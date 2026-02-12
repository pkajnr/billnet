import { notificationContext, Notification } from '../components/NotificationToast';

export const showToast = {
  success: (message: string, title?: string) => {
    notificationContext.dispatchEvent(
      new CustomEvent('add-notification', {
        detail: {
          type: 'success',
          title: title || 'Success',
          message,
          duration: 4000,
        } as Omit<Notification, 'id'>
      })
    );
  },

  error: (message: string, title?: string) => {
    notificationContext.dispatchEvent(
      new CustomEvent('add-notification', {
        detail: {
          type: 'error',
          title: title || 'Error',
          message,
          duration: 5000,
        } as Omit<Notification, 'id'>
      })
    );
  },

  warning: (message: string, title?: string) => {
    notificationContext.dispatchEvent(
      new CustomEvent('add-notification', {
        detail: {
          type: 'warning',
          title: title || 'Warning',
          message,
          duration: 4000,
        } as Omit<Notification, 'id'>
      })
    );
  },

  info: (message: string, title?: string) => {
    notificationContext.dispatchEvent(
      new CustomEvent('add-notification', {
        detail: {
          type: 'info',
          title: title || 'Info',
          message,
          duration: 4000,
        } as Omit<Notification, 'id'>
      })
    );
  },
};
