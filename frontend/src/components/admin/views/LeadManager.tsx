import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Phone, Mail, CheckCircle, XCircle } from 'lucide-react';

export function LeadManager() {
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/leads`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleConvert = async (leadId: string) => {
    // Basic converting just updates status for now, since user said no need to auto-create auth account.
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'converted' })
      });
      if (res.ok) {
        alert('Đã chuyển thành khách hàng!');
        fetchLeads();
      } else {
        alert('Có lỗi xảy ra');
      }
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Xóa Lead này?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/leads/${leadId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Đã xóa Lead');
        fetchLeads();
      } else {
        alert('Có lỗi xảy ra');
      }
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'new': return <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-200">Mới</span>;
      case 'contacted': return <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium border border-purple-200">Đã liên hệ</span>;
      case 'consulting': return <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-medium border border-amber-200">Đang tư vấn</span>;
      case 'considering': return <span className="px-2 py-1 bg-yellow-50 text-yellow-800 rounded-md text-xs font-medium border border-yellow-200">Đang cân nhắc</span>;
      case 'quoted': return <span className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded-md text-xs font-medium border border-cyan-200">Báo giá</span>;
      case 'converted': return <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium border border-emerald-200 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Chuyển đổi</span>;
      case 'no_interest': return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200 flex items-center gap-1"><XCircle className="w-3 h-3"/> Không nhu cầu</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200">{status}</span>;
    }
  };

  const renderScore = (score: number) => {
    if (score >= 80) return <span className="text-rose-600 font-bold">{score} (Hot)</span>;
    if (score >= 50) return <span className="text-amber-600 font-bold">{score} (Warm)</span>;
    return <span className="text-blue-600 font-bold">{score} (Cold)</span>;
  };

  return (
    <div className="flex flex-col gap-6 h-full text-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Khách Hàng Tiềm Năng (Leads)</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý và theo dõi các cơ hội bán hàng</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-sm">
          <Plus className="w-4 h-4" />
          <span>Thêm Lead</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Tổng Lead</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{leads.length}</p>
        </div>
        <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-sm">
          <p className="text-blue-600 text-sm font-medium">Lead mới</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{leads.filter(l => l.status === 'new').length}</p>
        </div>
        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm">
          <p className="text-amber-600 text-sm font-medium">Đang tư vấn</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{leads.filter(l => l.status === 'consulting').length}</p>
        </div>
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm">
          <p className="text-emerald-600 text-sm font-medium">Đã chuyển đổi</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{leads.filter(l => l.status === 'converted').length}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Tìm kiếm theo tên, SĐT, email..."
            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-xl text-sm font-medium text-slate-700 transition-all">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Lọc</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Khách hàng</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Nguồn</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Sản phẩm quan tâm</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Score</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Đang tải...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Chưa có khách hàng tiềm năng nào</td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50 group transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                          {lead.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{lead.fullName}</div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {lead.phone}</span>}
                            {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {lead.email}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-600">{lead.source}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{lead.interestedIn || '-'}</td>
                    <td className="px-6 py-4">
                      {renderStatus(lead.status)}
                    </td>
                    <td className="px-6 py-4">
                      {renderScore(lead.leadScore)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {lead.status !== 'converted' && (
                          <button 
                            onClick={() => handleConvert(lead.id)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Convert
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(lead.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
