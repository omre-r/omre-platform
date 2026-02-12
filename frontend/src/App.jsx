// React Router DOM to navigate between different pages
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Importing the Home component which represents the home page
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import ForgotPassword from "./pages/ForgotPassword";

import './App.css'

function App() {
  return (
    <div>
    <Router>
      <Routes>
        {/* we can add more routes here as needed, this is the home route which shows the home page */}
        <Route path="/" element={<Home />} />
        <Route path="/Auth" element={<Auth />} />
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/ForgotPassword" element={<ForgotPassword />} />
      </Routes>
    </Router>
    </div>
  );
}

export default App
