import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  username: string;
  access_token?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if user is authenticated on app load
    const savedAuth = localStorage.getItem('healthAI_auth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      // Check if token exists and is not expired
      if (authData.user && authData.user.access_token) {
        return true;
      }
    }
    return false;
  });
  
  const [user, setUser] = useState<User | null>(() => {
    const savedAuth = localStorage.getItem('healthAI_auth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      if (authData.user && authData.user.access_token) {
        return authData.user;
      }
    }
    return null;
  });

  const login = (userData: User) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('healthAI_auth', JSON.stringify({
      isAuthenticated: true,
      user: userData
    }));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('healthAI_auth');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('healthAI_auth', JSON.stringify({
        isAuthenticated: true,
        user: updatedUser
      }));
    }
  };

  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    if (isAuthenticated && user) {
      localStorage.setItem('healthAI_auth', JSON.stringify({
        isAuthenticated,
        user
      }));
    }
  }, [isAuthenticated, user]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
