// This file is creating a global authentication store for the whole webapp
// It will know "Am i logged in, who is the user, are they an admin, etc"
// In basic terms it will help every page now if you are authorized

// UseState stores the values like user or isAuthenticated
// Use effect runs side effects after rendering, so it will kick off the initial auth check
// Create context creates a global container that can be read throughout the app
// Use context lets components read from the contianer
import { createContext, useContext, useEffect, useState } from "react";

// getCurrentUser checks if someone is signed in rn
// fetchAuthSession gets current session/tokens so we can read things like groups or roles
import { getCurrentUser, fetchAuthSession, signOut } from "aws-amplify/auth";

// Creating the global context container, null until wrapping the app 
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // Starts true as we have not checked any authentication yet
    const [loadingAuth, setLoadingAuth] = useState(true);
    // Below becomes true if user is signed in
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    // Stores what is returned 
    const [user, setUser] = useState(null); 
    // Flag to identify if user is an admin
    const [isAdmin, setIsAdmin] = useState(false);

    // Check status function, will refresh and see if you are logged in, logged out, an admin, this is the source of truth
    async function refreshAuth() {
        try {
            // If not signed in will throw
            const currentUser = await getCurrentUser(); 
            setUser(currentUser);
            setIsAuthenticated(true);
            // On success will get current user, set it, and make sure that authentication is true

            // TEMP DEBUG CHECK CONSOLE LOG !!!!!!!!!!!!!!!!!!!!!!!!!!!!
            //console.log("CURRENT USER:", currentUser);


            // See what groups and possible admin access, treat as try block if not admin
            try {
                // Below returns id and access tokens
                const session = await fetchAuthSession();

                // TEMP DEBUG CHECK CONSOLE LOG !!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                //console.log("AUTH SESSION:", session);
                //console.log("ID TOKEN PAYLOAD:", session?.tokens?.idToken?.payload);
                //console.log("ACCESS TOKEN PAYLOAD:", session?.tokens?.accessToken?.payload);

                const groups =
                // Chain ?. in case of tokens not the shape expected
                // || [] if no groups exist
                session?.tokens?.idToken?.payload?.["cognito:groups"] || [];
                // Groups claim is stored on the ID token payload, under cognito:groups
                setIsAdmin(Array.isArray(groups) && groups.includes("admin"));
            } 
            catch {
                // Not an admin
                setIsAdmin(false);
                }
        } 
        // If error arises
        catch {
            // Null user, not authenticated, not an admin
            setUser(null);
            setIsAuthenticated(false);
            setIsAdmin(false);
        } 
        finally {
            // Loading auth is finished
            setLoadingAuth(false);
        }
    }

    async function logout() {
        // We reset state immediately so UI updates instantly, even before any refreshAuth call
        // Sign out clears the session
        // Nullifies and sets false any information previously
        await signOut();
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
    }

    // Check on app load
    // When refresh page will call refreshAuth to check the current session
    // Will keep user logged in after refresh
    useEffect(() => {
        refreshAuth();
    }, []);

    return (
        // Making the data globally available 
        // Provider is from Createcontext
        <AuthContext.Provider
        value={{
            // payload that every component can read via useContext(AuthContext)
            // Whenever any value inside changes, they will all be rerendered
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

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
