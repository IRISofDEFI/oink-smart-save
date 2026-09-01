import type { SVGProps } from "react";

export function ChartAnalysisIcon({ size = 24, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={size} height={size} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m3 11l2.5-2.5c1.017-1.017 1.526-1.526 2.137-1.638a2 2 0 0 1 .726 0c.611.112 1.12.62 2.137 1.638s1.526 1.526 2.137 1.638c.24.045.486.045.726 0c.611-.112 1.12-.621 2.137-1.638L21 3M3 15v6m6-8v8m6-5v5m6-12v12"/></svg>
  )
}
