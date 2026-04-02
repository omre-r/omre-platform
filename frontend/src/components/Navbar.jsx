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

import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/Logo.png";
import "../styles/Navbar.css";
import { useAuth } from "../context/AuthContext";
import cartIcon from "../assets/cartIcon.png";
import profileIcon from "../assets/profileIcon.png";

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
    <header className="navbar"
    style={{position: "sticky", top: "0", zIndex: "10000"}}>
      <div className="nav-left">
        {/* Navbar Logo ------------------------------------------------------------------------------------------ */}
        {/* On click will take user back to home page */}
        <NavLink to="/" className="logo-link">
          <img src={logo} alt="OMRE Logo" className="logo-image" />
        </NavLink>

        <NavLink
          to="/fragrances"
          className={({ isActive }) =>
            isActive ? "nav-item active-nav" : "nav-item"
          }
          style={luxuryBodyStyle}
          >
          Fragrances
        </NavLink>


        {/* {!isAdmin && (  */}
          <>
            <NavLink
              to="/AboutUs"
              className={({ isActive }) =>
                isActive ? "nav-item active-nav" : "nav-item"
              }
              style={luxuryBodyStyle}
              >
              About
            </NavLink>

            <NavLink
              to="/ContactUs"
              className={({ isActive }) =>
                isActive ? "nav-item active-nav" : "nav-item"
              }
              style={luxuryBodyStyle}
              >
              Contact
            </NavLink>
        </> 
      </div>

      {/* Navbar Links ---------------------------------------------------------------------------------------- */}
      {/* Link to auth is shown if loadingAuth false & is not authenticated */}
      <nav className="nav-links">
        {!loadingAuth && !isAuthenticated && (
          <NavLink to="/Auth" 
          className={({ isActive }) =>
            isActive ? "nav-item active-nav" : "nav-item"
          }
          style={luxuryBodyStyle} >Sign In</NavLink>
        )}

        {!loadingAuth && isAuthenticated && isAdmin && (  
          <NavLink to="/AdminDashboard" 
          className={({ isActive }) =>
            isActive ? "nav-item active-nav" : "nav-item"
          }
          style={luxuryBodyStyle}>Admin Dashboard</NavLink>
        )}

        {!loadingAuth && isAuthenticated && (
          <NavLink to="/Mixology" 
          className={({ isActive }) =>
            isActive ? "nav-item active-nav" : "nav-item"
          }
          style={luxuryBodyStyle} >Mixology</NavLink>
        )}

        {/* If loadingAuth is false (complete) and user is authenticated, will have ability to log out */}
        {!loadingAuth && isAuthenticated && (
          <NavLink 
            color="#F5F5F5" 
            style={luxuryBodyStyle}                       
            variation="primary"                                                                
            loadingText=""                                           
            onClick={() => handleLogout()}           
            >
            Sign Out
          </NavLink>
        )}
        {!loadingAuth && isAuthenticated && (
          <NavLink to="/Cart" 
          className={({ isActive }) =>
            isActive ? "nav-item active-nav" : "nav-item"
          }>
            <img src={cartIcon} alt="Cart" className="cart-icon" />
          </NavLink>
        )}

        {!loadingAuth && isAuthenticated && (
            <NavLink to="/Profile" 
            className={({ isActive }) =>
              isActive ? "nav-item active-nav" : "nav-item"
            }>
              <img src={profileIcon} alt="Profile" className="cart-icon" />
            </NavLink>
        )}
      </nav>
    </header>
  );
};

export default Navbar;


// Notes on future improvements:
// TODO: Use amplify instead of regular css