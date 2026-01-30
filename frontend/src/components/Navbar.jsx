import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/Navbar.css";

// Use signOut from our AuthorizationContext
import { useAuth } from "../context/AuthContext";

// import button from amplify 
import {Button} from "@aws-amplify/ui-react";

const luxuryBodyStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 400,
  fontSize: "1.3rem",   
  letterSpacing: "0.3px",
};

const Navbar = () => {
  // Access the navigate function and below we will be sent to the auth page after sign out
  const navigate = useNavigate();
  const { isAuthenticated, logout, isAdmin, loadingAuth } = useAuth();

  // Calls logout from the AuthContext.jsx
  async function handleLogout() {
    // Sets user null, authentication false, and admin as false meaning we are fully logged out
    await logout(); 
    // Navigate back to the auth screen
    navigate("/Auth"); 
  }

  return (
    <header className="navbar">
      {/* Omre logo on click will lead back to home page */}
      <Link to="/" className="logo-link">
        <img src={logo} alt="OMRE Logo" className="logo-image" />
      </Link>

      {/* Nav bar to move across website */}
      <nav className="nav-links">
        {/* Not being signed in you will have to access the sign in page */}
        {!loadingAuth && !isAuthenticated && (
          <Link to="/Auth" className="nav-item">AUTH</Link>
        )}

        {/* Sign out button if authenticated */}
        {!loadingAuth && isAuthenticated && (
          <Button 
            color="#F5F5F5" 
            style={luxuryBodyStyle}                       
            variation="primary"                                 
            //backgroundColor="rgba(82, 18, 0, 0.72)"                     
            border="1px solid rgba(245, 245, 245, 0.85)"                     
            loadingText=""                     
            // On click will sign the user out with the function above!                        
            onClick={() => handleLogout()}           
            >
            Sign Out
          </Button>
        )}

        {/* If authenticated and admin you can reach the admin dashboard */}
        {/* Come back to when we have definite admin roles or talk to ayman  */}
        {/* {!loadingAuth && isAuthenticated && isAdmin && (  */}
        {/* ABOVE IS THE ORIGINAL LINE, EDITED VERSION BELOW FOR NOW */}
        {!loadingAuth && isAuthenticated && ( 
          <Link to="/AdminDashboard" className="nav-item">ADMIN DASHBOARD</Link>
        )}
        
      </nav>
    </header>
  );
};

export default Navbar;

// Possibly edit this older code later and implement it using amplify components instead