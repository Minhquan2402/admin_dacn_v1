"use client";
import React, { useEffect, useState } from "react";
import { Pencil, Book } from "lucide-react";
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
      <h1 className="text-2xl font-bold mb-2">Ticket Management</h1>
      <p className="text-gray-500 mb-4">Organize and review all tickets on the platform</p>
      {loading && <p>Đang tải...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-xl shadow border p-4">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Tiêu đề</th>
                <th className="px-4 py-2 text-left">Trạng thái</th>
                <th className="px-4 py-2 text-left">Người tạo</th>
                <th className="px-4 py-2 text-left">Ngày tạo</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">No tickets found.</td>
                </tr>
              ) : (
                tickets.map((ticket: any) => (
                  <tr key={ticket._id || ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-semibold">{ticket._id || ticket.id}</td>
                    <td className="px-4 py-2">{ticket.title || ticket.subject}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${ticket.status === 'open' ? 'bg-green-100 text-green-700' : ticket.status === 'resolved' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{ticket.createdBy?.name || ticket.createdBy || ""}</td>
                    <td className="px-4 py-2">
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ""}<br />
                      <span className="text-xs text-gray-400">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleTimeString() : ""}</span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" size="sm" onClick={() => handleAssign(ticket._id || ticket.id)} title="Assign">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(ticket._id || ticket.id)} title="Update status">
                          <Book className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TicketsPage;
