import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import { AuthProvider, useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/submit/$teamId")({
  head: () => ({ meta: [{ title: "Submit Project — Catalyst 2K26" }] }),
  component: () => (
    <AuthProvider>
      <Submit />
    </AuthProvider>
  ),
});

const schema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(2000),
  repo_url: z.string().trim().url().max(500).or(z.literal("")),
  demo_url: z.string().trim().url().max(500).or(z.literal("")),
  video_url: z.string().trim().url().max(500).or(z.literal("")),
});

function Submit() {
  const { teamId } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [form, setForm] = useState({
    title: "", description: "", repo_url: "", demo_url: "", video_url: "",
  });
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!user) return nav({ to: "/login" });
    (async () => {
      const [{ data: t }, { data: s }, { count }] = await Promise.all([
        supabase.from("teams").select("*").eq("id", teamId).maybeSingle(),
        supabase.from("submissions").select("*").eq("team_id", teamId).maybeSingle(),
        supabase.from("team_members").select("*", { count: "exact", head: true }).eq("team_id", teamId),
      ]);
      setTeam(t);
      setMemberCount(count ?? 0);
      if (s) {
        setForm({
          title: s.title, description: s.description,
          repo_url: s.repo_url ?? "", demo_url: s.demo_url ?? "", video_url: s.video_url ?? "",
        });
      }
      setBusy(false);
    })();
  }, [user, loading, teamId, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    const payload = {
      team_id: teamId,
      title: parsed.data.title,
      description: parsed.data.description,
      repo_url: parsed.data.repo_url || null,
      demo_url: parsed.data.demo_url || null,
      video_url: parsed.data.video_url || null,
    };
    const { error } = await supabase.from("submissions").upsert(payload, { onConflict: "team_id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Submission saved.");
    nav({ to: "/dashboard" });
  };

  if (busy) return <PortalShell title="Loading…"><div /></PortalShell>;
  if (!team) return <PortalShell title="Not found"><Link to="/dashboard" className="text-blood">← Dashboard</Link></PortalShell>;
  const isLeader = team.leader_id === user?.id;
  if (!isLeader) {
    return (
      <PortalShell title="Leader only">
        <p className="text-bone/60">Only your team leader can edit the project submission.</p>
      </PortalShell>
    );
  }
  if (memberCount < 2) {
    return (
      <PortalShell title="Add members first">
        <p className="text-bone/60 mb-4">You need at least 2 members on your team before submitting.</p>
        <Link to="/team/$teamId" params={{ teamId }} className="text-blood underline">Manage team →</Link>
      </PortalShell>
    );
  }

  return (
    <PortalShell title="Submit your project">
      <form onSubmit={submit} className="mx-auto max-w-2xl panel p-6 sm:p-8 space-y-5">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/60">Project title</label>
          <input
            required maxLength={120}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-2 w-full bg-black/60 border border-bone/15 px-3 py-2.5 text-bone focus:outline-none focus:border-blood"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/60">Description</label>
          <textarea
            required maxLength={2000} rows={6}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-2 w-full bg-black/60 border border-bone/15 px-3 py-2.5 text-bone focus:outline-none focus:border-blood"
            placeholder="What did you build? What problem does it solve?"
          />
          <p className="mt-1 text-[10px] text-bone/40 font-mono">{form.description.length}/2000</p>
        </div>
        {[
          { k: "repo_url", l: "Repository URL (GitHub, GitLab…)" },
          { k: "demo_url", l: "Live demo URL" },
          { k: "video_url", l: "Video walkthrough URL (YouTube, Loom…)" },
        ].map((f) => (
          <div key={f.k}>
            <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/60">{f.l}</label>
            <input
              type="url"
              value={(form as any)[f.k]}
              onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
              className="mt-2 w-full bg-black/60 border border-bone/15 px-3 py-2.5 text-bone focus:outline-none focus:border-blood"
              placeholder="https://"
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={saving}
          className="bracket w-full border border-blood bg-blood py-3 font-mono text-[10px] uppercase tracking-[0.4em] text-black hover:bg-transparent hover:text-blood transition-all duration-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save submission"}
        </button>
      </form>
    </PortalShell>
  );
}
