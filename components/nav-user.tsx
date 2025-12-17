"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ChangeEvent } from "react"
import { Button } from "@/components/ui/button"

export function NavUser({ user }: { user?: { name: string; email: string; avatar: string } }) {
  const [profile, setProfile] = useState<{ name: string; email: string; avatar: string; phone?: string; dateOfBirth?: string }>({ name: "", email: "", avatar: "" })
  const [editOpen, setEditOpen] = useState(false)
  const [editData, setEditData] = useState<{ name: string; avatar: string; phone: string; dateOfBirth: string }>({ name: "", avatar: "", phone: "", dateOfBirth: "" })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await apiClient.getCurrentUserProfile()
        if (res.success && res.data) {
          setProfile({
            name: res.data.userName || res.data.name || "",
            email: res.data.email || "",
            avatar: res.data.avatar || "",
          })
        }
      } catch (err: unknown) {
        // fallback profile on error
        setProfile({ name: "Admin", email: "admin@example.com", avatar: "" })
        if (err instanceof Error) console.error('Failed fetch profile:', err.message)
        else console.error('Failed fetch profile:', String(err))
      }
    }
    fetchProfile()
  }, [])

  // Xử lý upload avatar
  const handleAvatarFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Tạo formData để upload
    const formData = new FormData()
    formData.append("avatar", file)
    try {
      // Gọi API upload avatar (ví dụ: /uploads/avatar hoặc /upload)
      // Use NEXT_PUBLIC_API_URL if provided (so it works on Vercel)
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      const res = await fetch(`${apiBase}/users/me/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`
        },
        body: formData
      })
      const data = await res.json()
      if (data.success && data.url) {
        setEditData(ed => ({ ...ed, avatar: data.url }))
      }
    } catch (err: unknown) {
      setErrorMsg("Upload avatar thất bại")
      if (err instanceof Error) console.error('Avatar upload failed:', err.message)
      else console.error('Avatar upload failed:', String(err))
    }
  }

  const handleEdit = () => {
    setEditData({
      name: profile.name,
      avatar: profile.avatar,
      phone: profile.phone || "",
      dateOfBirth: profile.dateOfBirth || ""
    })
    setEditOpen(true)
  }

  const handleSave = async () => {
    setLoading(true)
    setErrorMsg("")
    try {
      // Chỉ gửi các trường có giá trị
      const payload: any = {}
      if (editData.name) payload.userName = editData.name
      if (editData.avatar) payload.avatar = editData.avatar
      if (editData.phone) payload.phone = editData.phone
      if (editData.dateOfBirth) payload.dateOfBirth = editData.dateOfBirth

      const res = await apiClient.updateCurrentUserProfile(payload)
      if (res.success && res.data) {
        setProfile({
          name: res.data.userName || res.data.name || "",
          email: res.data.email || "",
          avatar: res.data.avatar || "",
          phone: res.data.phone || "",
          dateOfBirth: res.data.dateOfBirth || ""
        })
        setEditOpen(false)
      } else {
        setErrorMsg(res.message || "Cập nhật thất bại")
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Cập nhật thất bại")
    }
    setLoading(false)
  }
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="rounded-lg">AD</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{profile.name}</span>
                <span className="truncate text-xs">{profile.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback className="rounded-lg">AD</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{profile.name}</span>
                  <span className="truncate text-xs">{profile.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleEdit}>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              window.location.href = '/login'
            }}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      {/* Dialog chỉnh sửa hồ sơ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa hồ sơ cá nhân</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {errorMsg && (
              <div className="text-red-500 text-sm font-medium mb-2">{errorMsg}</div>
            )}
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="font-medium">Tên hiển thị</label>
              <Input id="name" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="font-medium">Số điện thoại</label>
              <Input id="phone" value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="dateOfBirth" className="font-medium">Ngày sinh</label>
              <Input
                id="dateOfBirth"
                type="date"
                value={editData.dateOfBirth}
                onChange={e => {
                  // Đảm bảo format yyyy-mm-dd
                  const val = e.target.value
                  setEditData({ ...editData, dateOfBirth: val })
                }}
                placeholder="yyyy-mm-dd"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="avatar" className="font-medium">Avatar</label>
              <Input id="avatar" value={editData.avatar} onChange={e => setEditData({ ...editData, avatar: e.target.value })} placeholder="Dán URL hoặc chọn file" />
              <input type="file" accept="image/*" onChange={handleAvatarFile} className="mt-2" />
              {editData.avatar && (
                <img src={editData.avatar} alt="Avatar preview" className="w-16 h-16 rounded-full mt-2 border" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={loading}>{loading ? "Đang lưu..." : "Lưu thay đổi"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarMenu>
  )
}