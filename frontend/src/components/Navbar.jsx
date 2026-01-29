import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/Navbar.css";

// Will let us sign out from a button in the navbar
import {signOut} from "aws-amplify/auth";

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
  async function handleSignOut() {
    try {
      // Call the signOut function from Amplify Auth
      await signOut();
      navigate("/Auth"); // On success it will navigate us back to the auth page
      }
      catch (error) {
        console.error("Error signing out: ", error);
      }
  };
  return (
    <header className="navbar">
      {/* Omre logo on click will lead back to home page */}
      <Link to="/" className="logo-link">
        <img src={logo} alt="OMRE Logo" className="logo-image" />
      </Link>

      {/* Nav bar to move across website */}
      <nav className="nav-links">
        {/* !! Add links to respective pages later !! */}
        <Link to="/Auth" className="nav-item">AUTH</Link>
        <Link to="/AdminDashboard" className="nav-item">ADMIN DASHBOARD</Link>
        <Button 
          color="#F5F5F5" 
          style={luxuryBodyStyle}                       
          variation="primary"                                 
          //backgroundColor="rgba(82, 18, 0, 0.72)"                     
          border="1px solid rgba(245, 245, 245, 0.85)"                     
          loadingText=""                     
          // On click will sign the user out with the function above!                        
          onClick={() => handleSignOut()}           
          >
          Sign Out
        </Button>
      </nav>
    </header>
  );
};

export default Navbar;

// Possibly edit this older code later and implement it using amplify components instead