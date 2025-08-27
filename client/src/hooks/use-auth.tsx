import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  user: any;
  company: any;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; name: string; companyName: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<{ accessToken: string; refreshToken: string } | null>(null);
  console.log("tokens",tokens)
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const storedTokens = localStorage.getItem("tokens");
    if (storedTokens) {
      setTokens(JSON.parse(storedTokens));
    }
  }, []);

  // Set auth header for API requests
  useEffect(() => {
    if (tokens?.accessToken) {
      // Update API client with auth header
      queryClient.setDefaultOptions({
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
        },
      });
    }
  }, [tokens, queryClient]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/user/profile"],
    enabled: !!tokens?.accessToken,
    queryFn: async () => {
      const res = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      return res.json();
    },
    onSuccess: (data) => {
      setTokens(data);
      localStorage.setItem("tokens", JSON.stringify(data));
      queryClient.invalidateQueries();
      setLocation("/");
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; name: string; companyName: string }) => {
      const res = await apiRequest("POST", "/api/auth/signup", data);
      return res.json();
    },
    onSuccess: (data) => {
      setTokens(data);
      localStorage.setItem("tokens", JSON.stringify(data));
      queryClient.invalidateQueries();
      setLocation("/");
    },
  });

  const logout = () => {
    setTokens(null);
    localStorage.removeItem("tokens");
    queryClient.clear();
    setLocation("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user: profile?.user,
        company: profile?.company,
        login: (email: string, password: string) => loginMutation.mutateAsync({ email, password }),
        signup: (data: { email: string; password: string; name: string; companyName: string }) => signupMutation.mutateAsync(data),
        logout,
        isLoading: isLoading || loginMutation.isPending || signupMutation.isPending,
      }}
    >
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
