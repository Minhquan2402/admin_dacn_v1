"use client";
import React, { useEffect, useState } from "react";
import { Pencil, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

const TicketsPage = () => {
  type TicketType = {
    id?: string;
    _id?: string;
    ticketNumber?: string | null;
    title?: string;
    subject?: string;
    description?: string;
    type?: string;
    priority?: string;
    status?: string;
    createdBy?: string;
    createdByName?: string | null;
    assignedTo?: string | null;
    assignedToName?: string | null;
    relatedShopId?: string | null;
    relatedShopReference?: string | null;
    relatedOrderId?: string | null;
    relatedOrderReference?: string | null;
    tags?: string[];
    attachments?: unknown[];
    commentsCount?: number;
    isPublic?: boolean;
    resolutionMessage?: string | null;
    resolvedAt?: string | null;
    createdAt?: string | number;
    updatedAt?: string | number;
  };
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getTickets();
      // API returns { success: true, data: TicketDTO[] }
      const list = Array.isArray(data) ? data : data?.data || [];
      setTickets(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "Lỗi khi lấy danh sách ticket");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Assign ticket
  const handleAssign = async (id: string) => {
    const assignedTo = prompt("Nhập agentId để gán ticket này:");
    if (!assignedTo) return;
    try {
      await apiClient.assignTicket(id, assignedTo);
      alert("Gán ticket thành công!");
      fetchTickets();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert("Lỗi khi gán ticket: " + (message || ""));
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert("Lỗi khi cập nhật trạng thái: " + (message || ""));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Ticket Management</h1>
      <p className="text-gray-500 mb-4">Organize and review all tickets on the platform</p>
      {loading && <p>Đang tải...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && (
        <>
        <div className="bg-white rounded-xl shadow border p-2">
          <div className="overflow-x-auto">
          <table className="min-w-full table-auto w-full">
            <thead>
                <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Tiêu đề</th>
                <th className="px-4 py-2 text-left">Trạng thái</th>
                <th className="px-4 py-2 text-left">Người tạo</th>
                <th className="px-4 py-2 text-left">Nội Dung</th>
                <th className="px-4 py-2 text-left">Ngày tạo</th>
                <th className="px-4 py-2 text-left hidden md:table-cell">Cập nhật</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-4">No tickets found.</td>
                </tr>
              ) : (
                tickets.map((ticket: TicketType) => (
                  <React.Fragment key={ticket._id || ticket.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-2 ">{ticket.title || ticket.subject}</td>
                    <td className="px-4 py-2 ">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${ticket.status === 'open' ? 'bg-green-100 text-green-700' : ticket.status === 'resolved' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 truncate max-w-xs">{ticket.relatedShopReference || ticket.createdBy || ""}</td>
                    <td className="px-4 py-2 truncate max-w-xs">{ticket.description ? (ticket.description.length > 100 ? ticket.description.substring(0, 100) + "..." : ticket.description) : ""}</td>
                    <td className="px-4 py-2">
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ""}<br />
                      <span className="text-xs text-gray-400">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleTimeString() : ""}</span>
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell">
                      {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : ""}<br />
                      <span className="text-xs text-gray-400">{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleTimeString() : ""}</span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" size="sm" onClick={() => {
                          const id = ticket._id || ticket.id || '';
                          if (!id) return alert('Invalid ticket id');
                          handleAssign(id);
                        }} title="Assign">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          const id = ticket._id || ticket.id || '';
                          if (!id) return alert('Invalid ticket id');
                          handleUpdateStatus(id);
                        }} title="Update status">
                          <Book className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedTicket(ticket);
                          setIsSheetOpen(true);
                        }} title="View details">
                          Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {/* details moved to the right-side Sheet (drawer) */}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={(open) => { setIsSheetOpen(open); if (!open) setSelectedTicket(null); }}>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Ticket Details</SheetTitle>
              <SheetDescription>{selectedTicket ? selectedTicket.title : ''}</SheetDescription>
            </SheetHeader>
            <div className="p-4 overflow-y-auto h-full">
              {selectedTicket ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground">Ticket #</span>
                      <div className="font-medium">{selectedTicket.ticketNumber || (selectedTicket._id || selectedTicket.id)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Status</div>
                      <div className="mt-1">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${selectedTicket.status === 'open' ? 'bg-green-100 text-green-700' : selectedTicket.status === 'resolved' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {selectedTicket.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Type & Priority</div>
                    <div className="mt-1 space-x-2">
                      <span className="text-sm">{selectedTicket.type}</span>
                      <span className="text-sm">{selectedTicket.priority}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Created By</div>
                    <div className="font-medium">{selectedTicket.createdByName || selectedTicket.createdBy || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Assigned To</div>
                    <div className="font-medium">{selectedTicket.assignedToName || selectedTicket.assignedTo || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Description</div>
                    <div className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{selectedTicket.description || '-'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Related Shop</div>
                      <div className="font-medium">{selectedTicket.relatedShopReference || selectedTicket.relatedShopId || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Related Order</div>
                      <div className="font-medium">{selectedTicket.relatedOrderReference || selectedTicket.relatedOrderId || '-'}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Tags</div>
                    <div className="mt-1 text-sm">{(selectedTicket.tags || []).join(', ')}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Attachments</div>
                    <div className="mt-1 text-sm">{Array.isArray(selectedTicket.attachments) ? selectedTicket.attachments.length : 0} file(s)</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    <div>Comments: {selectedTicket.commentsCount ?? 0}</div>
                    <div>Public: {selectedTicket.isPublic ? 'Yes' : 'No'}</div>
                    {selectedTicket.resolutionMessage && <div>Resolution: {selectedTicket.resolutionMessage}</div>}
                    {selectedTicket.resolvedAt && <div>Resolved at: {new Date(selectedTicket.resolvedAt).toLocaleString()}</div>}
                  </div>
                  <div className="text-xs text-gray-400">
                    <div>Created: {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : '-'}</div>
                    <div>Updated: {selectedTicket.updatedAt ? new Date(selectedTicket.updatedAt).toLocaleString() : '-'}</div>
                  </div>
                </div>
              ) : (
                <div>Không có ticket được chọn.</div>
              )}
            </div>
            <SheetFooter>
              <div className="flex justify-end gap-2">
                <SheetClose asChild>
                  <Button variant="outline">Close</Button>
                </SheetClose>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        </>
      )}
    </div>
  );
};

export default TicketsPage;
