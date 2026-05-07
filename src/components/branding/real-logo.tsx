import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type RealLogoMarkProps = {
  className?: string;
  title?: string;
};

export function RealLogoMark({
  className,
  title = siteConfig.name,
}: RealLogoMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={cn("h-10 w-10", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <rect x="4" y="4" width="56" height="56" rx="18" fill="#07111F" />
      <rect
        x="4.75"
        y="4.75"
        width="54.5"
        height="54.5"
        rx="17.25"
        stroke="#214367"
        strokeWidth="1.5"
      />
      <circle
        cx="32"
        cy="32"
        r="22"
        stroke="#5FA7FF"
        strokeWidth="1.5"
        opacity="0.14"
      />
      <circle
        cx="32"
        cy="32"
        r="14"
        stroke="#5FA7FF"
        strokeWidth="1.5"
        opacity="0.28"
      />
      <path
        d="M17 40L25 34L31 37L41 23L47 28"
        stroke="#86C4FF"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="47" cy="28" r="5" fill="#9DD0FF" />
      <circle
        cx="47"
        cy="28"
        r="8.5"
        stroke="#9DD0FF"
        strokeWidth="1.5"
        opacity="0.35"
      />
      <path
        d="M19 46H45"
        stroke="#5FA7FF"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.24"
      />
    </svg>
  );
}

type RealLogoLockupProps = {
  className?: string;
  markClassName?: string;
  titleClassName?: string;
  eyebrowClassName?: string;
  subtitleClassName?: string;
  eyebrow?: string;
  subtitle?: string;
};

export function RealLogoLockup({
  className,
  markClassName,
  titleClassName,
  eyebrowClassName,
  subtitleClassName,
  eyebrow,
  subtitle = siteConfig.tagline,
}: RealLogoLockupProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <RealLogoMark className={cn("h-11 w-11 shrink-0", markClassName)} />
      <div className="min-w-0">
        {eyebrow ? (
          <p
            className={cn(
              "truncate font-mono text-[10px] uppercase tracking-[0.24em] text-primary/82",
              eyebrowClassName,
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <p
          className={cn(
            "truncate text-lg font-semibold tracking-tight text-white",
            titleClassName,
          )}
        >
          {siteConfig.shortName}
        </p>
      </div>
    </div>
  );
}
