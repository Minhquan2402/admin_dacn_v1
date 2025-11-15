"use client";
import React from "react";

import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Livestream = {
  id: number;
  title: string;
  creator: string;
  status: string;
  startTime: string;
};

export default function LivestreamsPage() {
  const [livestreams, setLivestreams] = React.useState<Livestream[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    apiClient
      .getLivestreams()
      .then((data) => {
        setLivestreams(
          Array.isArray(data)
            ? data.map((ls: any) => ({
                id: ls.id,
                title: ls.title,
                creator: ls.hostName || ls.host || ls.creator || "",
                status: ls.status,
                startTime:
                  ls.startTime
                    ? new Date(ls.startTime).toLocaleString()
                    : ls.createdAt
                    ? new Date(ls.createdAt).toLocaleString()
                    : ""
              }))
            : []
        );
        setError(null);
      })
      .catch((err) => {
        setError(err.message || "Lỗi khi tải livestream");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Quản lý Livestream</h1>
      {loading && <div>Đang tải dữ liệu...</div>}
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Tiêu đề</th>
              <th className="border px-4 py-2">Người tạo</th>
              <th className="border px-4 py-2">Trạng thái</th>
              <th className="border px-4 py-2">Thời gian bắt đầu</th>
              <th className="border px-4 py-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {livestreams.map((ls) => (
              <tr key={ls.id}>
                <td className="border px-4 py-2">{ls.id}</td>
                <td className="border px-4 py-2">{ls.title}</td>
                <td className="border px-4 py-2">{ls.creator}</td>
                <td className="border px-4 py-2">
                  {ls.status === "LIVE" ? (
                    <span className="px-2 py-1 rounded text-white bg-green-500">LIVE</span>
                  ) : ls.status === "SCHEDULED" ? (
                    <span className="px-2 py-1 rounded text-yellow-800 bg-yellow-300">SCHEDULED</span>
                  ) : (
                    ls.status
                  )}
                </td>
                <td className="border px-4 py-2">{ls.startTime}</td>
                <td className="border px-4 py-2">
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm">
                      Xem
                    </Button>
                    <Button variant="outline" size="sm">
                      Xóa
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && livestreams.length === 0 && !error && (
          <div className="text-center py-4 text-gray-500">Không có livestream nào.</div>
        )}
      </div>
    </div>
  );
}
