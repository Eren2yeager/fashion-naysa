import { rupees } from "@/lib/format/rupees";

export function RupeeDisplay({ paise }: { paise: number }) {
  return <span className="font-mono tabular-nums">{rupees(paise)}</span>;
}
