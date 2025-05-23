class StorageService {
    constructor(prefix = 'shopease_') {
      this.prefix = prefix;
    }
  
    // Save data to localStorage with prefix
    set(key, value) {
      try {
        const serializedValue = JSON.stringify(value);
        localStorage.setItem(this.prefix + key, serializedValue);
        return true;
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
      }
    }
  
    // Get data from localStorage
    get(key) {
      try {
        const serializedValue = localStorage.getItem(this.prefix + key);
        if (serializedValue === null) {
          return null;
        }
        return JSON.parse(serializedValue);
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
      }
    }
  
    // Remove item from localStorage
    remove(key) {
      try {
        localStorage.removeItem(this.prefix + key);
        return true;
      } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
      }
    }
  
    // Clear all items with the prefix
    clear() {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(this.prefix)) {
            localStorage.removeItem(key);
          }
        });
        return true;
      } catch (error) {
        console.error('Error clearing localStorage:', error);
        return false;
      }
    }
  
    // Check if key exists
    has(key) {
      return localStorage.getItem(this.prefix + key) !== null;
    }
  }