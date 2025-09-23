# Authentication Error Handling

## Issue: AuthApiError: Invalid Refresh Token

This error occurs when Supabase refresh tokens expire or become invalid. This commonly happens when:

1. The user hasn't accessed the application for an extended period
2. The refresh token has been invalidated on the server
3. There's a mismatch between stored tokens and server state

## Solution Implemented

### 1. Enhanced Error Handling in `supabaseAuth.ts`

- Added specific error detection for refresh token issues
- Implemented `clearStoredSession()` to properly clean up invalid sessions
- Added `handleAuthError()` utility to categorize different types of auth errors
- Created `getSafeSession()` method with retry logic for transient errors

### 2. Improved Supabase Client Configuration

- Enabled `autoRefreshToken: true` to automatically handle token refresh
- Set `persistSession: true` to maintain sessions across browser sessions
- Added `detectSessionInUrl: true` for proper session handling

### 3. Enhanced UserContext

- Added auth state change listener to handle real-time authentication events
- Implemented proper error handling for session loading
- Added automatic session refresh detection

### 4. Component-Level Improvements

- Updated components to use `getSafeSession()` instead of direct `checkSession()`
- Added proper error messages for authentication failures
- Improved redirect logic for expired sessions

## Usage

### For New Components

```typescript
// Use the safe session method
const { user: sessionUser, error } = await authService.getSafeSession()
if (error) {
  console.log('Session error:', error)
  // Handle appropriately (redirect to login, show message, etc.)
}
```

### Error Types Handled

1. **Refresh Token Errors**: Automatically clears session and requires re-login
2. **Network Errors**: Retries up to 2 times with exponential backoff
3. **Unknown Errors**: Logs error but doesn't force logout

## Testing

To test the error handling:

1. Clear browser storage while logged in
2. Manually expire tokens in Supabase dashboard
3. Test network connectivity issues

## Prevention

- Users should be encouraged to stay logged in for shorter periods
- Consider implementing "remember me" functionality for longer sessions
- Monitor session expiry patterns to adjust token lifetimes if needed