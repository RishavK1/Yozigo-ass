const items = [
  { label: "Available", className: "border border-ink-300 bg-white" },
  { label: "Selected / your hold", className: "bg-brand-500" },
  { label: "Held by someone else", className: "bg-ink-200" },
  { label: "Booked", className: "bg-ink-700" },
];

export function SeatLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-ink-500">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={`h-3.5 w-3.5 rounded ${item.className}`} />
          {item.label}
        </div>
      ))}
    </div>
  );
}
