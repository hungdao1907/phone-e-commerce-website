import React from 'react';
import { motion } from 'framer-motion';
import { MoreVertical } from 'lucide-react';

const customers = [
  { id: 1, name: 'Danny Liu', email: 'danny@gmail.com', avatar: 'DL', deals: 1023, totalValue: '$37,431', color: 'bg-blue-500' },
  { id: 2, name: 'Bella Deviant', email: 'bella@gmail.com', avatar: 'BD', deals: 963, totalValue: '$30,423', color: 'bg-purple-500' },
  { id: 3, name: 'Darrell Steward', email: 'darrell@gmail.com', avatar: 'DS', deals: 843, totalValue: '$28,549', color: 'bg-emerald-500' },
  { id: 4, name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', avatar: 'NA', deals: 721, totalValue: '$24,100', color: 'bg-amber-500' },
  { id: 5, name: 'Trần Thị B', email: 'tranthib@gmail.com', avatar: 'TB', deals: 654, totalValue: '$19,800', color: 'bg-pink-500' },
];

export function CustomerListWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-2xl flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0">
        <h3 className="text-white font-semibold text-base">Customer list</h3>
        <button className="text-white/30 hover:text-white/60 transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Table Header */}
      <div className="px-6 pb-2 grid grid-cols-[2fr_1fr_1fr] gap-4 text-white/30 text-[11px] font-medium uppercase tracking-wider">
        <span>Name</span>
        <span className="text-center">Deals</span>
        <span className="text-right">Total Deal Value</span>
      </div>

      {/* Customer Rows */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3">
        {customers.map((customer, i) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 + i * 0.08 }}
            className="grid grid-cols-[2fr_1fr_1fr] gap-4 items-center px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer"
          >
            {/* Name */}
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full ${customer.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {customer.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/90 truncate">{customer.name}</p>
                <p className="text-[11px] text-white/35 truncate">{customer.email}</p>
              </div>
            </div>

            {/* Deals */}
            <p className="text-sm text-white/70 text-center font-medium">{customer.deals.toLocaleString()}</p>

            {/* Total Value */}
            <p className="text-sm text-white/90 text-right font-semibold">{customer.totalValue}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
