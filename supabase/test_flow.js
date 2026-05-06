import { createClient } from "@supabase/supabase-js";

// We use the anon key so we are subject to RLS just like the web client!
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

async function testFlow() {
  console.log("--- STARTING END-TO-END BACKEND TEST ---");

  // 1. Create User A (Leader)
  const emailA = `leader_${Date.now()}@hawkins.lab`;
  console.log(`\n1. Registering User A (${emailA})`);
  const { data: userAData, error: userAErr } = await supabase.auth.signUp({
    email: emailA,
    password: "Password123!",
    options: { data: { full_name: "Dustin Henderson" } },
  });
  if (userAErr) throw userAErr;

  // Wait for session to be active, or just use userAData.session
  await supabase.auth.setSession(userAData.session);
  await supabase
    .from("profiles")
    .update({
      full_name: "Dustin Henderson",
      phone: "111-111-1111",
      college: "Hawkins High",
    })
    .eq("user_id", userAData.user.id);
  console.log("   User A registered and profile updated.");

  // 2. User A creates a team
  console.log("\n2. User A creating a team...");
  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .insert({
      name: "Hellfire Club",
      track: "healthcare",
      tagline: "We don't do sports.",
      leader_id: userAData.user.id,
    })
    .select()
    .single();

  if (teamErr) throw teamErr;
  console.log(`   Team created! Name: ${team.name}, Code: ${team.pass_code}`);

  // Check if User A was added to team_members automatically
  const { data: aMembers } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", team.id);
  console.log(`   Team size after creation: ${aMembers.length} (Expected 1)`);
  if (aMembers.length !== 1 || aMembers[0].role !== "leader")
    throw new Error("Leader not in team_members");

  // 3. User A signs out, User B registers
  await supabase.auth.signOut();

  const emailB = `member_${Date.now()}@hawkins.lab`;
  console.log(`\n3. Registering User B (${emailB})`);
  const { data: userBData, error: userBErr } = await supabase.auth.signUp({
    email: emailB,
    password: "Password123!",
    options: { data: { full_name: "Mike Wheeler" } },
  });
  if (userBErr) throw userBErr;

  await supabase.auth.setSession(userBData.session);
  await supabase
    .from("profiles")
    .update({
      full_name: "Mike Wheeler",
      phone: "222-222-2222",
      college: "Hawkins High",
    })
    .eq("user_id", userBData.user.id);
  console.log("   User B registered.");

  // 4. User B joins team via code
  console.log("\n4. User B joining team via code...");
  const { data: joinRes, error: joinErr } = await supabase.rpc(
    "join_team_by_code",
    { p_code: team.pass_code },
  );
  if (joinErr) throw joinErr;
  console.log(`   User B successfully joined team ${joinRes}`);

  // Verify Team Size = 2
  const { data: bMembers } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", team.id);
  console.log(`   Team size now: ${bMembers.length} (Expected 2)`);

  // 5. User B tries to change track (Should Fail because they are not leader)
  console.log(
    "\n5. User B attempting to change track to 'fintech' (Expecting Error)...",
  );
  const { error: bTrackErr } = await supabase.rpc("change_team_track", {
    p_new_track: "fintech",
  });
  console.log(
    bTrackErr
      ? `   Correctly caught error: ${bTrackErr.message}`
      : "   FAILED: User B was able to change track!",
  );

  // 6. User B leaves team
  console.log("\n6. User B leaving the team...");
  const { error: bLeaveErr } = await supabase.rpc("leave_team");
  if (bLeaveErr) throw bLeaveErr;
  console.log("   User B left successfully.");

  // Verify Team Size = 1
  const { data: cMembers } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", team.id);
  console.log(`   Team size after B leaves: ${cMembers.length} (Expected 1)`);

  // 7. User B rejoins to test leadership transfer
  console.log("\n7. User B rejoining to test leadership transfer...");
  await supabase.rpc("join_team_by_code", { p_code: team.pass_code });
  console.log("   User B rejoined.");

  // 8. Sign back in as User A (Leader)
  await supabase.auth.signOut();
  await supabase.auth.signInWithPassword({
    email: emailA,
    password: "Password123!",
  });
  console.log("\n8. Switched back to User A (Leader)");

  // 9. User A changes track
  console.log("\n9. User A changing track to 'healthcare'...");
  const { error: aTrackErr } = await supabase.rpc("change_team_track", {
    p_new_track: "healthcare",
  });
  if (aTrackErr) throw aTrackErr;

  const { data: teamAfterTrack } = await supabase
    .from("teams")
    .select("track")
    .eq("id", team.id)
    .single();
  console.log(`   Track is now: ${teamAfterTrack.track} (Expected healthcare)`);

  // 10. User A transfers leadership to User B
  console.log("\n10. User A transferring leadership to User B...");
  const { error: leaderErr } = await supabase.rpc("change_team_leader", {
    p_new_leader_id: userBData.user.id,
  });
  if (leaderErr) throw leaderErr;
  console.log("   Leadership transferred.");

  // Verify Role in team_members
  const { data: finalMembers } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", userAData.user.id)
    .single();
  console.log(`   User A's new role: ${finalMembers.role} (Expected member)`);

  // 11. User A (now a member) leaves team
  console.log("\n11. User A leaving team...");
  const { error: aLeaveErr } = await supabase.rpc("leave_team");
  if (aLeaveErr) throw aLeaveErr;
  console.log("   User A successfully left.");

  console.log("\n✅ ALL TESTS PASSED SUCCESSFULLY!");
}

testFlow().catch((e) => {
  console.error("❌ TEST FAILED:", e);
});
