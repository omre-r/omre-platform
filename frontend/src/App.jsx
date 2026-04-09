// React Router DOM to navigate between different pages
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Importing the Home component which represents the home page
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import Mixology from "./pages/Mixology";
import Fragrances from "./pages/Fragrances";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import Cart from "./pages/Cart";
import Product from "./pages/Product";
import Profile from "./pages/Profile";
import ScrollToTop from "./components/ScrollToTop";
import { ToastProvider } from "./components/ToastContext";

import "./App.css";

function App() {
  return (
    <ToastProvider>
      <div>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/Auth" element={<Auth />} />
            <Route path="/AdminDashboard" element={<AdminDashboard />} />
            <Route path="/ForgotPassword" element={<ForgotPassword />} />
            <Route path="/Mixology" element={<Mixology />} />
            <Route path="/Fragrances" element={<Fragrances />} />
            <Route path="/AboutUs" element={<AboutUs />} />
            <Route path="/ContactUs" element={<ContactUs />} />
            <Route path="/Cart" element={<Cart />} />
            <Route path="/Fragrances/:parentid" element={<Product />} />
            <Route path="/Profile" element={<Profile />} />
          </Routes>
        </Router>
      </div>
    </ToastProvider>
  );
}

export default App;
