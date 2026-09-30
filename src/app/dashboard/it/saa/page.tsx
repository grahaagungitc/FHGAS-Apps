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

  // Filter Data berdasarkan Search Query dan Status
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 border-2 border-emerald-900 rounded-full text-xs font-black">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            APPROVED
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-900 border-2 border-rose-900 rounded-full text-xs font-black">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            REJECTED
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 border-2 border-amber-900 rounded-full text-xs font-black">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            IN APPROVAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 border-2 border-slate-900 rounded-full text-xs font-black">
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            DRAFT
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header & CTA Button */}
      <div className="bg-white border-2 border-slate-900 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-cyan-400 font-bold border-2 border-cyan-400">
            <FileSignature className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Daftar Pengajuan SAA
            </h1>
            <p className="text-xs font-mono text-slate-600 mt-0.5">
              Kelola dan pantau status permohonan System Access Authorization.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/it/saa/create"
          className="inline-flex items-center justify-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-black px-5 py-2.5 rounded-lg border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition hover:translate-x-[1px] hover:translate-y-[1px] text-xs uppercase"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Pengajuan Baru</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border-2 border-slate-900 rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search Box */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Tiket, Nama, atau Form..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-2 border-slate-900 rounded-lg pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-600 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto border-2 border-slate-900 rounded-lg px-3 py-2 text-xs font-bold bg-white focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">In Approval (Pending)</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
            Memuat Daftar Pengajuan SAA...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              Belum ada data pengajuan SAA.
            </p>
            <p className="text-xs text-slate-500">
              Klik tombol &quot;Buat Pengajuan Baru&quot; di atas untuk membuat formulir SAA.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-xs font-black uppercase tracking-wider border-b-2 border-slate-900">
                  <th className="p-3.5 pl-5">No. Tiket</th>
                  <th className="p-3.5">Tipe Access Form</th>
                  <th className="p-3.5">Pemohon</th>
                  <th className="p-3.5">Target Dept</th>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center pr-5">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 text-xs font-medium text-slate-800">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 pl-5 font-mono font-bold text-cyan-700">
                      #{req.ticketNumber || req.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 block">
                        {req.formConfig?.name || "-"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        [{req.formConfig?.code || "SAA"}]
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold block">{req.requesterName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {req.requesterEmail}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-700">
                      {req.department?.name || "-"}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {new Date(req.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3.5">{getStatusBadge(req.status)}</td>
                    <td className="p-3.5 text-center pr-5">
                      <Link
                        href={`/dashboard/it/saa/${req.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-cyan-600 bg-slate-100 hover:bg-cyan-50 border border-slate-900 px-2.5 py-1.5 rounded transition"
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