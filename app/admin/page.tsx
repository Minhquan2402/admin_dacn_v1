"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Overview } from "@/components/overview"
import { RecentSales } from "@/components/recent-sales"
import { apiClient } from "@/lib/api"

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.getDashboardStats().then((res) => {
      setStats(res)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="p-8">Đang tải dữ liệu...</div>
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalRevenue?.toLocaleString() ?? '-'}</div>
            <p className="text-xs text-muted-foreground">{stats?.revenueChange ?? ''}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats?.subscriptions ?? '-'}</div>
            <p className="text-xs text-muted-foreground">{stats?.subscriptionsChange ?? ''}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats?.sales ?? '-'}</div>
            <p className="text-xs text-muted-foreground">{stats?.salesChange ?? ''}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats?.activeNow ?? '-'}</div>
            <p className="text-xs text-muted-foreground">{stats?.activeNowChange ?? ''}</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={stats?.overview ?? []} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>
              You made {stats?.recentSalesCount ?? '-'} sales this month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentSales data={stats?.recentSales ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}