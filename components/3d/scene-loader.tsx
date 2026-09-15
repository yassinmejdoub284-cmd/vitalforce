"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const VitalJarScene = dynamic(
  () => import("@/components/3d/vital-jar-scene").then((module) => module.VitalJarScene),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[520px] rounded-[32px]" />
  }
);
