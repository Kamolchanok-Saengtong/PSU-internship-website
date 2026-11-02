import type { Place } from "@/lib/types";

const SIZES = {
  sm: { box: "rounded-lg px-2 py-1", amount: "text-base", unit: "text-xs" },
  md: { box: "rounded-xl px-2.5 py-1.5", amount: "text-xl", unit: "text-xs" },
  lg: { box: "rounded-2xl px-4 py-2.5", amount: "text-3xl", unit: "text-sm" },
} as const;

/**
 * The pay, as the second thing you read after the role: a big amount in a soft
 * green box, the unit small beside it. Unpaid is shown quietly in grey.
 */
export function PayTag({
  place: p,
  size = "md",
  showHours = true,
  className = "",
}: {
  place: Pick<Place, "allowance" | "payPer" | "hoursPerWeek">;
  size?: keyof typeof SIZES;
  showHours?: boolean;
  className?: string;
}) {
  const s = SIZES[size];
  if (p.allowance <= 0) {
    return (
      <span className={`inline-flex items-center bg-[#eceef3] font-semibold text-[#5f6678] ${s.box} ${className}`}>
        <span className={size === "lg" ? "text-xl" : "text-sm"}>Unpaid</span>
      </span>
    );
  }
  const unit = p.payPer === "hour" ? "/hour" : "/month";
  return (
    <span className={`inline-flex flex-col items-start bg-[#e9f7ef] text-[#0b6b40] ${s.box} ${className}`}>
      <span className="flex items-baseline gap-0.5 whitespace-nowrap">
        <span className={`tabular leading-none font-bold tracking-[-0.02em] ${s.amount}`}>฿{p.allowance.toLocaleString("en-US")}</span>
        <span className={`font-semibold opacity-80 ${s.unit}`}>{unit}</span>
      </span>
      {showHours && p.hoursPerWeek ? (
        <span className={`mt-0.5 font-medium text-[#3f7a5b] ${size === "lg" ? "text-sm" : "text-[0.7rem]"}`}>~{p.hoursPerWeek} hrs/week</span>
      ) : null}
    </span>
  );
}
