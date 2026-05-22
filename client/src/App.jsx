import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Spinner from './components/Spinner';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Naukri from './pages/Naukri';
import Indeed from './pages/Indeed';
import Analytics from './pages/Analytics';
import PaymentTracker from './pages/PaymentTracker';
import Users from './pages/Users';

// Protected Route wrapper component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Spinner fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Application Inner Layout Manager
const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main dashboard content container */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        {/* Top Navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Scrollable subpage view container */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/naukri" element={<Naukri />} />
              <Route path="/indeed" element={<Indeed />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/payment-tracker" element={<PaymentTracker />} />
              <Route path="/users" element={<Users />} />
              {/* Fallback to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard pages layout wrapper */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Toast notifications container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </AuthProvider>
  );
}

export default App;
