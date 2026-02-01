/*
IMPORT LIST ------------------------------------------------------------------------------
Explaining only necessary imports
  - useNavigate, on logout will take a user back to the login screen
  - useAuth from AuthContext, pulls functions necessary
    - isAuthenticated : Making sure that it is either true (signed in) or false (out)
    - logout : reimplemented within auth context and able to call from there to log out of the platform, sets information as null and/or false
    - isAdmin : will check if you have admin priviledge to access admin dashboard
    - loadingAuth : To make sure authentication is done
*/ 

import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/Navbar.css";
import { useAuth } from "../context/AuthContext";
import {Button} from "@aws-amplify/ui-react";

const luxuryBodyStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 400,
  fontSize: "1.3rem",   
  letterSpacing: "0.3px",
};

// Navbar -----------------------------------------------------------------------------------------------------
// Handles navigation between pages
const Navbar = () => {
  // Functions -------------------------------------------------------------------------------------------------
  // Navigate between pages as needed if logging out will be sent to Auth
  // Pulling functions from AuthContext to check authentication
  // handle log out function called from AuthContext to logout and move back to login page after
  const navigate = useNavigate();
  const { isAuthenticated, logout, isAdmin, loadingAuth } = useAuth();
  async function handleLogout() {
    await logout(); 
    navigate("/Auth"); 
  }

  return (
    <header className="navbar">
      {/* Navbar Logo ------------------------------------------------------------------------------------------ */}
      {/* On click will take user back to home page */}
      <Link to="/" className="logo-link">
        <img src={logo} alt="OMRE Logo" className="logo-image" />
      </Link>

      {/* Navbar Links ---------------------------------------------------------------------------------------- */}
      {/* Link to auth is shown if loadingAuth false & is not authenticated */}
      <nav className="nav-links">
        {!loadingAuth && !isAuthenticated && (
          <Link to="/Auth" className="nav-item">AUTH</Link>
        )}

        {/* If loadingAuth is false (complete) and user is authenticated, will have ability to log out */}
        {!loadingAuth && isAuthenticated && (
          <Button 
            color="#F5F5F5" 
            style={luxuryBodyStyle}                       
            variation="primary"                                                   
            border="1px solid rgba(245, 245, 245, 0.85)"                     
            loadingText=""                                           
            onClick={() => handleLogout()}           
            >
            Sign Out
          </Button>
        )}

         {!loadingAuth && isAuthenticated && isAdmin && (  
        // {!loadingAuth && isAuthenticated && ( 
          <Link to="/AdminDashboard" className="nav-item">ADMIN DASHBOARD</Link>
        )}
        
      </nav>
    </header>
  );
};

export default Navbar;


// Notes on future improvements:
// TODO: Use amplify instead of regular css
// TODO: Uncomment Admin line and fix that up after I become admin