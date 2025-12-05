"use client"
import React from "react";


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
import { Search, Plus, Edit, Trash2, ChevronRight, FolderPlus } from "lucide-react"
import { apiClient } from "@/lib/api"

interface Category {
  id: string
  name: string
  nameEn: string
  slug: string
  description?: string
  icon?: string
  level: number
  order: number
  isActive: boolean
  productCount: number
  parentId?: string
  children?: Category[]
  createdAt: string
  updatedAt?: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    slug: "",
    description: "",
    icon: "",
    order: 0,
    parentId: "",
    isActive: true,
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getCategories()
      setCategories(response.data || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const toggleRowExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedRows(newExpanded)
  }

  // Flatten category tree to a list with level info
  const flattenCategories = (categories: Category[], expandedRows: Set<string>, level = 0): Array<{category: Category, level: number}> => {
    let result: Array<{category: Category, level: number}> = [];
    for (const category of categories) {
      result.push({ category, level });
      if (expandedRows.has(category.id) && category.children && category.children.length > 0) {
        result = result.concat(flattenCategories(category.children, expandedRows, level + 1));
      }
    }
    return result;
  };

  const renderCategoryRow = (category: Category, level = 0): React.JSX.Element => {
    const isExpanded = expandedRows.has(category.id);
    const hasChildren = category.children && category.children.length > 0;
    return (
      <TableRow key={category.id}>
        <TableCell>
          <div
            className="flex items-center"
            style={{ paddingLeft: `${level * 20}px` }}
          >
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 mr-2"
                onClick={() => toggleRowExpansion(category.id)}
              >
                <ChevronRight
                  className={`h-3 w-3 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </Button>
            )}
            <span className="font-medium">{category.name}</span>
            {category.icon && <span className="ml-2">{category.icon}</span>}
          </div>
        </TableCell>
        <TableCell>{category.nameEn}</TableCell>
        <TableCell>{category.description}</TableCell>
        <TableCell>
          <Badge
            style={{
              backgroundColor: category.isActive ? '#22c55e' : '#ef4444', // xanh lá và đỏ
              color: 'white',
            }}
          >
            {category.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </TableCell>
        <TableCell>
          {new Date(category.createdAt).toLocaleDateString()}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDeleteCategory(category.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddCategory = () => {
    setFormData({
      name: "",
      nameEn: "",
      slug: "",
      description: "",
      icon: "",
      order: 0,
      parentId: "",
      isActive: true,
    })
    setIsAddModalOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setFormData({
      name: category.name,
      nameEn: category.nameEn,
      slug: category.slug || "",
      description: category.description || "",
      icon: category.icon || "",
      order: category.order || 0,
      parentId: category.parentId || "",
      isActive: category.isActive,
    })
    setEditingCategory(category)
    setIsEditModalOpen(true)
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await apiClient.deleteCategoryWithForce(categoryId, false);
        fetchCategories();
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    }
  }

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Chuẩn hóa dữ liệu gửi lên API
      const submitData = {
        name: formData.name,
        nameEn: formData.nameEn,
        slug: formData.slug,
        description: formData.description,
        icon: formData.icon,
        order: Number(formData.order) || 0,
        parentId: formData.parentId === 'root' ? null : formData.parentId,
        isActive: formData.isActive,
      };
      if (editingCategory) {
        await apiClient.updateCategory(editingCategory.id, submitData);
        setIsEditModalOpen(false);
      } else {
        await apiClient.createCategory(submitData);
        setIsAddModalOpen(false);
      }
      fetchCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">
            Manage product categories and subcategories
          </p>
        </div>
        <Button onClick={handleAddCategory}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Management</CardTitle>
          <CardDescription>
            Organize your products with hierarchical categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
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
                  <TableHead>Name</TableHead>
                  <TableHead>English Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  flattenCategories(filteredCategories, expandedRows).map(({category, level}) => renderCategoryRow(category, level))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Category Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new product category. Fill in the required information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCategory}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nameEn" className="text-right">English Name</Label>
                <Input id="nameEn" value={formData.nameEn} onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="slug" className="text-right">Slug</Label>
                <Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="icon" className="text-right">Icon</Label>
                <Input id="icon" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="order" className="text-right">Order</Label>
                <Input id="order" type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="parentId" className="text-right">Parent Category</Label>
                <Select value={formData.parentId} onValueChange={(value) => setFormData({ ...formData, parentId: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">None (Root Category)</SelectItem>
                    {categories.filter(cat => !cat.parentId).map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Add Category</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category information. Make changes below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCategory}>
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-parentId" className="text-right">
                  Parent Category
                </Label>
                <Select value={formData.parentId} onValueChange={(value) => setFormData({ ...formData, parentId: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">None (Root Category)</SelectItem>
                    {categories.filter(cat => !cat.parentId && cat.id !== editingCategory?.id).map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-isActive" className="text-right">
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
            </div>
            <DialogFooter>
              <Button type="submit">Update Category</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}