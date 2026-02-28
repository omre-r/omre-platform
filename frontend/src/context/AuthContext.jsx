/*
File context : 
This file is creating a global authentication state for the application
Responsibilities:
- Track whether a user is authenticated
- Expose the current user object
- Determine admin access from Cognito group claims
- Provide login/logout synchronization across the app
*/

/*
IMPORT LIST ------------------------------------------------------------
Explaining only necessary imports
    - from react
        - useState stores the values like user or isAuthenticated
        - useEffect runs side effects after rendering, so it will kick off the initial auth check
        - Create context creates a global container that can be read throughout the app
        - Use context lets components read from the container  
    - amplify Auth
        - getCurrentUser checks if someone is signed in rn
        - fetchAuthSession gets current session/tokens so we can read things like groups or roles
*/ 
import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, fetchAuthSession, signOut } from "aws-amplify/auth";

// Creating global context container for app ----------------------------------------
const AuthContext = createContext(null);


export function AuthProvider({ children }) {
    // Auth State -------------------------------------------------------
    // LoadingAuth will block UI until initial check complete, starts as true will end as false
    // If isAuthenticated means user is signed in and will become true
    // Flag to notify if admin has logged in
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null); 
    const [isAdmin, setIsAdmin] = useState(false);

    // RefreshAuth, checks status ----------------------------------------------------
    // Will set current user and make sure to setAuthentification, if invalid will throw and set info false or null
    // Temporary debug checks to see in console if tokens are there
    async function refreshAuth() {
    try {
        const currentUser = await getCurrentUser(); 
        setUser(currentUser);
        setIsAuthenticated(true);

        // Fetch session and update last_login
        try {
            const session = await fetchAuthSession();
            const token = session.tokens.accessToken?.jwtToken;

            if (token) {
                await fetch(`/users/${currentUser.attributes.sub}/last-login`, {
                    method: "PUT",
                    headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    },
                });
            }
        } catch (err) {
            console.error("Failed to update last_login:", err);
        }

        // Check if admin
        try {
            const session = await fetchAuthSession();
            const groups = session?.tokens?.accessToken?.payload?.["cognito:groups"] || [];
            setIsAdmin(Array.isArray(groups) && groups.includes("admin"));
        } catch {
            setIsAdmin(false);
        }

    } catch {
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
    } finally {
        setLoadingAuth(false);
    }
}


    // Logout function -----------------------------------------
    // If signed out sets user to null and any further authentification to false
    async function logout() {
        await signOut();
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
    }

    // RefreshAuth ------------------
    // Run initial check on load
    useEffect(() => {
        refreshAuth();
    }, []);

    // Context Provider -------------------------------------------------------
    // Exposes authentication state and helpers to the entire application
    return (
        <AuthContext.Provider
        value={{
            loadingAuth,
            isAuthenticated,
            user,
            isAdmin,
            refreshAuth,
            logout,
        }}
        >
        {children}
        </AuthContext.Provider>
  );
}

// useAuth Hook ---------------------------------------------------------------
// Convenience hook to consume AuthContext safely.
// Throws if used outside of <AuthProvider>.
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}