import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, FolderOpen, Smartphone, Laptop, Tablet, Headphones, Watch,
  ChevronRight, ChevronDown, Plus, Edit2, Trash2, X,
  LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

// --- TYPES ---
interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  children: Category[];
}

// Helper: Get icon component
const getIcon = (type?: string | null, isOpen?: boolean) => {
  switch (type) {
    case 'smartphone': return <Smartphone className="w-4 h-4" />;
    case 'laptop': return <Laptop className="w-4 h-4" />;
    case 'tablet': return <Tablet className="w-4 h-4" />;
    case 'headphones': return <Headphones className="w-4 h-4" />;
    case 'watch': return <Watch className="w-4 h-4" />;
    default: return isOpen ? <FolderOpen className="w-4 h-4 text-emerald-400" /> : <Folder className="w-4 h-4 text-emerald-400/70" />;
  }
};

const ICON_OPTIONS = [
  { value: '', label: 'Thư mục' },
  { value: 'smartphone', label: 'Điện thoại' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'tablet', label: 'Máy tính bảng' },
  { value: 'headphones', label: 'Phụ kiện' },
  { value: 'watch', label: 'Đồng hồ' },
];

// ========== TREE NODE COMPONENT ==========
const TreeNode = ({ 
  node, depth = 0, activeId, onSelect, onRefresh
}: { 
  node: Category; depth?: number; activeId: string | null; 
  onSelect: (node: Category) => void; onRefresh: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(depth === 0);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = activeId === node.id;

  return (
    <div className="flex flex-col w-full">
      <div 
        onClick={() => { onSelect(node); if (hasChildren) setIsOpen(!isOpen); }}
        className={cn(
          "group relative flex items-center gap-2 py-2 pr-3 cursor-pointer rounded-xl transition-all duration-200 select-none",
          isSelected ? "bg-white/10" : "hover:bg-white/5"
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        {isSelected && (
          <motion.div 
            layoutId="active-indicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-400 rounded-r-full" 
          />
        )}

        <div className="w-4 h-4 shrink-0 flex items-center justify-center text-white/50">
          {hasChildren && (isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
        </div>

        <div className={cn("w-5 h-5 shrink-0 flex items-center justify-center transition-colors", isSelected ? "text-emerald-400" : "text-white/60 group-hover:text-white/90")}>
          {getIcon(node.icon, isOpen)}
        </div>

        <span className={cn("text-sm font-medium truncate flex-1 transition-colors", isSelected ? "text-white" : "text-white/70 group-hover:text-white")}>
          {node.name}
        </span>

        {!node.isActive && (
          <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">Ẩn</span>
        )}
      </div>

      <AnimatePresence initial={false}>
        {hasChildren && isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden flex flex-col w-full">
            <div className="relative w-full">
              <div className="absolute top-0 bottom-2 bg-white/10 w-px" style={{ left: `${depth * 16 + 26}px` }} />
              {node.children.map((child) => (
                <TreeNode key={child.id} node={child} depth={depth + 1} activeId={activeId} onSelect={onSelect} onRefresh={onRefresh} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ========== MAIN COMPONENT ==========
export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuthStore();

  // Modal states
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: '', icon: '', parentId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:3001/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (activeCategory) {
          const findCat = (cats: Category[]): Category | null => {
            for (const c of cats) {
              if (c.id === activeCategory.id) return c;
              if (c.children) {
                const found = findCat(c.children);
                if (found) return found;
              }
            }
            return null;
          };
          const updated = findCat(data);
          if (updated) setActiveCategory(updated);
        }
      }
    } catch (error) {
      console.error('Lỗi tải danh mục:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  // ===== Category CRUD =====
  const handleOpenCreateCat = (parentId?: string) => {
    setEditingCategory(null);
    setCatForm({ name: '', icon: '', parentId: parentId || '' });
    setErrorMsg('');
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (cat: Category) => {
    setEditingCategory(cat);
    setCatForm({ name: cat.name, icon: cat.icon || '', parentId: cat.parentId || '' });
    setErrorMsg('');
    setIsCatModalOpen(true);
  };

  const handleSubmitCat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const url = editingCategory
        ? `http://localhost:3001/api/categories/${editingCategory.id}`
        : 'http://localhost:3001/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: catForm.name,
          icon: catForm.icon || null,
          parentId: catForm.parentId || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchCategories();
      setIsCatModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCat = async (id: string, name: string) => {
    if (!window.confirm(`Xóa danh mục "${name}" và toàn bộ danh mục con?`)) return;
    try {
      await fetch(`http://localhost:3001/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (activeCategory?.id === id) setActiveCategory(null);
      await fetchCategories();
    } catch (err) {
      alert('Lỗi khi xóa danh mục');
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await fetch(`http://localhost:3001/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isActive: !cat.isActive })
      });
      await fetchCategories();
    } catch (err) {
      console.error('Lỗi toggle active:', err);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 text-white w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh mục</h1>
          <p className="text-sm text-white/50 mt-1">Quản lý cấu trúc cây phân loại sản phẩm.</p>
        </div>
        <button 
          onClick={() => handleOpenCreateCat()}
          className="h-10 px-5 rounded-xl bg-white/10 border border-white/20 text-white flex items-center gap-2 hover:bg-white/20 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Tạo Danh Mục Gốc
        </button>
      </div>

      {/* SPLIT PANE */}
      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* LEFT: TREE */}
        <div className="w-[45%] flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden shrink-0">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
            <h2 className="font-semibold text-sm text-white/80 uppercase tracking-wider flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-emerald-400" /> Cây Danh Mục
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-white/40 text-sm">
                <Folder className="w-10 h-10 text-white/15 mb-3" />
                <p>Chưa có danh mục nào</p>
                <p className="text-xs mt-1">Hãy tạo danh mục đầu tiên!</p>
              </div>
            ) : (
              categories.map((node) => (
                <TreeNode key={node.id} node={node} activeId={activeCategory?.id || null} onSelect={setActiveCategory} onRefresh={fetchCategories} />
              ))
            )}
          </div>
        </div>

        {/* RIGHT: DETAILS */}
        <div className="flex-1 flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden relative">
          {activeCategory ? (
            <>
              {/* Header */}
              <div className="h-28 bg-gradient-to-br from-emerald-500/20 via-black/40 to-black/80 border-b border-white/10 relative p-6 flex items-end">
                <div className="relative z-10 flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-black/50 border border-white/20 backdrop-blur-md flex items-center justify-center text-emerald-400 shadow-xl">
                      {getIcon(activeCategory.icon, true)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-white">{activeCategory.name}</h2>
                      <p className="text-xs text-emerald-300/80 font-mono mt-0.5">/{activeCategory.slug || activeCategory.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenCreateCat(activeCategory.id)}
                      className="h-9 px-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-colors text-sm font-medium flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm con
                    </button>
                    <button 
                      onClick={() => handleOpenEditCat(activeCategory)}
                      className="h-9 px-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-colors text-sm font-medium flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Sửa
                    </button>
                    <button 
                      onClick={() => handleDeleteCat(activeCategory.id, activeCategory.name)}
                      className="h-9 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors text-sm font-medium flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-8">
                {/* Status Toggle */}
                <div className="flex items-center justify-between p-5 rounded-2xl bg-black/20 border border-white/5">
                  <div>
                    <h3 className="font-semibold text-white/90">Trạng thái hiển thị</h3>
                    <p className="text-sm text-white/40 mt-1">Danh mục này sẽ hiển thị trên menu chính của website</p>
                  </div>
                  <div 
                    onClick={() => handleToggleActive(activeCategory)}
                    className={cn(
                      "w-12 h-6 rounded-full p-1 cursor-pointer transition-colors relative",
                      activeCategory.isActive ? "bg-emerald-500" : "bg-white/10"
                    )}
                  >
                    <motion.div 
                      layout className="w-4 h-4 rounded-full bg-white shadow-sm"
                      animate={{ x: activeCategory.isActive ? 24 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <FolderOpen className="w-16 h-16 text-white/10 mb-4" />
              <h2 className="text-xl font-semibold text-white/80">Chưa chọn Danh mục</h2>
              <p className="text-white/40 mt-2 max-w-sm">Hãy chọn một danh mục trên cây thư mục bên trái để xem và chỉnh sửa.</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== MODAL: Tạo/Sửa Danh Mục ===== */}
      <AnimatePresence>
        {isCatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCatModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[#1c1c1e] border border-white/10 rounded-3xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editingCategory ? 'Sửa danh mục' : 'Tạo danh mục mới'}</h2>
                <button onClick={() => setIsCatModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-white/70" /></button>
              </div>
              {errorMsg && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{errorMsg}</div>}
              <form onSubmit={handleSubmitCat} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Tên danh mục *</label>
                  <input type="text" required value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})}
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors" placeholder="VD: Điện thoại di động" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Icon</label>
                  <div className="flex gap-2 flex-wrap">
                    {ICON_OPTIONS.map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => setCatForm({...catForm, icon: opt.value})}
                        className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors", catForm.icon === opt.value ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10")}
                      >
                        {getIcon(opt.value || undefined)} {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setIsCatModalOpen(false)} className="h-11 px-5 rounded-xl font-medium hover:bg-white/10 transition-colors">Hủy</button>
                  <button type="submit" disabled={isSubmitting} className="h-11 px-6 rounded-xl font-medium bg-emerald-500 text-black hover:bg-emerald-400 transition-colors disabled:opacity-50">
                    {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
