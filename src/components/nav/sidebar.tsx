"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/loads", label: "Load Board" },
  { href: "/drivers", label: "Drivers" },
  { href: "/trucks", label: "Trucks" },
  { href: "/documents", label: "Documents" },
  { href: "/brokers", label: "Brokers" },
  { href: "/facilities", label: "Facilities" },
  { href: "/revenue-recovery", label: "Revenue Recovery" },
];

export function Sidebar({ userName, companyName }: { userName: string; companyName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 shrink-0 bg-navy-950 text-white min-h-screen p-3 flex flex-col gap-1">
      <div className="flex items-center gap-2 font-display font-bold text-base px-2 pb-5 pt-1">
        <span className="w-5 h-5 rounded-md bg-gradient-to-br from-brand-green to-brand-greenDark" />
        LoadPilot
      </div>

      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "text-sm font-medium rounded-lg px-2.5 py-2 transition",
              active ? "bg-navy-800 text-white shadow-[inset_2px_0_0_#17B26A]" : "text-white/65 hover:bg-white/5 hover:text-white"
            )}
          >
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto pt-3 border-t border-white/10 flex items-center gap-2 px-2">
        <div className="w-7 h-7 rounded-md bg-navy-700 flex items-center justify-center text-[11px] font-bold">
          {userName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold truncate">{userName}</div>
          <div className="text-[11px] text-white/40 truncate">{companyName}</div>
        </div>
        <button onClick={handleSignOut} className="ml-auto text-white/40 hover:text-white text-xs">
          Sign out
        </button>
      </div>
    </aside>
  );
}
