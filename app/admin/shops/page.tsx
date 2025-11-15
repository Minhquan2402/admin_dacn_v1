"use client";
import React, { useEffect, useState } from 'react';

interface Shop {
  id: string;
  shopName?: string;
  name?: string;
  owner?: string | { name?: string };
  ownerId?: string;
  createdAt: string;
  status: string;
}

const PendingShopsPage: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:5000/api/shops');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setShops(data.data || []);
      } catch (err: any) {
        setError(err.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Shop Management</h1>
      <p className="text-gray-500 mb-4">Organize and review all shops on the platform</p>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-xl shadow border p-4">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Owner</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shops.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">No shops found.</td>
                </tr>
              ) : (
                shops.map(shop => (
                  <tr key={shop.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-semibold flex items-center gap-2">
                      {shop.shopName || shop.name}
                    </td>
                    <td className="px-4 py-2">
                      {typeof shop.owner === 'object'
                        ? shop.owner?.name
                        : shop.owner || shop.ownerId}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(shop.createdAt).toLocaleDateString()}<br />
                      <span className="text-xs text-gray-400">{new Date(shop.createdAt).toLocaleTimeString()}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${shop.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {shop.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        className="p-2 rounded hover:bg-gray-100 text-gray-500"
                        title="View details"
                        onClick={() => setSelectedShop(shop)}
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                      </button>
                      <button className="p-2 rounded hover:bg-gray-100 text-gray-500" title="Delete" disabled>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m5 10v-6"/></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Shop detail dialog - render ngoài bảng để tránh lỗi <div> trong <tr> */}
      {selectedShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{backdropFilter: 'blur(2px)'}}>
          <div className="relative bg-white rounded-xl shadow-lg p-6 min-w-[320px] max-w-[90vw]">
            <h2 className="text-xl font-bold mb-2">Shop Details</h2>
            <div className="mb-2"><span className="font-semibold">Name:</span> {selectedShop ? (selectedShop.shopName || selectedShop.name) : ''}</div>
            <div className="mb-2"><span className="font-semibold">Owner:</span> {selectedShop ? (typeof selectedShop.owner === 'object' ? selectedShop.owner?.name : selectedShop.owner || selectedShop.ownerId) : ''}</div>
            <div className="mb-2"><span className="font-semibold">Created At:</span> {selectedShop ? new Date(selectedShop.createdAt).toLocaleString() : ''}</div>
            <div className="mb-2"><span className="font-semibold">Status:</span> {selectedShop ? (<span className={`inline-block px-2 py-1 rounded text-xs font-medium ${selectedShop.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{selectedShop.status}</span>) : ''}</div>
            {/* Thêm các trường khác nếu cần */}
            <div className="mt-4 text-right">
              <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={() => setSelectedShop(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PendingShopsPage;
