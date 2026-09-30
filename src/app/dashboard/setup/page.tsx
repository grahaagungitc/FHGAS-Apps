import Link from "next/link";
import { Building2, Database, SlidersHorizontal, Users } from "lucide-react";

const setupLinks = [
	{ href: "/dashboard/setup/users", label: "User Management", icon: Users },
	{ href: "/dashboard/setup/departments", label: "Department Management", icon: Building2 },
	{ href: "/dashboard/setup/saa-config", label: "SAA Configuration", icon: SlidersHorizontal },
	{ href: "/dashboard/setup/saa-fields", label: "SAA Master Fields", icon: Database },
];

export default function SetupPage() {
	return (
		<section className="space-y-5">
			<header className="border-b-2 border-slate-900 pb-4">
				<h1 className="text-2xl font-black text-slate-900">System Setup</h1>
			</header>
			<nav className="grid gap-3 sm:grid-cols-2">
				{setupLinks.map(({ href, label, icon: Icon }) => (
					<Link key={href} href={href} className="flex items-center gap-3 border-2 border-slate-900 bg-white p-4 font-bold text-slate-800 hover:bg-cyan-50">
						<Icon className="h-5 w-5" />
						{label}
					</Link>
				))}
			</nav>
		</section>
	);
}
