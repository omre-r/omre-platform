import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Brands from './pages/Brands';
import BrandStorefront from './pages/BrandStorefront';
import Cart from './pages/Cart';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';

// Auth-required pages
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import CustomerOrders from './pages/CustomerOrders';

// Admin pages
import AdminApplications from './pages/admin/AdminApplications';
import AdminOrders from './pages/admin/AdminOrders';
import AdminEvents from './pages/admin/AdminEvents';

// Brand owner pages
import BrandDashboard from './pages/brand/BrandDashboard';
import BrandOrders from './pages/brand/BrandOrders';
import BrandProducts from './pages/brand/BrandProducts';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:id" element={<ProductDetail />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/brands/:slug" element={<BrandStorefront />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:slug" element={<EventDetail />} />

        {/* Authenticated (any role) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders/confirmation/:id" element={<OrderConfirmation />} />
        </Route>

        {/* Customer */}
        <Route element={<ProtectedRoute role="customer" />}>
          <Route path="/orders" element={<CustomerOrders />} />
        </Route>

        {/* Brand owner */}
        <Route element={<ProtectedRoute role="brand_owner" />}>
          <Route path="/brand/dashboard" element={<BrandDashboard />} />
          <Route path="/brand/orders" element={<BrandOrders />} />
          <Route path="/brand/products" element={<BrandProducts />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="/admin/applications" element={<AdminApplications />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/events" element={<AdminEvents />} />
        </Route>
      </Routes>
      <Footer />
    </>
  );
}
