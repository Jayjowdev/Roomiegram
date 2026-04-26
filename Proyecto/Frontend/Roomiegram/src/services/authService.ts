import { apiClients } from './api'
import type { LoginRequest, RegisterRequest, UserSession } from '../types/auth'

export async function loginUser(payload: LoginRequest) {
  const response = await apiClients.auth.post<UserSession>('/auth/login', payload)
  return response.data
}

export async function registerUser(payload: RegisterRequest) {
  const response = await apiClients.auth.post('/auth/register', payload)
  return response.data
}