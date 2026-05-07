import type { HomeTone } from "@/features/home/contracts/home-feed";

export function formatProbability(value: number) {
  if (value < 1) {
    return "<1%";
  }

  if (Number.isInteger(value)) {
    return `${value}%`;
  }

  return `${value.toFixed(1)}%`;
}

export function formatSignedDelta(value: number) {
  if (value === 0) {
    return "0%";
  }

  const absoluteValue = Math.abs(value);
  const formattedValue =
    absoluteValue < 1 ? absoluteValue.toFixed(1) : absoluteValue.toFixed(0);

  return `${value > 0 ? "↗" : "↘"} ${formattedValue}%`;
}

const toneUiMap: Record<
  HomeTone,
  {
    text: string;
    soft: string;
    border: string;
    dot: string;
    avatar: string;
    surface: string;
    line: string;
  }
> = {
  primary: {
    text: "text-primary",
    soft: "border-primary/20 bg-primary/12 text-primary",
    border: "border-primary/18",
    dot: "bg-primary",
    avatar: "bg-primary/16 text-primary",
    surface: "bg-primary/10",
    line: "var(--primary)",
  },
  sky: {
    text: "text-[color:var(--market-info)]",
    soft: "border-[color:var(--market-info)]/20 bg-[color:var(--market-info)]/12 text-[color:var(--market-info)]",
    border: "border-[color:var(--market-info)]/18",
    dot: "bg-[color:var(--market-info)]",
    avatar: "bg-[color:var(--market-info)]/16 text-[color:var(--market-info)]",
    surface: "bg-[color:var(--market-info)]/10",
    line: "var(--market-info)",
  },
  mint: {
    text: "text-[color:var(--market-positive)]",
    soft: "border-[color:var(--market-positive)]/20 bg-[color:var(--market-positive)]/12 text-[color:var(--market-positive)]",
    border: "border-[color:var(--market-positive)]/18",
    dot: "bg-[color:var(--market-positive)]",
    avatar:
      "bg-[color:var(--market-positive)]/16 text-[color:var(--market-positive)]",
    surface: "bg-[color:var(--market-positive)]/10",
    line: "var(--market-positive)",
  },
  gold: {
    text: "text-[color:var(--market-warning)]",
    soft: "border-[color:var(--market-warning)]/20 bg-[color:var(--market-warning)]/12 text-[color:var(--market-warning)]",
    border: "border-[color:var(--market-warning)]/18",
    dot: "bg-[color:var(--market-warning)]",
    avatar:
      "bg-[color:var(--market-warning)]/16 text-[color:var(--market-warning)]",
    surface: "bg-[color:var(--market-warning)]/10",
    line: "var(--market-warning)",
  },
  coral: {
    text: "text-[color:var(--market-negative)]",
    soft: "border-[color:var(--market-negative)]/20 bg-[color:var(--market-negative)]/12 text-[color:var(--market-negative)]",
    border: "border-[color:var(--market-negative)]/18",
    dot: "bg-[color:var(--market-negative)]",
    avatar:
      "bg-[color:var(--market-negative)]/16 text-[color:var(--market-negative)]",
    surface: "bg-[color:var(--market-negative)]/10",
    line: "var(--market-negative)",
  },
  slate: {
    text: "text-[color:var(--market-neutral)]",
    soft: "border-[color:var(--market-neutral)]/20 bg-[color:var(--market-neutral)]/12 text-[color:var(--market-neutral)]",
    border: "border-[color:var(--market-neutral)]/18",
    dot: "bg-[color:var(--market-neutral)]",
    avatar:
      "bg-[color:var(--market-neutral)]/16 text-[color:var(--market-neutral)]",
    surface: "bg-[color:var(--market-neutral)]/10",
    line: "var(--market-neutral)",
  },
};

export function getToneUi(tone: HomeTone) {
  return toneUiMap[tone];
}

export function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
