type HoscoverLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
};

export default function HoscoverLogo({
  className,
  markClassName,
  textClassName,
}: HoscoverLogoProps) {
  return (
    <div className={className}>
      <div
        className={[
          "flex h-11 w-11 items-center justify-center rounded-2xl",
          "border border-slate-200 bg-white text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.08)]",
          markClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" aria-hidden="true">
          <path d="M7 6.5v19" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M25 6.5v19" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M7 16h18" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      </div>
      <div className={textClassName}>
        <p className="text-lg font-bold tracking-tight text-slate-900">hoscover</p>
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Guest operations cloud</p>
      </div>
    </div>
  );
}
