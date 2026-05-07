"use client";

import { useState } from "react";

type RadarMarketDetailTabsProps = {
  overview: string;
  rules: string[];
  context: string[];
};

const sectionOptions = [
  { id: "rules", label: "Regras" },
  { id: "context", label: "Contexto do mercado" },
] as const;

export function RadarMarketDetailTabs({
  overview,
  rules,
  context,
}: RadarMarketDetailTabsProps) {
  const [activeSection, setActiveSection] = useState<"rules" | "context">(
    "rules",
  );
  const activeBody = activeSection === "rules" ? rules : context;

  return (
    <div className="space-y-5">
      <p className="text-sm leading-7 text-white/56">{overview}</p>

      <div className="flex items-center gap-2 border-b border-white/8 pb-3">
        {sectionOptions.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              activeSection === section.id
                ? "border-primary/24 bg-primary/14 text-primary"
                : "border-white/8 bg-white/[0.03] text-white/52 hover:bg-white/[0.06] hover:text-white/76"
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeBody.map((paragraph, index) => (
          <p
            key={`${activeSection}-${index}`}
            className="text-sm leading-7 text-white/66"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
