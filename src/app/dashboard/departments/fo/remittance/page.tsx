"use client";

import { useState, useEffect, useRef } from "react";
import {
  Receipt,
  History,
  Printer,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  CheckSquare,
  Square,
  FileSpreadsheet,
  X,
} from "lucide-react";
import DragScrollContainer from "@/components/DragScrollContainer";

interface StaffOption {
  id: string;
  name: string;
  email: string;
  position: string;
  departmentName: string;
}

interface RemittanceItem {
  id: string;
  userId?: string | null;
  canEdit?: boolean;
  timestamp: string;
  tanggal: string;
  staff: string;
  shift: string;
  outlet: string;
  received: number;
  paidOut: number;
  net: number;
  overage: number;
  amountToRemit: number;
  grandTotal: number;
  others: number;
  totalEnclosed: number;
  l100k: number;
  l50k: number;
  l20k: number;
  l10k: number;
  l5k: number;
  l2k: number;
  l1k: number;
  k1k: number;
  k500: number;
  k200: number;
  k100: number;
}

export default function FORemittancePage() {
  const [activeTab, setActiveTab] = useState<"entry" | "history">("entry");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Current logged in user info & rights
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    name?: string;
    email?: string;
    isFOLeader?: boolean;
    hasRemittanceFullAccess?: boolean;
  } | null>(null);

  // Edit Mode State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Master Data
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [historyData, setHistoryData] = useState<RemittanceItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form Meta State
  const [tanggal, setTanggal] = useState(new Date().toISOString().substring(0, 10));
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedStaffName, setSelectedStaffName] = useState("");
  const [shift, setShift] = useState("Morning");
  const [outlet, setOutlet] = useState("FO");

  // Financial State
  const [received, setReceived] = useState<number | "">("");
  const [paidOut, setPaidOut] = useState<number | "">("");
  const [overage, setOverage] = useState<number | "">("");
  const [others, setOthers] = useState<number | "">("");

  // Denominations State
  const [d100k, setD100k] = useState<number | "">("");
  const [d50k, setD50k] = useState<number | "">("");
  const [d20k, setD20k] = useState<number | "">("");
  const [d10k, setD10k] = useState<number | "">("");
  const [d5k, setD5k] = useState<number | "">("");
  const [d2k, setD2k] = useState<number | "">("");
  const [d1k, setD1k] = useState<number | "">("");
  const [k1k, setK1k] = useState<number | "">("");
  const [k500, setK500] = useState<number | "">("");
  const [k200, setK200] = useState<number | "">("");
  const [k100, setK100] = useState<number | "">("");

  // Modal Preview State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<RemittanceItem | null>(null);
  const [printDataList, setPrintDataList] = useState<RemittanceItem[]>([]);

  useEffect(() => {
    fetchRemittanceData();
  }, []);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRemittanceData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fo/remittance");
      if (res.ok) {
        const data = await res.json();
        const staffs: StaffOption[] = data.staffList || [];
        setStaffList(staffs);
        setHistoryData(data.history || []);
        setCurrentUser(data.currentUser || null);

        // Auto select current logged in user jika tidak sedang mengedit
        if (!editingId) {
          const loggedUserId = data.currentUser?.id;
          const loggedUserName = data.currentUser?.name?.trim().toLowerCase();

          let matchedStaff = staffs.find((s) => loggedUserId && s.id === loggedUserId);
          if (!matchedStaff && loggedUserName) {
            matchedStaff = staffs.find((s) => s.name.trim().toLowerCase() === loggedUserName);
          }

          if (matchedStaff) {
            setSelectedStaffId(matchedStaff.id);
            setSelectedStaffName(matchedStaff.name);
          } else if (data.currentUser?.name) {
            setSelectedStaffId(data.currentUser.id || "");
            setSelectedStaffName(data.currentUser.name);
          } else if (staffs.length > 0) {
            setSelectedStaffId(staffs[0].id);
            setSelectedStaffName(staffs[0].name);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load remittance data:", err);
      showToast("Gagal memuat data Remittance", "error");
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const numRec = Number(received) || 0;
  const numPaid = Number(paidOut) || 0;
  const numOver = Number(overage) || 0;
  const numOth = Number(others) || 0;

  const net = numRec - numPaid;
  const amountToRemit = net + numOver + numOth;

  const grandTotalCash =
    (Number(d100k) || 0) * 100000 +
    (Number(d50k) || 0) * 50000 +
    (Number(d20k) || 0) * 20000 +
    (Number(d10k) || 0) * 10000 +
    (Number(d5k) || 0) * 5000 +
    (Number(d2k) || 0) * 2000 +
    (Number(d1k) || 0) * 1000 +
    (Number(k1k) || 0) * 1000 +
    (Number(k500) || 0) * 500 +
    (Number(k200) || 0) * 200 +
    (Number(k100) || 0) * 100;

  const resetForm = () => {
    setEditingId(null);
    setTanggal(new Date().toISOString().substring(0, 10));
    setShift("Morning");
    setOutlet("FO");
    setReceived("");
    setPaidOut("");
    setOverage("");
    setOthers("");
    setD100k("");
    setD50k("");
    setD20k("");
    setD10k("");
    setD5k("");
    setD2k("");
    setD1k("");
    setK1k("");
    setK500("");
    setK200("");
    setK100("");

    if (currentUser?.id) {
      const match = staffList.find((s) => s.id === currentUser.id);
      if (match) {
        setSelectedStaffId(match.id);
        setSelectedStaffName(match.name);
      } else {
        setSelectedStaffId(currentUser.id);
        setSelectedStaffName(currentUser.name || "");
      }
    }
  };

  const startEditItem = (item: RemittanceItem) => {
    setEditingId(item.id);
    setTanggal(item.tanggal);
    setSelectedStaffName(item.staff);
    setSelectedStaffId(item.userId || "");
    setShift(item.shift);
    setOutlet(item.outlet || "FO");
    setReceived(item.received || "");
    setPaidOut(item.paidOut || "");
    setOverage(item.overage || "");
    setOthers(item.others || "");
    setD100k(item.l100k || "");
    setD50k(item.l50k || "");
    setD20k(item.l20k || "");
    setD10k(item.l10k || "");
    setD5k(item.l5k || "");
    setD2k(item.l2k || "");
    setD1k(item.l1k || "");
    setK1k(item.k1k || "");
    setK500(item.k500 || "");
    setK200(item.k200 || "");
    setK100(item.k100 || "");

    setActiveTab("entry");
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast(`Memuat data Remittance #${item.id.substring(0, 8)} untuk diedit`, "info");
  };

  const getCurrentFormPayload = (): RemittanceItem => {
    return {
      id: editingId || `TEMP-${Date.now()}`,
      userId: selectedStaffId || currentUser?.id,
      canEdit: true,
      timestamp: new Date().toLocaleString("id-ID"),
      tanggal,
      staff: selectedStaffName || "Kasir FO",
      shift,
      outlet,
      received: numRec,
      paidOut: numPaid,
      net,
      overage: numOver,
      amountToRemit,
      grandTotal: grandTotalCash,
      others: numOth,
      totalEnclosed: amountToRemit,
      l100k: Number(d100k) || 0,
      l50k: Number(d50k) || 0,
      l20k: Number(d20k) || 0,
      l10k: Number(d10k) || 0,
      l5k: Number(d5k) || 0,
      l2k: Number(d2k) || 0,
      l1k: Number(d1k) || 0,
      k1k: Number(k1k) || 0,
      k500: Number(k500) || 0,
      k200: Number(k200) || 0,
      k100: Number(k100) || 0,
    };
  };

  const handleSaveRemittance = async () => {
    if (!selectedStaffName) {
      showToast("Pilih Nama Kasir terlebih dahulu!", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        tanggal,
        staffName: selectedStaffName,
        userId: selectedStaffId || currentUser?.id,
        shift,
        outlet,
        received: numRec,
        paidOut: numPaid,
        net,
        overage: numOver,
        others: numOth,
        amountToRemit,
        grandTotal: grandTotalCash,
        totalEnclosed: amountToRemit,
        l100k: Number(d100k) || 0,
        l50k: Number(d50k) || 0,
        l20k: Number(d20k) || 0,
        l10k: Number(d10k) || 0,
        l5k: Number(d5k) || 0,
        l2k: Number(d2k) || 0,
        l1k: Number(d1k) || 0,
        k1k: Number(k1k) || 0,
        k500: Number(k500) || 0,
        k200: Number(k200) || 0,
        k100: Number(k100) || 0,
      };

      const res = await fetch("/api/fo/remittance", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(
          editingId
            ? "Laporan Remittance Berhasil Diperbarui!"
            : "Laporan Remittance Berhasil Disimpan!",
          "success"
        );
        resetForm();
        await fetchRemittanceData();
      } else {
        const err = await res.json();
        showToast(err.message || "Gagal menyimpan data", "error");
      }
    } catch (err) {
      console.error("Save remittance error:", err);
      showToast("Terjadi kesalahan server", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerPrint = (items: RemittanceItem[]) => {
    setPrintDataList(items);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const fmtRp = (v: number) => {
    if (!v || v === 0) return "-";
    return v.toLocaleString("id-ID");
  };

  const filteredHistory = historyData.filter((item) =>
    (item.staff || "").toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredHistory.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredHistory.map((item) => item.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 w-full">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-soft-lg text-white font-bold text-xs transition-all ${
            toast.type === "success"
              ? "bg-emerald-600"
              : toast.type === "error"
              ? "bg-rose-600"
              : "bg-indigo-600"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <span className="p-2.5 bg-indigo-50 text-[#5C61F4] rounded-2xl border border-indigo-100 shadow-soft">
              <Receipt className="w-6 h-6" />
            </span>
            <span>FO Cashier Remittance</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Sistem Laporan Setoran Tunai Front Office & Amplop Remittance Hotel
          </p>
        </div>

        {/* Tab Header Navigation */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("entry")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "entry"
                ? "bg-white text-[#5C61F4] shadow-soft"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Entry Data</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "history"
                ? "bg-white text-[#5C61F4] shadow-soft"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Remittance History</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3 font-semibold text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-[#5C61F4]" />
          <span>Memuat data sistem Remittance...</span>
        </div>
      ) : activeTab === "entry" ? (
        /* TAB 1: ENTRY DATA FORM */
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-6">
          {editingId && (
            <div className="flex items-center justify-between p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-bold">
              <span>Mode Edit: Sedang mengedit setoran kasir #{editingId.substring(0, 8)}</span>
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl text-amber-900 transition-all text-xs"
              >
                Batal Edit
              </button>
            </div>
          )}

          {/* Metadata Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Date / Tanggal</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full text-xs font-bold text-slate-800 p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Cashier Name (User Login / Kasir FO)</label>
              <select
                value={selectedStaffId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedStaffId(val);
                  const found = staffList.find((s) => s.id === val);
                  if (found) {
                    setSelectedStaffName(found.name);
                  } else if (currentUser?.id === val) {
                    setSelectedStaffName(currentUser.name || "");
                  }
                }}
                className="w-full text-xs font-bold text-slate-800 p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 transition-all"
              >
                <option value="">-- Pilih Kasir FO --</option>
                {/* Opsi khusus jika user login saat ini belum ada di list staff FO */}
                {currentUser?.id && !staffList.some((s) => s.id === currentUser.id) && (
                  <option value={currentUser.id}>
                    {currentUser.name} (User Login Saat Ini)
                  </option>
                )}
                {staffList.map((stf) => (
                  <option key={stf.id} value={stf.id}>
                    {stf.name} {currentUser?.id === stf.id ? "(Anda)" : `(${stf.departmentName})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Shift / Regu</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full text-xs font-bold text-slate-800 p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 transition-all"
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Night">Night</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Outlet / Gerai</label>
              <input
                type="text"
                value={outlet}
                onChange={(e) => setOutlet(e.target.value)}
                className="w-full text-xs font-bold text-slate-800 p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Left Column: Summary Keuangan */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-sm font-extrabold text-[#5C61F4] flex items-center gap-2">
                <span>Summary Keuangan</span>
              </h3>

              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Received (Diterima)</span>
                  <input
                    type="number"
                    value={received}
                    onChange={(e) => setReceived(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                    className="w-36 text-right font-extrabold text-slate-800 p-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Paid Out (Dibayarkan)</span>
                  <input
                    type="number"
                    value={paidOut}
                    onChange={(e) => setPaidOut(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                    className="w-36 text-right font-extrabold text-slate-800 p-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-bold p-2.5 bg-indigo-50/70 rounded-xl text-indigo-950">
                  <span>Net (Bersih)</span>
                  <span className="font-black text-sm text-[#5C61F4]">{net.toLocaleString("id-ID")}</span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Overage / (Shortage)</span>
                  <input
                    type="number"
                    value={overage}
                    onChange={(e) => setOverage(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                    className="w-36 text-right font-extrabold text-slate-800 p-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Others (Lain-lain)</span>
                  <input
                    type="number"
                    value={others}
                    onChange={(e) => setOthers(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                    className="w-36 text-right font-extrabold text-slate-800 p-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-bold p-3 bg-purple-100 rounded-xl text-purple-900 border border-purple-200">
                  <span>Amount to Remit (Total disetor)</span>
                  <span className="font-black text-base text-purple-700">{amountToRemit.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Rincian Pecahan Uang (Denominasi) */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-extrabold text-[#5C61F4]">
                Rincian Uang (Denominasi Fisik)
              </h3>

              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-xs font-medium text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Denominasi</th>
                      <th className="p-2.5 text-center">Qty (Lembar/Koin)</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { label: "100.000", val: d100k, setVal: setD100k, mult: 100000 },
                      { label: "50.000", val: d50k, setVal: setD50k, mult: 50000 },
                      { label: "20.000", val: d20k, setVal: setD20k, mult: 20000 },
                      { label: "10.000", val: d10k, setVal: setD10k, mult: 10000 },
                      { label: "5.000", val: d5k, setVal: setD5k, mult: 5000 },
                      { label: "2.000", val: d2k, setVal: setD2k, mult: 2000 },
                      { label: "1.000", val: d1k, setVal: setD1k, mult: 1000 },
                      { label: "Coin 1.000", val: k1k, setVal: setK1k, mult: 1000 },
                      { label: "Coin 500", val: k500, setVal: setK500, mult: 500 },
                      { label: "Coin 200", val: k200, setVal: setK200, mult: 200 },
                      { label: "Coin 100", val: k100, setVal: setK100, mult: 100 },
                    ].map((row, idx) => {
                      const num = Number(row.val) || 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-800">{row.label}</td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              value={row.val}
                              onChange={(e) => row.setVal(e.target.value === "" ? "" : Number(e.target.value))}
                              placeholder="0"
                              className="w-20 text-center font-bold p-1 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-xs"
                            />
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-800">
                            {(num * row.mult).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-900 text-white font-extrabold text-xs">
                      <td colSpan={2} className="p-3">GRAND TOTAL CASH (Fisik)</td>
                      <td className="p-3 text-right text-sm text-amber-300">
                        {grandTotalCash.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setPreviewData(getCurrentFormPayload());
                setPreviewModalOpen(true);
              }}
              className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-soft transition-all flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Amplop</span>
            </button>

            <button
              type="button"
              onClick={handleSaveRemittance}
              disabled={saving}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{saving ? "Menyimpan..." : "Save Data Remittance"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleTriggerPrint([getCurrentFormPayload()])}
              className="flex-1 py-3 px-4 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-2xl shadow-soft transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Amplop Langsung</span>
            </button>
          </div>
        </div>
      ) : (
        /* TAB 2: REMITTANCE HISTORY */
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
          {/* History Controls Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="🔍 Cari nama kasir..."
                className="w-full text-xs font-medium text-slate-700 p-3 pl-9 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>

            <button
              type="button"
              onClick={() => {
                const selectedItems = historyData.filter((h) => selectedIds.includes(h.id));
                if (selectedItems.length === 0) {
                  showToast("Pilih minimal 1 data pada checkbox dahulu!", "error");
                  return;
                }
                handleTriggerPrint(selectedItems);
              }}
              className="w-full sm:w-auto py-2.5 px-4 bg-[#5C61F4] hover:bg-indigo-600 text-white font-bold text-xs rounded-2xl shadow-soft transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Selected (Bulk Print: {selectedIds.length})</span>
            </button>
          </div>

          {/* Table History */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
            <DragScrollContainer>
              <table className="w-full text-xs font-medium text-left min-w-[750px]">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center w-10">
                    <button type="button" onClick={toggleSelectAll}>
                      {selectedIds.length === filteredHistory.length && filteredHistory.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#5C61F4]" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">Created at</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Nama Kasir FO</th>
                  <th className="p-3">Shift</th>
                  <th className="p-3">Received</th>
                  <th className="p-3">Amount to Remit</th>
                  <th className="p-3">Total Cash</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 font-semibold">
                      Tidak ada riwayat setoran remittance ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-center">
                        <button type="button" onClick={() => toggleSelectRow(item.id)}>
                          {selectedIds.includes(item.id) ? (
                            <CheckSquare className="w-4 h-4 text-[#5C61F4]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px] font-medium">{item.timestamp}</td>
                      <td className="p-3 font-bold text-slate-800">{item.tanggal}</td>
                      <td className="p-3 font-bold text-slate-800">{item.staff}</td>
                      <td className="p-3">{item.shift}</td>
                      <td className="p-3 font-bold">{item.received.toLocaleString("id-ID")}</td>
                      <td className="p-3 font-black text-[#5C61F4]">
                        {item.amountToRemit.toLocaleString("id-ID")}
                      </td>
                      <td className="p-3 font-bold">{item.grandTotal.toLocaleString("id-ID")}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {item.canEdit && (
                            <button
                              type="button"
                              onClick={() => startEditItem(item)}
                              title="Edit Remittance"
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1"
                            >
                              <span>Edit</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewData(item);
                              setPreviewModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTriggerPrint([item])}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#5C61F4] font-bold text-[11px] rounded-lg transition-all flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </DragScrollContainer>
          </div>
        </div>
      )}

      {/* MODAL POPUP PREVIEW AMPLOP */}
      {previewModalOpen && previewData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-soft-lg flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#5C61F4]" />
                <span>Print Preview Amplop Remittance</span>
              </h3>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Envelope Visual Matching AppScript Exact Style */}
            <div className="p-6 overflow-y-auto bg-[#f7fafc] flex justify-center">
              <div className="w-[88mm] bg-white border border-slate-300 p-4 text-black font-sans text-left space-y-3 shadow-md rounded-none leading-normal">
                <div className="border-b-2 border-black pb-1.5 flex items-end justify-between">
                  <div>
                    <div className="text-xl font-black text-[#8b2550] leading-none tracking-tight">favehotel</div>
                    <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-700 mt-1">
                      GRAHA AGUNG SURABAYA
                    </div>
                  </div>
                  <div className="text-sm font-black uppercase tracking-wider text-black">REMITTANCE</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-500 font-semibold block text-[8px]">Date / <i className="font-serif italic">Tanggal :</i></span>
                    <span className="border-b border-dotted border-black block font-bold pb-0.5">{previewData.tanggal}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[8px]">Cashier / <i className="font-serif italic">Kasir :</i></span>
                    <span className="border-b border-dotted border-black block font-bold pb-0.5">{previewData.staff}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[8px]">Shift / <i className="font-serif italic">Regu :</i></span>
                    <span className="border-b border-dotted border-black block font-bold pb-0.5">{previewData.shift}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[8px]">Outlet / <i className="font-serif italic">Gerai :</i></span>
                    <span className="border-b border-dotted border-black block font-bold pb-0.5">{previewData.outlet}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-black pt-1.5 space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="font-bold">Received / <i className="font-serif italic font-normal text-slate-600">Diterima</i></span>
                    <span className="font-extrabold">Rp. {fmtRp(previewData.received)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Paid Out / <i className="font-serif italic font-normal text-slate-600">Dibayarkan</i></span>
                    <span className="font-extrabold">Rp. {previewData.paidOut > 0 ? fmtRp(previewData.paidOut) : "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Net / <i className="font-serif italic font-normal text-slate-600">Bersih</i></span>
                    <span className="font-extrabold">Rp. {fmtRp(previewData.net)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Overage / (Shortage) In Cash</span>
                    <span className="font-extrabold">Rp. {previewData.overage !== 0 ? fmtRp(previewData.overage) : "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Others / <i className="font-serif italic font-normal text-slate-600">Lain-lain</i></span>
                    <span className="font-extrabold">Rp. {previewData.others > 0 ? fmtRp(previewData.others) : "-"}</span>
                  </div>
                  <div className="flex justify-between font-black border-t-2 border-b-2 border-black py-1.5 text-xs">
                    <span>Amount to Remit (Total Enclosed)</span>
                    <span>Rp. {fmtRp(previewData.amountToRemit)}</span>
                  </div>
                </div>

                {/* Denomination Table */}
                <table className="w-full text-[9px] font-bold border-collapse">
                  <thead>
                    <tr className="border-t border-b border-black text-slate-800">
                      <th className="text-right py-1 pr-2">DENOMINASI</th>
                      <th className="text-center py-1">QTY</th>
                      <th className="text-right py-1">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr><td colSpan={3} className="pt-2 font-black underline text-[9px]">BANK NOTES / <i className="font-serif italic font-normal">Uang Kertas</i></td></tr>
                    <tr><td className="text-right pr-2">100.000</td><td className="text-center border-b border-dotted border-black">{previewData.l100k || "-"}</td><td className="text-right">{previewData.l100k > 0 ? fmtRp(previewData.l100k * 100000) : "-"}</td></tr>
                    <tr><td className="text-right pr-2">50.000</td><td className="text-center border-b border-dotted border-black">{previewData.l50k || "-"}</td><td className="text-right">{previewData.l50k > 0 ? fmtRp(previewData.l50k * 50000) : "-"}</td></tr>
                    <tr><td className="text-right pr-2">20.000</td><td className="text-center border-b border-dotted border-black">{previewData.l20k || "-"}</td><td className="text-right">{previewData.l20k > 0 ? fmtRp(previewData.l20k * 20000) : "-"}</td></tr>
                    <tr><td className="text-right pr-2">10.000</td><td className="text-center border-b border-dotted border-black">{previewData.l10k || "-"}</td><td className="text-right">{previewData.l10k > 0 ? fmtRp(previewData.l10k * 10000) : "-"}</td></tr>
                    <tr><td className="text-right pr-2">5.000</td><td className="text-center border-b border-dotted border-black">{previewData.l5k || "-"}</td><td className="text-right">{previewData.l5k > 0 ? fmtRp(previewData.l5k * 5000) : "-"}</td></tr>
                    <tr><td className="text-right pr-2">2.000</td><td className="text-center border-b border-dotted border-black">{previewData.l2k || "-"}</td><td className="text-right">{previewData.l2k > 0 ? fmtRp(previewData.l2k * 2000) : "-"}</td></tr>
                    <tr><td className="text-right pr-2">1.000</td><td className="text-center border-b border-dotted border-black">{previewData.l1k || "-"}</td><td className="text-right">{previewData.l1k > 0 ? fmtRp(previewData.l1k * 1000) : "-"}</td></tr>

                    <tr><td colSpan={3} className="pt-2 font-black underline text-[9px]">COINS / <i className="font-serif italic font-normal">Uang Logam</i></td></tr>
                    <tr><td className="text-right pr-2">Logam 1.000</td><td className="text-center border-b border-dotted border-black">{previewData.k1k || "-"}</td><td className="text-right">{previewData.k1k > 0 ? fmtRp(previewData.k1k * 1000) : "-"}</td></tr>
                    <tr><td className="text-right pr-2">500</td><td className="text-center border-b border-dotted border-black">{previewData.k500 || "-"}</td><td className="text-right">{previewData.k500 > 0 ? fmtRp(previewData.k500 * 500) : "-"}</td></tr>
                    <tr><td className="text-right pr-2">200</td><td className="text-center border-b border-dotted border-black">{previewData.k200 || "-"}</td><td className="text-right">{previewData.k200 > 0 ? fmtRp(previewData.k200 * 200) : "-"}</td></tr>
                    <tr><td className="text-right pr-2">100</td><td className="text-center border-b border-dotted border-black">{previewData.k100 || "-"}</td><td className="text-right">{previewData.k100 > 0 ? fmtRp(previewData.k100 * 100) : "-"}</td></tr>

                    <tr className="bg-slate-100 font-extrabold border-t-2 border-b-2 border-black">
                      <td colSpan={2} className="py-1.5">
                        Grand Total Cash
                        <span className="block font-normal text-[8px] italic text-slate-600">Jumlah Fisik Tunai</span>
                      </td>
                      <td className="text-right py-1.5 font-black text-[#8b2550] text-xs">
                        Rp. {fmtRp(previewData.grandTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Signatures Table */}
                <table className="w-full text-[9px] font-bold border-collapse mt-3 text-center">
                  <tbody>
                    <tr>
                      <td className="w-1/2 p-1">
                        <div>SPV Sign</div>
                        <div className="h-8"></div>
                        <div className="w-4/5 mx-auto border-t border-black"></div>
                      </td>
                      <td className="w-1/2 p-1">
                        <div>Cashier&apos;s Sign</div>
                        <div className="h-8"></div>
                        <div className="w-4/5 mx-auto border-t border-black"></div>
                      </td>
                    </tr>
                    <tr>
                      <td className="w-1/2 p-1 pt-2">
                        <div>Witnessed by</div>
                        <div className="h-8"></div>
                        <div className="w-4/5 mx-auto border-t border-black"></div>
                      </td>
                      <td className="w-1/2 p-1 pt-2">
                        <div>Verified by GC</div>
                        <div className="h-8"></div>
                        <div className="w-4/5 mx-auto border-t border-black"></div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="border-t border-black pt-1 text-[9px] font-semibold min-h-[30px]">
                  Notes:
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-white">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewModalOpen(false);
                  handleTriggerPrint([previewData]);
                }}
                className="py-2 px-4 bg-[#5C61F4] hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-soft transition-all flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Amplop Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT AREA ENGINE (FOR A4 LANDSCAPE PRINTING) */}
      <div id="printArea" className="hidden print:block">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              height: 100% !important;
              overflow: hidden !important;
            }
            body * { visibility: hidden; }
            #printArea, #printArea * { visibility: visible; }
            #printArea { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
            @page { size: A4 landscape; margin: 0; }
            .print-page-a4 {
              width: 297mm;
              height: 200mm;
              max-height: 200mm;
              box-sizing: border-box;
              padding: 3mm 8mm 3mm 8mm;
              margin: 0;
              display: flex;
              flex-direction: row;
              justify-content: flex-end;
              page-break-after: always;
              break-after: page;
              page-break-inside: avoid;
              break-inside: avoid;
              overflow: hidden;
            }
            .print-page-a4:last-child {
              page-break-after: auto;
              break-after: auto;
            }
            .envelope-container {
              width: 90mm;
              box-sizing: border-box;
              border-left: 1px dashed #000;
              padding-left: 5mm;
              padding-right: 3mm;
              font-family: 'Montserrat', Arial, sans-serif;
              color: #000 !important;
              background: white;
              text-align: left;
            }
            .p-header { border-bottom: 2px solid #000; padding-bottom: 2px; margin-bottom: 5px; display: flex; align-items: flex-end; justify-content: space-between; }
            .p-title-envelope { font-size: 10.5pt; font-weight: 800; text-transform: uppercase; }
            .p-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 8px; margin-bottom: 5px; font-size: 7pt; font-weight: 700; }
            .p-meta-label { color: #555; font-size: 6pt; display: block; }
            .p-meta-value { border-bottom: 1px dotted #000; display: block; font-weight: bold; }
            .p-fin-box { border-top: 1px dashed #000; padding-top: 3px; margin-bottom: 5px; font-size: 7pt; }
            .p-fin-line { display: flex; justify-content: space-between; padding: 1.5px 0; border-bottom: 1px dashed #ccc; }
            .p-fin-line.bold-remit { border-top: 2px solid #000; border-bottom: 2px solid #000; font-weight: 800; padding: 3px 0; margin-top: 3px; font-size: 7.5pt; }
            .p-table-denom { width: 100%; border-collapse: collapse; font-size: 6.5pt; font-weight: 700; }
            .p-table-denom th { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 2px 0; }
            .p-table-denom td { padding: 1px 0; }
            .p-category-head { font-weight: 900; text-decoration: underline; padding-top: 2.5px !important; font-size: 6.5pt; }
            .col-denom { text-align: right; width: 30%; padding-right: 5px !important; }
            .col-qty { text-align: center; width: 18%; border-bottom: 1px dotted #000; }
            .col-total { text-align: right; width: 52%; }
            .p-grand-total { border-top: 2px solid #000; border-bottom: 2px solid #000; font-weight: 800; }
            .p-grand-total td { padding: 2.5px 0 !important; }
            .p-sig-table { width: 100%; margin-top: 8px; font-size: 7pt; font-weight: 700; text-align: center; border-collapse: collapse; }
            .p-sig-table td { width: 50%; padding: 2px 4px; vertical-align: top; }
            .p-sig-gap { height: 70px; }
            .p-sig-line { width: 85%; margin: 0 auto; border-top: 1px solid #000; }
            .p-notes-box { border-top: 1px solid #000; margin-top: 10px; padding-top: 2px; font-size: 6.5pt; font-weight: 600; min-height: 22px; }
          }
        ` }} />

        {printDataList.map((item, idx) => (
          <div key={idx} className="print-page-a4">
            <div className="envelope-container">
              <div className="p-header">
                <div>
                  <div style={{ fontSize: "14pt", fontWeight: 800, color: "#8b2550", lineHeight: "1" }}>favehotel</div>
                  <div style={{ fontSize: "7pt", fontWeight: 700, textTransform: "uppercase", marginTop: "2px" }}>graha agung surabaya</div>
                </div>
                <div className="p-title-envelope">Remittance</div>
              </div>

              <div className="p-meta-grid">
                <div>
                  <span className="p-meta-label">Date / <i>Tanggal :</i></span>
                  <span className="p-meta-value">{item.tanggal}</span>
                </div>
                <div>
                  <span className="p-meta-label">Cashier / <i>Kasir :</i></span>
                  <span className="p-meta-value">{item.staff}</span>
                </div>
                <div>
                  <span className="p-meta-label">Shift / <i>Regu :</i></span>
                  <span className="p-meta-value">{item.shift}</span>
                </div>
                <div>
                  <span className="p-meta-label">Outlet / <i>Gerai :</i></span>
                  <span className="p-meta-value">{item.outlet}</span>
                </div>
              </div>

              <div className="p-fin-box">
                <div className="p-fin-line">
                  <span>Received / <i>Diterima</i></span>
                  <span style={{ fontWeight: 800 }}>Rp. {fmtRp(item.received)}</span>
                </div>
                <div className="p-fin-line">
                  <span>Paid Out / <i>Dibayarkan</i></span>
                  <span style={{ fontWeight: 800 }}>Rp. {item.paidOut > 0 ? fmtRp(item.paidOut) : "-"}</span>
                </div>
                <div className="p-fin-line">
                  <span>Net / <i>Bersih</i></span>
                  <span style={{ fontWeight: 800 }}>Rp. {fmtRp(item.net)}</span>
                </div>
                <div className="p-fin-line">
                  <span>Overage / (Shortage) In Cash</span>
                  <span style={{ fontWeight: 800 }}>Rp. {item.overage !== 0 ? fmtRp(item.overage) : "-"}</span>
                </div>
                <div className="p-fin-line">
                  <span>Others / <i>Lain-lain</i></span>
                  <span style={{ fontWeight: 800 }}>Rp. {item.others > 0 ? fmtRp(item.others) : "-"}</span>
                </div>
                <div className="p-fin-line bold-remit">
                  <span>Amount to Remit (Total Enclosed)</span>
                  <span>Rp. {fmtRp(item.amountToRemit)}</span>
                </div>
              </div>

              <table className="p-table-denom">
                <thead>
                  <tr>
                    <th className="col-denom">DENOMINASI</th>
                    <th className="col-qty">QTY</th>
                    <th className="col-total">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td colSpan={3} className="p-category-head">BANK NOTES / <i>Uang Kertas</i></td></tr>
                  <tr><td className="col-denom">100.000</td><td className="col-qty">{item.l100k || "-"}</td><td className="col-total">{item.l100k > 0 ? fmtRp(item.l100k * 100000) : "-"}</td></tr>
                  <tr><td className="col-denom">50.000</td><td className="col-qty">{item.l50k || "-"}</td><td className="col-total">{item.l50k > 0 ? fmtRp(item.l50k * 50000) : "-"}</td></tr>
                  <tr><td className="col-denom">20.000</td><td className="col-qty">{item.l20k || "-"}</td><td className="col-total">{item.l20k > 0 ? fmtRp(item.l20k * 20000) : "-"}</td></tr>
                  <tr><td className="col-denom">10.000</td><td className="col-qty">{item.l10k || "-"}</td><td className="col-total">{item.l10k > 0 ? fmtRp(item.l10k * 10000) : "-"}</td></tr>
                  <tr><td className="col-denom">5.000</td><td className="col-qty">{item.l5k || "-"}</td><td className="col-total">{item.l5k > 0 ? fmtRp(item.l5k * 5000) : "-"}</td></tr>
                  <tr><td className="col-denom">2.000</td><td className="col-qty">{item.l2k || "-"}</td><td className="col-total">{item.l2k > 0 ? fmtRp(item.l2k * 2000) : "-"}</td></tr>
                  <tr><td className="col-denom">1.000</td><td className="col-qty">{item.l1k || "-"}</td><td className="col-total">{item.l1k > 0 ? fmtRp(item.l1k * 1000) : "-"}</td></tr>

                  <tr><td colSpan={3} className="p-category-head">COINS / <i>Uang Logam</i></td></tr>
                  <tr><td className="col-denom">Logam 1.000</td><td className="col-qty">{item.k1k || "-"}</td><td className="col-total">{item.k1k > 0 ? fmtRp(item.k1k * 1000) : "-"}</td></tr>
                  <tr><td className="col-denom">500</td><td className="col-qty">{item.k500 || "-"}</td><td className="col-total">{item.k500 > 0 ? fmtRp(item.k500 * 500) : "-"}</td></tr>
                  <tr><td className="col-denom">200</td><td className="col-qty">{item.k200 || "-"}</td><td className="col-total">{item.k200 > 0 ? fmtRp(item.k200 * 200) : "-"}</td></tr>
                  <tr><td className="col-denom">100</td><td className="col-qty">{item.k100 || "-"}</td><td className="col-total">{item.k100 > 0 ? fmtRp(item.k100 * 100) : "-"}</td></tr>

                  <tr className="p-grand-total">
                    <td colSpan={2}>
                      Grand Total Cash
                      <span style={{ display: "block", fontSize: "6pt", fontWeight: "normal", fontStyle: "italic", color: "#555" }}>Jumlah Fisik Tunai</span>
                    </td>
                    <td className="col-total" style={{ color: "#8b2550", fontSize: "8pt", fontWeight: 800 }}>Rp. {fmtRp(item.grandTotal)}</td>
                  </tr>
                </tbody>
              </table>

              <table className="p-sig-table">
                <tbody>
                  <tr>
                    <td>
                      <div>SPV Sign</div>
                      <div className="p-sig-gap"></div>
                      <div className="p-sig-line"></div>
                    </td>
                    <td>
                      <div>Cashier&apos;s Sign</div>
                      <div className="p-sig-gap"></div>
                      <div className="p-sig-line"></div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingTop: "6px" }}>
                      <div>Witnessed by</div>
                      <div className="p-sig-gap"></div>
                      <div className="p-sig-line"></div>
                    </td>
                    <td style={{ paddingTop: "6px" }}>
                      <div>Verified by GC</div>
                      <div className="p-sig-gap"></div>
                      <div className="p-sig-line"></div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="p-notes-box">
                Notes:
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
