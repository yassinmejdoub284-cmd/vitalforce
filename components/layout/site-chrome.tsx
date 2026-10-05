"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
export function SiteChrome({children}:{children:ReactNode}){
 const pathname=usePathname();
 const admin=pathname==="/admin"||pathname.startsWith("/admin/");
 const landing=pathname==="/lp"||pathname.startsWith("/lp/");
 useEffect(()=>{
   document.documentElement.lang=landing?"ar":"fr";
   document.documentElement.dir=landing?"rtl":"ltr";
 },[landing]);
 return <>{!admin&&!landing&&<SiteHeader/>}{children}{!admin&&!landing&&<SiteFooter/>}</>;
}
