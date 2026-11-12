'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SalaryConfig } from '@/types';
import { Save, CheckCircle2 } from 'lucide-react';

interface Props {
  config: SalaryConfig;
  userId: string;
  onRefresh: () => void;
}

export default function SalaryConfigTab({ config, userId, onRefresh }: Props) {
  const [formData, setFormData] = useState<SalaryConfig>(config);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (field: keyof SalaryConfig, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: typeof prev[field] === 'number' ? Number(value) : value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const payload = {
        user_id: userId,
        rank_level: formData.rank_level,
        basic_salary: Number(formData.basic_salary) || 0,
        responsibility_salary: Number(formData.responsibility_salary) || 0,
        seniority_allowance: Number(formData.seniority_allowance) || 0,
        diligence_allowance: Number(formData.diligence_allowance) || 0,
        standard_work_days: Number(formData.standard_work_days) || 26,
        insurance_rate: Number(formData.insurance_rate) || 0,
        union_rate: Number(formData.union_rate) || 0,
      };

      const { error } = await supabase.from('salary_configs').upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;

      setSaved(true);
      onRefresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
      <h2 className="text-lg font-bold text-white mb-1">Cài Đặt Mức Lương Cá Nhân</h2>
      <p className="text-xs text-slate-400 mb-6">Thiết lập các thông số hợp đồng lao động để app tự động tính toán</p>

      {saved && (
        <div className="mb-6 p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Đã lưu thành công các thông số lương!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">Bậc Lương</label>
          <input
            type="text"
            value={formData.rank_level}
            onChange={(e) => handleChange('rank_level', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">Ngày Công Chuẩn Trong Tháng</label>
          <input
            type="number"
            step="0.5"
            value={formData.standard_work_days}
            onChange={(e) => handleChange('standard_work_days', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">Lương Cơ Bản (VNĐ)</label>
          <input
            type="number"
            value={formData.basic_salary}
            onChange={(e) => handleChange('basic_salary', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">Lương Trách Nhiệm (VNĐ)</label>
          <input
            type="number"
            value={formData.responsibility_salary}
            onChange={(e) => handleChange('responsibility_salary', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">Phụ Cấp Thâm Niên (VNĐ)</label>
          <input
            type="number"
            value={formData.seniority_allowance}
            onChange={(e) => handleChange('seniority_allowance', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">Phụ Cấp Chuyên Cần (VNĐ)</label>
          <input
            type="number"
            value={formData.diligence_allowance}
            onChange={(e) => handleChange('diligence_allowance', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">Trừ Bảo Hiểm (%)</label>
          <input
            type="number"
            step="0.1"
            value={formData.insurance_rate}
            onChange={(e) => handleChange('insurance_rate', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">Phí Công Đoàn (%)</label>
          <input
            type="number"
            step="0.1"
            value={formData.union_rate}
            onChange={(e) => handleChange('union_rate', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="sm:col-span-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}
