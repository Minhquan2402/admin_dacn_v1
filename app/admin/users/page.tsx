"use client"

import { useState, useEffect } from "react"
import toast, { Toaster } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Plus, Edit, Lock, Unlock, UserPlus } from "lucide-react"
import { apiClient } from "@/lib/api"

interface User {
  id: string
  email: string
  userName: string
  phone?: string
  role: string
  isVerified: boolean
  createdAt: string
  locked?: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
    // Xử lý khóa/mở khóa tài khoản
    const handleLockUser = async (userId: string, locked: boolean) => {
      console.log('Lock user click:', userId, locked);
      try {
        await apiClient.lockUser(userId, locked)
        fetchUsers()
      } catch (error) {
        console.error('Failed to lock/unlock user:', error)
      }
    }
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    phone: "",
    role: "customer" as "customer" | "admin",
    password: "",
  })

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getUsers({
        page: currentPage,
        limit: 10,
        search: searchTerm,
      })
      setUsers(response.data.users || [])
      setTotalPages(response.data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      // For demo purposes, use mock data
      setUsers([
        {
          id: '1',
          email: 'admin@example.com',
          userName: 'Admin User',
          phone: '0901234567',
          role: 'admin',
          isVerified: true,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          email: 'customer@example.com',
          userName: 'John Doe',
          phone: '0909876543',
          role: 'customer',
          isVerified: true,
          createdAt: '2025-01-15T00:00:00.000Z',
        },
      ])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchUsers()
  }

  const handleAddUser = () => {
    setFormData({
      userName: "",
      email: "",
      phone: "",
      role: "customer",
      password: "",
    })
    setIsAddModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setFormData({
      userName: user.userName,
      email: user.email,
      phone: user.phone || "",
      role: user.role as "customer" | "admin",
      password: "",
    })
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await apiClient.deleteUser(userId)
        fetchUsers()
      } catch (error) {
        console.error('Failed to delete user:', error)
        // For demo, remove from local state
        setUsers(users.filter(user => user.id !== userId))
      }
    }
  }

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await apiClient.updateUser(editingUser.id, formData)
        setIsEditModalOpen(false)
        toast.success("Cập nhật user thành công!")
      } else {
        const { userName, email, phone, role, password } = formData;
        await apiClient.registerUser({ userName, email, phone, role, password });
        setIsAddModalOpen(false)
        toast.success("Thêm user mới thành công!")
      }
      fetchUsers()
    } catch (error) {
      console.error('Failed to save user:', error)
      toast.error("Có lỗi xảy ra, vui lòng thử lại!")
      // For demo, update local state
      if (editingUser) {
        setUsers(users.map(user =>
          user.id === editingUser.id
            ? { ...user, ...formData }
            : user
        ))
        setIsEditModalOpen(false)
      } else {
        const newUser: User = {
          id: Date.now().toString(),
          ...formData,
          isVerified: false,
          createdAt: new Date().toISOString(),
        }
        setUsers([...users, newUser])
        setIsAddModalOpen(false)
      }
    }
  }

  return (
    <>
      <Toaster position="top-right" />
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Button onClick={handleAddUser}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage all registered users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <form onSubmit={handleSearch} className="flex-1 flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Locked</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.userName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isVerified ? 'default' : 'destructive'}>
                          {user.isVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.locked ? 'destructive' : 'default'}>
                          {user.locked ? 'Locked' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.role !== 'admin' && (
                            user.locked ? (
                              <Button variant="default" size="sm" onClick={() => handleLockUser(user.id, false)} title="Mở khóa tài khoản">
                                <Unlock className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button variant="destructive" size="sm" onClick={() => handleLockUser(user.id, true)} title="Khóa tài khoản">
                                <Lock className="h-4 w-4" />
                              </Button>
                            )
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. Fill in the required information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="userName" className="text-right">
                  Name
                </Label>
                <Input
                  id="userName"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select value={formData.role} onValueChange={(value: "customer" | "admin") => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Add User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Make changes below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-userName" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-userName"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Role
                </Label>
                <Select value={formData.role} onValueChange={(value: "customer" | "admin") => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Update User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </>
  )
}