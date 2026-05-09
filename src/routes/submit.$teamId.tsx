import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  UploadCloud,
  X,
  Loader2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Github,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/submit/$teamId")({
  head: () => ({ meta: [{ title: "Submit Project — Catalyst 2K26" }] }),
  component: Submit,
});

const TECH_OPTIONS = [
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "FastAPI",
  "Flask",
  "Django",
  "TensorFlow",
  "PyTorch",
  "LangChain",
  "OpenAI API",
  "Gemini API",
  "Hugging Face",
  "Scikit-learn",
  "PostgreSQL",
  "MongoDB",
  "Firebase",
  "Supabase",
  "Docker",
  "AWS",
  "GCP",
  "Azure",
  "Tailwind CSS",
  "Other",
];

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120),
  problem_statement: z
    .string()
    .trim()
    .min(20, "Briefly describe the problem you solved")
    .max(1000),
  solution_approach: z
    .string()
    .trim()
    .min(20, "Describe your approach and how AI is used")
    .max(1000),
  description: z
    .string()
    .trim()
    .min(50, "Please write at least 50 characters describing your project")
    .max(3000),
  repo_url: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .max(500)
    .or(z.literal("")),
  demo_url: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .max(500)
    .or(z.literal("")),
  video_url: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .max(500)
    .or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {Array.from({ length: total }).map((_, i) => {
        const step = i + 1;
        const active = step === current;
        const passed = step < current;
        return (
          <div key={step} className="flex items-center">
            <div
              className={`h-8 w-8 flex items-center justify-center rounded-full font-mono text-[10px] border transition-colors ${
                active
                  ? "bg-blood text-black border-blood shadow-[0_0_15px_oklch(0.56_0.26_25/0.3)]"
                  : passed
                    ? "bg-blood/20 text-blood border-blood"
                    : "bg-black/60 text-bone/40 border-bone/15"
              }`}
            >
              {passed ? <CheckCircle2 className="h-4 w-4" /> : step}
            </div>
            {step < total && (
              <div
                className={`h-px w-8 sm:w-16 transition-colors ${
                  passed ? "bg-blood" : "bg-bone/15"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Submit() {
  const { teamId } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [team, setTeam] = useState<any>(null);

  const [techStack, setTechStack] = useState<string[]>([]);
  const [customTech, setCustomTech] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);

  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [memberCount, setMemberCount] = useState(0);

  const [step, setStep] = useState(1);
  const [isPreview, setIsPreview] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    trigger,
    control,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      problem_statement: "",
      solution_approach: "",
      description: "",
      repo_url: "",
      demo_url: "",
      video_url: "",
    },
    mode: "onChange",
  });

  const formValues = watch();

  // Auto-save logic
  useEffect(() => {
    if (busy) return;
    const timeoutId = setTimeout(() => {
      localStorage.setItem(
        `catalyst-draft-${teamId}`,
        JSON.stringify({
          ...formValues,
          techStack,
        }),
      );
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [formValues, techStack, busy, teamId]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav({ to: "/login" });
      return;
    }
    (async () => {
      const [{ data: t }, { data: s }, { count }] = await Promise.all([
        supabase.from("teams").select("*").eq("id", teamId).maybeSingle(),
        supabase
          .from("submissions")
          .select("*")
          .eq("team_id", teamId)
          .maybeSingle(),
        supabase
          .from("team_members")
          .select("*", { count: "exact", head: true })
          .eq("team_id", teamId),
      ]);
      setTeam(t);
      setMemberCount(count ?? 0);

      const localDraftStr = localStorage.getItem(`catalyst-draft-${teamId}`);
      let draft = null;
      if (localDraftStr) {
        try {
          draft = JSON.parse(localDraftStr);
        } catch (e) {}
      }

      if (s) {
        reset({
          title: s.title || "",
          description: s.description || "",
          problem_statement: (s as any).problem_statement || "",
          solution_approach: (s as any).solution_approach || "",
          repo_url: s.repo_url ?? "",
          demo_url: s.demo_url ?? "",
          video_url: s.video_url ?? "",
        });
        if ((s as any).tech_stack) {
          setTechStack(
            (s as any).tech_stack
              .split(",")
              .map((x: string) => x.trim())
              .filter(Boolean),
          );
        }
        if ((s as any).screenshots?.length) {
          setScreenshots((s as any).screenshots);
        }
      } else if (draft) {
        reset({
          title: draft.title || "",
          description: draft.description || "",
          problem_statement: draft.problem_statement || "",
          solution_approach: draft.solution_approach || "",
          repo_url: draft.repo_url || "",
          demo_url: draft.demo_url || "",
          video_url: draft.video_url || "",
        });
        if (draft.techStack) setTechStack(draft.techStack);
      }
      setBusy(false);
    })();
  }, [user, loading, teamId, nav, reset]);

  const toggleTech = (tech: string) => {
    setTechStack((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech],
    );
  };

  const addCustomTech = () => {
    const trimmed = customTech.trim();
    if (trimmed && !techStack.includes(trimmed)) {
      setTechStack((prev) => [...prev, trimmed]);
      setCustomTech("");
    }
  };

  const handleScreenshots = async (files: File[]) => {
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
    setScreenshotFiles((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setScreenshots((prev) => [...prev, ...previews]);
  };

  const removeScreenshot = (idx: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== idx));
    setScreenshotFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files?.length) {
        handleScreenshots(Array.from(e.dataTransfer.files));
      }
    },
    [screenshotFiles, screenshots],
  );

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (step === 1)
      fieldsToValidate = ["title", "problem_statement", "solution_approach"];
    if (step === 2) fieldsToValidate = ["description"];
    if (step === 3) fieldsToValidate = ["repo_url", "demo_url", "video_url"];

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      if (step === 2 && techStack.length === 0) {
        toast.error("Please select at least one technology.");
        return;
      }
      setStep((s) => s + 1);
    }
  };

  const submit = async (values: FormValues) => {
    setSaving(true);
    try {
      const uploadPromises = screenshotFiles.map(async (file) => {
        const path = `${teamId}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("submissions")
          .upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        const {
          data: { publicUrl },
        } = supabase.storage.from("submissions").getPublicUrl(path);
        return publicUrl;
      });
      const uploadedUrls = await Promise.all(uploadPromises);
      const finalScreenshots = [
        ...screenshots.filter((s) => s.startsWith("http")),
        ...uploadedUrls,
      ];

      const payload: any = {
        team_id: teamId,
        title: values.title,
        description: values.description,
        problem_statement: values.problem_statement,
        solution_approach: values.solution_approach,
        repo_url: values.repo_url || null,
        demo_url: values.demo_url || null,
        video_url: values.video_url || null,
        tech_stack: techStack.join(", "),
        screenshots: finalScreenshots.length ? finalScreenshots : null,
      };

      const { error } = await supabase
        .from("submissions")
        .upsert(payload, { onConflict: "team_id" });
      if (error) throw error;

      localStorage.removeItem(`catalyst-draft-${teamId}`);
      setSubmitted(true);
      setTimeout(() => nav({ to: "/dashboard" }), 3000);
    } catch (err: any) {
      toast.error(err.message || "Submission failed.");
    } finally {
      setSaving(false);
    }
  };

  if (busy)
    return (
      <PortalShell title="Loading…">
        <div />
      </PortalShell>
    );
  if (!team)
    return (
      <PortalShell title="Not found">
        <Link to="/dashboard" className="text-blood">
          ← Dashboard
        </Link>
      </PortalShell>
    );
  if (team.leader_id !== user?.id)
    return (
      <PortalShell title="Leader only">
        <p className="text-bone/60">
          Only your team leader can edit the project submission.
        </p>
      </PortalShell>
    );
  if (memberCount < 2)
    return (
      <PortalShell title="Add members first">
        <p className="text-bone/60 mb-4">
          You need at least 2 members on your team before submitting.
        </p>
        <Link
          to="/team/$teamId"
          params={{ teamId }}
          className="text-blood underline"
        >
          Manage team →
        </Link>
      </PortalShell>
    );

  if (submitted) {
    return (
      <PortalShell title="Mission Accomplished!">
        <div className="mx-auto max-w-lg text-center space-y-6 pt-10">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-blood/10 border border-blood/50 text-blood">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h2 className="font-display text-4xl text-bone">Project Submitted</h2>
          <p className="font-serif text-bone/60 text-lg">
            Your entry has been secured in the Hawkings lab database. Good luck
            out there.
          </p>
          <div className="pt-6">
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-blood" />
            <p className="text-[10px] uppercase font-mono tracking-widest text-bone/40 mt-3">
              Redirecting to Dashboard...
            </p>
          </div>
        </div>
      </PortalShell>
    );
  }

  const field = (label: string, required = false, err?: string) => (
    <div className="flex justify-between items-end mb-2">
      <label className="font-mono text-[10px] uppercase tracking-[0.35em] text-bone/60">
        {label}
        {required && <span className="text-blood ml-1">*</span>}
      </label>
      {err && (
        <span className="text-blood text-[10px] font-mono uppercase truncate max-w-[200px]">
          {err}
        </span>
      )}
    </div>
  );

  const inputClass = (err?: string) =>
    `w-full bg-black/60 border ${err ? "border-blood ring-1 ring-blood/20" : "border-bone/15 focus:border-blood"} px-4 py-3 text-bone placeholder:text-bone/30 focus:outline-none focus:ring-1 focus:ring-blood/30 transition-colors text-sm`;

  const getCharColor = (len: number, max: number) => {
    if (len > max * 0.9) return "text-blood font-bold";
    if (len > max * 0.75) return "text-amber";
    return "text-bone/30";
  };

  return (
    <PortalShell title="Submit your project">
      <div className="mx-auto max-w-3xl">
        <StepIndicator current={step} total={4} />

        <form onSubmit={handleSubmit(submit)} className="space-y-8">
          {/* STEP 1: Pitch Basics */}
          {step === 1 && (
            <div className="panel p-6 sm:p-8 space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.5em] text-blood font-bold border-b border-blood/20 pb-3">
                The Pitch
              </h2>

              <div>
                {field("Project Title", true, errors.title?.message)}
                <input
                  {...register("title")}
                  maxLength={120}
                  className={inputClass(errors.title?.message)}
                  placeholder="e.g. MindBridge — AI Mental Health Companion"
                />
              </div>

              <div>
                {field(
                  "Problem Statement",
                  true,
                  errors.problem_statement?.message,
                )}
                <textarea
                  {...register("problem_statement")}
                  maxLength={1000}
                  rows={4}
                  className={inputClass(errors.problem_statement?.message)}
                  placeholder="What problem does your project solve? Why does it matter?"
                />
                <p
                  className={`mt-1 font-mono text-[10px] text-right ${getCharColor(formValues.problem_statement?.length || 0, 1000)}`}
                >
                  {formValues.problem_statement?.length || 0}/1000
                </p>
              </div>

              <div>
                {field(
                  "Solution & AI Usage",
                  true,
                  errors.solution_approach?.message,
                )}
                <textarea
                  {...register("solution_approach")}
                  maxLength={1000}
                  rows={4}
                  className={inputClass(errors.solution_approach?.message)}
                  placeholder="How did you build it? Which AI models/APIs did you use and why?"
                />
                <p
                  className={`mt-1 font-mono text-[10px] text-right ${getCharColor(formValues.solution_approach?.length || 0, 1000)}`}
                >
                  {formValues.solution_approach?.length || 0}/1000
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Deep Dive */}
          {step === 2 && (
            <div className="panel p-6 sm:p-8 space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.5em] text-cyan font-bold border-b border-cyan/20 pb-3">
                Deep Dive
              </h2>

              <div>
                <div className="flex items-center justify-between mb-2">
                  {field(
                    "Full Project Description",
                    true,
                    errors.description?.message,
                  )}
                  <button
                    type="button"
                    onClick={() => setIsPreview(!isPreview)}
                    className="font-mono text-[9px] uppercase tracking-widest text-cyan hover:text-bone transition-colors underline underline-offset-4"
                  >
                    {isPreview ? "Edit Mode" : "Preview Markdown"}
                  </button>
                </div>

                {isPreview ? (
                  <div className="w-full bg-black/60 border border-bone/15 px-4 py-4 min-h-[200px] prose prose-invert prose-blood prose-sm max-w-none">
                    <ReactMarkdown>
                      {formValues.description ||
                        "*No description provided yet.*"}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <>
                    <textarea
                      {...register("description")}
                      maxLength={3000}
                      rows={8}
                      className={inputClass(errors.description?.message)}
                      placeholder="Comprehensive description using Markdown: features, architecture, challenges, learnings..."
                    />
                    <p
                      className={`mt-1 font-mono text-[10px] text-right ${getCharColor(formValues.description?.length || 0, 3000)}`}
                    >
                      {formValues.description?.length || 0}/3000
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-bone/10">
                {field("Tech Stack", true)}
                <div className="flex flex-wrap gap-2">
                  {TECH_OPTIONS.map((tech) => (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => toggleTech(tech)}
                      className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] border transition-all duration-200 ${techStack.includes(tech) ? "border-cyan bg-cyan/20 text-cyan" : "border-bone/20 text-bone/50 hover:border-bone/50 hover:text-bone/80"}`}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <input
                    value={customTech}
                    onChange={(e) => setCustomTech(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomTech();
                      }
                    }}
                    className={`${inputClass()} flex-1`}
                    placeholder="Add custom tech..."
                  />
                  <button
                    type="button"
                    onClick={addCustomTech}
                    className="px-5 py-2 border border-bone/20 text-bone/60 hover:border-cyan hover:text-cyan font-mono text-[10px] uppercase tracking-[0.2em] transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {techStack.map((t) => (
                    <span
                      key={t}
                      className="flex items-center gap-1.5 px-3 py-1 bg-cyan/10 border border-cyan/30 font-mono text-[10px] text-cyan"
                    >
                      {t}{" "}
                      <button
                        type="button"
                        onClick={() => toggleTech(t)}
                        className="hover:text-bone"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Media & Links */}
          {step === 3 && (
            <div className="panel p-6 sm:p-8 space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.5em] text-amber font-bold border-b border-amber/20 pb-3">
                Media & Links
              </h2>

              <div className="space-y-3">
                {field("Project Links")}
                <div className="relative">
                  <Github className="absolute left-3 top-3 h-5 w-5 text-bone/40" />
                  <input
                    {...register("repo_url")}
                    type="url"
                    className={`${inputClass(errors.repo_url?.message)} pl-10 border-amber/20`}
                    placeholder="Repository URL (e.g. https://github.com/...)"
                  />
                </div>
                <input
                  {...register("demo_url")}
                  type="url"
                  className={inputClass(errors.demo_url?.message)}
                  placeholder="Live Demo URL (e.g. https://your-demo.vercel.app)"
                />
                <input
                  {...register("video_url")}
                  type="url"
                  className={inputClass(errors.video_url?.message)}
                  placeholder="Video Walkthrough URL (YouTube, Loom)"
                />
              </div>

              <div className="pt-4 border-t border-bone/10">
                {field("Screenshots (Max 5)")}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                  {screenshots.map((src, i) => (
                    <div
                      key={i}
                      className="relative aspect-video bg-black/40 border border-bone/15 overflow-hidden group"
                    >
                      <img
                        src={src}
                        alt="Screenshot"
                        className="w-full h-full object-cover"
                      />
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
                    <label
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                      className={`aspect-video border border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${isDragOver ? "border-amber bg-amber/10" : "border-bone/25 hover:border-amber hover:bg-amber/5"}`}
                    >
                      <UploadCloud
                        className={`h-6 w-6 mb-2 ${isDragOver ? "text-amber" : "text-bone/40"}`}
                      />
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-center text-bone/40 px-2">
                        Click or Drop
                      </span>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files)
                            handleScreenshots(Array.from(e.target.files));
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div className="panel p-6 sm:p-8 space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.5em] text-blood font-bold border-b border-blood/20 pb-3">
                Final Review
              </h2>
              <div className="bg-black/40 border border-bone/10 p-5 space-y-4">
                <div>
                  <span className="font-mono text-[9px] uppercase text-bone/50 block">
                    Title
                  </span>
                  <p className="text-xl text-bone font-display">
                    {formValues.title}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[9px] uppercase text-bone/50 block">
                    Tech
                  </span>
                  <p className="text-sm text-cyan">
                    {techStack.join(" • ") || "None"}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[9px] uppercase text-bone/50 block">
                    Problem
                  </span>
                  <p className="text-sm text-bone/80 line-clamp-2">
                    {formValues.problem_statement}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[9px] uppercase text-bone/50 block">
                    Repo URL
                  </span>
                  <p className="text-sm text-bone/80">
                    {formValues.repo_url ? "Provided" : "No repo provided"}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[9px] uppercase text-bone/50 block">
                    Media
                  </span>
                  <p className="text-sm text-bone/80">
                    {screenshots.length} Screenshots attached
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Block */}
          <div className="flex gap-4 pt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="bracket px-6 py-4 border border-bone/20 text-bone/60 hover:text-bone hover:border-bone/50 font-mono text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="bracket flex-1 bg-bone text-black py-4 font-mono text-[11px] uppercase tracking-[0.3em] hover:bg-bone/80 transition-colors flex justify-center items-center gap-2"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="bracket flex-1 border border-blood bg-blood py-4 font-mono text-[11px] uppercase tracking-[0.4em] text-black hover:bg-transparent hover:text-blood transition-all duration-500 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Deploying Project..." : "Secure Submission"}
              </button>
            )}
          </div>
        </form>
      </div>
    </PortalShell>
  );
}
