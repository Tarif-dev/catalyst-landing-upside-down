import { createServerFn } from "@tanstack/react-start";

const TRACK_LABEL: Record<string, string> = {
  healthcare: "AI for Healthcare",
  fintech: "AI for Fintech",
  sustainability: "AI for Sustainability",
  education: "AI for Education",
};

export type PublicProjectShowcaseItem = {
  id: string;
  teamId: string;
  title: string;
  description: string;
  problemStatement: string | null;
  solutionApproach: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  videoUrl: string | null;
  techStack: string[];
  screenshots: string[];
  submittedAt: string;
  updatedAt: string;
  team: {
    id: string;
    name: string;
    tagline: string | null;
    track: string | null;
    trackLabel: string;
    isWinner: boolean;
  } | null;
};

function normalizeTechStack(value?: string | null) {
  return (
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

export async function readPublicProjectShowcase(): Promise<
  PublicProjectShowcaseItem[]
> {
  const { supabaseAdmin } =
    await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("submissions")
    .select(
      "id, team_id, title, description, problem_statement, solution_approach, repo_url, demo_url, video_url, tech_stack, screenshots, submitted_at, updated_at, teams(id, name, tagline, track, is_winner)",
    )
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Failed to read project showcase", error);
    throw new Error("Could not load submitted projects.");
  }

  return (data ?? []).map((item: any) => {
    const team = Array.isArray(item.teams) ? item.teams[0] : item.teams;
    const track = team?.track ?? null;

    return {
      id: item.id,
      teamId: item.team_id,
      title: item.title,
      description: item.description,
      problemStatement: item.problem_statement ?? null,
      solutionApproach: item.solution_approach ?? null,
      repoUrl: item.repo_url ?? null,
      demoUrl: item.demo_url ?? null,
      videoUrl: item.video_url ?? null,
      techStack: normalizeTechStack(item.tech_stack),
      screenshots: item.screenshots ?? [],
      submittedAt: item.submitted_at,
      updatedAt: item.updated_at,
      team: team
        ? {
            id: team.id,
            name: team.name,
            tagline: team.tagline ?? null,
            track,
            trackLabel:
              TRACK_LABEL[track || ""] ||
              track?.replace(/_/g, " ") ||
              "Open Track",
            isWinner: Boolean(team.is_winner),
          }
        : null,
    };
  });
}

export const getPublicProjectShowcase = createServerFn({
  method: "GET",
}).handler(async () => readPublicProjectShowcase());
