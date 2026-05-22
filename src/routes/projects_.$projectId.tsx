import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowUpRight,
  Github,
  MonitorPlay,
  Trophy,
  Video,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Nav } from "@/components/Nav";
import {
  getPublicProjectById,
  type PublicProjectShowcaseItem,
} from "@/lib/project-showcase";

export const Route = createFileRoute("/projects_/$projectId")({
  head: () => ({
    meta: [
      { title: "Project Details — Catalyst 2K26" },
      {
        name: "description",
        content: "View the full details of a Catalyst 2K26 project submission.",
      },
    ],
  }),
  loader: async ({ params }) => {
    try {
      return await getPublicProjectById({
        data: { projectId: params.projectId },
      });
    } catch {
      return null;
    }
  },
  component: ProjectDetailsPage,
});

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ProjectLinks({ project }: { project: PublicProjectShowcaseItem }) {
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
      <p className="font-serif text-base text-bone/55">
        No public links shared.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
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

function ProjectDetailsPage() {
  const project = Route.useLoaderData();

  if (!project) {
    return (
      <div className="min-h-screen bg-black text-bone">
        <Nav />
        <main className="px-5 pt-28 pb-16 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="panel p-10 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood">
                Project Not Found
              </p>
              <h1 className="mt-4 font-display text-4xl text-bone">
                This project could not be loaded
              </h1>
              <p className="mx-auto mt-4 max-w-xl font-serif text-lg leading-relaxed text-bone/65">
                The project may have been removed, or the link may be invalid.
              </p>
              <Link
                to="/projects"
                className="btn-secondary mt-8 inline-flex items-center px-5 py-3"
              >
                Back to Projects
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const heroImage = project.screenshots[0] ?? null;

  return (
    <div className="min-h-screen bg-black text-bone">
      <Nav />

      <main className="relative overflow-hidden pt-24 sm:pt-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(164,29,35,0.28),transparent_58%)]" />
        <div className="pointer-events-none absolute right-[-10rem] top-40 h-72 w-72 rounded-full bg-cyan/10 blur-3xl" />

        <section className="relative px-5 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto max-w-7xl">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-bone/55 transition-colors hover:text-blood"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Projects
            </Link>

            <div className="mt-6 grid gap-8 xl:grid-cols-[1fr_0.95fr]">
              <div className="panel overflow-hidden">
                <div className="relative aspect-[16/10] bg-black/40">
                  {heroImage ? (
                    <img
                      src={heroImage}
                      alt={`${project.title} preview`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.72))]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                  <div className="absolute left-5 right-5 top-5 flex flex-wrap gap-2">
                    {project.team?.trackLabel ? (
                      <span className="border border-blood/30 bg-black/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-blood">
                        {project.team.trackLabel}
                      </span>
                    ) : null}
                    {project.team?.isWinner ? (
                      <span className="inline-flex items-center gap-1.5 border border-amber/35 bg-black/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-amber">
                        <Trophy className="h-3.5 w-3.5" />
                        Winner
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="panel p-6 sm:p-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-bone/40">
                  {project.team?.name || "Catalyst Team"}
                </p>
                <h1 className="mt-3 font-display text-4xl leading-tight text-bone sm:text-5xl">
                  {project.title}
                </h1>
                {project.team?.tagline ? (
                  <p className="mt-4 font-serif text-xl italic text-bone/70">
                    "{project.team.tagline}"
                  </p>
                ) : null}

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="border border-white/10 bg-black/25 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">
                      Submitted
                    </p>
                    <p className="mt-2 font-serif text-base text-bone/80">
                      {formatTimestamp(project.submittedAt)}
                    </p>
                  </div>
                  <div className="border border-white/10 bg-black/25 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">
                      Last Updated
                    </p>
                    <p className="mt-2 font-serif text-base text-bone/80">
                      {formatTimestamp(project.updatedAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">
                    Project Links
                  </p>
                  <div className="mt-4">
                    <ProjectLinks project={project} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-8">
                <div className="panel p-6 sm:p-8">
                  <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-blood">
                    Problem Statement
                  </p>
                  <p className="mt-4 whitespace-pre-wrap font-serif text-lg leading-relaxed text-bone/80">
                    {project.problemStatement || "Not shared publicly."}
                  </p>
                </div>

                <div className="panel p-6 sm:p-8">
                  <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan">
                    Solution & AI Usage
                  </p>
                  <p className="mt-4 whitespace-pre-wrap font-serif text-lg leading-relaxed text-bone/80">
                    {project.solutionApproach || "Not shared publicly."}
                  </p>
                </div>

                <div className="panel p-6 sm:p-8">
                  <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan">
                    Full Description
                  </p>
                  <div className="prose prose-invert prose-blood mt-5 max-w-none text-bone/80 prose-headings:text-bone prose-strong:text-bone prose-a:text-cyan">
                    <ReactMarkdown>{project.description}</ReactMarkdown>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="panel p-6 sm:p-8">
                  <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan">
                    Tech Stack
                  </p>
                  {project.techStack.length ? (
                    <div className="mt-5 flex flex-wrap gap-2">
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
                    <p className="mt-4 font-serif text-bone/55">
                      No tech stack shared.
                    </p>
                  )}
                </div>

                <div className="panel p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan">
                      Screenshots
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-bone/35">
                      {project.screenshots.length} attached
                    </p>
                  </div>

                  {project.screenshots.length ? (
                    <div className="mt-5 grid gap-4">
                      {project.screenshots.map((src, index) => (
                        <a
                          key={`${project.id}-${index}`}
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden border border-white/10 bg-black/20 transition-colors hover:border-cyan/35"
                        >
                          <img
                            src={src}
                            alt={`${project.title} screenshot ${index + 1}`}
                            className="aspect-video w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 border border-white/10 bg-black/20 p-4 font-serif text-bone/55">
                      No screenshots uploaded for this project.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
