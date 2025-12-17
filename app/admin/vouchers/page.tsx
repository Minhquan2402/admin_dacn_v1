"use client";
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table } from '@/components/ui/table';
import { Alert } from '@/components/ui/alert';
import { apiClient } from '@/lib/api';
import { Select } from '@/components/ui/select';

// Sử dụng các hàm public, cần bổ sung vào api.ts
const createVoucher = (data: any) => apiClient.createVoucher(data);

interface Voucher {
  id: string;
  code: string;
  type?: string;
  value?: number;
  startsAt?: string;
  expiresAt?: string;
}

export default function VouchersPage() {
  // Đã xóa state danh sách voucher
  const [form, setForm] = useState({ code: '', type: 'fixed', value: '', startsAt: '', expiresAt: '' });
  const [fixedValue, setFixedValue] = useState('');
  const [percentValue, setPercentValue] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  // State cho cấp phát voucher
  const [issueUserId, setIssueUserId] = useState('');
  const [issueVoucherId, setIssueVoucherId] = useState('');
  const [issueResult, setIssueResult] = useState<string | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);


  async function handleCreateVoucher(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(null);
    // Xác định loại và giá trị giảm giá dựa trên ô nhập
    let type = '';
    let value: number | null = null;
    if (percentValue && Number(percentValue) > 0 && (!fixedValue || Number(fixedValue) === 0)) {
      type = 'percent';
      value = Number(percentValue);
    } else if (fixedValue && Number(fixedValue) > 0 && (!percentValue || Number(percentValue) === 0)) {
      type = 'fixed';
      value = Number(fixedValue);
    } else if (percentValue && Number(percentValue) > 0 && fixedValue && Number(fixedValue) > 0) {
      // Nếu nhập cả hai, ưu tiên ô vừa nhập cuối cùng (cần lưu lại state ô cuối cùng được nhập)
      type = form.type;
      value = form.type === 'percent' ? Number(percentValue) : Number(fixedValue);
    } else {
      // Không hợp lệ, không làm gì cả
      return;
    }
    try {
      await createVoucher({
        code: form.code,
        type,
        value,
        startsAt: form.startsAt,
        expiresAt: form.expiresAt,
      });
      setSuccess('Tạo voucher thành công!');
      setForm({ code: '', type: 'fixed', value: '', startsAt: '', expiresAt: '' });
      setFixedValue('');
      setPercentValue('');
    } catch (err: unknown) {
      // Không hợp lệ, không làm gì cả
      // If we ever want to log: if (err instanceof Error) console.error(err.message)
    }
  }

  async function handleIssueVoucher(e: React.FormEvent) {
    e.preventDefault();
    setIssueError(null);
    setIssueResult(null);
    if (!issueUserId || !issueVoucherId) {
      setIssueError('Vui lòng nhập userId và chọn voucher');
      return;
    }
    try {
      await apiClient.issueVoucherToUser(issueVoucherId, issueUserId);
      setIssueResult('Cấp phát voucher thành công!');
      setIssueUserId('');
      setIssueVoucherId('');
    } catch (err: unknown) {
      if (err instanceof Error) setIssueError(err.message || 'Cấp phát voucher thất bại');
      else setIssueError(String(err) || 'Cấp phát voucher thất bại');
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Quản lý Voucher</h1>
      {/* Form tạo voucher mới */}
      <Card className="p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Tạo voucher mới</h2>
        <form onSubmit={handleCreateVoucher} className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Mã voucher"
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              required
            />
          </div>
          <div className="flex gap-4">
            {/* Bên trái: Giảm giá cố định */}
            <div className="w-1/2 flex flex-col">
              <label className="font-semibold mb-2">Giảm giá cố định</label>
              <Input
                placeholder="Giá trị cố định (VNĐ)"
                type="number"
                value={fixedValue}
                onChange={e => {
                  setFixedValue(e.target.value);
                  setForm(f => ({ ...f, type: 'fixed' }));
                }}
              />
            </div>
            {/* Bên phải: Giảm giá phần trăm */}
            <div className="w-1/2 flex flex-col">
              <label className="font-semibold mb-2">Giảm giá phần trăm</label>
              <Input
                placeholder="Giá trị phần trăm (%)"
                type="number"
                value={percentValue}
                onChange={e => {
                  setPercentValue(e.target.value);
                  setForm(f => ({ ...f, type: 'percent' }));
                }}
              />
            </div>
          </div>
          <div className="flex gap-4 flex-wrap mt-4">
            <div className="flex flex-col">
              <label className="text-sm mb-1">Ngày bắt đầu</label>
              <Input
                type="date"
                value={form.startsAt}
                onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm mb-1">Ngày kết thúc</label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" className="self-end">Tạo voucher</Button>
          </div>
        </form>
        {/* Đã xóa error */}
        {success && <Alert variant="default">{success}</Alert>}
      </Card>
      {/* Form cấp phát voucher cho user */}
      <Card className="p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Cấp phát voucher cho user</h2>
        <form onSubmit={handleIssueVoucher} className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Voucher ID"
              value={issueVoucherId}
              onChange={e => setIssueVoucherId(e.target.value)}
              required
            />
            <Input
              placeholder="User ID"
              value={issueUserId}
              onChange={e => setIssueUserId(e.target.value)}
              required
            />
            <Button type="submit">Cấp phát</Button>
          </div>
        </form>
        {issueError && <Alert variant="destructive">{issueError}</Alert>}
        {issueResult && <Alert variant="default">{issueResult}</Alert>}
      </Card>
      {/* Đã xóa danh sách voucher */}
    </div>
  );
}
