"use client";
import React, { useState } from "react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function NotificationPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("user");
  const [targetId, setTargetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  // Gửi thông báo cho một người dùng
  const handleSend = async () => {
    setLoading(true);
    setResult("");
    try {
      await apiClient.sendNotificationToUser({
        audience: "user",
        targetId: targetId,
        title,
        message,
        type:"system"
      });
      setResult("Đã gửi thông báo!");
    } catch (err) {
      setResult("Gửi thất bại!");
    }
    setLoading(false);
  };


  // Broadcast thông báo cho tất cả
  const handleBroadcast = async () => {
    setLoading(true);
    setResult("");
    try {
      await apiClient.broadcastNotification({
        audience: target === "user" ? "all_users" : "all_shops",
        title,
        message,
      });
      setResult("Đã broadcast thông báo!");
    } catch (err) {
      setResult("Broadcast thất bại!");
    }
    setLoading(false);
  };


  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gửi thông báo cho người dùng</h1>
      <div className="space-y-4">
        <input
          className="border px-3 py-2 w-full rounded"
          placeholder="Tiêu đề thông báo"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          className="border px-3 py-2 w-full rounded"
          placeholder="Nội dung thông báo"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <input
          className="border px-3 py-2 w-full rounded"
          placeholder="ID người dùng (gửi riêng)"
          value={targetId}
          onChange={e => setTargetId(e.target.value)}
        />
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleSend} disabled={loading || !targetId}>
            Gửi cho 1 người dùng
          </Button>
          <select
            className="border px-2 py-1 rounded"
            value={target}
            onChange={e => setTarget(e.target.value)}
          >
            <option value="user">Tất cả người dùng</option>
            <option value="shop">Tất cả shop</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleBroadcast} disabled={loading}>
            Broadcast thông báo
          </Button>
        </div>
        {result && (
          <div className="mt-2 text-sm text-green-700">{result}</div>
        )}
      </div>
    </div>
  );
}
