/**
 * AdminScanner — Reusable QR scanner + check-in action UI.
 * Used in both admin.tsx (Scanner tab) and volunteer.tsx portal.
 * Enhanced with: scan history, quick-action mode, audio feedback, status bar.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  lookupParticipant,
  recordCheckinAction,
  undoCheckinAction,
  resetAllCheckins,
} from "@/lib/checkin";

type Actions = {
  gate_entry: boolean;
  checked_in: boolean;
  meal_1: boolean;
  meal_2: boolean;
};

type ParticipantInfo = {
  name: string;
  email: string;
  phone: string;
  college: string;
  passCode: string;
  gender: string;
  teamName?: string;
  track?: string;
  role?: string;
};

type ScanResult = {
  participant: ParticipantInfo;
  actions: Actions;
  verified: boolean;
  error?: string;
};

type HistoryEntry = {
  id: number;
  name: string;
  passCode: string;
  action: string;
  success: boolean;
  time: string;
};

const ACTION_CONFIG: { key: keyof Actions; label: string; icon: string; color: string; bg: string }[] = [
  { key: "gate_entry", label: "Gate Entry", icon: "🚪", color: "#2563eb", bg: "#eff6ff" },
  { key: "checked_in", label: "Check-in", icon: "✅", color: "#059669", bg: "#f0fdf4" },
  { key: "meal_1", label: "Meal 1", icon: "🍽️", color: "#d97706", bg: "#fffbeb" },
  { key: "meal_2", label: "Meal 2", icon: "🍽️", color: "#7c3aed", bg: "#faf5ff" },
];

let historyCounter = 0;

// Audio feedback using Web Audio API
function playTone(success: boolean) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.12;
    if (success) {
      osc.frequency.value = 880;
      osc.type = "sine";
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
      setTimeout(() => {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        g2.gain.value = 0.12; o2.frequency.value = 1320; o2.type = "sine";
        o2.start(); o2.stop(ctx.currentTime + 0.15);
      }, 100);
    } else {
      osc.frequency.value = 300;
      osc.type = "square";
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {}
}

function vibrateSuccess() { try { navigator?.vibrate?.([100, 50, 100]); } catch {} }
function vibrateError() { try { navigator?.vibrate?.([300]); } catch {} }

export function AdminScanner({ accessToken }: { accessToken: string }) {
  const [mode, setMode] = useState<"scan" | "manual">("manual");
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [looking, setLooking] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [flashState, setFlashState] = useState<"" | "success" | "error">("");
  const [quickAction, setQuickAction] = useState<keyof Actions | "none">("none");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [scanCount, setScanCount] = useState(0);
  const scannerRef = useRef<any>(null);
  const scannerContainerId = "qr-scanner-container";
  const lastScannedRef = useRef<string>("");
  const cooldownRef = useRef<number>(0);

  const lookupFn = useServerFn(lookupParticipant);
  const recordFn = useServerFn(recordCheckinAction);
  const undoFn = useServerFn(undoCheckinAction);
  const resetFn = useServerFn(resetAllCheckins);

  const addHistory = useCallback((name: string, passCode: string, action: string, success: boolean) => {
    const entry: HistoryEntry = {
      id: ++historyCounter,
      name, passCode, action, success,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
    setHistory(prev => [entry, ...prev].slice(0, 15));
    setScanCount(prev => prev + 1);
  }, []);

  const triggerFlash = useCallback((type: "success" | "error") => {
    setFlashState(type);
    setTimeout(() => setFlashState(""), 600);
  }, []);

  const handleLookup = useCallback(
    async (code: string) => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed) return;
      if (trimmed === lastScannedRef.current && Date.now() < cooldownRef.current) return;
      lastScannedRef.current = trimmed;
      cooldownRef.current = Date.now() + 3000;

      setLooking(true);
      try {
        const res = await lookupFn({ data: { accessToken, passCode: trimmed } });
        if (!res.found) {
          toast.error(res.error || "Participant not found.");
          playTone(false); vibrateError(); triggerFlash("error");
          addHistory("Unknown", trimmed, "Lookup", false);
          setResult(null);
        } else if (!res.verified) {
          toast.warning(res.error || "Not verified.");
          playTone(false); vibrateError(); triggerFlash("error");
          addHistory((res.participant as any)?.name || "Unknown", trimmed, "Not Verified", false);
          setResult({ participant: res.participant as ParticipantInfo, actions: { gate_entry: false, checked_in: false, meal_1: false, meal_2: false }, verified: false, error: res.error });
        } else {
          playTone(true); vibrateSuccess(); triggerFlash("success");
          addHistory((res.participant as ParticipantInfo).name, trimmed, "Lookup ✓", true);
          setResult({ participant: res.participant as ParticipantInfo, actions: res.actions!, verified: true });
          // Quick action auto-fire
          if (quickAction !== "none" && res.actions && !res.actions[quickAction]) {
            setTimeout(() => autoFireAction(trimmed, quickAction, res.participant as ParticipantInfo, res.actions!), 300);
          }
        }
      } catch (err: any) {
        toast.error(err?.message || "Lookup failed.");
        playTone(false); vibrateError(); triggerFlash("error");
      } finally {
        setLooking(false);
      }
    },
    [accessToken, lookupFn, quickAction, addHistory, triggerFlash],
  );

  const autoFireAction = async (passCode: string, action: keyof Actions, participant: ParticipantInfo, currentActions: Actions) => {
    if (currentActions[action]) return;
    setActionBusy(action);
    try {
      const res = await recordFn({ data: { accessToken, passCode, action } });
      if (res.alreadyUsed) {
        toast.warning(res.message);
        addHistory(participant.name, passCode, `${ACTION_CONFIG.find(a => a.key === action)?.label} (already)`, false);
      } else {
        toast.success(res.message);
        playTone(true); vibrateSuccess(); triggerFlash("success");
        addHistory(participant.name, passCode, ACTION_CONFIG.find(a => a.key === action)?.label || action, true);
      }
      setResult(prev => prev ? { ...prev, actions: res.actions } : prev);
    } catch (err: any) {
      toast.error(err?.message || "Action failed.");
    } finally {
      setActionBusy(null);
    }
  };

  // Initialize camera scanner
  useEffect(() => {
    if (mode !== "scan") return;
    let html5QrCode: any = null;
    let mounted = true;
    const initScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted) return;
        html5QrCode = new Html5Qrcode(scannerContainerId);
        scannerRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 15, qrbox: { width: 280, height: 280 }, aspectRatio: 1, disableFlip: false },
          (decodedText: string) => {
            let code = decodedText;
            const match = decodedText.match(/\/verify\/([A-Za-z0-9]+)/);
            if (match) code = match[1];
            handleLookup(code);
          },
          () => {},
        );
        if (mounted) setScannerReady(true);
      } catch {
        if (mounted) { toast.error("Camera access denied. Use manual entry."); setMode("manual"); }
      }
    };
    const timeout = setTimeout(initScanner, 200);
    return () => {
      mounted = false;
      clearTimeout(timeout);
      if (html5QrCode) html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
      scannerRef.current = null;
      setScannerReady(false);
    };
  }, [mode, handleLookup]);

  const handleAction = async (action: keyof Actions) => {
    if (!result?.participant || !result.verified) return;
    setActionBusy(action);
    try {
      const res = await recordFn({ data: { accessToken, passCode: result.participant.passCode, action } });
      if (res.alreadyUsed) {
        toast.warning(res.message); playTone(false); vibrateError();
        addHistory(result.participant.name, result.participant.passCode, `${ACTION_CONFIG.find(a => a.key === action)?.label} (dup)`, false);
      } else {
        toast.success(res.message); playTone(true); vibrateSuccess(); triggerFlash("success");
        addHistory(result.participant.name, result.participant.passCode, ACTION_CONFIG.find(a => a.key === action)?.label || action, true);
      }
      setResult(prev => prev ? { ...prev, actions: res.actions } : prev);
    } catch (err: any) { toast.error(err?.message || "Action failed."); }
    finally { setActionBusy(null); }
  };

  const handleUndo = async (action: keyof Actions) => {
    if (!result?.participant) return;
    setActionBusy(`undo-${action}`);
    try {
      const res = await undoFn({ data: { accessToken, passCode: result.participant.passCode, action } });
      toast.success(res.message);
      addHistory(result.participant.name, result.participant.passCode, `Undo ${ACTION_CONFIG.find(a => a.key === action)?.label}`, true);
      setResult(prev => prev ? { ...prev, actions: res.actions } : prev);
    } catch (err: any) { toast.error(err?.message || "Undo failed."); }
    finally { setActionBusy(null); }
  };

  const handleReset = async () => {
    if (!result?.participant) return;
    if (!window.confirm("Reset ALL actions for this participant?")) return;
    setActionBusy("reset");
    try {
      const res = await resetFn({ data: { accessToken, passCode: result.participant.passCode } });
      toast.success(res.message);
      addHistory(result.participant.name, result.participant.passCode, "Reset All", true);
      setResult(prev => prev ? { ...prev, actions: res.actions } : prev);
    } catch (err: any) { toast.error(err?.message || "Reset failed."); }
    finally { setActionBusy(null); }
  };

  const scanNext = () => { setResult(null); setManualCode(""); lastScannedRef.current = ""; cooldownRef.current = 0; };

  const lastEntry = history[0];
  const flashBorder = flashState === "success" ? "2px solid #22c55e" : flashState === "error" ? "2px solid #ef4444" : "1px solid #e5e7eb";

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Status Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", padding: "10px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13 }}>
        <span style={{ fontWeight: 700, color: "#1e293b" }}>📊 Session:</span>
        <span style={{ color: "#2563eb", fontWeight: 600 }}>{scanCount} scans</span>
        {lastEntry && (
          <>
            <span style={{ color: "#cbd5e1" }}>|</span>
            <span style={{ color: lastEntry.success ? "#059669" : "#dc2626" }}>
              Last: {lastEntry.name} — {lastEntry.action} ({lastEntry.time})
            </span>
          </>
        )}
        {quickAction !== "none" && (
          <>
            <span style={{ color: "#cbd5e1" }}>|</span>
            <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 700 }}>
              ⚡ Quick: {ACTION_CONFIG.find(a => a.key === quickAction)?.label}
            </span>
          </>
        )}
      </div>

      {/* Mode + Quick Action Row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 10, padding: 4 }}>
          {(["scan", "manual"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setResult(null); }} style={{ padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: mode === m ? "#fff" : "transparent", color: mode === m ? "#111827" : "#6b7280", boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s" }}>
              {m === "scan" ? "📷 Camera" : "⌨️ Manual"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>⚡ Quick Action:</label>
          <select
            value={quickAction}
            onChange={e => setQuickAction(e.target.value as any)}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, fontWeight: 600, background: "#fff", cursor: "pointer" }}
          >
            <option value="none">Off</option>
            {ACTION_CONFIG.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
          </select>
        </div>
      </div>

      {/* Scanner / Manual Input */}
      {!result && (
        <div style={{ background: "#fff", border: flashBorder, borderRadius: 12, padding: 24, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", transition: "border-color 0.3s" }}>
          {mode === "scan" ? (
            <div>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Point camera at QR code</h3>
              <div id={scannerContainerId} style={{ width: "100%", maxWidth: 400, margin: "0 auto", borderRadius: 12, overflow: "hidden", background: "#000", minHeight: 320 }} />
              {!scannerReady && <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: 12 }}>Starting camera...</p>}
              {looking && <p style={{ textAlign: "center", color: "#2563eb", fontSize: 14, fontWeight: 600, marginTop: 12 }}>Looking up participant...</p>}
              {quickAction !== "none" && (
                <p style={{ textAlign: "center", color: "#7c3aed", fontSize: 12, fontWeight: 600, marginTop: 8 }}>
                  ⚡ Auto-firing "{ACTION_CONFIG.find(a => a.key === quickAction)?.label}" on successful scan
                </p>
              )}
            </div>
          ) : (
            <div>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Enter Pass Code</h3>
              <form onSubmit={e => { e.preventDefault(); handleLookup(manualCode); }} style={{ display: "flex", gap: 10, maxWidth: 400 }}>
                <input type="text" value={manualCode} onChange={e => setManualCode(e.target.value.toUpperCase())} placeholder="e.g. 0042" maxLength={10} autoFocus style={{ flex: 1, padding: "12px 16px", border: "2px solid #d1d5db", borderRadius: 8, fontSize: 20, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.15em", textAlign: "center", outline: "none", transition: "border-color 0.15s" }} onFocus={e => { e.currentTarget.style.borderColor = "#2563eb"; }} onBlur={e => { e.currentTarget.style.borderColor = "#d1d5db"; }} />
                <button type="submit" disabled={looking || !manualCode.trim()} style={{ padding: "12px 24px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontSize: 15, fontWeight: 700, cursor: looking ? "not-allowed" : "pointer", opacity: looking || !manualCode.trim() ? 0.5 : 1 }}>
                  {looking ? "..." : "Lookup"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div style={{ display: "grid", gap: 16 }}>
          {/* Participant Info */}
          <div style={{ background: result.verified ? "#f0fdf4" : "#fef2f2", border: `2px solid ${result.verified ? "#86efac" : "#fecaca"}`, borderRadius: 12, padding: 20, transition: "border-color 0.3s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: result.verified ? "#dcfce7" : "#fee2e2", color: result.verified ? "#166534" : "#991b1b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {result.verified ? "✓ Verified" : "✗ Not Verified"}
                </div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>{result.participant.name}</h2>
                <div style={{ marginTop: 8, display: "grid", gap: 3 }}>
                  {result.participant.teamName && (
                    <p style={{ margin: 0, fontSize: 14, color: "#374151" }}><strong>Team:</strong> {result.participant.teamName}{result.participant.role === "leader" ? " (Leader)" : ""}</p>
                  )}
                  {result.participant.track && (
                    <p style={{ margin: 0, fontSize: 14, color: "#374151" }}><strong>Track:</strong> {result.participant.track.charAt(0).toUpperCase() + result.participant.track.slice(1)}</p>
                  )}
                  <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{result.participant.college}{result.participant.gender ? ` · ${result.participant.gender}` : ""}</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{result.participant.email}{result.participant.phone ? ` · ${result.participant.phone}` : ""}</p>
                </div>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 800, color: result.verified ? "#059669" : "#b91c1c", letterSpacing: "0.1em" }}>
                {result.participant.passCode}
              </div>
            </div>
            {result.error && (
              <div style={{ marginTop: 12, padding: "8px 12px", background: "#fef3c7", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#92400e" }}>
                ⚠ {result.error}
              </div>
            )}
          </div>

          {/* Status Summary Strip */}
          {result.verified && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {ACTION_CONFIG.map(({ key, label, icon, color, bg }) => (
                <div key={key} style={{ textAlign: "center", padding: "8px 4px", borderRadius: 8, background: result.actions[key] ? bg : "#f9fafb", border: `1px solid ${result.actions[key] ? color : "#e5e7eb"}40`, transition: "all 0.2s" }}>
                  <div style={{ fontSize: 18 }}>{result.actions[key] ? "✓" : icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: result.actions[key] ? color : "#9ca3af", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons — only if verified */}
          {result.verified && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Actions</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {ACTION_CONFIG.map(({ key, label, icon, color }) => {
                  const used = result.actions[key];
                  const isBusy = actionBusy === key || actionBusy === `undo-${key}`;
                  return (
                    <div key={key} style={{ border: `2px solid ${used ? "#e5e7eb" : color}`, borderRadius: 10, overflow: "hidden", transition: "all 0.15s" }}>
                      <button onClick={() => (used ? handleUndo(key) : handleAction(key))} disabled={isBusy} style={{ width: "100%", padding: "16px 12px", border: "none", background: used ? "#f9fafb" : color, color: used ? "#6b7280" : "#fff", cursor: isBusy ? "not-allowed" : "pointer", fontSize: 15, fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 0.15s", opacity: isBusy ? 0.6 : 1 }}>
                        <span style={{ fontSize: 24 }}>{used ? "✓" : icon}</span>
                        <span>{label}</span>
                        {used && <span style={{ fontSize: 10, fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>{isBusy ? "Undoing..." : "Tap to undo"}</span>}
                        {!used && isBusy && <span style={{ fontSize: 10 }}>Recording...</span>}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
                <button onClick={handleReset} disabled={actionBusy === "reset" || (!result.actions.gate_entry && !result.actions.checked_in && !result.actions.meal_1 && !result.actions.meal_2)} style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid #fecaca", background: "#fef2f2", color: "#b91c1c", cursor: "pointer", fontSize: 12, fontWeight: 600, opacity: (!result.actions.gate_entry && !result.actions.checked_in && !result.actions.meal_1 && !result.actions.meal_2) ? 0.4 : 1 }}>
                  {actionBusy === "reset" ? "Resetting..." : "🔄 Reset All"}
                </button>
              </div>
            </div>
          )}

          {/* Scan Next */}
          <button onClick={scanNext} style={{ padding: "14px 24px", borderRadius: 10, border: "2px solid #2563eb", background: "#eff6ff", color: "#1d4ed8", cursor: "pointer", fontSize: 16, fontWeight: 700, transition: "all 0.15s" }}>
            📷 Scan Next Participant
          </button>
        </div>
      )}

      {/* Scan History */}
      {history.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#374151" }}>📋 Scan History</h3>
            <button onClick={() => setHistory([])} style={{ padding: "3px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb", fontSize: 11, cursor: "pointer", color: "#6b7280" }}>Clear</button>
          </div>
          <div style={{ maxHeight: 240, overflow: "auto", display: "grid", gap: 4 }}>
            {history.map(h => (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", borderRadius: 6, background: h.success ? "#f0fdf4" : "#fef2f2", fontSize: 12 }}>
                <span style={{ fontSize: 14 }}>{h.success ? "✅" : "❌"}</span>
                <span style={{ flex: 1, fontWeight: 600, color: "#1f2937" }}>{h.name}</span>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>{h.passCode}</span>
                <span style={{ color: "#6b7280" }}>{h.action}</span>
                <span style={{ color: "#9ca3af", fontSize: 11 }}>{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
