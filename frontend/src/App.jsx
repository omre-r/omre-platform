import React from "react";

// React Router DOM to navigate between different pages
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Importing the Home component which represents the home page
import Home from "./pages/Home";
import Auth from "./pages/Auth";

import './App.css'

function App() {
  return (
    <div>
    <Router>
      <Routes>
        {/* we can add more routes here as needed, this is the home route which shows the home page */}
        <Route path="/" element={<Home />} />
        <Route path="/Auth" element={<Auth />} />
      </Routes>
    </Router>
    </div>
  );
}

export default App
