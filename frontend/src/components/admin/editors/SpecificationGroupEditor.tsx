import React from 'react';
import { Plus, X, GripVertical } from 'lucide-react';

export interface SpecItem {
  label: string;
  value: string;
}

export interface SpecGroup {
  title: string;
  items: SpecItem[];
}

interface SpecificationGroupEditorProps {
  groups: SpecGroup[];
  onChange: (groups: SpecGroup[]) => void;
}

export function SpecificationGroupEditor({ groups, onChange }: SpecificationGroupEditorProps) {
  const updateGroup = (index: number, updates: Partial<SpecGroup>) => {
    const newGroups = [...groups];
    newGroups[index] = { ...newGroups[index], ...updates };
    onChange(newGroups);
  };

  const addGroup = () => {
    onChange([...groups, { title: '', items: [{ label: '', value: '' }] }]);
  };

  const removeGroup = (index: number) => {
    onChange(groups.filter((_, i) => i !== index));
  };

  const addItem = (groupIndex: number) => {
    const newGroups = [...groups];
    newGroups[groupIndex].items.push({ label: '', value: '' });
    onChange(newGroups);
  };

  const removeItem = (groupIndex: number, itemIndex: number) => {
    const newGroups = [...groups];
    newGroups[groupIndex].items = newGroups[groupIndex].items.filter((_, i) => i !== itemIndex);
    onChange(newGroups);
  };

  const updateItem = (groupIndex: number, itemIndex: number, field: 'label' | 'value', val: string) => {
    const newGroups = [...groups];
    newGroups[groupIndex].items[itemIndex][field] = val;
    onChange(newGroups);
  };

  return (
    <div className="space-y-4">
      {groups.map((group, gi) => (
        <div key={gi} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Group Title */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
            <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={group.title}
              onChange={(e) => updateGroup(gi, { title: e.target.value })}
              placeholder="Tên nhóm thông số (VD: Màn hình, Camera, Hiệu năng...)"
              className="flex-1 bg-transparent text-sm font-bold text-emerald-800 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeGroup(gi)}
              className="p-1 text-slate-400 hover:text-red-600 transition-colors"
              title="Xóa nhóm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Items Table */}
          <div className="p-3">
            <div className="grid grid-cols-[1fr_1fr_28px] gap-2 mb-2 px-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tên thông số</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Giá trị</span>
              <span />
            </div>
            
            {group.items.map((item, ii) => (
              <div key={ii} className="grid grid-cols-[1fr_1fr_28px] gap-2 mb-1.5 group">
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updateItem(gi, ii, 'label', e.target.value)}
                  placeholder="VD: Kích thước..."
                  className="w-full h-8 bg-slate-50 px-2.5 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none focus:bg-white transition-colors placeholder:text-slate-400"
                />
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => updateItem(gi, ii, 'value', e.target.value)}
                  placeholder="VD: 6.1 inch..."
                  className="w-full h-8 bg-slate-50 px-2.5 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none focus:bg-white transition-colors placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => removeItem(gi, ii)}
                  className="w-7 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addItem(gi)}
              className="mt-2 text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors border border-emerald-200"
            >
              <Plus className="w-3 h-3" /> Thêm thông số
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addGroup}
        className="w-full py-3 border border-dashed border-slate-300 hover:border-emerald-500 rounded-xl text-sm text-slate-500 hover:text-emerald-700 font-semibold flex items-center justify-center gap-2 transition-colors bg-white shadow-sm"
      >
        <Plus className="w-4 h-4" /> Thêm nhóm thông số
      </button>
    </div>
  );
}
