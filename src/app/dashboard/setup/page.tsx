import Link from "next/link";
import { Building2, Database, SlidersHorizontal, Users } from "lucide-react";

const setupLinks = [
	{ href: "/dashboard/setup/users", label: "User Management", desc: "Kelola pengguna dan peran sistem", icon: Users, color: "bg-[#8B5CF6] text-white" },
	{ href: "/dashboard/setup/departments", label: "Department Management", desc: "Kelola daftar departemen hotel", icon: Building2, color: "bg-[#2DD4BF] text-white" },
	{ href: "/dashboard/setup/saa-config", label: "SAA Configuration", desc: "Konfigurasi formulir & langkah persetujuan", icon: SlidersHorizontal, color: "bg-[#5C61F4] text-white" },
	{ href: "/dashboard/setup/saa-fields", label: "SAA Master Fields", desc: "Repositori field permohonan dinamis", icon: Database, color: "bg-[#FFB800] text-white" },
];

export default function SetupPage() {
	return (
		<section className="space-y-6 max-w-5xl mx-auto">
			<header className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft">
				<h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">System Setup</h1>
				<p className="text-xs font-medium text-slate-400 mt-0.5">Kelola data master dan konfigurasi aplikasi</p>
			</header>

			<nav className="grid gap-4 sm:grid-cols-2">
				{setupLinks.map(({ href, label, desc, icon: Icon, color }) => (
					<Link
						key={href}
						href={href}
						className="flex items-center gap-4 bg-white border border-slate-100 rounded-3xl p-5 shadow-soft hover:shadow-md transition-all group"
					>
						<div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color} group-hover:scale-105 transition-transform`}>
							<Icon className="h-6 w-6" />
						</div>
						<div>
							<h2 className="text-sm font-extrabold text-slate-800">{label}</h2>
							<p className="text-xs font-medium text-slate-400 mt-0.5">{desc}</p>
						</div>
					</Link>
				))}
			</nav>
		</section>
	);
}
