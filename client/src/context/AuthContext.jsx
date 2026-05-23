import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { API_PATHS } from '../constants/apiPaths';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Load user from localStorage
  useEffect(() => {
    const checkUserLoggedIn = () => {
      const storedUserInfo = localStorage.getItem('userInfo');

      if (storedUserInfo) {
        try {
          const parsedUser = JSON.parse(storedUserInfo);
          setUser(parsedUser);
        } catch (error) {
          console.error('Failed to parse user credentials:', error);
          localStorage.removeItem('userInfo');
        }
      }

      setLoading(false);
    };

    checkUserLoggedIn();
  }, []);

  // Login
  const login = async (email, password) => {
    setLoading(true);

    try {
      const { data } = await api.post(API_PATHS.auth.login, {
        email,
        password,
      });

      setUser(data);

      localStorage.setItem('userInfo', JSON.stringify(data));

      toast.success(`Welcome back, ${data.name}!`, {
        position: 'top-right',
        autoClose: 3000,
        theme: 'light',
      });

      navigate('/dashboard');

      return { success: true };
    } catch (error) {
      console.error('Login Error:', error);

      const errorMsg =
        error.response?.data?.message ||
        'Login failed. Please check credentials.';

      toast.error(errorMsg, {
        position: 'top-right',
        autoClose: 4000,
        theme: 'light',
      });

      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  };

  // Register
  const register = async (name, email, password) => {
    setLoading(true);

    try {
      await api.post(API_PATHS.auth.register, {
        name,
        email,
        password,
      });

      toast.success(
        'Registration successful! Your account is pending administrator approval.',
        {
          position: 'top-right',
          autoClose: 5000,
          theme: 'light',
        }
      );

      navigate('/login');

      return { success: true };
    } catch (error) {
      console.error('Register Error:', error);

      const errorMsg =
        error.response?.data?.message ||
        'Registration failed. Try again.';

      toast.error(errorMsg, {
        position: 'top-right',
        autoClose: 4000,
        theme: 'light',
      });

      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('userInfo');

    setUser(null);

    toast.info('Logged out successfully.', {
      position: 'top-right',
      autoClose: 2000,
      theme: 'light',
    });

    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);