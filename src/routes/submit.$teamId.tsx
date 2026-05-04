import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { UploadCloud, X, Loader2 } from "lucide-react";

export const Route = createFileRoute("/submit/$teamId")({
  head: () => ({ meta: [{ title: "Submit Project — Catalyst 2K26" }] }),
  component: Submit,
});

const TECH_OPTIONS = [
  "Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js",
  "FastAPI", "Flask", "Django", "TensorFlow", "PyTorch", "LangChain",
  "OpenAI API", "Gemini API", "Hugging Face", "Scikit-learn", "PostgreSQL",
  "MongoDB", "Firebase", "Supabase", "Docker", "AWS", "GCP", "Azure",
  "Tailwind CSS", "Other",
];

const schema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().trim().min(50, "Please write at least 50 characters describing your project").max(3000),
  problem_statement: z.string().trim().min(20, "Briefly describe the problem you solved").max(1000),
  solution_approach: z.string().trim().min(20, "Describe your approach and how AI is used").max(1000),
  repo_url: z.string().trim().url("Must be a valid URL").max(500).or(z.literal("")),
  demo_url: z.string().trim().url("Must be a valid URL").max(500).or(z.literal("")),
  video_url: z.string().trim().url("Must be a valid URL").max(500).or(z.literal("")),
  tech_stack: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
});

function Submit() {
  const { teamId } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    problem_statement: "",
    solution_approach: "",
    repo_url: "",
    demo_url: "",
    video_url: "",
  });
  const [techStack, setTechStack] = useState<string[]>([]);
  const [customTech, setCustomTech] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/login" }); return; }
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
          title: s.title || "",
          description: s.description || "",
          problem_statement: (s as any).problem_statement || "",
          solution_approach: (s as any).solution_approach || "",
          repo_url: s.repo_url ?? "",
          demo_url: s.demo_url ?? "",
          video_url: s.video_url ?? "",
        });
        if ((s as any).tech_stack) {
          setTechStack((s as any).tech_stack.split(",").map((t: string) => t.trim()).filter(Boolean));
        }
        if ((s as any).screenshots?.length) {
          setScreenshots((s as any).screenshots);
        }
      }
      setBusy(false);
    })();
  }, [user, loading, teamId, nav]);

  const toggleTech = (tech: string) => {
    setTechStack(prev =>
      prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
    );
  };

  const addCustomTech = () => {
    const trimmed = customTech.trim();
    if (trimmed && !techStack.includes(trimmed)) {
      setTechStack(prev => [...prev, trimmed]);
      setCustomTech("");
    }
  };

  const handleScreenshots = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const total = screenshotFiles.length + files.length;
    if (total > 5) {
      toast.error("Maximum 5 screenshots allowed.");
      return;
    }
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 5MB limit.`);
        return;
      }
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} is not an image.`);
        return;
      }
    }
    setScreenshotFiles(prev => [...prev, ...files]);
    // Generate local preview URLs
    const previews = files.map(f => URL.createObjectURL(f));
    setScreenshots(prev => [...prev, ...previews]);
    e.target.value = "";
  };

  const removeScreenshot = (idx: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== idx));
    setScreenshotFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ ...form, tech_stack: techStack.join(", "), screenshots });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (techStack.length === 0) {
      toast.error("Please select at least one technology.");
      return;
    }
    setSaving(true);
    try {
      // Upload new screenshots to Supabase Storage
      let uploadedUrls: string[] = [];
      for (const file of screenshotFiles) {
        const path = `${teamId}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("submissions").upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from("submissions").getPublicUrl(path);
        uploadedUrls.push(publicUrl);
      }
      // Keep existing remote URLs (not blob:// previews) + new uploads
      const finalScreenshots = [
        ...screenshots.filter(s => s.startsWith("http")),
        ...uploadedUrls,
      ];

      const payload: any = {
        team_id: teamId,
        title: form.title,
        description: form.description,
        problem_statement: form.problem_statement,
        solution_approach: form.solution_approach,
        repo_url: form.repo_url || null,
        demo_url: form.demo_url || null,
        video_url: form.video_url || null,
        tech_stack: techStack.join(", "),
        screenshots: finalScreenshots.length ? finalScreenshots : null,
      };

      const { error } = await supabase.from("submissions").upsert(payload, { onConflict: "team_id" });
      if (error) throw error;
      toast.success("🚀 Submission saved successfully!");
      nav({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "Submission failed.");
    } finally {
      setSaving(false);
    }
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

  const field = (label: string, required = false) => (
    <label className="block font-mono text-[10px] uppercase tracking-[0.35em] text-bone/60 mb-2">
      {label}{required && <span className="text-blood ml-1">*</span>}
    </label>
  );
  const inputClass = "w-full bg-black/60 border border-bone/15 px-4 py-3 text-bone placeholder:text-bone/30 focus:outline-none focus:border-blood focus:ring-1 focus:ring-blood/30 transition-colors text-sm";

  return (
    <PortalShell title="Submit your project">
      <form onSubmit={submit} className="mx-auto max-w-3xl space-y-8">

        {/* — Section 1: Project Identity — */}
        <div className="panel p-6 sm:p-8 space-y-6">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.5em] text-blood font-bold border-b border-blood/20 pb-3">
            Project Identity
          </h2>

          <div>
            {field("Project Title", true)}
            <input
              required maxLength={120}
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className={inputClass}
              placeholder="e.g. MindBridge — AI Mental Health Companion"
            />
          </div>

          <div>
            {field("Problem Statement", true)}
            <textarea
              required maxLength={1000} rows={3}
              value={form.problem_statement}
              onChange={e => setForm({ ...form, problem_statement: e.target.value })}
              className={inputClass}
              placeholder="What problem does your project solve? Why does it matter?"
            />
            <p className="mt-1 font-mono text-[10px] text-bone/30">{form.problem_statement.length}/1000</p>
          </div>

          <div>
            {field("Solution & AI Usage", true)}
            <textarea
              required maxLength={1000} rows={3}
              value={form.solution_approach}
              onChange={e => setForm({ ...form, solution_approach: e.target.value })}
              className={inputClass}
              placeholder="How did you build it? Which AI models/APIs did you use and why?"
            />
            <p className="mt-1 font-mono text-[10px] text-bone/30">{form.solution_approach.length}/1000</p>
          </div>

          <div>
            {field("Full Project Description", true)}
            <textarea
              required maxLength={3000} rows={6}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className={inputClass}
              placeholder="Comprehensive description: features, architecture, challenges, learnings..."
            />
            <p className="mt-1 font-mono text-[10px] text-bone/30">{form.description.length}/3000</p>
          </div>
        </div>

        {/* — Section 2: Tech Stack — */}
        <div className="panel p-6 sm:p-8 space-y-5">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.5em] text-cyan font-bold border-b border-cyan/20 pb-3">
            Tech Stack <span className="text-blood ml-1">*</span>
          </h2>
          <p className="font-serif italic text-bone/60 text-sm">Select all technologies you used. You can also add custom ones.</p>

          <div className="flex flex-wrap gap-2">
            {TECH_OPTIONS.map(tech => (
              <button
                key={tech}
                type="button"
                onClick={() => toggleTech(tech)}
                className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] border transition-all duration-200 ${
                  techStack.includes(tech)
                    ? "border-blood bg-blood/20 text-blood"
                    : "border-bone/20 text-bone/50 hover:border-bone/50 hover:text-bone/80"
                }`}
              >
                {tech}
              </button>
            ))}
          </div>

          {/* Custom tech */}
          <div className="flex gap-3">
            <input
              value={customTech}
              onChange={e => setCustomTech(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomTech(); }}}
              className={`${inputClass} flex-1`}
              placeholder="Add a custom technology..."
            />
            <button
              type="button"
              onClick={addCustomTech}
              className="px-5 py-2 border border-bone/20 text-bone/60 hover:border-blood hover:text-blood font-mono text-[10px] uppercase tracking-[0.2em] transition-colors"
            >
              Add
            </button>
          </div>

          {techStack.length > 0 && (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-bone/40 mb-2">Selected:</p>
              <div className="flex flex-wrap gap-2">
                {techStack.map(t => (
                  <span key={t} className="flex items-center gap-1.5 px-3 py-1 bg-blood/10 border border-blood/30 font-mono text-[10px] text-blood">
                    {t}
                    <button type="button" onClick={() => toggleTech(t)} className="hover:text-bone">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* — Section 3: Screenshots — */}
        <div className="panel p-6 sm:p-8 space-y-5">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.5em] text-amber font-bold border-b border-amber/20 pb-3">
            Screenshots / Demo Images
          </h2>
          <p className="font-serif italic text-bone/60 text-sm">Upload up to 5 images (max 5MB each). These will be visible to judges.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {screenshots.map((src, i) => (
              <div key={i} className="relative aspect-video bg-black/40 border border-bone/15 overflow-hidden group">
                <img src={src} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeScreenshot(i)}
                  className="absolute top-1.5 right-1.5 bg-black/70 text-bone hover:text-blood p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {screenshots.length < 5 && (
              <label className="aspect-video border border-dashed border-bone/25 flex flex-col items-center justify-center cursor-pointer hover:border-blood hover:bg-blood/5 transition-all">
                <UploadCloud className="h-6 w-6 text-bone/40 mb-2" />
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone/40">Add image</span>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleScreenshots} />
              </label>
            )}
          </div>
        </div>

        {/* — Section 4: Links — */}
        <div className="panel p-6 sm:p-8 space-y-5">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.5em] text-bone/70 font-bold border-b border-bone/20 pb-3">
            Project Links
          </h2>
          {[
            { k: "repo_url", l: "Repository URL", p: "https://github.com/your-team/project" },
            { k: "demo_url", l: "Live Demo URL", p: "https://your-demo.vercel.app" },
            { k: "video_url", l: "Video Walkthrough (YouTube / Loom)", p: "https://youtube.com/watch?v=..." },
          ].map(f => (
            <div key={f.k}>
              {field(f.l)}
              <input
                type="url"
                value={(form as any)[f.k]}
                onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                className={inputClass}
                placeholder={f.p}
              />
            </div>
          ))}
        </div>

        {/* — Submit — */}
        <button
          type="submit"
          disabled={saving}
          className="bracket w-full border border-blood bg-blood py-4 font-mono text-[11px] uppercase tracking-[0.4em] text-black hover:bg-transparent hover:text-blood transition-all duration-500 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving…" : "Save Submission"}
        </button>
      </form>
    </PortalShell>
  );
}
