"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Stepper({ campaignId }: { campaignId?: string }) {
  const pathname = usePathname();
  
  const steps = [
    { label: "Upload", path: "upload" },
    { label: "Configure", path: "setup" },
    { label: "Review", path: "review" },
    { label: "Launch", path: "launch" },
    { label: "Monitor", path: "sending" }
  ];

  return (
    <div className="w-full border-b border-zinc-200 bg-white">
      <div className="flex items-center w-full px-2">
      {steps.map((step, idx) => {
        const isActive = pathname.includes(`/${step.path}`);
        
        // Fix: Existing campaigns shouldn't link to a non-existent /[id]/upload page
        const href = (step.path === 'upload' && campaignId) 
          ? `/campaigns/${campaignId}/setup` // Redirect back to setup
          : `/campaigns/${campaignId || 'new'}/${step.path}`;
          
        const isCompleted = !!campaignId || step.path === 'upload';

        return (
          <div key={step.label} className="flex-1">
            {isCompleted ? (
              <Link 
                href={href}
                className={`block py-3 text-xs font-semibold text-center border-b-2 transition-colors ${
                  isActive ? 'text-black border-black' : 'text-zinc-400 border-transparent hover:text-black hover:border-zinc-200'
                }`}
              >
                <span className="hidden sm:inline-block mr-1 opacity-40">{idx + 1} ·</span> {step.label}
              </Link>
            ) : (
              <span className="block py-3 text-xs font-semibold text-center border-b-2 text-zinc-200 border-transparent cursor-not-allowed">
                <span className="hidden sm:inline-block mr-1 opacity-40">{idx + 1} ·</span> {step.label}
              </span>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
