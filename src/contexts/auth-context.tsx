import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  username: string;
  farmName?: string;
  onboardingCompleted?: boolean;
  farmTier?: "basic" | "small_business" | "enterprise";
  // Subscription fields
  subscriptionTier?: "free" | "small_farm" | "professional" | "enterprise";
  subscriptionStatus?: "active" | "trial" | "expired" | "cancelled";
  subscriptionEndDate?: string;
  trialEndDate?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Check if user is authenticated on app load
  const { data: authData, isLoading, refetch } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          return null; // Not authenticated
        }
        throw new Error("Failed to check authentication");
      }
      
      const data = await response.json();
      return data.user;
    },
    retry: false,
  });

  useEffect(() => {
    if (authData) {
      setUser(authData);
    } else if (authData === null) {
      setUser(null);
    }
  }, [authData]);

  const login = (userData: User) => {
    setUser(userData);
    refetch(); // Refresh user data from server
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      refetch(); // Refresh auth state
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}