import prisma from "@/lib/prisma";
import Link from "next/link";
import { LeadsClient } from "./LeadsClient";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;

  const where: any = { AND: [] };

  if (q) {
    where.AND.push({
      OR: [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { companyName: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  if (status === "hot") {
    where.AND.push({ OR: [{ replied: true }, { status: "Hot" }] });
  } else if (status === "warm") {
    where.AND.push({ opened: true });
    where.AND.push({ replied: false });
  } else if (status === "cold") {
    where.AND.push({ opened: false });
    where.AND.push({ replied: false });
  }

  const leads = await prisma.lead.findMany({
    where: where.AND.length > 0 ? where : {},
    orderBy: { updatedAt: "desc" },
  });

  const allCount = await prisma.lead.count();
  const hotCount = await prisma.lead.count({ where: { OR: [{ replied: true }, { status: "Hot" }] } });
  const warmCount = await prisma.lead.count({ where: { AND: [{ opened: true }, { replied: false }] } });
  const coldCount = await prisma.lead.count({ where: { AND: [{ opened: false }, { replied: false }] } });

  const searchStr = q ? `&q=${encodeURIComponent(q)}` : "";

  const tabs = [
    { key: null, label: "All", count: allCount, href: q ? `/leads?q=${encodeURIComponent(q)}` : "/leads" },
    { key: "hot", label: "Hot", count: hotCount, href: `/leads?status=hot${searchStr}` },
    { key: "warm", label: "Warm", count: warmCount, href: `/leads?status=warm${searchStr}` },
    { key: "cold", label: "Cold", count: coldCount, href: `/leads?status=cold${searchStr}` },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-black tracking-tight">Leads</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage and track your outreach interactions</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <form action="/leads" method="GET" className="flex-1 w-full sm:max-w-sm">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder="Search by name, company..."
            className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-black focus:outline-none focus:border-zinc-400 transition-colors placeholder:text-zinc-400"
          />
        </form>

        <div className="flex items-center rounded-lg border border-zinc-200 bg-white overflow-hidden">
          {tabs.map((tab) => {
            const isActive = (tab.key === null && !status) || tab.key === status;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-2 text-xs font-medium transition-colors border-r last:border-r-0 border-zinc-200 ${
                  isActive
                    ? "bg-black text-white"
                    : "text-zinc-500 hover:text-black hover:bg-zinc-50"
                }`}
              >
                {tab.label} ({tab.count})
              </Link>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <LeadsClient leads={leads} />

      {/* Footer */}
      <div className="text-center text-xs text-zinc-400 py-4">
        Showing {leads.length} of {allCount} leads
      </div>
    </div>
  );
}
