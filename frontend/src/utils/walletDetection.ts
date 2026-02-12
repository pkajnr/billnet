/**
 * Utility to safely detect and handle wallet providers
 * Prevents MetaMask connection errors on page load
 */

// Check if MetaMask or other wallet is available
export const isWalletAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

// Safely get wallet provider
export const getWalletProvider = () => {
  if (typeof window === 'undefined') return null;
  return window.ethereum || null;
};

// Check if specific wallet is installed
export const isMetaMaskInstalled = (): boolean => {
  if (typeof window === 'undefined' || !window.ethereum) return false;
  return window.ethereum.isMetaMask === true;
};

// Prevent auto-connection attempts
export const disableAutoConnect = () => {
  if (typeof window === 'undefined') return;
  
  // Override any auto-connect behavior
  if (window.ethereum && typeof window.ethereum._metamask !== 'undefined') {
    try {
      // Disable auto-refresh
      window.ethereum.autoRefreshOnNetworkChange = false;
    } catch (error) {
      console.debug('Could not disable auto-refresh:', error);
    }
  }
};

// Initialize wallet detection on app load
export const initWalletDetection = () => {
  disableAutoConnect();
  
  // Log wallet availability for debugging
  if (import.meta.env.DEV) {
    console.log('Wallet Detection:', {
      available: isWalletAvailable(),
      isMetaMask: isMetaMaskInstalled(),
      provider: getWalletProvider() ? 'Found' : 'Not found'
    });
  }
};

declare global {
  interface Window {
    ethereum?: any;
  }
}
