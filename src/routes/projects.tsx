import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
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

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function ProjectGridCard({
  project,
  index,
}: {
  project: PublicProjectShowcaseItem;
  index: number;
}) {
  const previewImage = project.screenshots[0] ?? null;

  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId: project.id }}
      className={`panel group block overflow-hidden reveal ${
        index % 3 === 1
          ? "reveal-delay-1"
          : index % 3 === 2
            ? "reveal-delay-2"
            : ""
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-black/40">
        {previewImage ? (
          <img
            src={previewImage}
            alt={`${project.title} preview`}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.72))]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
      </div>

      <div className="p-5 sm:p-6">
        <h2 className="font-display text-2xl leading-tight text-bone sm:text-3xl">
          {project.title}
        </h2>
        <p className="mt-3 font-serif text-base leading-relaxed text-bone/70">
          {truncateText(project.description, 140)}
        </p>
      </div>
    </Link>
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
      project.description,
      project.team?.name,
      project.problemStatement,
      project.solutionApproach,
      ...project.techStack,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesTrack && haystack.includes(query.trim().toLowerCase());
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
                  Explore the
                  <span className="title-outline ml-3 not-italic">
                    submitted builds.
                  </span>
                </h1>
                <p className="mt-6 max-w-3xl font-serif text-lg leading-relaxed text-bone/68 sm:text-xl">
                  Browse Catalyst projects as a gallery. Open any card to view
                  the full write-up, links, and screenshots on its own page.
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
              <div className="mt-8 grid gap-6 lg:grid-cols-3">
                {filteredProjects.map((project, index) => (
                  <ProjectGridCard
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
                  the full project gallery.
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
