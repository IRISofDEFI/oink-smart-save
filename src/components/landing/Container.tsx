import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Page-width wrapper shared by every landing section. */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1320px] px-4 md:px-5 lg:px-10", className)}>{children}</div>;
}
