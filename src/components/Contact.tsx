import { useState } from "react";
import { SectionTitle } from "./SectionTitle";

const RECIPIENT = "catalyst.auk@gmail.com";

export function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = form.name.trim();
    const email = form.email.trim();
    const subject = form.subject.trim() || "Catalyst 2K26 — Enquiry";
    const message = form.message.trim();

    if (!name || name.length > 100)
      return setError("Please enter your name (under 100 chars).");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255)
      return setError("Please enter a valid email.");
    if (!message || message.length > 2000)
      return setError("Please enter a message (under 2000 chars).");

    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    const href = `mailto:${RECIPIENT}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    setSent(true);
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden px-6 py-24 md:py-44 border-t border-blood/10"
    >
      <div className="pointer-events-none absolute right-0 top-20 h-80 w-80 blob-rose opacity-40" />
      <div className="pointer-events-none absolute left-0 bottom-0 h-80 w-80 blob-blood opacity-30" />

      <div className="relative mx-auto max-w-5xl">
        <SectionTitle eyebrow="Open Channel — Transmit to Hawkins" italic>
          Contact Us.
        </SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-blood/15 reveal reveal-delay-1">
          {/* Left panel */}
          <div className="md:col-span-5 bg-black p-7 sm:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="block h-px w-8 bg-blood/60" />
                <span className="font-mono text-[9px] uppercase tracking-[0.45em] text-blood">
                  Reach the Lab
                </span>
              </div>
              <h3 className="font-display text-3xl sm:text-4xl md:text-5xl italic text-bone leading-tight mb-5">
                Patch into the
                <br />
                <span className="title-outline not-italic">frequency.</span>
              </h3>
              <p className="font-serif italic text-bone/60 text-base md:text-lg leading-relaxed mb-8">
                Questions, sponsorships, press, or partnership proposals — send
                a signal and we'll transmit back within 48 hours.
              </p>

              <div className="space-y-4">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone/45 mb-1">
                    Email
                  </div>
                  <a
                    href={`mailto:${RECIPIENT}`}
                    className="font-display italic text-lg sm:text-xl text-bone hover:text-blood transition-colors break-all"
                  >
                    {RECIPIENT}
                  </a>
                </div>
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone/45 mb-1">
                    Campus
                  </div>
                  <div className="font-display italic text-lg text-bone">
                    Amity University, Kolkata
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone/45 mb-1">
                    Hackathon
                  </div>
                  <div className="font-display italic text-lg text-bone">
                    21 – 22 May 2026
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-7 bg-black p-7 sm:p-10">
            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              <Field
                label="Name"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Eleven Hopper"
                maxLength={100}
                required
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                placeholder="you@hawkins.edu"
                maxLength={255}
                required
              />
              <Field
                label="Subject"
                value={form.subject}
                onChange={(v) => setForm((f) => ({ ...f, subject: v }))}
                placeholder="Sponsorship · Press · Enquiry"
                maxLength={150}
              />
              <div>
                <label className="block mb-2 font-mono text-[9px] uppercase tracking-[0.4em] text-bone/50">
                  Message
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, message: e.target.value }))
                  }
                  placeholder="Transmit your message…"
                  rows={5}
                  maxLength={2000}
                  required
                  className="w-full bg-black/60 border border-bone/15 px-4 py-3 font-serif text-base text-bone placeholder:text-bone/30 focus:outline-none focus:border-blood/70 transition-colors resize-y"
                />
              </div>

              {error && (
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-blood">
                  ⚠ {error}
                </p>
              )}
              {sent && !error && (
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-blood/80">
                  ✦ Signal sent. Your mail client should open shortly.
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  className="bracket flex-1 border border-blood bg-blood px-6 py-4 font-mono text-[10px] uppercase tracking-[0.45em] text-black transition-all duration-500 hover:bg-transparent hover:text-blood"
                >
                  Transmit Signal →
                </button>
                <a
                  href={`mailto:${RECIPIENT}`}
                  className="bracket flex-1 text-center border border-bone/20 px-6 py-4 font-mono text-[10px] uppercase tracking-[0.45em] text-bone/80 transition-all duration-500 hover:border-blood/60 hover:text-blood"
                >
                  Direct Email
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block mb-2 font-mono text-[9px] uppercase tracking-[0.4em] text-bone/50">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        className="w-full bg-black/60 border border-bone/15 px-4 py-3 font-serif text-base text-bone placeholder:text-bone/30 focus:outline-none focus:border-blood/70 transition-colors"
      />
    </div>
  );
}
