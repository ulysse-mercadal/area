export interface DecodedToken {
  sub: number;
  email: string;
  role: string;
}

export interface AuthContextType {
  user: DecodedToken | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (details: { email: string; password: string; name: string; surname: string }) => Promise<void>;
  logout: () => void;
  isTokenValid: () => Promise<any>;
}
