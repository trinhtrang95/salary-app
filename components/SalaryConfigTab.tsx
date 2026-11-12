'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SalaryConfig } from '@/types';
import { Save, CheckCircle2, ShieldCheck, Briefcase } from 'lucide-react';

export default function SalaryConfigTab({ config, userId, onRefresh }: any) {
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

  const vnd = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-black text-white">Cài Đặt Mức Lương & Phụ Cấp</h2>
          <p className="text-xs text-slate-400">Các thông số gốc dùng để tự động tính đơn giá mỗi giờ làm</p>
        </div>
      </div>

      {saved && (
        <div className="mb-6 p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Đã lưu thành công cài đặt mức lương mới!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Nhóm Thông tin Hợp đồng */}
        <div className="space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">1. Thông Tin Hợp Đồng</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Bậc Lương</label>
              <input
                type="text"
                value={formData.rank_level}
                onChange={(e) => handleChange('rank_level', e.target.value)}
                className="w-full bg-transparent font-bold text-white text-sm focus:outline-none"
                required
              />
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ngày Công Chuẩn Trong Tháng</label>
              <input
                type="number"
                step="0.5"
                value={formData.standard_work_days}
                onChange={(e) => handleChange('standard_work_days', e.target.value)}
                className="w-full bg-transparent font-bold text-white text-sm focus:outline-none"
                required
              />
              <span className="text-[10px] text-slate-500">Tương đương {formData.standard_work_days * 8} giờ chuẩn</span>
            </div>
          </div>
        </div>

        {/* Nhóm Thu Nhập Gốc */}
        <div className="space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">2. Lương & Phụ Cấp Gốc</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Lương Cơ Bản</label>
              <input
                type="number"
                value={formData.basic_salary}
                onChange={(e) => handleChange('basic_salary', e.target.value)}
                className="w-full bg-transparent font-bold text-white text-sm focus:outline-none"
                required
              />
              <span className="text-[10px] text-indigo-400">{vnd(formData.basic_salary)}</span>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Lương Trách Nhiệm</label>
              <input
                type="number"
                value={formData.responsibility_salary}
                onChange={(e) => handleChange('responsibility_salary', e.target.value)}
                className="w-full bg-transparent font-bold text-white text-sm focus:outline-none"
                required
              />
              <span className="text-[10px] text-indigo-400">{vnd(formData.responsibility_salary)}</span>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phụ Cấp Thâm Niên</label>
              <input
                type="number"
                value={formData.seniority_allowance}
                onChange={(e) => handleChange('seniority_allowance', e.target.value)}
                className="w-full bg-transparent font-bold text-white text-sm focus:outline-none"
                required
              />
              <span className="text-[10px] text-indigo-400">{vnd(formData.seniority_allowance)}</span>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phụ Cấp Chuyên Cần</label>
              <input
                type="number"
                value={formData.diligence_allowance}
                onChange={(e) => handleChange('diligence_allowance', e.target.value)}
                className="w-full bg-transparent font-bold text-white text-sm focus:outline-none"
                required
              />
              <span className="text-[10px] text-indigo-400">{vnd(formData.diligence_allowance)}</span>
            </div>
          </div>
        </div>

        {/* Nhóm Khấu Trừ */}
        <div className="space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">3. Tỷ Lệ Trích Nộp</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Trừ Bảo Hiểm (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.insurance_rate}
                onChange={(e) => handleChange('insurance_rate', e.target.value)}
                className="w-full bg-transparent font-bold text-rose-400 text-sm focus:outline-none"
                required
              />
              <span className="text-[10px] text-slate-500">Mặc định 10.5% tính trên LCB</span>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Đoàn Phí (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.union_rate}
                onChange={(e) => handleChange('union_rate', e.target.value)}
                className="w-full bg-transparent font-bold text-rose-400 text-sm focus:outline-none"
                required
              />
              <span className="text-[10px] text-slate-500">Mặc định 0.5% tính trên LCB</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-black text-xs rounded-2xl shadow-xl shadow-indigo-500/25 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : 'Lưu Tất Cả Cài Đặt'}
          </button>
        </div>
      </form>
    </div>
  );
}
