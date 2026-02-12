// Simple toast notification system without popups
let toastContainer: HTMLDivElement | null = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function createToast(message: string, type: 'success' | 'error' | 'warning' | 'info') {
  const container = getToastContainer();
  const toast = document.createElement('div');
  
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-orange-500',
    info: 'bg-blue-500'
  };
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  toast.className = `${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg pointer-events-auto transition-all transform translate-x-0 opacity-100`;
  toast.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="text-lg">${icons[type]}</span>
      <span class="font-medium">${message}</span>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(400px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, 3000);
}

export const showToast = {
  success: (message: string) => {
    console.log('✅', message);
    createToast(message, 'success');
  },
  error: (message: string) => {
    console.error('❌', message);
    createToast(message, 'error');
  },
  warning: (message: string) => {
    console.warn('⚠️', message);
    createToast(message, 'warning');
  },
  info: (message: string) => {
    console.info('ℹ️', message);
    createToast(message, 'info');
  }
};
