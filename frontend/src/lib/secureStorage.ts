import CryptoJS from 'crypto-js';

// Get encryption key from environment variable
// In production, this should be a secure random string
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-production';

/**
 * Secure storage wrapper for localStorage with AES encryption
 * Use this for storing sensitive data like API keys
 */
export const secureStorage = {
    /**
     * Encrypt and store a value in localStorage
     * @param key - Storage key
     * @param value - Value to encrypt and store
     */
    setItem: (key: string, value: string): void => {
        try {
            const encrypted = CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
            localStorage.setItem(key, encrypted);
        } catch (error) {
            console.error('Error encrypting data:', error);
            throw new Error('Failed to securely store data');
        }
    },

    /**
     * Retrieve and decrypt a value from localStorage
     * @param key - Storage key
     * @returns Decrypted value or null if not found
     */
    getItem: (key: string): string | null => {
        try {
            const encrypted = localStorage.getItem(key);
            if (!encrypted) return null;

            const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
            const value = decrypted.toString(CryptoJS.enc.Utf8);

            // If decryption fails, it returns an empty string
            return value || null;
        } catch (error) {
            console.error('Error decrypting data:', error);
            return null;
        }
    },

    /**
     * Remove an item from localStorage
     * @param key - Storage key
     */
    removeItem: (key: string): void => {
        localStorage.removeItem(key);
    },

    /**
     * Clear all items from localStorage
     */
    clear: (): void => {
        localStorage.clear();
    },

    /**
     * Check if a key exists in localStorage
     * @param key - Storage key
     * @returns true if key exists
     */
    hasItem: (key: string): boolean => {
        return localStorage.getItem(key) !== null;
    }
};

export default secureStorage;
