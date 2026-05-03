import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2, UploadCloud } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Complete Application — Catalyst 2K26" }] }),
  component: OnboardingPage,
});

const schema = z.object({
  firstName: z.string().trim().min(2, "First name is required"),
  lastName: z.string().trim().min(2, "Last name is required"),
  phone: z.string().trim().min(10, "Valid phone number required"),
  college: z.string().trim().min(2, "College is required"),
  course: z.string().trim().min(2, "Stream/Course is required"),
  yearOfStudy: z.string().trim().min(4, "Batch/Year of Study is required (e.g. 2026)"),
  address: z.string().trim().min(10, "Full address is required"),
  dob: z.string().trim().min(8, "Date of Birth is required"),
  linkedinUrl: z.string().url("Valid LinkedIn URL required"),
  githubUrl: z.union([z.string().url("Valid GitHub URL"), z.literal(""), z.undefined()]),
  dietaryRestrictions: z.string().optional(),
  tshirtSize: z.enum(["XS", "S", "M", "L", "XL", "XXL"], { errorMap: () => ({ message: "Select a valid size" }) }),
});

function OnboardingPage() {
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();
  
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    college: "Amity University Kolkata",
    course: "",
    yearOfStudy: "",
    address: "",
    dob: "",
    linkedinUrl: "",
    githubUrl: "",
    dietaryRestrictions: "None",
    tshirtSize: "M" as any,
  });
  
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav({ to: "/login" });
      return;
    }
    if (profile?.is_complete) {
      nav({ to: "/dashboard" });
    }
    
    // Auto-fill existing data if any
    if (profile) {
      setForm(prev => ({
        ...prev,
        firstName: profile.first_name || (profile.full_name?.split(" ")[0] || ""),
        lastName: profile.last_name || (profile.full_name?.split(" ").slice(1).join(" ") || ""),
        phone: profile.phone || "",
        college: profile.college || "Amity University Kolkata",
        course: profile.course || "",
        yearOfStudy: profile.year_of_study || "",
        address: profile.address || "",
        dob: profile.dob || "",
        linkedinUrl: profile.linkedin_url || "",
        githubUrl: profile.github_url || "",
        dietaryRestrictions: profile.dietary_restrictions || "None",
        tshirtSize: profile.tshirt_size || "M",
      }));
    }
  }, [user, profile, loading, nav]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are allowed.");
        e.target.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be under 5MB.");
        e.target.value = "";
        return;
      }
      setResumeFile(file);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    
    if (!resumeFile && !profile?.resume_url) {
      toast.error("Please upload your resume.");
      return;
    }

    setBusy(true);

    try {
      let resumeUrl = profile?.resume_url || "";

      // 1. Upload Resume
      if (resumeFile) {
        const filePath = `${user.id}-${Date.now()}.pdf`;
        const { error: uploadError, data } = await supabase.storage
          .from("resumes")
          .upload(filePath, resumeFile, { upsert: true });

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from("resumes").getPublicUrl(filePath);
        resumeUrl = publicUrl;
      }

      // 2. Update Profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: `${parsed.data.firstName} ${parsed.data.lastName}`.trim(),
          first_name: parsed.data.firstName,
          last_name: parsed.data.lastName,
          phone: parsed.data.phone,
          college: parsed.data.college,
          course: parsed.data.course,
          year_of_study: parsed.data.yearOfStudy,
          address: parsed.data.address,
          dob: parsed.data.dob,
          linkedin_url: parsed.data.linkedinUrl,
          github_url: parsed.data.githubUrl || null,
          dietary_restrictions: parsed.data.dietaryRestrictions,
          tshirt_size: parsed.data.tshirtSize,
          resume_url: resumeUrl,
          is_complete: true,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Force a reload so AuthProvider gets the updated profile
      window.location.href = "/dashboard";
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong during submission.");
      setBusy(false);
    }
  };

  if (loading || (profile && profile.is_complete)) {
    return <PortalShell title="Loading…"><div className="text-bone/50">…</div></PortalShell>;
  }

  return (
    <PortalShell title="Application Form">
      <div className="mx-auto max-w-4xl pb-12">
        <div className="text-center mb-10">
          <h2 className="font-display text-4xl sm:text-5xl text-bone mb-4 drop-shadow-md">Welcome to Catalyst</h2>
          <p className="font-serif italic text-bone/80 text-lg">
            Please complete your application profile to enter the Upside Down.
          </p>
        </div>

        <form onSubmit={submit} className="panel p-8 sm:p-12">
          
          {/* PERSONAL INFO */}
          <h3 className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood text-glow-blood mb-6 font-bold border-b border-blood/20 pb-2">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70 mb-2">First Name</label>
              <input required value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} className="input-styled" placeholder="Dustin" />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70 mb-2">Last Name</label>
              <input required value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} className="input-styled" placeholder="Henderson" />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70 mb-2">Email (Read Only)</label>
              <input disabled value={user?.email || ""} className="input-styled opacity-50 cursor-not-allowed" />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70 mb-2">Phone Number</label>
              <input required type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="input-styled" placeholder="+91 ..." />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70 mb-2">Date of Birth</label>
              <input required type="date" value={form.dob} onChange={(e) => setForm({...form, dob: e.target.value})} className="input-styled [color-scheme:dark]" />
            </div>
          </div>

          {/* ACADEMICS */}
          <h3 className="font-mono text-[10px] uppercase tracking-[0.4em] text-cyan text-glow-cyan mb-6 font-bold border-b border-cyan/20 pb-2">
            Academic Background
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="sm:col-span-2">
              <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70 mb-2">College / Institution</label>
              <input required value={form.college} onChange={(e) => setForm({...form, college: e.target.value})} className="input-styled" placeholder="Amity University" />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70 mb-2">Stream / Course</label>
              <input required value={form.course} onChange={(e) => setForm({...form, course: e.target.value})} className="input-styled" placeholder="B.Tech CSE" />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70 mb-2">Batch / Year of Study</label>
              <input required value={form.yearOfStudy} onChange={(e) => setForm({...form, yearOfStudy: e.target.value})} className="input-styled" placeholder="2026" />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70 mb-2">Full Address</label>
              <textarea required value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="input-styled min-h-[100px] resize-y py-3" placeholder="Your residential address..." />
            </div>
          </div>

          {/* PROFESSIONAL */}
          <h3 className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber text-glow-amber mb-6 font-bold border-b border-amber/20 pb-2">
            Professional Profile
          </h3>
          <div className="grid grid-cols-1 gap-6 mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70 mb-2">LinkedIn URL</label>
                <input required type="url" value={form.linkedinUrl} onChange={(e) => setForm({...form, linkedinUrl: e.target.value})} className="input-styled" placeholder="https://linkedin.com/in/..." />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70 mb-2">GitHub URL (Optional)</label>
                <input type="url" value={form.githubUrl} onChange={(e) => setForm({...form, githubUrl: e.target.value})} className="input-styled" placeholder="https://github.com/..." />
              </div>
            </div>
            
            <div className="p-6 border border-white/10 rounded-xl bg-black/20">
              <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70 mb-4">Resume / CV (PDF Only, Max 5MB)</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer btn-secondary inline-flex items-center gap-2">
                  <UploadCloud className="w-4 h-4" />
                  <span>Choose File</span>
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                </label>
                <span className="text-sm font-serif italic text-bone/60">
                  {resumeFile ? resumeFile.name : profile?.resume_url ? "Resume previously uploaded." : "No file chosen"}
                </span>
              </div>
            </div>
          </div>

          {/* LOGISTICS */}
          <h3 className="font-mono text-[10px] uppercase tracking-[0.4em] text-bone/80 mb-6 font-bold border-b border-bone/20 pb-2">
            Logistics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70 mb-2">T-Shirt Size</label>
              <select value={form.tshirtSize} onChange={(e) => setForm({...form, tshirtSize: e.target.value})} className="input-styled appearance-none cursor-pointer">
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70 mb-2">Dietary Restrictions</label>
              <input value={form.dietaryRestrictions} onChange={(e) => setForm({...form, dietaryRestrictions: e.target.value})} className="input-styled" placeholder="None, Veg, Vegan, etc." />
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="btn-primary flex items-center justify-center gap-3 w-full sm:w-auto min-w-[200px]"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? "Saving Profile…" : "Complete Application"}
            </button>
          </div>
        </form>
      </div>
    </PortalShell>
  );
}
