// src/app/campaigns/[id]/setup/page.tsx

import prisma from "@/lib/prisma";

import { redirect } from "next/navigation";

import Link from "next/link";

import { getAuthUser } from "@/lib/auth";

import { updateCampaignSetup } from "../../actions";

import { Stepper } from "@/components/Stepper";

import { ArrowRight } from "lucide-react";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CampaignSetupPage({
  params,
}: PageProps) {

  // Auth
  const user =
    await getAuthUser();

  const userId = user.id;

  // Params
  const { id } =
    await params;

  // Parallel queries
  const [
    campaign,
    settings,
    strategies,
    smtpAccounts,
  ] = await Promise.all([

    prisma.campaign.findUnique({
      where: {
        id,
        userId,
      },

      include: {
        _count: {
          select: {
            leads: true,
          },
        },
      },
    }),

    prisma.settings.findUnique({
      where: {
        userId,
      },
    }),

    prisma.strategy.findMany({
      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,
      },
    }),

    prisma.integrationAccount.findMany({
      where: {
        userId,
        type: "SMTP",
      },

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        name: true,
        provider: true,
        isVerified: true,
      },
    }),
  ]);

  if (!campaign) {
    return (
      <div className="p-8 text-center text-zinc-400">
        Campaign not found
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">

      <Stepper campaignId={id} />

      <form
        action={
          updateCampaignSetup
        }
        className="space-y-6"
      >

        <input
          type="hidden"
          name="campaignId"
          value={campaign.id}
        />

        {/* Header */}
        <div>
          <div className="mb-1 flex items-center gap-2">

            <Link
              href={`/campaigns/${campaign.id}`}
              className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:text-black"
            >
              Campaign
            </Link>

            <span className="text-zinc-300">
              /
            </span>

            <span className="text-[10px] font-bold uppercase tracking-widest text-black">
              Configuration
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-black">
            {campaign.name ||
              "Campaign Setup"}
          </h1>

          <p className="text-sm text-zinc-400">
            Define your outreach strategy and AI context
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">

          {/* LEFT COLUMN */}
          <div className="flex-1 space-y-6 lg:w-[58.33%]">

            {/* Campaign Identity */}
            <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6">

              <div>
                <h3 className="text-sm font-semibold text-black">
                  Campaign Identity
                </h3>

                <p className="mt-0.5 text-xs text-zinc-400">
                  Define your internal name and outreach context
                </p>
              </div>

              <div className="space-y-4">

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    Campaign Name
                  </label>

                  <input
                    type="text"
                    name="campaignName"
                    defaultValue={
                      campaign.name ||
                      ""
                    }
                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-black transition-colors focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    AI Author / Sender Name
                  </label>

                  <input
                    type="text"
                    name="senderName"
                    defaultValue={
                      campaign.senderName ||
                      ""
                    }
                    placeholder="Your Name or GTM Team"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-black transition-colors focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    Context for AI
                  </label>

                  <textarea
                    name="context"
                    rows={4}
                    defaultValue={
                      campaign.context ||
                      ""
                    }
                    placeholder="Offering AI ops support..."
                    className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-black transition-colors focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Followups */}
            <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6">

              <div>
                <h3 className="text-sm font-semibold text-black">
                  Sequence Logic
                </h3>

                <p className="mt-0.5 text-xs text-zinc-400">
                  Configure follow-up timing
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">

                {[1, 2].map((step) => (
                  <div
                    key={
                      step
                    }
                  >
                    <label className="mb-1 block text-xs font-medium text-zinc-500">
                      Follow-up{" "}
                      {
                        step
                      }
                    </label>

                    <select
                      name={`followup${step}Delay`}
                      defaultValue={
                        step ===
                          1
                          ? campaign.followup1Delay
                          : campaign.followup2Delay
                      }
                      className="w-full cursor-pointer appearance-none rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-black transition-colors focus:border-zinc-400 focus:outline-none"
                    >
                      {(
                        settings?.followupDelayOptions ||
                        "1,3,5,7,10,14"
                      )
                        .split(
                          ","
                        )
                        .map(
                          (
                            delay
                          ) => (
                            <option
                              key={
                                delay
                              }
                              value={delay.trim()}
                            >
                              Day{" "}
                              {delay.trim()}
                            </option>
                          )
                        )}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex-1 space-y-6 lg:w-[41.66%]">

            {/* SMTP */}
            <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6">

              <div>
                <h3 className="text-sm font-semibold text-black">
                  Tone & Strategy
                </h3>

                <p className="mt-0.5 text-xs text-zinc-400">
                  Configure outreach behavior
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-500">
                  Sending Email Account
                </label>

                <select
                  name="smtpAccountId"
                  defaultValue={
                    campaign.smtpAccountId ||
                    ""
                  }
                  className="w-full cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-black transition-colors focus:border-zinc-400 focus:outline-none"
                >
                  <option value="">
                    Select Sending Account...
                  </option>

                  {smtpAccounts.map(
                    (
                      account
                    ) => (
                      <option
                        key={
                          account.id
                        }
                        value={
                          account.id
                        }
                      >
                        {
                          account.name
                        }{" "}
                        (
                        {
                          account.provider
                        }
                        )
                      </option>
                    )
                  )}
                </select>

                {smtpAccounts.length ===
                  0 && (
                    <p className="mt-2 text-[10px] text-red-500">
                      No SMTP accounts found.{" "}

                      <Link
                        href="/settings"
                        className="font-bold underline"
                      >
                        Add one in settings
                      </Link>
                    </p>
                  )}
              </div>

              {/* More strategy sections here */}
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-4 font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-[0.98]"
            >
              Generate{" "}
              {
                campaign
                  ._count
                  .leads
              }{" "}
              Drafts

              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}