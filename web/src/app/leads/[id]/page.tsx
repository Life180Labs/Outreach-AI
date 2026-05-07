import prisma from "@/lib/prisma";
import { LeadDetailClient } from "./LeadDetailClient";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { 
      messages: { orderBy: { createdAt: 'asc' } },
      campaign: true 
    }
  });

  if (!lead) return <div className="p-8 text-center">Lead not found</div>;

  return (
    <div className="flex flex-col h-full bg-[#fdfcf9]">
      <div className="h-14 border-b border-zinc-200 flex items-center px-4 bg-white shrink-0">
        <Link href="/leads" className="flex items-center gap-1.5 text-zinc-500 hover:text-black transition-colors text-sm font-medium group">
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          back to leads
        </Link>
      </div>

      <div className="flex-1 overflow-hidden p-4 sm:p-8">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
          <LeadDetailClient lead={lead} />
        </div>
      </div>
    </div>
  );
}
