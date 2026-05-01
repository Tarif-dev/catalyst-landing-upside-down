import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import { AuthProvider, useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/team/new")({
  head: () => ({ meta: [{ title: "Create Team — Catalyst 2K26" }] }),
  component: () => (
    <AuthProvider>
      <NewTeam />
    </AuthProvider>
  ),
});

const TRACKS = [
  { v: "healthcare", l: "AI for Healthcare · Hopper" },
  { v: "fintech", l: "AI for Fintech · Dustin" },
  { v: "sustainability", l: "AI for Sustainability · Will" },
  { v: "education", l: "AI for Education · Eleven" },
  { v: "open", l: "Open Innovation · Steve" },
];

const schema = z.object({
  name: z.string().trim().min(2).max(50).regex(/^[\w\s\-\.\&]+$/, "Letters, numbers, spaces, - . & only"),
  track: z.enum(["healthcare", "fintech", "sustainability", "education", "open"]),
  tagline: z.string().trim().max(120).optional(),
});

function NewTeam() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", track: "open", tagline: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav({ to: "/login" });
      return;
    }
    // already in a team?
    supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) nav({ to: "/dashboard" });
      });
  }, [user, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("teams")
      .insert({
        name: parsed.data.name,
        track: parsed.data.track,
        tagline: parsed.data.tagline || null,
        leader_id: user.id,
      })
      .select()
      .single();
    setBusy(false);
    if (error) {
      toast.error(error.message.includes("unique") ? "Team name already taken." : error.message);
      return;
    }
    toast.success("Team created. Now add your members.");
    nav({ to: "/team/$teamId", params: { teamId: data.id } });
  };

  return (
    <PortalShell title="Forge your team">
      <div className="mx-auto max-w-xl">
        <form onSubmit={submit} className="panel p-6 sm:p-8 space-y-5">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/60">Team name</label>
            <input
              required
              maxLength={50}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-2 w-full bg-black/60 border border-bone/15 px-3 py-2.5 text-bone focus:outline-none focus:border-blood"
              placeholder="The Hawkins Party"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/60">Track</label>
            <select
              value={form.track}
              onChange={(e) => setForm({ ...form, track: e.target.value })}
              className="mt-2 w-full bg-black/60 border border-bone/15 px-3 py-2.5 text-bone focus:outline-none focus:border-blood"
            >
              {TRACKS.map((t) => (
                <option key={t.v} value={t.v} className="bg-black">{t.l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/60">Tagline (optional)</label>
            <input
              maxLength={120}
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="mt-2 w-full bg-black/60 border border-bone/15 px-3 py-2.5 text-bone focus:outline-none focus:border-blood"
              placeholder="Friends don't lie."
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="bracket w-full border border-blood bg-blood py-3 font-mono text-[10px] uppercase tracking-[0.4em] text-black hover:bg-transparent hover:text-blood transition-all duration-500 disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create team"}
          </button>
          <p className="text-center text-xs font-serif italic text-bone/50">
            You'll be set as leader. After this, add 1–4 more members (each must already have a Catalyst account).
          </p>
        </form>
      </div>
    </PortalShell>
  );
}
