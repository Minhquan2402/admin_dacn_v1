"use client";
import React, { useEffect, useState } from "react";
import { Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";

const TicketsPage = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getTickets();
      setTickets(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      setError(err.message || "Lỗi khi lấy danh sách ticket");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Assign ticket
  const handleAssign = async (id: string) => {
    const agentId = prompt("Nhập agentId để gán ticket này:");
    if (!agentId) return;
    try {
      await apiClient.assignTicket(id, agentId);
      alert("Gán ticket thành công!");
      fetchTickets();
    } catch (err: any) {
      alert("Lỗi khi gán ticket: " + (err.message || ""));
    }
  };

  // Update status
  const handleUpdateStatus = async (id: string) => {
    const status = prompt("Nhập trạng thái mới cho ticket:");
    if (!status) return;
    try {
      await apiClient.updateTicketStatus(id, status);
      alert("Cập nhật trạng thái thành công!");
      fetchTickets();
    } catch (err: any) {
      alert("Lỗi khi cập nhật trạng thái: " + (err.message || ""));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Ticket List</h1>
      {loading ? (
        <div>Đang tải...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-2 py-1">ID</th>
              <th className="border px-2 py-1">Tiêu đề</th>
              <th className="border px-2 py-1">Trạng thái</th>
              <th className="border px-2 py-1">Người tạo</th>
              <th className="border px-2 py-1">Ngày tạo</th>
              <th className="border px-2 py-1">Chức năng</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket: any) => (
              <tr key={ticket._id || ticket.id}>
                <td className="border px-2 py-1">{ticket._id || ticket.id}</td>
                <td className="border px-2 py-1">{ticket.title || ticket.subject}</td>
                <td className="border px-2 py-1">{ticket.status}</td>
                <td className="border px-2 py-1">{ticket.createdBy?.name || ticket.createdBy || ""}</td>
                <td className="border px-2 py-1">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : ""}</td>
                <td className="border px-2 py-1">
                  <div className="flex justify-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleAssign(ticket._id || ticket.id)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(ticket._id || ticket.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TicketsPage;
