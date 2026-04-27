import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-hot-toast';

const AdminLayout = () => {
  const { axios } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin-specific session state, independent of the global user session
  // Using sessionStorage ensures the admin has to log in again when the tab is closed/reopened
  const [adminToken, setAdminToken] = useState(sessionStorage.getItem('adminToken'));
  const [adminUser, setAdminUser] = useState(null);
  const [verifying, setVerifying] = useState(!!sessionStorage.getItem('adminToken'));

  // On mount (or when adminToken changes), verify the stored admin token
  useEffect(() => {
    const verifyAdmin = async () => {
      if (!adminToken) {
        setVerifying(false);
        return;
      }
      setVerifying(true);
      try {
        const { data } = await axios.get('/api/user/data', {
          headers: { Authorization: adminToken }
        });
        if (data.success && data.user.role === 'admin') {
          setAdminUser(data.user);
        } else {
          // Token invalid or not admin – clear it
          sessionStorage.removeItem('adminToken');
          setAdminToken(null);
          setAdminUser(null);
        }
      } catch {
        sessionStorage.removeItem('adminToken');
        setAdminToken(null);
        setAdminUser(null);
      } finally {
        setVerifying(false);
      }
    };
    verifyAdmin();
  }, [adminToken]);

  // Handle Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post('/api/user/login', { email, password });
      if (data.success) {
        // Verify the user is actually an admin before persisting
        const userRes = await axios.get('/api/user/data', {
          headers: { Authorization: data.token }
        });
        if (userRes.data.success) {
          if (userRes.data.user.role === 'admin') {
            // Store in a separate key so it doesn't interfere with the regular session
            sessionStorage.setItem('adminToken', data.token);
            setAdminToken(data.token);
            setAdminUser(userRes.data.user);
            toast.success("Welcome, Admin");
          } else {
            toast.error("Access denied. Admin privileges required.");
          }
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Admin logout (only clears the admin session, not the regular user)
  const handleAdminLogout = () => {
    sessionStorage.removeItem('adminToken');
    setAdminToken(null);
    setAdminUser(null);
    toast.success('Admin session ended');
  };

  // Show loader while verifying saved admin token
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If no valid admin session, show the Admin Login form
  if (!adminToken || !adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">Admin Portal</h2>
            <p className="text-gray-500 mt-2 text-sm">Sign in to access the dashboard</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none"
                placeholder="admin@meshwar.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
            >
              {loading ? 'Authenticating...' : 'Sign In as Admin'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-green-600 hover:text-green-800 font-medium">← Back to main site</a>
          </div>
        </div>
      </div>
    )
  }

  // If admin is authenticated, render the nested admin routes
  return <Outlet context={{ adminUser, adminToken, handleAdminLogout }} />;
};

export default AdminLayout;
