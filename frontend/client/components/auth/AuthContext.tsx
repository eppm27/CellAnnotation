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
  registerWithToken: (token: string) => void;
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

  const applyToken = (accessToken: string) => {
    const decoded = jwtDecode<JwtPayload>(accessToken);
    if (!decoded.email || !decoded.role) {
      throw new Error("Invalid authentication token");
    }

    localStorage.setItem("token", accessToken);
    localStorage.setItem("role", decoded.role);
    setUser({ email: decoded.email, role: decoded.role });
    setToken(accessToken);
    setRole(decoded.role);
  };

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

    applyToken(access_token);
  };

  const registerWithToken = (accessToken: string) => {
    applyToken(accessToken);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  };

  return (
    <AuthContext.Provider value={{ user, login, registerWithToken, logout }}>
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
