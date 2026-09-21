import { ArrowUpRight, Sparkles } from "lucide-react";
export default function ComingSoon() {
  return <section className="mx-auto max-w-[1480px] px-5 pb-20 lg:px-8">
    <div className="overflow-hidden rounded-[32px] border border-[#dce7dc] bg-[#0c3328] p-7 text-white shadow-[0_30px_80px_rgba(18,63,50,.16)] sm:p-10">
      <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-[#bfead0]"><Sparkles size={13}/> Coming soon</span>
          <h2 className="mt-4 font-['Plus_Jakarta_Sans'] text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">More ways to plan better journeys.</h2>
          <p className="mt-3 text-sm leading-7 text-[#b8ccc2]">Smarter recommendations, richer trip insights, flexible planning tools and more are on the way.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-[#dff6e8]">Stay tuned <ArrowUpRight size={16}/></div>
      </div>
    </div>
  </section>;
}
