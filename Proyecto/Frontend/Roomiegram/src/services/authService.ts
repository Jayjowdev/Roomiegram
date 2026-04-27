import type {
  AuthError,
  AuthResponse,
  BackendLoginResponse,
  BackendRegisterResponse,
  LoginRequest,
  RegisterRequest,
  UserSession,
} from "../types/Auth";

const API_BASE_URL =
  import.meta.env.VITE_USUARIO_API_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8088";

const SESSION_KEY = "roomiegramSession";

async function readError(response: Response, fallback: string): Promise<Error> {
  try {
    const data: AuthError | string = await response.json();
    if (typeof data === "string") {
      return new Error(data || fallback);
    }

    return new Error(data.message || data.mensaje || fallback);
  } catch {
    return new Error(fallback);
  }
}

function createSessionId(userId: number) {
  return `local-session-${userId}-${Date.now()}`;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw await readError(response, "No se pudo iniciar sesión");
    }

    const data: BackendLoginResponse = await response.json();
    return {
      sessionId: createSessionId(data.id),
      user: {
        id: data.id,
        nombre: data.usuario,
        usuario: data.usuario,
        role: data.role,
      },
    };
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw await readError(response, "No se pudo crear la cuenta");
    }

    const data: BackendRegisterResponse = await response.json();
    return {
      sessionId: createSessionId(data.id),
      user: {
        id: data.id,
        nombre: data.nombre,
        correo: data.correo,
        usuario: data.usuario,
        role: "CLIENTE",
      },
    };
  },

  createDemoSession(): AuthResponse {
    return {
      sessionId: createSessionId(1),
      user: {
        id: 1,
        nombre: "Martina",
        correo: "martina@roomiegram.cl",
        usuario: "martina",
        role: "ADMIN",
      },
    };
  },

  saveSession(sessionId: string, user: UserSession): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId, user }));
  },

  getSession(): AuthResponse | null {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) {
      return null;
    }

    try {
      return JSON.parse(saved) as AuthResponse;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  removeSession(): void {
    localStorage.removeItem(SESSION_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getSession();
  },
};
