export type LoginRequest = {
  usuario: string;
  contrasena: string;
};

export type RegisterRequest = {
  nombre: string;
  correo: string;
  usuario: string;
  contrasena: string;
  telefono: string;
};

export type BackendLoginResponse = {
  id: number;
  usuario: string;
  role: string;
  mensaje?: string;
};

export type BackendRegisterResponse = {
  id: number;
  nombre: string;
  correo: string;
  usuario: string;
  telefono?: string;
};

export type UserSession = {
  id: number;
  nombre: string;
  correo?: string;
  usuario: string;
  role?: string;
};

export type AuthResponse = {
  sessionId: string;
  user: UserSession;
};

export type AuthError = {
  message?: string;
  mensaje?: string;
  errors?: Record<string, string>;
};
