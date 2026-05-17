import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/PortalShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Edit Profile - Catalyst 2K26" }] }),
  component: ProfilePage,
});

const schema = z.object({
  firstName: z.string().trim().min(2, "First name is required"),
  lastName: z.string().trim().min(2, "Last name is required"),
  phone: z.string().trim().min(10, "Valid phone number required"),
  college: z.string().trim().min(2, "College is required"),
  course: z.string().trim().min(2, "Stream/Course is required"),
  yearOfStudy: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Please select your graduating year"),
  address: z.string().trim().min(10, "Full address is required"),
  dob: z.string().trim().min(8, "Date of Birth is required"),
  linkedinUrl: z.string().trim().url("Valid LinkedIn URL required"),
  githubUrl: z.string().trim().url("Valid GitHub URL required"),
  dietaryRestrictions: z
    .string()
    .trim()
    .min(2, "Dietary restrictions are required. Enter None if not applicable."),
  gender: z.enum(["male", "female", "others"], {
    errorMap: () => ({ message: "Please select your gender" }),
  }),
});

const emptyProfileForm = {
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
  gender: "",
};

const graduatingYears = Array.from({ length: 9 }, (_, i) => String(2023 + i));

const normalizeGender = (gender?: string | null) =>
  gender?.toLowerCase() === "other" ? "others" : gender?.toLowerCase() || "";

function formFromProfile(profile: any) {
  return {
    ...emptyProfileForm,
    firstName: profile?.first_name || profile?.full_name?.split(" ")[0] || "",
    lastName:
      profile?.last_name ||
      profile?.full_name?.split(" ").slice(1).join(" ") ||
      "",
    phone: profile?.phone || "",
    college: profile?.college || "Amity University Kolkata",
    course: profile?.course || "",
    yearOfStudy: profile?.year_of_study || "",
    address: profile?.address || "",
    dob: profile?.dob || "",
    linkedinUrl: profile?.linkedin_url || "",
    githubUrl: profile?.github_url || "",
    dietaryRestrictions: profile?.dietary_restrictions || "None",
    gender: normalizeGender(profile?.gender),
  };
}

function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState(emptyProfileForm);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [currentResumeUrl, setCurrentResumeUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const didLoad = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav({ to: "/login" });
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        toast.error("Could not load your profile.");
        console.error(error);
        setInitializing(false);
        return;
      }

      const currentProfile = data ?? profile;
      if (!currentProfile?.is_complete) {
        nav({ to: "/onboarding" });
        return;
      }

      setForm(formFromProfile(currentProfile));
      setCurrentResumeUrl(currentProfile.resume_url || "");
      didLoad.current = true;
      setInitializing(false);
    })();
  }, [loading, nav, profile, user]);

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
    if (!user || !didLoad.current) return;

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setBusy(true);

    try {
      let resumeUrl = currentResumeUrl;

      if (resumeFile) {
        const filePath = `${user.id}-${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(filePath, resumeFile, { upsert: true });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("resumes").getPublicUrl(filePath);
        resumeUrl = publicUrl;
      }

      const fullName =
        `${parsed.data.firstName} ${parsed.data.lastName}`.trim();

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          first_name: parsed.data.firstName,
          last_name: parsed.data.lastName,
          phone: parsed.data.phone,
          college: parsed.data.college,
          course: parsed.data.course,
          year_of_study: parsed.data.yearOfStudy,
          address: parsed.data.address,
          dob: parsed.data.dob,
          linkedin_url: parsed.data.linkedinUrl,
          github_url: parsed.data.githubUrl,
          dietary_restrictions: parsed.data.dietaryRestrictions,
          gender: parsed.data.gender,
          resume_url: resumeUrl || null,
          is_complete: true,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      const { error: memberError } = await supabase
        .from("team_members")
        .update({
          full_name: fullName,
          phone: parsed.data.phone,
          college: parsed.data.college,
        })
        .eq("user_id", user.id);

      if (memberError) throw memberError;

      toast.success("Profile updated.");
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not update your profile.");
      setBusy(false);
    }
  };

  if (loading || initializing) {
    return (
      <PortalShell title="Loading...">
        <div className="text-bone/50 font-mono text-sm">
          Loading your profile...
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell title="Edit Profile">
      <div className="mx-auto max-w-4xl pb-12">
        <div className="mb-10 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood">
            Participant Details
          </p>
          <h2 className="mt-3 font-display text-4xl text-bone drop-shadow-md sm:text-5xl">
            Update your application
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-serif text-lg italic text-bone/70">
            Keep these details accurate for verification, certificates, and
            event-day coordination.
          </p>
        </div>

        <form onSubmit={submit} className="panel p-8 sm:p-12">
          <h3 className="mb-6 border-b border-blood/20 pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-blood text-glow-blood">
            Personal Information
          </h3>
          <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70">
                First Name
              </label>
              <input
                required
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                className="input-styled"
              />
            </div>
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70">
                Last Name
              </label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="input-styled"
              />
            </div>
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70">
                Email
              </label>
              <input
                disabled
                value={user?.email || ""}
                className="input-styled cursor-not-allowed opacity-50"
              />
            </div>
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70">
                Phone Number
              </label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-styled"
              />
            </div>
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70">
                Date of Birth
              </label>
              <input
                required
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="input-styled [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70">
                Sex / Gender
              </label>
              <select
                required
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="input-styled [color-scheme:dark]"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="others">Others</option>
              </select>
            </div>
          </div>

          <h3 className="mb-6 border-b border-cyan/20 pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-cyan text-glow-cyan">
            Academic Background
          </h3>
          <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70">
                College / Institution
              </label>
              <input
                required
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
                className="input-styled"
              />
            </div>
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70">
                Stream / Course
              </label>
              <input
                required
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                className="input-styled"
              />
            </div>
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70">
                Graduating Year
              </label>
              <select
                required
                value={form.yearOfStudy}
                onChange={(e) =>
                  setForm({ ...form, yearOfStudy: e.target.value })
                }
                className="input-styled [color-scheme:dark]"
              >
                <option value="">Select year</option>
                {graduatingYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70">
                Full Address
              </label>
              <textarea
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="input-styled min-h-[100px] resize-y py-3"
              />
            </div>
          </div>

          <h3 className="mb-6 border-b border-amber/20 pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-amber text-glow-amber">
            Professional Profile
          </h3>
          <div className="mb-10 grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70">
                  LinkedIn URL
                </label>
                <input
                  required
                  type="url"
                  value={form.linkedinUrl}
                  onChange={(e) =>
                    setForm({ ...form, linkedinUrl: e.target.value })
                  }
                  className="input-styled"
                />
              </div>
              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70">
                  GitHub URL
                </label>
                <input
                  required
                  type="url"
                  value={form.githubUrl}
                  onChange={(e) =>
                    setForm({ ...form, githubUrl: e.target.value })
                  }
                  className="input-styled"
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-6">
              <label className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70">
                Resume / CV (Optional, PDF Only, Max 5MB)
              </label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <label className="btn-secondary inline-flex cursor-pointer items-center gap-2">
                  <UploadCloud className="h-4 w-4" />
                  <span>Choose File</span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                <span className="text-sm font-serif italic text-bone/60">
                  {resumeFile
                    ? resumeFile.name
                    : currentResumeUrl
                      ? "Resume previously uploaded."
                      : "No file chosen"}
                </span>
              </div>
            </div>
          </div>

          <h3 className="mb-6 border-b border-bone/20 pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-bone/80">
            Logistics
          </h3>
          <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/70">
                Dietary Restrictions
              </label>
              <input
                required
                value={form.dietaryRestrictions}
                onChange={(e) =>
                  setForm({ ...form, dietaryRestrictions: e.target.value })
                }
                className="input-styled"
                placeholder="None, Veg, Vegan, etc."
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
            <Link
              to="/dashboard"
              className="btn-secondary flex min-h-12 items-center justify-center px-6"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={busy}
              className="btn-primary flex min-h-12 items-center justify-center gap-3 px-6 sm:min-w-[200px]"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </PortalShell>
  );
}
