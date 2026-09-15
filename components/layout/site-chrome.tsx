"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
export function SiteChrome({children}:{children:ReactNode}){
 const pathname=usePathname();
 const admin=pathname==="/admin"||pathname.startsWith("/admin/");
 return <>{!admin&&<SiteHeader/>}{children}{!admin&&<SiteFooter/>}</>;
}
