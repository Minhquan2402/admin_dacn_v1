"use client"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import React from "react"
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
      description: string
      price: number
      originalPrice?: number
      category: {
        id: string
        name: string
        parentName?: string
      }
      unit?: string
      images: string[]
      stock: number
      isActive: boolean
      isFeatured: boolean
      createdAt: string
    }

  export default function ProductsPage() {
  // State lưu file ảnh khi thêm/sửa sản phẩm
  const [imageFiles, setImageFiles] = useState<File[]>([])
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
      description: "",
      price: 0,
      originalPrice: 0,
      categoryId: "",
      unit: "",
      stock: 0,
      isActive: true,
      isFeatured: false,
    })
  // ...existing code...

  // Categories dạng cây (có children)
  const [categories, setCategories] = useState<Array<any>>([])

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
        const mappedProducts = (response.data || []).map((item: any) => {
          let parentName = '';
          if (item.category && item.category.parentId && categories.length > 0) {
            const parentCat = categories.find(c => c.id === item.category.parentId);
            if (parentCat) parentName = parentCat.name;
          }
          // Đảm bảo id là string, không undefined/null
          let id = "";
          if (typeof item.id === "string" && item.id) id = item.id;
          else if (typeof item._id === "string" && item._id) id = item._id;
          return {
            id,
            name: item.name,
            nameEn: item.nameEn,
            description: item.description,
            price: item.price,
            originalPrice: item.originalPrice,
            category: typeof item.category === 'object' && item.category !== null
              ? { id: item.category.id || item.category._id || '', name: item.category.name || item.category, parentName }
              : { id: '', name: item.category || '', parentName },
            images: item.images || [],
            stock: typeof item.stock === 'number' ? item.stock : (item.stockQuantity ?? 0),
            isActive: typeof item.isActive === 'boolean' ? item.isActive : (item.inStock ?? false),
            isFeatured: item.isFeatured ?? false,
            createdAt: item.createdAt,
          }
        })
        setProducts(mappedProducts)
        setTotalPages(response.pagination?.totalPages || 1)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }

    // Lấy category dạng cây (có children)
    const fetchCategories = async () => {
      try {
        const response = await apiClient.getCategories()
        setCategories(response.data || [])
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
        description: "",
        price: 0,
        originalPrice: 0,
        categoryId: "",
        unit: "",
        stock: 0,
        isActive: true,
        isFeatured: false,
      })
      setImageFiles([])
      setIsAddModalOpen(true)
    }

    const handleEditProduct = (product: Product) => {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice || 0,
        categoryId: product.category.id,
        unit: product.unit ?? "",
        stock: product.stock,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
      })
      setImageFiles([])
      setEditingProduct(product)
      setIsEditModalOpen(true)
    }

    const handleDeleteProduct = async (productId: string) => {
      console.log('Delete productId:', productId)
      if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm này? Hành động này không thể hoàn tác.")) {
        try {
          // Xoá mềm trước
          await apiClient.deleteProduct(productId)
          // Sau đó xoá vĩnh viễn
          await apiClient.deleteProductPermanent(productId)
          setProducts(prev => prev.filter(p => p.id !== productId))
        } catch (error) {
          console.error('Failed to permanently delete product:', error)
          setProducts(prev => prev.filter(p => p.id !== productId))
        }
      }
    }

    const handleSubmitProduct = async (e: React.FormEvent) => {
      e.preventDefault()
      try {
        // Chuẩn hóa dữ liệu gửi lên backend
        const payload = {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          originalPrice: formData.originalPrice,
          category: formData.categoryId, // truyền id cho backend
          unit: formData.unit,
          stockQuantity: formData.stock,
          isActive: formData.isActive,
          isFeatured: formData.isFeatured,
        }
        let productId = null
        let imageUrls: string[] = []
        // Nếu có file ảnh, upload lên Cloudinary qua API backend
        if (imageFiles.length > 0) {
          const formDataImg = new FormData()
          imageFiles.forEach(file => formDataImg.append('images', file))
          // Gọi API backend để upload ảnh, trả về mảng URL
          // Giả sử apiClient.uploadProductImages(productId, formDataImg) trả về { urls: [...] }
          // Nếu là thêm mới, cần tạo product trước để lấy id
          if (!editingProduct) {
            const res = await apiClient.createProduct(payload)
            productId = res.data?.id || res.data?._id
            // Upload ảnh
            const imgRes = await apiClient.uploadProductImages(productId, formDataImg)
            imageUrls = imgRes.data?.images || []
            // Cập nhật lại product với images
            await apiClient.updateProduct(productId, { images: imageUrls })
            setIsAddModalOpen(false)
          } else {
            // Sửa sản phẩm
            await apiClient.updateProduct(editingProduct.id, payload)
            productId = editingProduct.id
            // Upload ảnh
            const imgRes = await apiClient.uploadProductImages(productId, formDataImg)
            imageUrls = imgRes.data?.images || []
            // Nếu có ảnh mới thì thêm vào mảng ảnh cũ, nếu không thì giữ nguyên
            const newImages = imageUrls.length > 0 ? [...editingProduct.images, ...imageUrls] : editingProduct.images
            await apiClient.updateProduct(productId, { images: newImages })
            setIsEditModalOpen(false)
          }
        } else {
          // Không có ảnh, chỉ tạo/sửa sản phẩm
          if (editingProduct) {
            await apiClient.updateProduct(editingProduct.id, payload)
            productId = editingProduct.id
            setIsEditModalOpen(false)
          } else {
            const res = await apiClient.createProduct(payload)
            productId = res.data?.id || res.data?._id
            setIsAddModalOpen(false)
          }
        }
        // Sau khi upload, cập nhật lại danh sách sản phẩm
        fetchProducts()
      } catch (error) {
        console.error('Lưu sản phẩm thất bại:', error)
        // Nếu lỗi, cập nhật local state cho demo
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
                    {/* Bỏ cột Unit */}
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
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.category.name}
                          {product.category.parentName && (
                            <span className="text-xs text-muted-foreground"> <br/>({product.category.parentName})</span>
                          )}
                        </TableCell>
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
                        {/* Bỏ hiển thị đơn vị tính ở bảng */}
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
                    value={formData.name ?? ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    value={formData.description ?? ""}
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
                    value={formData.price ?? 0}
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
                    value={formData.originalPrice ?? 0}
                    onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="categoryId" className="text-right">
                    Category
                  </Label>
                  <div className="col-span-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full text-left">
                          {(() => {
                            const parent = categories.find(c => c.id === formData.categoryId);
                            if (parent) return parent.name;
                            for (const cat of categories) {
                              if (cat.children && cat.children.length > 0) {
                                const child = cat.children.find((child: any) => child.id === formData.categoryId);
                                if (child) return child.name;
                              }
                            }
                            return "Select category";
                          })()}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full">
                        {categories.map(cat => (
                          cat.children && cat.children.length > 0 ? (
                            <DropdownMenuSub key={cat.id}>
                              <DropdownMenuSubTrigger>{cat.name}</DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {/* Only show parent if not 'Hải sản' under 'Cá biển' */}
                                {cat.children.map((child: any) => (
                                  <DropdownMenuItem key={child.id} onClick={() => setFormData({ ...formData, categoryId: child.id })}>
                                    {child.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          ) : (
                            <DropdownMenuItem key={cat.id} onClick={() => setFormData({ ...formData, categoryId: cat.id })}>{cat.name}</DropdownMenuItem>
                          )
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right">
                    Stock
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock ?? 0}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unit" className="text-right">
                    Đơn vị tính
                  </Label>
                  <Input
                    id="unit"
                    value={formData.unit ?? ""}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                {/* Trường upload hình ảnh */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="images" className="text-right">
                    Images
                  </Label>
                  <Input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    className="col-span-3"
                    onChange={e => {
                      if (e.target.files) {
                        setImageFiles(Array.from(e.target.files))
                      }
                    }}
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
                    value={formData.name ?? ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    value={formData.description ?? ""}
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
                    value={formData.price ?? 0}
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
                    value={formData.originalPrice ?? 0}
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
                        <React.Fragment key={cat.id}>
                          <SelectItem value={cat.id}>{cat.name}</SelectItem>
                          {cat.children && cat.children.length > 0 && cat.children.map((child: any) => (
                            <SelectItem key={child.id} value={child.id}>
                              <span style={{ paddingLeft: 20 }}>&#x21B3; {(child as any).name}</span>
                            </SelectItem>
                          ))}
                        </React.Fragment>
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
                    value={formData.stock ?? 0}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-unit" className="text-right">
                    Đơn vị tính
                  </Label>
                  <Input
                    id="edit-unit"
                    value={formData.unit ?? ""}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                {/* Trường upload hình ảnh */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-images" className="text-right">
                    Category
                  </Label>
                  <div className="col-span-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full text-left">
                          {categories.find(c => c.id === formData.categoryId)?.name || "Select category"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full">
                        {categories.map(cat => (
                          cat.children && cat.children.length > 0 ? (
                            <DropdownMenuSub key={cat.id}>
                              <DropdownMenuSubTrigger>{cat.name}</DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => setFormData({ ...formData, categoryId: cat.id })}>{cat.name}</DropdownMenuItem>
                                {cat.children.map((child: any) => (
                                  <DropdownMenuItem key={child.id} onClick={() => setFormData({ ...formData, categoryId: child.id })}>
                                    {child.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          ) : (
                            <DropdownMenuItem key={cat.id} onClick={() => setFormData({ ...formData, categoryId: cat.id })}>{cat.name}</DropdownMenuItem>
                          )
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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