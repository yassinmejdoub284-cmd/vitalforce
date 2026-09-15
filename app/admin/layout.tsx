import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { AdminNav } from "@/components/admin/admin-nav";
export const metadata={robots:{index:false,follow:false}};
export default function AdminLayout({children}:{children:ReactNode}){
 return <div className="admin-shell"><header className="admin-header"><Link href="/admin" className="admin-brand"><Image src="/images/v2/logo.png" alt="Vital Force" width={90} height={58}/><div><strong>VITAL FORCE</strong><span>ESPACE ADMINISTRATION</span></div></Link><Link href="/" className="editorial-link">Voir la boutique ↗</Link></header><main className="container-shell grid gap-8 py-10 lg:grid-cols-[220px_1fr]"><AdminNav/><div className="min-w-0">{children}</div></main><p className="admin-local-note">Interface locale de gestion. L’authentification doit être configurée avant toute publication.</p></div>;
}
