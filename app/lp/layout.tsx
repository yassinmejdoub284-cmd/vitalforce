import type { ReactNode } from "react";
import "./landing.css";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return <div className="vf-landing" lang="ar" dir="rtl">{children}</div>;
}
