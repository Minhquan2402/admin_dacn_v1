  "use client"

  import { useState, useEffect } from "react"
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
  } from "@/components/ui/dialog"
  import { Label } from "@/components/ui/label"
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
  import { Textarea } from "@/components/ui/textarea"
  import { Search, Plus, Edit, Trash2, Eye } from "lucide-react"
  import { apiClient } from "@/lib/api"

  interface Product {
    id: string
    name: string
    nameEn: string
    description: string
    price: number
    originalPrice?: number
    category: {
      id: string
      name: string
    }
    images: string[]
    stock: number
    isActive: boolean
    isFeatured: boolean
    createdAt: string
  }

  export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)

    // Form data
    const [formData, setFormData] = useState({
      name: "",
      nameEn: "",
      description: "",
      price: 0,
      originalPrice: 0,
      categoryId: "",
      stock: 0,
      isActive: true,
      isFeatured: false,
    })

    // Categories for dropdown
    const [categories, setCategories] = useState<Array<{id: string, name: string}>>([])

    useEffect(() => {
      fetchProducts()
      fetchCategories()
    }, [currentPage, searchTerm])

    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await apiClient.getProducts({
          page: currentPage,
          limit: 10,
          search: searchTerm,
        })
        const mappedProducts = (response.data || []).map((item: any) => ({
          id: item.id || item._id,
          name: item.name,
          nameEn: item.nameEn,
          description: item.description,
          price: item.price,
          originalPrice: item.originalPrice,
          category: typeof item.category === 'object' && item.category !== null
            ? { id: item.category.id || item.category._id || '', name: item.category.name || item.category }
            : { id: '', name: item.category || '' },
          images: item.images || [],
          stock: typeof item.stock === 'number' ? item.stock : (item.stockQuantity ?? 0),
          isActive: typeof item.isActive === 'boolean' ? item.isActive : (item.inStock ?? false),
          isFeatured: item.isFeatured ?? false,
          createdAt: item.createdAt,
        }))
        setProducts(mappedProducts)
        setTotalPages(response.pagination?.totalPages || 1)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchCategories = async () => {
      try {
        const response = await apiClient.getCategories()
        setCategories(response.data?.map((cat: any) => ({ id: cat.id, name: cat.name })) || [])
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price)
    }

    const handleAddProduct = () => {
      setFormData({
        name: "",
        nameEn: "",
        description: "",
        price: 0,
        originalPrice: 0,
        categoryId: "",
        stock: 0,
        isActive: true,
        isFeatured: false,
      })
      setIsAddModalOpen(true)
    }

    const handleEditProduct = (product: Product) => {
      setFormData({
        name: product.name,
        nameEn: product.nameEn,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice || 0,
        categoryId: product.category.id,
        stock: product.stock,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
      })
      setEditingProduct(product)
      setIsEditModalOpen(true)
    }

    const handleDeleteProduct = async (productId: string) => {
      if (confirm("Are you sure you want to delete this product?")) {
        try {
          await apiClient.deleteProduct(productId)
          fetchProducts()
        } catch (error) {
          console.error('Failed to delete product:', error)
          // For demo, remove from local state
          setProducts(products.filter(p => p.id !== productId))
        }
      }
    }

    const handleSubmitProduct = async (e: React.FormEvent) => {
      e.preventDefault()
      try {
        // Chuẩn hóa dữ liệu gửi lên backend
        const payload = {
          name: formData.name,
          nameEn: formData.nameEn,
          description: formData.description,
          price: formData.price,
          originalPrice: formData.originalPrice,
          categoryId: formData.categoryId,
          stockQuantity: formData.stock,
          isActive: formData.isActive,
          isFeatured: formData.isFeatured,
        }
        if (editingProduct) {
          // Update product
          await apiClient.updateProduct(editingProduct.id, payload)
          setIsEditModalOpen(false)
        } else {
          // Add new product
          await apiClient.createProduct(payload)
          setIsAddModalOpen(false)
        }
        fetchProducts()
      } catch (error) {
        console.error('Failed to save product:', error)
        // For demo, update local state
        if (editingProduct) {
          setProducts(products.map(p =>
            p.id === editingProduct.id
              ? { ...p, ...formData, category: categories.find(c => c.id === formData.categoryId) || p.category }
              : p
          ))
          setIsEditModalOpen(false)
        } else {
          const newProduct: Product = {
            id: Date.now().toString(),
            ...formData,
            category: categories.find(c => c.id === formData.categoryId) || { id: formData.categoryId, name: 'Unknown' },
            images: [],
            createdAt: new Date().toISOString(),
          }
          setProducts([...products, newProduct])
          setIsAddModalOpen(false)
        }
      }
    }

    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Products</h2>
            <p className="text-muted-foreground">
              Manage your product inventory and details
            </p>
          </div>
          <Button onClick={handleAddProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Management</CardTitle>
            <CardDescription>
              View and manage all your products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                            {product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <span className="text-gray-400 text-xs">No img</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.nameEn}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{product.category.name}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatPrice(product.price)}</div>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <div className="text-sm text-muted-foreground line-through">
                                {formatPrice(product.originalPrice)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.stock}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={product.isActive
                              ? 'bg-green-500 text-white border-transparent'
                              : 'bg-red-500 text-white border-transparent'}
                          >
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.isFeatured && (
                            <Badge variant="outline">Featured</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                              <Trash2 className="h-4 w-4" />
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

        {/* Add Product Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Create a new product. Fill in the required information below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitProduct}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nameEn" className="text-right">
                    English Name
                  </Label>
                  <Input
                    id="nameEn"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Price (VND)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="originalPrice" className="text-right">
                    Original Price (VND)
                  </Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="categoryId" className="text-right">
                    Category
                  </Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right">
                    Stock
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isActive" className="text-right">
                    Active
                  </Label>
                  <Select value={formData.isActive.toString()} onValueChange={(value) => setFormData({ ...formData, isActive: value === 'true' })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isFeatured" className="text-right">
                    Featured
                  </Label>
                  <Select value={formData.isFeatured.toString()} onValueChange={(value) => setFormData({ ...formData, isFeatured: value === 'true' })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Featured</SelectItem>
                      <SelectItem value="false">Not Featured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Product</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Product Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update product information. Make changes below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitProduct}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-nameEn" className="text-right">
                    English Name
                  </Label>
                  <Input
                    id="edit-nameEn"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="edit-description" className="text-right pt-2">
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-price" className="text-right">
                    Price (VND)
                  </Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-originalPrice" className="text-right">
                    Original Price (VND)
                  </Label>
                  <Input
                    id="edit-originalPrice"
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-categoryId" className="text-right">
                    Category
                  </Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-stock" className="text-right">
                    Stock
                  </Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-isActive" className="text-right">
                    Active
                  </Label>x
                  <Select value={formData.isActive.toString()} onValueChange={(value) => setFormData({ ...formData, isActive: value === 'true' })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-isFeatured" className="text-right">
                    Featured
                  </Label>
                  <Select value={formData.isFeatured.toString()} onValueChange={(value) => setFormData({ ...formData, isFeatured: value === 'true' })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Featured</SelectItem>
                      <SelectItem value="false">Not Featured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Update Product</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }