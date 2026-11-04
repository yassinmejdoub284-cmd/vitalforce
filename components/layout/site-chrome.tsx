"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { useStoreSettings } from "@/components/store-settings";
export function SiteChrome({children}:{children:ReactNode}){
 const pathname=usePathname();
 const admin=pathname==="/admin"||pathname.startsWith("/admin/");
 const landing=pathname==="/lp"||pathname.startsWith("/lp/");
 const {store}=useStoreSettings();
 useEffect(()=>{
   document.documentElement.lang=landing?"ar":"fr";
   document.documentElement.dir=landing?"rtl":"ltr";
 },[landing]);
 return <>{!admin&&!landing&&store.announcement&&<div className="bg-forest-950 px-4 py-2 text-center text-xs font-semibold text-gold-100">{store.announcement}</div>}{!admin&&!landing&&<SiteHeader/>}{children}{!admin&&!landing&&<SiteFooter/>}</>;
}
