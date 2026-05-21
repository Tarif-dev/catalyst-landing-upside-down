import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowUpRight,
  Github,
  MonitorPlay,
  Search,
  Trophy,
  Video,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Nav } from "@/components/Nav";
import {
  getPublicProjectShowcase,
  type PublicProjectShowcaseItem,
} from "@/lib/project-showcase";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Project Showcase — Catalyst 2K26" },
      {
        name: "description",
        content:
          "Browse all submitted Catalyst 2K26 projects, demos, walkthroughs, and screenshots.",
      },
      { property: "og:title", content: "Catalyst 2K26 Project Showcase" },
      {
        property: "og:description",
        content: "Explore public project submissions from Catalyst 2K26.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://hack-catalyst.vercel.app/projects" },
    ],
  }),
  loader: async () => {
    try {
      return await getPublicProjectShowcase();
    } catch {
      return [];
    }
  },
  component: ProjectsShowcasePage,
});

const TRACK_ORDER = [
  "all",
  "healthcare",
  "fintech",
  "sustainability",
  "education",
] as const;

const TRACK_LABEL: Record<string, string> = {
  all: "All Tracks",
  healthcare: "AI for Healthcare",
  fintech: "AI for Fintech",
  sustainability: "AI for Sustainability",
  education: "AI for Education",
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function ProjectLinks({
  project,
  compact = false,
}: {
  project: PublicProjectShowcaseItem;
  compact?: boolean;
}) {
  const links = [
    {
      label: "Repository",
      href: project.repoUrl,
      icon: Github,
    },
    {
      label: "Live Demo",
      href: project.demoUrl,
      icon: MonitorPlay,
    },
    {
      label: "Walkthrough",
      href: project.videoUrl,
      icon: Video,
    },
  ].filter((item) => item.href);

  if (!links.length) {
    return (
      <p
        className={`font-serif text-bone/50 ${compact ? "text-sm" : "text-base"}`}
      >
        No public links shared.
      </p>
    );
  }

  return (
    <div className={`flex flex-wrap gap-3 ${compact ? "" : "pt-1"}`}>
      {links.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.label}
            href={item.href!}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-bone/75 transition-colors hover:border-cyan/40 hover:text-cyan"
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        );
      })}
    </div>
  );
}

function ProjectCard({
  project,
  index,
}: {
  project: PublicProjectShowcaseItem;
  index: number;
}) {
  const previewImage = project.screenshots[0] ?? null;

  return (
    <article
      className={`panel overflow-hidden reveal ${index % 3 === 1 ? "reveal-delay-1" : index % 3 === 2 ? "reveal-delay-2" : ""}`}
    >
      <div className="grid gap-0 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="relative min-h-[240px] border-b border-white/10 bg-black/40 xl:min-h-full xl:border-b-0 xl:border-r">
          {previewImage ? (
            <img
              src={previewImage}
              alt={`${project.title} preview`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.6))]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
          <div className="absolute left-5 right-5 top-5 flex flex-wrap gap-2">
            <span className="border border-blood/30 bg-black/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-blood">
              {project.team?.trackLabel || "Project"}
            </span>
            {project.team?.isWinner ? (
              <span className="inline-flex items-center gap-1.5 border border-amber/35 bg-black/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-amber">
                <Trophy className="h-3.5 w-3.5" />
                Winner
              </span>
            ) : null}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-bone/45">
              {project.team?.name || "Catalyst Team"}
            </p>
            <h2 className="mt-2 font-display text-3xl text-bone sm:text-4xl">
              {project.title}
            </h2>
            {project.team?.tagline ? (
              <p className="mt-2 font-serif italic text-bone/70">
                "{project.team.tagline}"
              </p>
            ) : null}
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">
                Submitted {formatTimestamp(project.submittedAt)}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-bone/35">
                Updated {formatTimestamp(project.updatedAt)}
              </p>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan">
              {project.screenshots.length} screenshot
              {project.screenshots.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="border border-white/10 bg-black/25 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">
                Problem
              </p>
              <p className="mt-3 font-serif text-base leading-relaxed text-bone/78">
                {truncateText(
                  project.problemStatement || "Not shared publicly.",
                  190,
                )}
              </p>
            </div>
            <div className="border border-white/10 bg-black/25 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">
                Approach
              </p>
              <p className="mt-3 font-serif text-base leading-relaxed text-bone/78">
                {truncateText(
                  project.solutionApproach || "Not shared publicly.",
                  190,
                )}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">
              Snapshot
            </p>
            <p className="mt-3 font-serif text-lg leading-relaxed text-bone/78">
              {truncateText(project.description, 260)}
            </p>
          </div>

          <div className="mt-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">
              Tech Stack
            </p>
            {project.techStack.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="border border-cyan/20 bg-cyan/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 font-serif text-bone/50">
                No tech stack shared.
              </p>
            )}
          </div>

          <div className="mt-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">
              Links
            </p>
            <div className="mt-3">
              <ProjectLinks project={project} compact />
            </div>
          </div>

          <details className="group mt-7 border-t border-white/10 pt-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-blood">
                Full Submission
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bone/45 transition-colors group-open:text-cyan">
                Tap to expand
              </span>
            </summary>

            <div className="mt-5 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="border border-white/10 bg-black/25 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">
                    Problem Statement
                  </p>
                  <p className="mt-3 whitespace-pre-wrap font-serif text-base leading-relaxed text-bone/80">
                    {project.problemStatement || "Not shared publicly."}
                  </p>
                </div>
                <div className="border border-white/10 bg-black/25 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">
                    Solution & AI Usage
                  </p>
                  <p className="mt-3 whitespace-pre-wrap font-serif text-base leading-relaxed text-bone/80">
                    {project.solutionApproach || "Not shared publicly."}
                  </p>
                </div>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">
                  Full Description
                </p>
                <div className="prose prose-invert prose-blood mt-4 max-w-none text-bone/80 prose-headings:text-bone prose-strong:text-bone prose-a:text-cyan">
                  <ReactMarkdown>{project.description}</ReactMarkdown>
                </div>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">
                  Public Links
                </p>
                <div className="mt-4">
                  <ProjectLinks project={project} />
                </div>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">
                  Screenshots
                </p>
                {project.screenshots.length ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {project.screenshots.map((src, screenshotIndex) => (
                      <a
                        key={`${project.id}-${screenshotIndex}`}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden border border-white/10 bg-black/20 transition-colors hover:border-cyan/35"
                      >
                        <img
                          src={src}
                          alt={`${project.title} screenshot ${screenshotIndex + 1}`}
                          className="aspect-video w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 border border-white/10 bg-black/20 p-4 font-serif text-bone/55">
                    No screenshots uploaded for this project.
                  </div>
                )}
              </div>
            </div>
          </details>
        </div>
      </div>
    </article>
  );
}

function ProjectsShowcasePage() {
  const projects = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [trackFilter, setTrackFilter] =
    useState<(typeof TRACK_ORDER)[number]>("all");

  const filteredProjects = projects.filter((project) => {
    const matchesTrack =
      trackFilter === "all" || project.team?.track === trackFilter;

    const haystack = [
      project.title,
      project.team?.name,
      project.team?.tagline,
      project.description,
      project.problemStatement,
      project.solutionApproach,
      ...project.techStack,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesQuery = haystack.includes(query.trim().toLowerCase());
    return matchesTrack && matchesQuery;
  });

  const trackCounts = TRACK_ORDER.reduce<Record<string, number>>(
    (acc, track) => {
      acc[track] =
        track === "all"
          ? projects.length
          : projects.filter((project) => project.team?.track === track).length;
      return acc;
    },
    {},
  );

  return (
    <div className="min-h-screen bg-black text-bone">
      <Nav />

      <main className="relative overflow-hidden pt-24 sm:pt-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(164,29,35,0.28),transparent_58%)]" />
        <div className="pointer-events-none absolute right-[-10rem] top-40 h-72 w-72 rounded-full bg-cyan/10 blur-3xl" />
        <div className="pointer-events-none absolute left-[-8rem] top-[32rem] h-80 w-80 rounded-full bg-blood/10 blur-3xl" />

        <section className="relative border-b border-white/10 px-5 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-blood reveal">
              Public Showcase
            </p>
            <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div className="reveal reveal-delay-1">
                <h1 className="max-w-4xl font-display text-5xl leading-[0.95] text-bone sm:text-6xl lg:text-7xl">
                  Submitted projects,
                  <span className="title-outline ml-3 not-italic">
                    out in the open.
                  </span>
                </h1>
                <p className="mt-6 max-w-3xl font-serif text-lg leading-relaxed text-bone/68 sm:text-xl">
                  Browse what Catalyst teams built across every track. Each card
                  includes the project pitch, approach, links, and screenshots,
                  all on a public URL anyone can share.
                </p>
              </div>

              <div className="panel p-5 sm:p-6 reveal reveal-delay-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-bone/40">
                      Projects listed
                    </p>
                    <p className="mt-3 font-display text-5xl text-bone">
                      {projects.length}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-bone/40">
                      Tracks represented
                    </p>
                    <p className="mt-3 font-display text-5xl text-cyan">
                      {
                        new Set(
                          projects
                            .map((project) => project.team?.track)
                            .filter(Boolean),
                        ).size
                      }
                    </p>
                  </div>
                </div>
                <div className="hairline-bone mt-6" />
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/"
                    className="btn-secondary inline-flex items-center px-5 py-3"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative px-5 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="panel p-5 sm:p-6 reveal">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <label
                    htmlFor="project-search"
                    className="font-mono text-[10px] uppercase tracking-[0.32em] text-bone/40"
                  >
                    Search projects
                  </label>
                  <div className="relative mt-3">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-bone/35" />
                    <input
                      id="project-search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search by title, team, tech, or keywords..."
                      className="input-styled pl-14"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {TRACK_ORDER.map((track) => (
                    <button
                      key={track}
                      type="button"
                      onClick={() => setTrackFilter(track)}
                      className={`px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                        trackFilter === track
                          ? "border border-blood bg-blood/15 text-blood"
                          : "border border-white/10 bg-white/5 text-bone/60 hover:border-white/25 hover:text-bone"
                      }`}
                    >
                      {TRACK_LABEL[track]} · {trackCounts[track] || 0}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-bone/40">
                {filteredProjects.length} project
                {filteredProjects.length === 1 ? "" : "s"} visible
              </p>
              {(query || trackFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setTrackFilter("all");
                  }}
                  className="w-fit font-mono text-[10px] uppercase tracking-[0.28em] text-cyan transition-colors hover:text-bone"
                >
                  Reset filters
                </button>
              )}
            </div>

            {filteredProjects.length ? (
              <div className="mt-8 grid gap-8">
                {filteredProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="panel mt-8 p-10 text-center reveal">
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood">
                  No matches
                </p>
                <h2 className="mt-4 font-display text-4xl text-bone">
                  Nothing fits that filter yet
                </h2>
                <p className="mx-auto mt-4 max-w-xl font-serif text-lg leading-relaxed text-bone/65">
                  Try a different keyword, or switch back to all tracks to see
                  the full project wall.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-5 py-10 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-2xl italic text-bone">
              Catalyst 2K26
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">
              Public project showcase
            </p>
          </div>
          <Link
            to="/"
            className="font-mono text-[10px] uppercase tracking-[0.28em] text-bone/55 transition-colors hover:text-blood"
          >
            Back to main site
          </Link>
        </div>
      </footer>
    </div>
  );
}
