"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api";

interface UserSnapshot {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    province?: string;
    district?: string;
    commune?: string;
    street?: string;
    detail?: string;
  };
}

type RequestStatus = "pending" | "approved" | "rejected";

interface RegisterShopOwnerRequest {
  id: string;
  userId: string;
  certificateUrl: string;
  status: RequestStatus;
  reviewMessage?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  userSnapshot?: UserSnapshot | null;
}

const statusFilters: { value: "all" | RequestStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const badgeClassName: Record<RequestStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
};

const PAGE_SIZE = 10;

const formatDateTime = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return `${date.toLocaleDateString()} · ${date.toLocaleTimeString()}`;
};

const formatAddress = (snapshot?: UserSnapshot | null) => {
  if (!snapshot?.address) return "-";
  const parts = [
    snapshot.address.detail,
    snapshot.address.street,
    snapshot.address.commune,
    snapshot.address.district,
    snapshot.address.province,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "-";
};

export default function RegisterRequestsPage() {
  const [requests, setRequests] = useState<RegisterShopOwnerRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | RequestStatus>("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailRequest, setDetailRequest] = useState<RegisterShopOwnerRequest | null>(null);
  const [actionRequest, setActionRequest] = useState<RegisterShopOwnerRequest | null>(null);
  const [actionMode, setActionMode] = useState<"approve" | "reject">("approve");
  const [reviewMessage, setReviewMessage] = useState("");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, currentPage]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getRegisterShopOwnerRequests({
        status: statusFilter === "all" ? undefined : statusFilter,
        page: currentPage,
        limit: PAGE_SIZE,
      });
      const data = Array.isArray(response?.data) ? response.data : response?.data?.data;
      setRequests(Array.isArray(data) ? (data as RegisterShopOwnerRequest[]) : []);
      setTotalPages(response?.meta?.totalPages ?? 1);
      setTotalItems(response?.meta?.total ?? (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load requests";
      setError(message);
      setRequests([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (value: "all" | RequestStatus) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const openReviewDialog = (request: RegisterShopOwnerRequest, mode: "approve" | "reject") => {
    setActionRequest(request);
    setActionMode(mode);
    setReviewMessage("");
    setIsReviewDialogOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!actionRequest) return;
    try {
      setSubmitLoading(true);
      await apiClient.reviewRegisterShopOwnerRequest(actionRequest.id, {
        status: actionMode === "approve" ? "approved" : "rejected",
        reviewMessage: reviewMessage.trim() || undefined,
      });
      setIsReviewDialogOpen(false);
      setActionRequest(null);
      setReviewMessage("");
      fetchRequests();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update request";
      setError(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const summaryText = useMemo(() => {
    if (loading) return "Loading requests...";
    if (!totalItems) return "No requests found";
    return `Showing ${requests.length} of ${totalItems} requests`;
  }, [loading, totalItems, requests.length]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shop Owner Requests</h1>
        <p className="text-muted-foreground">Review and process submissions from customers who want to become shop owners.</p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
          <CardTitle className="text-base">{summaryText}</CardTitle>
          <CardDescription>Use filters to focus on pending reviews or revisit approved/rejected records.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Certificate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      Loading requests...
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      No requests match the current filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="font-semibold">{request.userSnapshot?.name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{request.userSnapshot?.email || request.userId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{request.userSnapshot?.phone || "-"}</div>
                        <div className="text-xs text-muted-foreground">{formatAddress(request.userSnapshot)}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDateTime(request.createdAt)}</TableCell>
                      <TableCell>
                        <Badge className={`${badgeClassName[request.status]} capitalize`}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {request.certificateUrl ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="px-0"
                            onClick={() => window.open(request.certificateUrl, "_blank", "noopener")}
                          >
                            View document
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Missing file</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                          <Button variant="outline" size="sm" onClick={() => setDetailRequest(request)}>
                            Details
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            disabled={request.status !== "pending"}
                            onClick={() => openReviewDialog(request, "approve")}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={request.status !== "pending"}
                            onClick={() => openReviewDialog(request, "reject")}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!detailRequest} onOpenChange={(open) => !open && setDetailRequest(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request details</DialogTitle>
            <DialogDescription>Review submitted information and attached certificate.</DialogDescription>
          </DialogHeader>
          {detailRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Applicant</p>
                <p className="text-base font-semibold">{detailRequest.userSnapshot?.name || "Unknown"}</p>
                <p className="text-sm text-muted-foreground">{detailRequest.userSnapshot?.email || detailRequest.userId}</p>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{detailRequest.userSnapshot?.phone || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span className="ml-4 max-w-[60%] text-right font-medium">{formatAddress(detailRequest.userSnapshot)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span className="font-medium">{formatDateTime(detailRequest.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={`${badgeClassName[detailRequest.status]} capitalize`}>
                    {detailRequest.status}
                  </Badge>
                </div>
              </div>
              {detailRequest.reviewMessage && (
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Review message</p>
                  <p className="text-sm text-foreground">{detailRequest.reviewMessage}</p>
                </div>
              )}
              {detailRequest.certificateUrl ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase text-muted-foreground">Certificate</p>
                  <div className="overflow-hidden rounded-md border">
                    <img
                      src={detailRequest.certificateUrl}
                      alt="Certificate preview"
                      className="h-64 w-full object-contain bg-muted"
                    />
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0"
                    onClick={() => window.open(detailRequest.certificateUrl, "_blank", "noopener")}
                  >
                    Open full image
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No certificate uploaded.</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailRequest(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReviewDialogOpen} onOpenChange={(open) => {
        setIsReviewDialogOpen(open);
        if (!open) {
          setActionRequest(null);
          setReviewMessage("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{actionMode === "approve" ? "Approve request" : "Reject request"}</DialogTitle>
            <DialogDescription>
              {actionMode === "approve"
                ? "Confirm that this user is verified and ready to become a shop owner."
                : "Share a short note explaining why the request is rejected."}
            </DialogDescription>
          </DialogHeader>
          {actionRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold">{actionRequest.userSnapshot?.name || actionRequest.userId}</p>
                <p className="text-xs text-muted-foreground">{actionRequest.userSnapshot?.email || actionRequest.userId}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-message">Reviewer note</Label>
                <Textarea
                  id="review-message"
                  placeholder={actionMode === "approve" ? "Optional note for auditing" : "Let the user know what to fix"}
                  value={reviewMessage}
                  onChange={(event) => setReviewMessage(event.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={actionMode === "approve" ? "default" : "destructive"}
              onClick={handleReviewSubmit}
              disabled={submitLoading}
            >
              {submitLoading ? "Processing..." : actionMode === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
