import { STATUS_LABEL, type Status } from "@/lib/status";

const STYLE: Record<Status, string> = {
  "final-call": "bg-gold text-navy-950",
  "closing-soon": "bg-gold-soft text-gold-ink",
  open: "bg-[#e3f4ec] text-success",
  closed: "bg-[#eceef3] text-[#5f6678]",
};

export function StatusBadge({
  status,
  className = "",
  style,
}: {
  status: Status;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={style}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${STYLE[status]} ${className}`}
    >
      {status === "final-call" && <span className="pulse-dot mr-1.5" aria-hidden />}
      {STATUS_LABEL[status]}
    </span>
  );
}
