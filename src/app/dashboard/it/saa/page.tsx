"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileSignature,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronRight,
  Eye
} from "lucide-react";

interface SaaRequest {
  id: string;
  ticketNumber: string;
  requesterName: string;
  requesterEmail: string;
  formConfig: {
    code: string;
    name: string;
  };
  department: {
    name: string;
  };
  status: "PENDING" | "APPROVED" | "REJECTED" | "DRAFT";
  currentStep?: string;
  createdAt: string;
}

export default function SaaListPage() {
  const [requests, setRequests] = useState<SaaRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchSaaRequests();
  }, []);

  const fetchSaaRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/setup/saa-request");
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Gagal mengambil daftar pengajuan SAA:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requesterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.formConfig?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.department?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            APPROVED
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-bold border border-rose-100">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            REJECTED
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold border border-amber-100">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            IN APPROVAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            DRAFT
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & CTA Button */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#5C61F4]">
            <FileSignature className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Daftar Pengajuan SAA
            </h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Kelola dan pantau status permohonan System Access Authorization.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/it/saa/create"
          className="inline-flex items-center justify-center gap-2 bg-[#5C61F4] hover:bg-indigo-600 text-white font-bold px-5 py-3 rounded-2xl shadow-soft hover:shadow-indigo-200 transition-all text-xs active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Pengajuan Baru</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-soft flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search Box */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Tiket, Nama, atau Form..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold bg-white text-slate-700 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">In Approval (Pending)</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400 tracking-wider">
            Memuat Daftar Pengajuan SAA...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-200 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              Belum ada data pengajuan SAA.
            </p>
            <p className="text-xs text-slate-400 font-medium">
              Klik tombol &quot;Buat Pengajuan Baru&quot; di atas untuk membuat formulir SAA.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4 pl-6">No. Tiket</th>
                  <th className="p-4">Tipe Access Form</th>
                  <th className="p-4">Pemohon</th>
                  <th className="p-4">Target Dept</th>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 pl-6 font-bold text-[#5C61F4]">
                      #{req.ticketNumber || req.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-800 block">
                        {req.formConfig?.name || "-"}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        [{req.formConfig?.code || "SAA"}]
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-800 block">{req.requesterName}</span>
                      <span className="text-[10px] text-slate-400">
                        {req.requesterEmail}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      {req.department?.name || "-"}
                    </td>
                    <td className="p-4 text-slate-500 font-medium">
                      {new Date(req.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-4">{getStatusBadge(req.status)}</td>
                    <td className="p-4 text-center pr-6">
                      <Link
                        href={`/dashboard/it/saa/${req.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5C61F4] hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}