import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import { api } from "@/lib/api";

type User = {
  email: string;
  role: "admin" | "user";
};

type AuthContextType = {
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
};

type JwtPayload = {
  identity: string;
  role?: "user" | "admin";
  email?: string;
  exp: number;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState(
    localStorage.getItem("token") || undefined,
  );
  const [role, setRole] = useState(localStorage.getItem("role") || undefined);

  // Fetch user when app starts (if token exists)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decoded = jwtDecode<{ email: string; role: "admin" | "user" }>(
        token,
      );
      if (decoded && decoded.email && decoded.role) {
        setUser({ email: decoded.email, role: decoded.role });
      }
    } catch (err) {
      console.error("Invalid token", err);
      setUser(null);
    }
  }, []);

  const login = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    const access_token = await api<string>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const decoded = jwtDecode<JwtPayload>(access_token);

    // Save to localStorage
    localStorage.setItem("token", access_token);
    localStorage.setItem("role", decoded.role);

    // Update context state
    setUser({ email: decoded.email, role: decoded.role });
    setToken(access_token);
    setRole(decoded.role);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
