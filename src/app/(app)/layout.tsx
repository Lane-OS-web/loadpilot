import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/nav/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_id, companies(name)")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex">
      <Sidebar
        userName={profile?.full_name ?? user.email ?? "User"}
        companyName={(profile as any)?.companies?.name ?? ""}
      />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
