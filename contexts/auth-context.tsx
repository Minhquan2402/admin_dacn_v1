"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  userName: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  refreshAccessToken: () => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('admin_token')
    const refreshToken = localStorage.getItem('admin_refresh_token')
    if (token) {
      setUser({
        id: '1',
        email: 'admin@example.com',
        userName: 'Admin User',
        role: 'admin'
      })
    } else if (refreshToken) {
      // Try to refresh access token automatically
      refreshAccessToken().then((success) => {
        if (success) {
          setUser({
            id: '1',
            email: 'admin@example.com',
            userName: 'Admin User',
            role: 'admin'
          })
        }
        setIsLoading(false)
      })
      return
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Use ApiClient which picks up NEXT_PUBLIC_API_URL or defaults to localhost
      const result = await (await import('@/lib/api')).apiClient.login(email, password)
      if (!result) throw new Error('Login failed')
      // apiClient.login will store the token in localStorage if present; set user from response
      if (result.user) setUser(result.user)
    } catch (error) {
      throw new Error('Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Hàm tự động refresh access token
  const refreshAccessToken = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem('admin_refresh_token')
    if (!refreshToken) return false
    try {
      // Replace with real API call
      // const response = await fetch('/api/refresh', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ refreshToken })
      // })
      // const { accessToken, refreshToken: newRefreshToken } = await response.json()
      // For demo, always succeed
      localStorage.setItem('admin_token', 'mock_token_new')
      // localStorage.setItem('admin_refresh_token', newRefreshToken)
      return true
    } catch {
      logout()
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_refresh_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}