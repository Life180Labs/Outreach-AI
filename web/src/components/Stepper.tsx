"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Stepper({ campaignId }: { campaignId?: string }) {
  const pathname = usePathname();
  
  const steps = [
    { label: "1 · Upload", path: "upload", match: ["upload"] },
    { label: "2 · Setup", path: "setup", match: ["setup"] },
    { label: "3 · Review", path: "review", match: ["review"] },
    { label: "4 · Send", path: "launch", match: ["launch"] },
    { label: "5 · Monitor", path: "sending", match: ["sending"] }
  ];

  return (
    <div className="w-full border-b border-brand-border bg-[#fdfdfc]">
      <div className="flex items-center max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
      {steps.map((step) => {
        let isActive = false;
        if (step.path === "") {
          isActive = pathname.endsWith(`/campaigns/${campaignId}`);
        } else {
          isActive = pathname.includes(`/${step.path}`);
        }

        const href = step.path ? `/campaigns/${campaignId || 'new'}/${step.path}` : `/campaigns/${campaignId}`;
        
        return (
          <div key={step.label} className="flex-1 text-center">
            <Link 
              href={campaignId ? href : '#'}
              className={`block pb-3 text-sm font-medium border-b-2 ${isActive ? 'text-black border-black' : 'text-brand-muted border-transparent hover:text-black'}`}
            >
              {step.label}
            </Link>
          </div>
        );
      })}
      </div>
    </div>
  );
}
