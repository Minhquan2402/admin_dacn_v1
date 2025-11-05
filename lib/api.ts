// API client for BE_DACN_v1 backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Add auth token if available
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }
    }

    let response: Response
    try {
      response = await fetch(url, config)
    } catch (err: any) {
      // Network errors (server down, CORS, etc.)
      console.error('Network request failed:', err)
      throw new Error(`Network request failed: ${err?.message ?? String(err)}`)
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Users API
  async getUsers(params?: { page?: number; limit?: number; search?: string }) {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.search) query.append('search', params.search)

    return this.request(`/users?${query}`)
  }

  async getUserById(id: string) {
    return this.request(`/users/${id}`)
  }


  // Đăng ký user qua /auth/register
  async registerUser(data: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateUser(id: string, data: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    })
  }

  // Categories API
  async getCategories() {
    return this.request('/categories')
  }

  async getCategoryById(id: string) {
    return this.request(`/categories/${id}`)
  }

  async createCategory(data: any) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCategory(id: string, data: any) {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }
  async deleteCategoryWithForce(id: string, force: boolean = false) {
    return this.request(`/categories/${id}?force=${force}`, {
      method: 'DELETE',
    })
  }

  // Products API
  async getProducts(params?: { page?: number; limit?: number; category?: string; search?: string }) {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.category) query.append('category', params.category)
    if (params?.search) query.append('q', params.search)

    return this.request(`/products?${query}`)
  }

  async getProductById(id: string) {
    return this.request(`/products/${id}`)
  }

  async createProduct(data: any) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateProduct(id: string, data: any) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    })
  }

  // Orders API
  async getOrders(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.status) query.append('status', params.status)
    if (params?.search) query.append('search', params.search)

    return this.request(`/orders?${query}`)
  }

  async getOrderById(id: string) {
    return this.request(`/orders/${id}`)
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  // Auth API
  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (response.token) {
      localStorage.setItem('admin_token', response.token)
    }

    return response
  }

  async logout() {
    localStorage.removeItem('admin_token')
  }

  // Dashboard stats
  async getDashboardStats() {
    return this.request('/admin/stats')
  }
}

export const apiClient = new ApiClient(API_BASE_URL)