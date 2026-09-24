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
      case 'new': return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md text-xs font-medium border border-blue-500/30">Mới</span>;
      case 'contacted': return <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-md text-xs font-medium border border-purple-500/30">Đã liên hệ</span>;
      case 'consulting': return <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-md text-xs font-medium border border-orange-500/30">Đang tư vấn</span>;
      case 'considering': return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-md text-xs font-medium border border-yellow-500/30">Đang cân nhắc</span>;
      case 'quoted': return <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-md text-xs font-medium border border-cyan-500/30">Báo giá</span>;
      case 'converted': return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-xs font-medium border border-green-500/30 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Chuyển đổi</span>;
      case 'no_interest': return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-md text-xs font-medium border border-gray-500/30 flex items-center gap-1"><XCircle className="w-3 h-3"/> Không nhu cầu</span>;
      default: return <span className="px-2 py-1 bg-white/10 text-white/60 rounded-md text-xs font-medium">{status}</span>;
    }
  };

  const renderScore = (score: number) => {
    if (score >= 80) return <span className="text-red-400 font-bold">{score} (Hot)</span>;
    if (score >= 50) return <span className="text-orange-400 font-bold">{score} (Warm)</span>;
    return <span className="text-blue-400 font-bold">{score} (Cold)</span>;
  };

  return (
    <div className="flex flex-col gap-6 h-full text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Khách Hàng Tiềm Năng (Leads)</h1>
          <p className="text-white/40 text-sm mt-1">Quản lý và theo dõi các cơ hội bán hàng</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#99e300] hover:bg-[#88ca00] text-black font-semibold rounded-xl transition-all">
          <Plus className="w-4 h-4" />
          <span>Thêm Lead</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-white/40 text-sm">Tổng Lead</p>
          <p className="text-2xl font-bold mt-1">{leads.length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-white/40 text-sm">Lead mới</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{leads.filter(l => l.status === 'new').length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-white/40 text-sm">Đang tư vấn</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">{leads.filter(l => l.status === 'consulting').length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-white/40 text-sm">Đã chuyển đổi</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{leads.filter(l => l.status === 'converted').length}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input 
            type="text"
            placeholder="Tìm kiếm theo tên, SĐT, email..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#99e300]"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-all">
          <Filter className="w-4 h-4" />
          <span>Lọc</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-white/40 bg-white/5 sticky top-0 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 font-medium">Khách hàng</th>
                <th className="px-6 py-4 font-medium">Nguồn</th>
                <th className="px-6 py-4 font-medium">Sản phẩm quan tâm</th>
                <th className="px-6 py-4 font-medium">Trạng thái</th>
                <th className="px-6 py-4 font-medium">Score</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-white/40">Đang tải...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-white/40">Chưa có khách hàng tiềm năng nào</td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-white/5 group transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#99e300]/20 to-[#99e300]/5 border border-[#99e300]/20 flex items-center justify-center text-[#99e300] font-bold">
                          {lead.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{lead.fullName}</div>
                          <div className="flex items-center gap-2 text-xs text-white/50 mt-1">
                            {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {lead.phone}</span>}
                            {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {lead.email}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-white/10 rounded-md text-xs">{lead.source}</span>
                    </td>
                    <td className="px-6 py-4 text-white/80">{lead.interestedIn || '-'}</td>
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
                            className="px-3 py-1.5 bg-[#99e300]/10 hover:bg-[#99e300]/20 text-[#99e300] border border-[#99e300]/20 rounded-lg text-xs font-medium transition-colors"
                          >
                            Convert
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(lead.id)}
                          className="p-1.5 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
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
