import { Link } from "@/i18n/navigation";

type SaktiLogoProps = {
  href?: string;
  areaLabel?: string;
};

export default function SaktiLogo({ href = "/", areaLabel }: SaktiLogoProps) {
  return (
    <Link href={href} className="group inline-flex max-w-full items-center gap-2.5 sm:gap-3">
      <span
        aria-hidden="true"
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 border-sakti-gold/70 bg-sakti-forest text-sm font-black text-white shadow-md transition group-hover:-rotate-2 group-hover:scale-[1.03] sm:h-14 sm:w-14 sm:text-base"
      >
        <span className="relative z-10">S</span>
        <span className="absolute -right-1 top-1 h-3 w-3 rounded-full border-2 border-sakti-paper bg-sakti-gold sm:-right-1.5 sm:top-1.5 sm:h-3.5 sm:w-3.5" />
        <span className="absolute -bottom-1 left-2.5 h-2.5 w-2.5 rounded-full border-2 border-sakti-paper bg-sakti-gold/90 sm:-bottom-1.5 sm:left-3 sm:h-3 sm:w-3" />
        <span className="absolute left-1 top-1 h-1.5 w-1.5 rounded-full bg-white/45 sm:h-2 sm:w-2" />
      </span>
      <span className="min-w-0 py-0.5">
        <span className="block max-w-[13.5rem] whitespace-normal break-words font-display text-[1rem] font-black leading-[1.05] text-sakti-forestDark transition group-hover:text-sakti-forest min-[380px]:max-w-none min-[380px]:text-[1.08rem] sm:whitespace-nowrap sm:text-2xl">
          LITERATERAPI-SAKTI
        </span>
        {areaLabel ? (
          <span className="mt-1 block max-w-[13.5rem] whitespace-normal break-words text-[10px] font-black uppercase tracking-[0.14em] text-sakti-gold min-[380px]:max-w-none sm:whitespace-nowrap sm:text-xs sm:tracking-[0.18em]">
            {areaLabel}
          </span>
        ) : (
          <span className="mt-1 hidden items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-sakti-forestDark/62 sm:flex">
            <span>Baca</span>
            <span className="h-1.5 w-1.5 rounded-full bg-sakti-gold" />
            <span>Refleksi</span>
            <span className="h-1.5 w-1.5 rounded-full bg-sakti-gold" />
            <span>Tumbuh</span>
          </span>
        )}
      </span>
    </Link>
  );
}
