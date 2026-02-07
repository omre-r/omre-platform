# OMRE Fragrances: Frontend Auth Integration Guide (UPDATED)

Ayman Nazir (Backend Lead)
GOAL: AWS Cognito + Amplify v6 Setup (Signup, Login, Reset Password)  


---


We are using **AWS Amplify v6** (the latest stable version) to handle all authentication with AWS Cognito. This handles security, sessions, token refresh, and API authorization automatically.

---

## 1. Installation
( I know you probably have this all updated and running so feel free to skip whatever you have done)
Run this command in your project root:

```bash
npm install aws-amplify
```

**Current Version:** This guide is for `aws-amplify@6.x` (latest as of Jan 2026)

---

## 2. ⚙️ Configuration Setup

### Create Configuration File (IMPORTANT OUR AWS COGNITO CURRENT IDS)
Create a file named `src/aws-config.js` and paste this code:

```javascript
// src/aws-config.js
import { Amplify } from 'aws-amplify';

const authConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_jytrX6A4l',
      userPoolClientId: '2tkp1h45fog0t93300kf1s9uaq',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
      }
    }
  }
};

Amplify.configure(authConfig);

export default Amplify;
```

### Initialize in Your App
Import this config file **at the very top** of your `index.js` or `App.js`:

```javascript
// At the TOP of index.js or App.js
import './aws-config';
import React from 'react';
// ... rest of your imports
```

⚠️ **CRITICAL:** This must be imported before any auth-related code runs.

---

## 3. 🛠️ Core Authentication Functions

### Import Required Functions
```javascript
import { 
  signUp, 
  confirmSignUp, 
  signIn, 
  signOut, 
  resetPassword, 
  confirmResetPassword,
  getCurrentUser,
  fetchAuthSession
} from 'aws-amplify/auth';
```

---

### A. Sign Up (Register New User)

**Required Fields:** Email, Password, First Name, Last Name, Favorite Notes

```javascript
async function handleSignUp(email, password, firstName, lastName, favoriteNotes = '') {
  try {
    const { isSignUpComplete, userId, nextStep } = await signUp({
      username: email, // We use email as username
      password,
      options: {
        userAttributes: {
          email,
          given_name: firstName,
          family_name: lastName,
          'custom:favorite_notes': favoriteNotes || '' // Custom attribute - required by our schema
        }
      }
    });

    console.log('Sign up successful!');
    console.log('Next Step:', nextStep.signUpStep); // Will be "CONFIRM_SIGN_UP"
    
    // Redirect user to verification page
    // Pass email to verification form
    return { success: true, email, nextStep };
    
  } catch (error) {
    console.error('Sign Up Error:', error);
    
    // Handle specific errors
    if (error.name === 'UsernameExistsException') {
      alert('This email is already registered. Please sign in instead.');
    } else if (error.name === 'InvalidPasswordException') {
      alert('Password does not meet requirements. Must be at least 8 characters with uppercase, lowercase, numbers, and special characters.');
    } else {
      alert(error.message || 'Sign up failed. Please try again.');
    }
    
    return { success: false, error };
  }
}
```

---

### B. Verify Email (Confirm Sign Up)

After registration, user receives a 6-digit code via email:

```javascript
async function handleVerifyEmail(email, verificationCode) {
  try {
    const { isSignUpComplete, nextStep } = await confirmSignUp({
      username: email,
      confirmationCode: verificationCode
    });

    if (isSignUpComplete) {
      alert('Email verified! Please log in.');
      // Redirect to login page
      return { success: true };
    }
    
  } catch (error) {
    console.error('Verification Error:', error);
    
    if (error.name === 'CodeMismatchException') {
      alert('Invalid verification code. Please check and try again.');
    } else if (error.name === 'ExpiredCodeException') {
      alert('Verification code has expired. Please request a new one.');
    } else {
      alert(error.message || 'Verification failed.');
    }
    
    return { success: false, error };
  }
}
```

---

### C. Sign In (Login)

```javascript
async function handleSignIn(email, password) {
  try {
    const { isSignedIn, nextStep } = await signIn({ 
      username: email, 
      password 
    });

    if (isSignedIn) {
      console.log('Login successful!');
      
      // Get user info after successful login
      const user = await getCurrentUser();
      console.log('Current user:', user);
      
      // Redirect to dashboard/home
      return { success: true, user };
    }
    
    // Handle additional steps if needed (e.g., MFA, password change required)
    if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
      alert('Please verify your email first.');
      // Redirect to verification page
    }
    
  } catch (error) {
    console.error('Login Error:', error);
    
    if (error.name === 'NotAuthorizedException') {
      alert('Incorrect email or password.');
    } else if (error.name === 'UserNotFoundException') {
      alert('No account found with this email.');
    } else if (error.name === 'UserNotConfirmedException') {
      alert('Please verify your email before signing in.');
      // Redirect to verification page
    } else {
      alert(error.message || 'Login failed.');
    }
    
    return { success: false, error };
  }
}
```

---

### D. Check If User Is Already Logged In

**Use this on app load to check authentication status:**

```javascript
async function checkAuthStatus() {
  try {
    const user = await getCurrentUser();
    console.log('User is authenticated:', user);
    
    // Optional: Get auth tokens
    const session = await fetchAuthSession();
    console.log('Access Token:', session.tokens?.accessToken);
    
    return { 
      isAuthenticated: true, 
      user,
      tokens: session.tokens 
    };
    
  } catch (error) {
    // User is not authenticated
    console.log('User not authenticated');
    return { isAuthenticated: false };
  }
}

// Example: Use in useEffect on App load
useEffect(() => {
  checkAuthStatus().then(({ isAuthenticated, user }) => {
    if (isAuthenticated) {
      // User is logged in - show dashboard
      setCurrentUser(user);
    } else {
      // User not logged in - show login page
      navigate('/login');
    }
  });
}, []);
```

---

### E. Forgot Password (2-Step Process)

#### Step 1: Request Reset Code

```javascript
async function requestPasswordReset(email) {
  try {
    const output = await resetPassword({ username: email });
    
    console.log('Reset code sent to:', output.nextStep.codeDeliveryDetails);
    alert('Check your email for the password reset code.');
    
    // Show form with fields for: Code & New Password
    return { success: true };
    
  } catch (error) {
    console.error('Password Reset Request Error:', error);
    
    if (error.name === 'UserNotFoundException') {
      alert('No account found with this email.');
    } else {
      alert(error.message || 'Failed to send reset code.');
    }
    
    return { success: false, error };
  }
}
```

#### Step 2: Confirm New Password

```javascript
async function confirmPasswordReset(email, verificationCode, newPassword) {
  try {
    await confirmResetPassword({
      username: email,
      confirmationCode: verificationCode,
      newPassword
    });
    
    alert('Password changed successfully! Please log in with your new password.');
    // Redirect to login page
    return { success: true };
    
  } catch (error) {
    console.error('Password Reset Error:', error);
    
    if (error.name === 'CodeMismatchException') {
      alert('Invalid reset code. Please check and try again.');
    } else if (error.name === 'ExpiredCodeException') {
      alert('Reset code has expired. Please request a new one.');
    } else if (error.name === 'InvalidPasswordException') {
      alert('Password does not meet requirements.');
    } else {
      alert(error.message || 'Password reset failed.');
    }
    
    return { success: false, error };
  }
}
```

---

### F. Sign Out

```javascript
async function handleSignOut() {
  try {
    await signOut();
    console.log('User signed out successfully');
    
    // Clear any local state
    // Redirect to login page
    window.location.href = '/login';
    
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

// Optional: Global sign out (signs out from all devices)
async function handleGlobalSignOut() {
  try {
    await signOut({ global: true });
    console.log('User signed out from all devices');
    window.location.href = '/login';
  } catch (error) {
    console.error('Global sign out error:', error);
  }
}
```

---

## 4. 🔑 Session & Token Management

### Get Current Session & Tokens

```javascript
async function getAuthTokens() {
  try {
    const session = await fetchAuthSession();
    
    return {
      accessToken: session.tokens?.accessToken?.toString(),
      idToken: session.tokens?.idToken?.toString(),
      // Tokens are automatically refreshed by Amplify
    };
    
  } catch (error) {
    console.error('Failed to get auth session:', error);
    return null;
  }
}

// Force refresh tokens
async function refreshTokens() {
  try {
    const session = await fetchAuthSession({ forceRefresh: true });
    return session.tokens;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
}
```

### Using Tokens with API Calls

```javascript
// Example: Making authenticated API calls
async function callProtectedAPI() {
  try {
    const { accessToken } = await getAuthTokens();
    
    const response = await fetch('https://your-api.com/endpoint', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return await response.json();
    
  } catch (error) {
    console.error('API call failed:', error);
  }
}
```

---

## 5. 🎯 Important Notes & Best Practices

### Password Requirements
AWS Cognito enforces these password rules:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

### Custom Attribute
- The `'custom:favorite_notes'` field is **required** by our database schema
- Always send it during sign up (even if empty string `''`)
- Custom attributes in Cognito must be prefixed with `custom:`

### Username = Email
- We use email as the username throughout the system
- Always pass the user's email to the `username` parameter

### Session Handling
- Tokens are automatically refreshed by Amplify (no manual refresh needed in most cases)
- Access tokens expire after 1 hour by default
- Amplify handles token refresh automatically when calling `fetchAuthSession()`

### Error Handling
Common error names to handle:
- `UsernameExistsException` - Email already registered
- `UserNotFoundException` - User doesn't exist
- `NotAuthorizedException` - Wrong password or user not authorized
- `UserNotConfirmedException` - Email not verified
- `CodeMismatchException` - Wrong verification/reset code
- `ExpiredCodeException` - Code has expired
- `InvalidPasswordException` - Password doesn't meet requirements

### Testing Checklist
✅ User can sign up with email/password  
✅ User receives verification email  
✅ User can verify email with code  
✅ User can log in after verification  
✅ User can request password reset  
✅ User can reset password with code  
✅ User stays logged in after page refresh  
✅ User can log out  
✅ Error messages display correctly  

---

## 6. 🚨 Common Issues & Solutions

### Issue: "User is not authenticated" error
**Solution:** User needs to sign in first. Call `getCurrentUser()` to check auth status.

### Issue: Tokens expired
**Solution:** Amplify auto-refreshes tokens. Call `fetchAuthSession()` to get fresh tokens.

### Issue: Configuration not working
**Solution:** Make sure `aws-config.js` is imported at the very top of your entry file.

### Issue: Custom attribute error
**Solution:** Ensure custom attributes are prefixed with `custom:` and that the attribute exists in Cognito User Pool.

---

## 7. 📚 Additional Resources

- [AWS Amplify v6 Documentation](https://docs.amplify.aws/react/)
- [AWS Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools.html)
- [Amplify v6 Migration Guide](https://docs.amplify.aws/gen1/react/build-a-backend/troubleshooting/migrate-from-javascript-v5-to-v6/)

---

## ✅ Summary

**What's Included:**
- ✅ User registration with email verification
- ✅ Login/logout functionality  
- ✅ Password reset flow
- ✅ Session management & token handling
- ✅ Authentication state checking
- ✅ Comprehensive error handling
- ✅ All latest Amplify v6 best practices

**What You DON'T Need:**
- ❌ No backend API calls for auth (Amplify handles it)
- ❌ No manual token management (auto-refreshed)
- ❌ No separate CognitoUser objects (v6 uses internal state)

---

**Questions?** Contact Ayman Nazir (Backend Lead) 

**Last Updated:** January 2026 | Amplify v6.x
