import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/Navbar.css";

const Navbar = () => {
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
      </nav>
    </header>
  );
};

export default Navbar;
