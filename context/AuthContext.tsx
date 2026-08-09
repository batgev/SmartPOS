import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import sessionService from "../services/session.service";

export type LoggedInUser = {
  id: number;
  username: string;
  fullName: string;
  role: string;
};

type AuthContextType = {
  user: LoggedInUser | null;
  loading: boolean;
  login: (user: LoggedInUser) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<LoggedInUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const savedUser =
        await sessionService.getUser();

      if (savedUser) {
        setUser(savedUser);
      }
    } catch (error) {
      console.error(
        "Failed to restore session:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function login(user: LoggedInUser) {
    await sessionService.saveUser(user);
    setUser(user);
  }

  async function logout() {
    await sessionService.clearUser();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}