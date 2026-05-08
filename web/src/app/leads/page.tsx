import prisma from "@/lib/prisma";
import Link from "next/link";
import { LeadsClient } from "./LeadsClient";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ q?: string, status?: string }> }) {
  const { q, status } = await searchParams;

  const where: any = {};
  if (q) {
    where.OR = [
      { firstName: { contains: q } },
      { lastName: { contains: q } },
      { companyName: { contains: q } },
    ];
  }

  if (status === 'hot') {
    where.OR = [{ replied: true }, { status: 'hot' }];
  } else if (status === 'warm') {
    where.AND = [{ opened: true }, { replied: false }];
  } else if (status === 'cold') {
    where.AND = [{ opened: false }, { replied: false }];
  }

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });

  const allCount = await prisma.lead.count();
  const hotCount = await prisma.lead.count({ where: { OR: [{ replied: true }, { status: 'hot' }] } });
  const warmCount = await prisma.lead.count({ where: { AND: [{ opened: true }, { replied: false }] } });
  const coldCount = await prisma.lead.count({ where: { AND: [{ opened: false }, { replied: false }] } });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full min-h-full">
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden p-6">

        <form action="/leads" method="GET" className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder="Search by name, company, location..."
            className="w-full md:max-w-md bg-white border border-brand-border rounded-lg px-4 py-2.5 text-black focus:outline-none text-sm"
          />

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="flex flex-wrap bg-white border border-brand-border rounded-lg overflow-hidden shadow-sm">
              <Link href="/leads" className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-r border-brand-border transition-colors ${!status ? 'bg-[#f8f8f8] text-black' : 'text-brand-muted hover:text-black hover:bg-zinc-50'}`}>
                All ({allCount})
              </Link>
              <Link href="/leads?status=hot" className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-r border-brand-border transition-colors ${status === 'hot' ? 'bg-[#eef8ed] text-[#2b6528]' : 'text-brand-muted hover:text-black hover:bg-zinc-50'}`}>
                Hot ({hotCount})
              </Link>
              <Link href="/leads?status=warm" className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-r border-brand-border transition-colors ${status === 'warm' ? 'bg-orange-50 text-orange-700' : 'text-brand-muted hover:text-black hover:bg-zinc-50'}`}>
                Warm ({warmCount})
              </Link>
              <Link href="/leads?status=cold" className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${status === 'cold' ? 'bg-zinc-100 text-zinc-700' : 'text-brand-muted hover:text-black hover:bg-zinc-50'}`}>
                Cold ({coldCount})
              </Link>
            </div>
          </div>
        </form>

        <LeadsClient leads={leads} />

        <div className="pt-6 text-center text-sm text-brand-muted">
          Showing {leads.length} of {allCount} leads
        </div>
      </div>
    </div>
  );
}
