import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/index.ts';
import { api } from '../services/api.ts';
import { socket } from '../services/socket.ts';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  isLocked: boolean;
  appPin: string | null;
  unlockApp: (pin: string) => boolean;
  setAppPin: (pin: string | null) => void;
  switchUser: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  blockUser: (targetUserId: string) => Promise<void>;
  unblockUser: (targetUserId: string) => Promise<void>;
  sendOtp: (phone: string) => Promise<any>;
  loginWithPhone: (phone: string, otp: string, name?: string, username?: string) => Promise<boolean>;
  loginWithEmail: (email: string, pass: string, name?: string) => Promise<boolean>;
  logout: () => void;
  refreshUsers: () => Promise<void>;
  deleteMyAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appPin, setPinState] = useState<string | null>(() => localStorage.getItem('connectra_app_pin'));
  const [isLocked, setIsLocked] = useState<boolean>(() => !!localStorage.getItem('connectra_app_pin'));

  const refreshUsers = async () => {
    try {
      const users = await api.getUsers();
      setAllUsers(users);
      const savedUserId = localStorage.getItem('connectra_active_user_id') || 'user_alex';
      const user = users.find((u) => u.id === savedUserId) || users[0];
      if (user) {
        setCurrentUser(user);
        socket.connect(user.id);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUsers();

    // Listen to presence updates from other users
    const unsubPresence = socket.on('presence:update', (payload: { userId: string; status: User['status']; lastSeen: string }) => {
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === payload.userId ? { ...u, status: payload.status, lastSeen: payload.lastSeen } : u
        )
      );
      setCurrentUser((prev) =>
        prev && prev.id === payload.userId ? { ...prev, status: payload.status, lastSeen: payload.lastSeen } : prev
      );
    });

    return () => {
      unsubPresence();
      socket.disconnect();
    };
  }, []);

  const switchUser = async (userId: string) => {
    const target = allUsers.find((u) => u.id === userId);
    if (target) {
      localStorage.setItem('connectra_active_user_id', userId);
      setCurrentUser(target);
      socket.identify(userId);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    try {
      const updated = await api.updateUser(currentUser.id, updates);
      setCurrentUser(updated);
      setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const blockUser = async (targetUserId: string) => {
    if (!currentUser) return;
    try {
      const res = await api.toggleBlockUser(currentUser.id, targetUserId, 'block');
      setCurrentUser((prev) => (prev ? { ...prev, blockedUserIds: res.blockedUserIds } : prev));
    } catch (err) {
      console.error('Failed to block user:', err);
    }
  };

  const unblockUser = async (targetUserId: string) => {
    if (!currentUser) return;
    try {
      const res = await api.toggleBlockUser(currentUser.id, targetUserId, 'unblock');
      setCurrentUser((prev) => (prev ? { ...prev, blockedUserIds: res.blockedUserIds } : prev));
    } catch (err) {
      console.error('Failed to unblock user:', err);
    }
  };

  const sendOtp = async (phone: string) => {
    return api.sendOtp(phone);
  };

  const loginWithPhone = async (phone: string, otp: string, name?: string, username?: string) => {
    try {
      const res = await api.verifyOtp(phone, otp, name, username);
      if (res.user) {
        localStorage.setItem('connectra_active_user_id', res.user.id);
        setCurrentUser(res.user);
        setAllUsers((prev) => {
          if (prev.some((u) => u.id === res.user.id)) {
            return prev.map((u) => (u.id === res.user.id ? res.user : u));
          }
          return [...prev, res.user];
        });
        socket.connect(res.user.id);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to verify OTP with backend:', err);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, _pass: string, name?: string) => {
    try {
      let res;
      try {
        res = await api.loginEmail(email);
      } catch (loginErr) {
        // If user not found, auto-register
        res = await api.registerEmail(email, name);
      }

      if (res.user) {
        localStorage.setItem('connectra_active_user_id', res.user.id);
        setCurrentUser(res.user);
        setAllUsers((prev) => {
          if (prev.some((u) => u.id === res.user.id)) {
            return prev.map((u) => (u.id === res.user.id ? res.user : u));
          }
          return [...prev, res.user];
        });
        socket.connect(res.user.id);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to authenticate email:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('connectra_active_user_id');
    setCurrentUser(null);
  };

  const deleteMyAccount = async () => {
    if (!currentUser) return;
    try {
      await api.deleteAccount(currentUser.id);
      localStorage.removeItem('connectra_active_user_id');
      await refreshUsers();
    } catch (err) {
      console.error('Failed to delete account:', err);
    }
  };

  const unlockApp = (pin: string) => {
    if (appPin && pin === appPin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const setAppPin = (pin: string | null) => {
    if (pin) {
      localStorage.setItem('connectra_app_pin', pin);
      setPinState(pin);
    } else {
      localStorage.removeItem('connectra_app_pin');
      setPinState(null);
      setIsLocked(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isLoading,
        isLocked,
        appPin,
        unlockApp,
        setAppPin,
        switchUser,
        updateProfile,
        blockUser,
        unblockUser,
        sendOtp,
        loginWithPhone,
        loginWithEmail,
        logout,
        refreshUsers,
        deleteMyAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
