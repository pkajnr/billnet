export const showToast = {
  success: (message: string) => {
    console.log('✅', message);
    alert(message);
  },
  error: (message: string) => {
    console.error('❌', message);
    alert(message);
  },
  warning: (message: string) => {
    console.warn('⚠️', message);
    alert(message);
  },
  info: (message: string) => {
    console.info('ℹ️', message);
    alert(message);
  }
};
