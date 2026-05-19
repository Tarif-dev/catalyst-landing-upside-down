/**
 * Server functions for QR check-in operations at the hackathon venue.
 *
 * Used by both the Admin "Scanner" tab and the Volunteer portal.
 * All functions verify the caller is either an admin or a volunteer.
 */

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

/* ── Helpers ───────────────────────────────────────────────── */

function adminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role not configured.");
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

function authedClient(accessToken: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase not configured.");
  return createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

/** Verify caller is an admin OR a volunteer. Returns admin client + caller info. */
async function requireAdminOrVolunteer(accessToken: string) {
  const callerSupa = authedClient(accessToken);
  const { data: callerUser, error } = await callerSupa.auth.getUser(accessToken);
  if (error || !callerUser?.user) throw new Error("Unauthorized.");

  const supa = adminClient();
  const userId = callerUser.user.id;

  // Check admin first
  const { data: adminRow } = await supa
    .from("admins")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (adminRow) return { supa, user: callerUser.user, role: "admin" as const };

  // Check volunteer
  const { data: volunteerRow } = await supa
    .from("volunteers" as any)
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (volunteerRow) return { supa, user: callerUser.user, role: "volunteer" as const };

  throw new Error("Unauthorized: not an admin or volunteer.");
}

/** Verify caller is an admin. */
async function requireAdmin(accessToken: string) {
  const callerSupa = authedClient(accessToken);
  const { data: callerUser, error } = await callerSupa.auth.getUser(accessToken);
  if (error || !callerUser?.user) throw new Error("Unauthorized.");

  const supa = adminClient();
  const { data: adminRow } = await supa
    .from("admins")
    .select("id")
    .eq("id", callerUser.user.id)
    .maybeSingle();

  if (!adminRow) throw new Error("Unauthorized: not an admin.");
  return { supa, user: callerUser.user };
}

const checkinActionSchema = z.enum(["gate_entry", "checked_in", "meal_1", "meal_2"]);
type CheckinAction = z.infer<typeof checkinActionSchema>;

/* ── 1. Lookup Participant ─────────────────────────────────── */

export const lookupParticipant = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string().min(20),
      passCode: z.string().min(1).max(10),
    }),
  )
  .handler(async ({ data }) => {
    const { supa } = await requireAdminOrVolunteer(data.accessToken);

    const code = data.passCode.toUpperCase().trim();

    // 1. Find profile
    const { data: profile, error: profileErr } = await supa
      .from("profiles")
      .select("id, user_id, full_name, email, phone, college, payment_status, pass_code, gender")
      .eq("pass_code", code)
      .maybeSingle();

    if (profileErr) throw profileErr;
    if (!profile) return { found: false as const, error: "No participant with this pass code." };

    if (profile.payment_status !== "paid") {
      return {
        found: true as const,
        verified: false as const,
        participant: {
          name: profile.full_name || "Unknown",
          email: profile.email || "",
          phone: profile.phone || "",
          college: profile.college || "",
          passCode: profile.pass_code,
          gender: profile.gender || "",
        },
        error: "Participant is NOT verified (payment pending).",
      };
    }

    // 2. Find team info
    const { data: membership } = await supa
      .from("team_members")
      .select("team_id, role, teams(name, track)")
      .eq("user_id", profile.user_id)
      .maybeSingle();

    const team = (membership as any)?.teams ?? null;

    // 3. Find existing checkin
    const { data: checkin } = await supa
      .from("checkins" as any)
      .select("gate_entry, checked_in, meal_1, meal_2")
      .eq("pass_code", code)
      .maybeSingle();

    return {
      found: true as const,
      verified: true as const,
      participant: {
        name: profile.full_name || "Unknown",
        email: profile.email || "",
        phone: profile.phone || "",
        college: profile.college || "",
        passCode: profile.pass_code,
        gender: profile.gender || "",
        teamName: team?.name || "",
        track: team?.track || "",
        role: (membership as any)?.role || "",
      },
      actions: {
        gate_entry: !!(checkin as any)?.gate_entry,
        checked_in: !!(checkin as any)?.checked_in,
        meal_1: !!(checkin as any)?.meal_1,
        meal_2: !!(checkin as any)?.meal_2,
      },
    };
  });

/* ── 2. Record Check-in Action ─────────────────────────────── */

export const recordCheckinAction = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string().min(20),
      passCode: z.string().min(1).max(10),
      action: checkinActionSchema,
    }),
  )
  .handler(async ({ data }) => {
    const { supa } = await requireAdminOrVolunteer(data.accessToken);
    const code = data.passCode.toUpperCase().trim();

    // 1. Verify participant exists and is paid
    const { data: profile } = await supa
      .from("profiles")
      .select("pass_code, payment_status")
      .eq("pass_code", code)
      .maybeSingle();

    if (!profile) throw new Error("Participant not found.");
    if (profile.payment_status !== "paid")
      throw new Error("Participant is not verified.");

    // 2. Check existing checkin row
    const { data: existing } = await supa
      .from("checkins" as any)
      .select("id, gate_entry, checked_in, meal_1, meal_2")
      .eq("pass_code", code)
      .maybeSingle();

    const actionKey = data.action;

    if (existing && (existing as any)[actionKey]) {
      return {
        success: false,
        alreadyUsed: true,
        message: `${actionLabel(actionKey)} has already been recorded.`,
        actions: {
          gate_entry: !!(existing as any).gate_entry,
          checked_in: !!(existing as any).checked_in,
          meal_1: !!(existing as any).meal_1,
          meal_2: !!(existing as any).meal_2,
        },
      };
    }

    // 3. Upsert
    if (existing) {
      await supa
        .from("checkins" as any)
        .update({
          [actionKey]: true,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("pass_code", code);
    } else {
      await supa.from("checkins" as any).insert({
        pass_code: code,
        [actionKey]: true,
      } as any);
    }

    // 4. Read back
    const { data: updated } = await supa
      .from("checkins" as any)
      .select("gate_entry, checked_in, meal_1, meal_2")
      .eq("pass_code", code)
      .maybeSingle();

    return {
      success: true,
      alreadyUsed: false,
      message: `${actionLabel(actionKey)} recorded successfully.`,
      actions: {
        gate_entry: !!(updated as any)?.gate_entry,
        checked_in: !!(updated as any)?.checked_in,
        meal_1: !!(updated as any)?.meal_1,
        meal_2: !!(updated as any)?.meal_2,
      },
    };
  });

/* ── 3. Undo Check-in Action ──────────────────────────────── */

export const undoCheckinAction = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string().min(20),
      passCode: z.string().min(1).max(10),
      action: checkinActionSchema,
    }),
  )
  .handler(async ({ data }) => {
    const { supa } = await requireAdminOrVolunteer(data.accessToken);
    const code = data.passCode.toUpperCase().trim();

    const { data: existing } = await supa
      .from("checkins" as any)
      .select("id, gate_entry, checked_in, meal_1, meal_2")
      .eq("pass_code", code)
      .maybeSingle();

    if (!existing) throw new Error("No check-in record found for this participant.");

    await supa
      .from("checkins" as any)
      .update({
        [data.action]: false,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("pass_code", code);

    const { data: updated } = await supa
      .from("checkins" as any)
      .select("gate_entry, checked_in, meal_1, meal_2")
      .eq("pass_code", code)
      .maybeSingle();

    return {
      success: true,
      message: `${actionLabel(data.action)} has been undone.`,
      actions: {
        gate_entry: !!(updated as any)?.gate_entry,
        checked_in: !!(updated as any)?.checked_in,
        meal_1: !!(updated as any)?.meal_1,
        meal_2: !!(updated as any)?.meal_2,
      },
    };
  });

/* ── 4. Reset All Actions ─────────────────────────────────── */

export const resetAllCheckins = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string().min(20),
      passCode: z.string().min(1).max(10),
    }),
  )
  .handler(async ({ data }) => {
    const { supa } = await requireAdminOrVolunteer(data.accessToken);
    const code = data.passCode.toUpperCase().trim();

    // Delete the row entirely — a clean slate
    await supa
      .from("checkins" as any)
      .delete()
      .eq("pass_code", code);

    return {
      success: true,
      message: "All check-in actions have been reset.",
      actions: {
        gate_entry: false,
        checked_in: false,
        meal_1: false,
        meal_2: false,
      },
    };
  });

/* ── 5. Volunteer Management (admin-only) ─────────────────── */

export const getVolunteers = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string().min(20) }))
  .handler(async ({ data }) => {
    const { supa } = await requireAdmin(data.accessToken);
    const { data: volunteers, error } = await supa
      .from("volunteers" as any)
      .select("id, email, name, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { volunteers: volunteers ?? [] };
  });

export const addVolunteer = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string().min(20),
      email: z.string().email(),
      name: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { supa } = await requireAdmin(data.accessToken);

    // Find auth user by email
    const { data: usersRes, error: listErr } = await supa.auth.admin.listUsers({
      perPage: 1000,
    });

    if (listErr) throw listErr;
    const authUser = usersRes?.users?.find(
      (u) => u.email?.toLowerCase() === data.email.toLowerCase(),
    );

    if (!authUser) {
      throw new Error(
        `No account found for "${data.email}". The volunteer must have an existing account first.`,
      );
    }

    // Check if already a volunteer
    const { data: existing } = await supa
      .from("volunteers" as any)
      .select("id")
      .eq("id", authUser.id)
      .maybeSingle();

    if (existing) {
      return { added: false, message: "This person is already a volunteer." };
    }

    // Check if they're an admin (no need to add as volunteer)
    const { data: adminRow } = await supa
      .from("admins")
      .select("id")
      .eq("id", authUser.id)
      .maybeSingle();

    if (adminRow) {
      return { added: false, message: "This person is already an admin — they have scanner access." };
    }

    const { error: insertErr } = await supa
      .from("volunteers" as any)
      .insert({
        id: authUser.id,
        email: data.email.toLowerCase(),
        name: data.name || authUser.user_metadata?.full_name || "",
      } as any);

    if (insertErr) throw insertErr;

    return { added: true, message: `${data.email} added as a volunteer.` };
  });

export const removeVolunteer = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      accessToken: z.string().min(20),
      volunteerId: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    const { supa } = await requireAdmin(data.accessToken);

    const { error } = await supa
      .from("volunteers" as any)
      .delete()
      .eq("id", data.volunteerId);

    if (error) throw error;
    return { removed: true };
  });

/* ── 6. Get All Check-in Statuses (admin-only dashboard) ─── */

export const getAllCheckinStatuses = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string().min(20) }))
  .handler(async ({ data }) => {
    const { supa } = await requireAdmin(data.accessToken);

    // Get all verified participants
    const { data: profiles, error: profErr } = await supa
      .from("profiles")
      .select("user_id, full_name, email, phone, college, pass_code, gender, payment_status")
      .eq("payment_status", "paid")
      .order("full_name", { ascending: true });

    if (profErr) throw profErr;
    if (!profiles || profiles.length === 0) return { statuses: [], summary: { gate_entry: 0, checked_in: 0, meal_1: 0, meal_2: 0, total: 0 } };

    // Get all checkin records
    const { data: checkins } = await supa
      .from("checkins" as any)
      .select("pass_code, gate_entry, checked_in, meal_1, meal_2");

    const checkinMap = new Map<string, any>();
    (checkins || []).forEach((c: any) => {
      checkinMap.set(c.pass_code, c);
    });

    // Get team info for all participants
    const userIds = profiles.map((p) => p.user_id);
    const { data: memberships } = await supa
      .from("team_members")
      .select("user_id, role, teams(name, track)")
      .in("user_id", userIds);

    const teamMap = new Map<string, { teamName: string; track: string; role: string }>();
    (memberships || []).forEach((m: any) => {
      teamMap.set(m.user_id, {
        teamName: m.teams?.name || "",
        track: m.teams?.track || "",
        role: m.role || "",
      });
    });

    let summaryGate = 0, summaryCheckin = 0, summaryMeal1 = 0, summaryMeal2 = 0;

    const statuses = profiles.map((p) => {
      const ci = checkinMap.get(p.pass_code) || {};
      const team = teamMap.get(p.user_id) || { teamName: "", track: "", role: "" };
      const gate = !!ci.gate_entry;
      const checked = !!ci.checked_in;
      const m1 = !!ci.meal_1;
      const m2 = !!ci.meal_2;

      if (gate) summaryGate++;
      if (checked) summaryCheckin++;
      if (m1) summaryMeal1++;
      if (m2) summaryMeal2++;

      return {
        passCode: p.pass_code,
        name: p.full_name || "Unknown",
        email: p.email || "",
        phone: p.phone || "",
        college: p.college || "",
        gender: p.gender || "",
        teamName: team.teamName,
        track: team.track,
        role: team.role,
        gate_entry: gate,
        checked_in: checked,
        meal_1: m1,
        meal_2: m2,
      };
    });

    return {
      statuses,
      summary: {
        gate_entry: summaryGate,
        checked_in: summaryCheckin,
        meal_1: summaryMeal1,
        meal_2: summaryMeal2,
        total: profiles.length,
      },
    };
  });

/* ── Helpers ───────────────────────────────────────────────── */

function actionLabel(action: CheckinAction): string {
  const labels: Record<CheckinAction, string> = {
    gate_entry: "Gate Entry",
    checked_in: "Check-in",
    meal_1: "Meal 1",
    meal_2: "Meal 2",
  };
  return labels[action];
}
