import clsx from "clsx";

const VARIANTS = {
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-rose-50 text-rose-700",
  blue: "bg-blue-50 text-blue-700",
  slate: "bg-slate-100 text-slate-600",
};

export function Badge({ children, variant = "slate" }: { children: React.ReactNode; variant?: keyof typeof VARIANTS }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", VARIANTS[variant])}>
      {children}
    </span>
  );
}

/** Maps a load_status value to the right badge color + label, in one place
 * so status meaning stays consistent across the load board, detail page,
 * and driver app. */
export function loadStatusBadge(status: string) {
  const map: Record<string, { variant: keyof typeof VARIANTS; label: string }> = {
    booked: { variant: "blue", label: "Booked" },
    dispatched: { variant: "blue", label: "Dispatched" },
    at_pickup: { variant: "amber", label: "At pickup" },
    in_transit: { variant: "green", label: "In transit" },
    at_delivery: { variant: "amber", label: "At delivery" },
    delivered: { variant: "slate", label: "Delivered" },
    invoiced: { variant: "blue", label: "Invoiced" },
    paid: { variant: "green", label: "Paid" },
    cancelled: { variant: "red", label: "Cancelled" },
  };
  return map[status] ?? { variant: "slate" as const, label: status };
}
