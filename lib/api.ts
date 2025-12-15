const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
class ApiClient {
            // Khóa hoặc mở khóa tài khoản người dùng (chỉ admin)
            async lockUser(id: string, isLocked: boolean) {
              return this.request(`/users/${id}/lock`, {
                method: 'PATCH',
                body: JSON.stringify({ isLocked }),
              });
            }
        // Issue voucher to a specific user (admin only)
        async issueVoucherToUser(voucherId: string, userId: string) {
          return this.request(`/vouchers/${voucherId}/issue`, {
            method: 'POST',
            body: JSON.stringify({ userId }),
          });
        }
      // Vouchers API
      async getVouchers() {
        return this.request('/vouchers');
      }

      async createVoucher(data: any) {
        return this.request('/vouchers', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
    // Cập nhật hồ sơ người dùng hiện tại
    async updateCurrentUserProfile(data: any) {
      return this.request('/users/me/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    }
  // Lấy thông tin hồ sơ người dùng hiện tại
  async getCurrentUserProfile() {
    return this.request('/users/me/profile')
  }
    // Approve a pending shop
    async approveShop(id: string) {
      return this.request(`/shops/${id}/approve`, {
        method: 'PATCH',
      });
    }

    // Reject a pending shop
    async rejectShop(id: string) {
      return this.request(`/shops/${id}/reject`, {
        method: 'PATCH',
      });
    }

    async getRegisterShopOwnerRequests(params?: { status?: 'pending' | 'approved' | 'rejected'; page?: number; limit?: number }) {
      const query = new URLSearchParams();
      if (params?.status) query.append('status', params.status);
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      const qs = query.toString();
      return this.request(`/register-shop-owner${qs ? `?${qs}` : ''}`);
    }

    async reviewRegisterShopOwnerRequest(id: string, payload: { status: 'approved' | 'rejected'; reviewMessage?: string }) {
      return this.request(`/register-shop-owner/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    }
    // Assign ticket to agent (admin only)
    async assignTicket(id: string, assignedTo: string) {
      return this.request(`/tickets/${id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ assignedTo }),
      });
    }

    // Update ticket status (admin or assigned agent)
    async updateTicketStatus(id: string, status: string) {
      return this.request(`/tickets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    }
  // Livestreams API
  async getLivestreams(params?: { status?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    return this.request(`/livestreams?${query}`);
  }
    // Tickets API
    async getTickets() {
      return this.request('/tickets');
    }

    async getSupportChatThreads(params?: { search?: string; limit?: number; offset?: number }) {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (typeof params?.limit === 'number') query.append('limit', String(params.limit));
      if (typeof params?.offset === 'number') query.append('offset', String(params.offset));
      const qs = query.toString();
      const result = await this.request(`/support/chat/threads${qs ? `?${qs}` : ''}`);
      return result?.data ?? result;
    }

    async getSupportChatThreadByUser(userId: string) {
      const result = await this.request(`/support/chat/threads/${userId}`);
      return result?.data ?? result;
    }

    async sendSupportChatMessageToUser(userId: string, content: string) {
      const result = await this.request(`/support/chat/threads/${userId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      return result?.data ?? result;
    }

    async markSupportChatThreadReadByAdmin(userId: string) {
      const result = await this.request(`/support/chat/threads/${userId}/read`, {
        method: 'PATCH',
      });
      return result?.data ?? result;
    }
  // Upload product images (multipart/form-data)
  async uploadProductImages(productId: string, formDataImg: FormData) {
    const url = `${this.baseURL}/products/${productId}/images`
    const token = localStorage.getItem('admin_token')
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    // Không đặt Content-Type, để browser tự set boundary
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formDataImg,
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return response.json()
  }
  // Xóa ảnh sản phẩm
  async deleteProductImage(productId: string, imageUrl: string) {
    const url = `${this.baseURL}/products/${productId}/images`;
    const token = localStorage.getItem('admin_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }
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
    } catch (err: unknown) {
      // Network errors (server down, CORS, etc.)
      console.error('Network request failed:', err)
      if (err instanceof Error) throw new Error(`Network request failed: ${err.message}`)
      throw new Error(`Network request failed: ${String(err)}`)
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

  // Xóa vĩnh viễn sản phẩm (Admin only)
  async deleteProductPermanent(id: string) {
    return this.request(`/products/${id}/permanent`, {
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

    // Lấy managerId từ localStorage (giả sử lưu userId admin ở key 'admin_user_id')
    let managerId = ''
    try {
      managerId = localStorage.getItem('admin_user_id') || ''
    } catch {}
    // Nếu chưa có, thử lấy từ token hoặc context (tùy hệ thống)
    const managerIdParam = managerId ? `managerId=${managerId}&` : ''
    return this.request(`/users/me/manage/orders?${managerIdParam}${query}`)
  }

  async getOrderById(id: string) {
    return this.request(`/orders/${id}`)
  }

  async updateOrderStatus(id: string, status: string, note: string = '') {
  return this.request(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      note,
      changedBy: 'admin'
    }),
  })
}

  // Thêm API lấy tất cả đơn hàng (cho admin)
  async getAllOrders(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    return this.request(`/orders?${query}`);
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

  // Notifications API
  async sendNotificationToUser(data: {
    audience: 'user',
    targetId: string,
    title: string,
    message: string,
    type?: string
  }) {
    return this.request('/notifications/send', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async broadcastNotification(data: {
    audience: 'all_users' | 'all_shops',
    title: string,
    message: string
  }) {
    return this.request('/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)