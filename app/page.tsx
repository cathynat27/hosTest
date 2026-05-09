import { redirect } from "next/navigation";

//import Link from "next/link";

// import HoscoverLogo from "@/app/components/hoscover-logo";

// const FEATURES = [
//   {
//     label: "Real-time escalation alerts",
//     sub: "Instant WhatsApp escalations to your team",
//   },
//   {
//     label: "AI conversation management",
//     sub: "Monitor and guide AI-handled guest chats",
//   },
//   {
//     label: "Instant guest takeover & reply",
//     sub: "Take control and respond directly via WhatsApp",
//   },
// ];
export default function Home() {
  redirect("/login");
}

// export default function Home() {
//   return (
//
// <main className="min-h-screen bg-white px-4 py-8 sm:px-6 sm:py-12">
//   <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] sm:p-10">
//     <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//       <HoscoverLogo className="flex items-center gap-3" textClassName="space-y-0.5" />
//       <div className="flex items-center gap-2 self-start sm:self-auto">
//         <span className="inline-flex w-fit rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
//           Live with AI + Staff
//         </span>
//         <Link
//           href="/login"
//           className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
//         >
//           Staff Sign In
//         </Link>
//       </div>
//     </header>

//     <section className="mt-10">
//       <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
//         Run guest messaging like a premium concierge desk.
//       </h1>
//       <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
//         Keep every escalation visible, jump in instantly, and maintain service quality
//         across your hotel teams from one clean command center.
//       </p>

//       <div className="mt-7 grid gap-3 sm:grid-cols-3">
//         <div className="rounded-2xl border border-slate-200 bg-white p-4">
//           <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Escalation response</p>
//           <p className="mt-2 text-3xl font-semibold text-slate-900">&lt; 20s</p>
//         </div>
//         <div className="rounded-2xl border border-slate-200 bg-white p-4">
//           <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Conversations</p>
//           <p className="mt-2 text-3xl font-semibold text-slate-900">Real-time</p>
//         </div>
//         <div className="rounded-2xl border border-slate-200 bg-white p-4">
//           <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Coverage</p>
//           <p className="mt-2 text-3xl font-semibold text-slate-900">24/7</p>
//         </div>
//       </div>

//       <ul className="mt-8 space-y-3">
//         {FEATURES.map((feature) => (
//           <li
//             key={feature.label}
//             className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
//           >
//             <p className="text-sm font-semibold text-slate-900">{feature.label}</p>
//             <p className="mt-1 text-xs text-slate-600">{feature.sub}</p>
//           </li>
//         ))}
//       </ul>

//     </section>
//   </div>
// </main>
//   );
// }
