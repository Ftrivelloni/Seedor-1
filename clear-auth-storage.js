// Run this in your browser's console to clear all auth-related storage
console.log('Clearing all authentication storage...');

// Clear localStorage
const localKeysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (
    key.includes('supabase') || 
    key.includes('auth') ||
    key.includes('session') ||
    key.includes('token')
  )) {
    localKeysToRemove.push(key);
  }
}

localKeysToRemove.forEach(key => {
  console.log(`Removing ${key} from localStorage`);
  localStorage.removeItem(key);
});

// Clear sessionStorage
const sessionKeysToRemove = [];
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key && (
    key.includes('supabase') || 
    key.includes('auth') ||
    key.includes('session') ||
    key.includes('token')
  )) {
    sessionKeysToRemove.push(key);
  }
}

sessionKeysToRemove.forEach(key => {
  console.log(`Removing ${key} from sessionStorage`);
  sessionStorage.removeItem(key);
});

console.log('Storage cleared! Refreshing page...'); 
window.location.reload();