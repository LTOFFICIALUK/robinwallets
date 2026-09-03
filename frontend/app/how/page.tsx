import Link from "next/link";
import { BRAND, CHAIN_ID, CHAIN_LABEL } from "@/lib/brand";

export const metadata = {
  title: "How it works",
};

const STEPS = [
  {
    title: "Seen",
    body: "A wallet showed up on the Robinhood Chain tape or leaderboard. We may only have a truncated address.",
  },
  {
    title: "Candidate",
    body: "There is enough recent activity to care, but the wallet is not resolved or not active enough to follow yet.",
  },
  {
    title: "Trackable",
    body: "We have a full 0x address and enough trades in the last day to copy into a tracker.",
  },
  {
    title: "Good",
    body: "Full address, hot tape (about 40+ trades in 24h), and size or positive net ETH. These are the ones worth watching first.",
  },
];

export default function HowPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#CCFF00]">Methodology</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">How {BRAND} decides who to follow</h1>
      <p className="mt-4 text-[15px] leading-7 text-[#8b95a3]">
        We ingest the public {CHAIN_LABEL} (chain {CHAIN_ID}) KOL feed and 24h board, then score each
        wallet as new trades land. Rankings update live. They are activity filters, not a promise of
        profit.
      </p>

      <ol className="mt-10 space-y-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="rounded-2xl bg-[#101216] p-5 ring-1 ring-[#232830]">
            <p className="text-xs uppercase tracking-wider text-[#5d6570]">Step {index + 1}</p>
            <h2 className="mt-1 text-lg font-medium">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#8b95a3]">{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 rounded-2xl bg-[#101216] p-5 ring-1 ring-[#232830]">
        <h2 className="text-lg font-medium">What you can do with it</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#8b95a3]">
          <li>Watch wallets so they stay pinned at the top of the board.</li>
          <li>Export your watchlist as Axiom-ready JSON.</li>
          <li>Paste a full 0x to track someone who is not on the public feed yet.</li>
        </ul>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-xl bg-[#CCFF00] px-4 py-2.5 text-sm font-semibold text-[#111] hover:bg-[#d8ff4d]"
        >
          Back to the tracker
        </Link>
      </div>
    </main>
  );
}
