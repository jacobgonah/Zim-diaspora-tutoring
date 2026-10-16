const STRIPES = [
  "#006400",
  "#ffd200",
  "#d40000",
  "#000000",
  "#d40000",
  "#ffd200",
  "#006400",
];

export function FlagStripes({ className = "h-2" }: { className?: string }) {
  return (
    <div className={`flex w-full flex-col ${className}`} aria-hidden="true">
      {STRIPES.map((color, index) => (
        <div key={index} className="min-h-0 flex-1" style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}
