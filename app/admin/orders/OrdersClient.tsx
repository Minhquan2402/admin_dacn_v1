"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Eye, Edit } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiClient } from "@/lib/api"

interface Order {
  id: string
  _id?: string
  userId: {
    _id: string
    userName: string
    email: string
  }
  items: Array<{
    productId: string;
    productName: string;
    productImage?: string;
    quantity: number;
    price: number;
    subtotal?: number;
  }>
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  createdAt: string
  updatedAt: string
}

const statusColors = {
  pending: 'secondary',
  confirmed: 'default',
  preparing: 'outline',
  shipping: 'outline',
  delivered: 'default',
  cancelled: 'destructive',
} as const

const paymentStatusColors = {
  pending: 'secondary',
  paid: 'default',
  failed: 'destructive',
  refunded: 'outline',
} as const

export default function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Form data for edit
  const [editFormData, setEditFormData] = useState({
    status: 'pending' as Order['status'],
    paymentStatus: 'pending' as Order['paymentStatus'],
    notes: '',
  })
  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAllOrders({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
      });
      const orders = response?.data?.orders || [];
      console.log('DEBUG ORDERS:', orders);
      setOrders(orders);
      setTotalPages(response?.data?.pagination?.totalPages || 1);
    } catch (error: any) {
      if (error?.message?.includes('401') || error?.message?.includes('đăng nhập')) {
        alert('Bạn cần đăng nhập để xem danh sách đơn hàng!');
      } else {
        alert('Không thể lấy danh sách đơn hàng!');
      }
      setOrders([]);
      setTotalPages(1);
    }
    setLoading(false);
  };

  function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    if (!orderId || orderId === "undefined") {
      alert("Order ID không hợp lệ!");
      return;
    }
    try {
      await apiClient.updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (error) {
      alert('Đổi trạng thái thất bại!');
      console.error('Failed to update order status:', error);
      setOrders(orders.map((order: Order) =>
        order.id === orderId
          ? { ...order, status: newStatus as Order['status'] }
          : order
      ));
    }
  }

  function handleViewOrder(order: Order) {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  }

  function handleEditOrder(order: Order) {
    setSelectedOrder(order);
    setEditFormData({
      status: order.status,
      paymentStatus: order.paymentStatus,
      notes: '',
    });
    setIsEditModalOpen(true);
  }

  async function handleSubmitEditOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      // await apiClient.updateOrder(selectedOrder.id, editFormData)
      setIsEditModalOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order:', error);
      setOrders(orders.map((order: Order) =>
        order.id === selectedOrder.id
          ? { ...order, ...editFormData }
          : order
      ));
      setIsEditModalOpen(false);
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground">
            Manage customer orders and fulfillment
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
          <CardDescription>
            View and manage all customer orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [<TableRow key="loading-row">
                    <TableCell colSpan={8} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>]
                ) : orders.length === 0 ? (
                  [<TableRow key="empty-row">
                    <TableCell colSpan={8} className="text-center">
                      No orders found
                    </TableCell>
                  </TableRow>]
                ) : (
                  orders.map((order, idx) => (
                    <TableRow key={order.id || order._id || idx}>
                      <TableCell className="font-medium">{order.id || order._id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.userId?.userName ?? "Unknown User"}</div>
                          <div className="text-sm text-muted-foreground">{order.userId?.email ?? "No email"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {/* Nếu render danh sách item, cần key cho từng phần tử */}
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </TableCell>
                      <TableCell>{formatPrice(order.total)}</TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange((order.id || order._id) + '', value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <Badge variant={statusColors[order.status]}>
                              {order.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending" key="pending">Pending</SelectItem>
                            <SelectItem value="confirmed" key="confirmed">Confirmed</SelectItem>
                            <SelectItem value="preparing" key="preparing">Preparing</SelectItem>
                            <SelectItem value="shipping" key="shipping">Shipping</SelectItem>
                            <SelectItem value="delivered" key="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled" key="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={paymentStatusColors[order.paymentStatus]}>
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}>
                            <Eye className="h-4 w-4" />
                          </Button>
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

      {/* View Order Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              View complete order information and items
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer</Label>
                  <p className="text-sm">{selectedOrder.userId?.userName ?? "Unknown User"}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.userId?.email ?? "No email"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Order Date</Label>
                  <p className="text-sm">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={statusColors[selectedOrder.status]} className="ml-2">
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Status</Label>
                  <Badge variant={paymentStatusColors[selectedOrder.paymentStatus]} className="ml-2">
                    {selectedOrder.paymentStatus}
                  </Badge>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Order Items</Label>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item, idx) => (
                        <TableRow key={item.productId || idx}>
                          <TableCell>{item.productName || "Unknown Product"}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                          <TableCell className="text-right">{formatPrice(item.subtotal ?? item.price * item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow key="order-total-row">
                        <TableCell colSpan={3} className="text-right font-medium">Total Amount:</TableCell>
                        <TableCell className="text-right font-bold">{formatPrice(selectedOrder.total)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Order - {selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Update order status and payment information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEditOrder}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">
                  Order Status
                </Label>
                <Select value={editFormData.status} onValueChange={(value) => setEditFormData({ ...editFormData, status: value as Order['status'] })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="shipping">Shipping</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-payment-status" className="text-right">
                  Payment Status
                </Label>
                <Select value={editFormData.paymentStatus} onValueChange={(value) => setEditFormData({ ...editFormData, paymentStatus: value as Order['paymentStatus'] })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-notes" className="text-right pt-2">
                  Notes
                </Label>
                <Textarea
                  id="edit-notes"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="col-span-3"
                  placeholder="Add any notes about this order..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Update Order</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
