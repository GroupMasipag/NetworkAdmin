import { useState, useEffect, useRef } from "react";
import {
  Ban,
  Activity,
  Terminal,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  X,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface MitigationModalProps {
  alert: {
    id: number;
    type: string;
    source: string;
    severity: string;
  };
  darkMode: boolean;
  onBack: () => void;
  onClose: () => void;
}

type ActionStatus = "idle" | "loading" | "success" | "error";

interface LogLine {
  ts: string;
  level: "CRITICAL" | "WARN" | "INFO" | "DEBUG";
  msg: string;
}

// ── API helpers ───────────────────────────────────────────────────────────────

// Removed localhost API_BASE - using the live Render URL directly below

async function callMitigateAPI(
  threatId: number,
  payload: object
): Promise<{ success: boolean; message: string; detail: string }> {
  try {
    // 1. Pointing to the specific threat ID route we built in app.py
    const res = await fetch(`https://networkadmin.onrender.com/api/threats/${threatId}/mitigate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
      credentials: 'include'
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || data.message || `HTTP Error ${res.status}`);
    }
    
    return { 
      success: true, 
      message: data.message || "Action completed", 
      detail: data.detail || "" 
    };
  } catch (error: any) {
    console.error("Mitigation API Error:", error);
    throw new Error(error.message || "Failed to connect to backend");
  }
}

async function fetchLogs(alertId: number): Promise<LogLine[]> {
  try {
    const res = await fetch(`https://networkadmin.onrender.com/api/logs/live?alert_id=${alertId}`, {
      signal: AbortSignal.timeout(8000),
      credentials: 'include'
    });
    
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    
    const data = await res.json();
    return data.logs as LogLine[];
  } catch (error) {
    console.error("Log Fetch Error:", error);
    throw new Error("Could not connect to live log stream");
  }
}

// ── Log helpers ───────────────────────────────────────────────────────────────

function logLevelColor(level: string) {
  switch (level.toUpperCase()) {
    case "CRITICAL": return "text-red-400";
    case "WARN":     return "text-yellow-400";
    case "INFO":     return "text-emerald-400";
    default:         return "text-gray-500";
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MitigationModal({
  alert,
  darkMode,
  onBack,
  onClose,
}: MitigationModalProps) {
  const [blockStatus,    setBlockStatus]    = useState<ActionStatus>("idle");
  const [blockResult,    setBlockResult]    = useState("");
  const [throttleStatus, setThrottleStatus] = useState<ActionStatus>("idle");
  const [throttleResult, setThrottleResult] = useState("");
  const [showLogs,       setShowLogs]       = useState(false);
  const [logLines,       setLogLines]       = useState<LogLine[]>([]);
  const [logLoading,     setLogLoading]     = useState(false);
  const [logError,       setLogError]       = useState<string | null>(null);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  // Stream log lines in one-by-one when the terminal opens
  useEffect(() => {
    if (!showLogs) return;
    setLogLoading(true);
    setLogError(null);
    setLogLines([]);
    
    fetchLogs(alert.id)
      .then((lines) => {
        setLogLoading(false);
        if (!lines || lines.length === 0) {
          setLogError("No logs found for this alert in the database.");
          return;
        }
        lines.forEach((line, i) => {
          setTimeout(() => setLogLines((prev) => [...prev, line]), i * 150);
        });
      })
      .catch((err) => {
        setLogLoading(false);
        setLogError(err.message);
      });
  }, [showLogs, alert.id]);

  // Auto-scroll terminal
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logLines]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleBlock = async () => {
    if (blockStatus !== "idle") return;
    setBlockStatus("loading");
    try {
      const result = await callMitigateAPI(alert.id, {
        action: "Block Suspicious IPs" // 3. Pass the specific action text to Python
      });
      setBlockStatus("success");
      setBlockResult(result.message);
      toast.success("IPs Blocked", {
        description: result.message + (result.detail ? ` · ${result.detail}` : ""),
      });

      setTimeout(onClose, 2000);
    } catch (err: any) {
      setBlockStatus("error");
      setBlockResult(err.message);
      toast.error("Block Failed", { description: err.message });
    }
  };

  const handleThrottle = async () => {
    if (throttleStatus !== "idle") return;
    setThrottleStatus("loading");
    try {
      const result = await callMitigateAPI(alert.id, {
        action: "Throttle Inbound Traffic" // 3. Pass the specific action text to Python
      });
      setThrottleStatus("success");
      setThrottleResult(result.message);
      toast.success("Traffic Throttled", {
        description: result.message + (result.detail ? ` · ${result.detail}` : ""),
      });
    } catch (err: any) {
      setThrottleStatus("error");
      setThrottleResult(err.message);
      toast.error("Throttle Failed", { description: err.message });
    }
  };

  // ── Styles ───────────────────────────────────────────────────────────────────

  const card     = darkMode ? "bg-[#0f1f35] border border-blue-900/40" : "bg-gray-50 border border-gray-200";
  const textMain = darkMode ? "text-white"     : "text-gray-900";
  const textSub  = darkMode ? "text-gray-400"  : "text-gray-500";

  function actionBtn(status: ActionStatus, idleColor: string, loadingColor: string) {
    if (status === "success") return "bg-emerald-600/20 text-emerald-400 cursor-default";
    if (status === "error")   return "bg-red-600/20 text-red-400 cursor-default";
    if (status === "loading") return `${loadingColor} text-white cursor-not-allowed opacity-80`;
    return `${idleColor} text-white hover:opacity-90 cursor-pointer`;
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-[60]"
      onClick={onClose}
    >
      <div
        className={`max-w-2xl w-full rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          darkMode ? "bg-[#1a2942]" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
            darkMode ? "border-blue-900/30" : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"
              }`}
              title="Back to alert details"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className={`text-lg font-semibold leading-tight ${textMain}`}>
                Mitigation Console
              </h2>
              <p className={`text-xs ${textSub}`}>
                {alert.type} &middot; Source: {alert.source}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-900/20 text-red-400 text-xs font-medium border border-red-800/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              {alert.severity.toUpperCase()}
            </span>
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Action Cards ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">

          {/* Card 1 – Block IPs */}
          <div
            className={`rounded-lg border-l-4 ${
              blockStatus === "success"
                ? "border-emerald-500"
                : blockStatus === "error"
                ? "border-red-500"
                : "border-red-600"
            } ${card}`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`p-2 rounded-lg mt-0.5 flex-shrink-0 ${
                      blockStatus === "success" ? "bg-emerald-500/10" : "bg-red-500/10"
                    }`}
                  >
                    {blockStatus === "success" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : blockStatus === "error" ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <Ban className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium text-sm ${textMain}`}>Block Suspicious IPs</p>
                    {blockStatus === "success" ? (
                      <p className="text-emerald-400 text-xs mt-0.5">{blockResult}</p>
                    ) : blockStatus === "error" ? (
                      <p className="text-red-400 text-xs mt-0.5">{blockResult}</p>
                    ) : (
                      <p className={`text-xs mt-0.5 ${textSub}`}>
                        Add DROP rules to the firewall for all flagged source addresses.
                        Takes effect on inbound traffic immediately.
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBlock}
                  disabled={blockStatus !== "idle"}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${actionBtn(
                    blockStatus,
                    "bg-red-600",
                    "bg-red-700"
                  )}`}
                >
                  {blockStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                  {blockStatus === "success" && <CheckCircle2 className="w-4 h-4" />}
                  {blockStatus === "idle"    && "Execute Block"}
                  {blockStatus === "loading" && "Blocking…"}
                  {blockStatus === "success" && "Blocked"}
                  {blockStatus === "error"   && "Failed"}
                </button>
              </div>
            </div>
          </div>

          {/* Card 2 – Throttle */}
          <div
            className={`rounded-lg border-l-4 ${
              throttleStatus === "success"
                ? "border-emerald-500"
                : throttleStatus === "error"
                ? "border-red-500"
                : "border-orange-500"
            } ${card}`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`p-2 rounded-lg mt-0.5 flex-shrink-0 ${
                      throttleStatus === "success" ? "bg-emerald-500/10" : "bg-orange-500/10"
                    }`}
                  >
                    {throttleStatus === "success" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : throttleStatus === "error" ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <Activity className="w-5 h-5 text-orange-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium text-sm ${textMain}`}>Throttle Inbound Traffic</p>
                    {throttleStatus === "success" ? (
                      <p className="text-emerald-400 text-xs mt-0.5">{throttleResult}</p>
                    ) : throttleStatus === "error" ? (
                      <p className="text-red-400 text-xs mt-0.5">{throttleResult}</p>
                    ) : (
                      <p className={`text-xs mt-0.5 ${textSub}`}>
                        Apply tc rate-limiting to cap bandwidth from suspicious CIDR ranges.
                        Sets a 10 Mbps ceiling on eth0.
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleThrottle}
                  disabled={throttleStatus !== "idle"}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${actionBtn(
                    throttleStatus,
                    "bg-orange-500",
                    "bg-orange-600"
                  )}`}
                >
                  {throttleStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                  {throttleStatus === "success" && <CheckCircle2 className="w-4 h-4" />}
                  {throttleStatus === "idle"    && "Apply Throttle"}
                  {throttleStatus === "loading" && "Applying…"}
                  {throttleStatus === "success" && "Active"}
                  {throttleStatus === "error"   && "Failed"}
                </button>
              </div>
            </div>
          </div>

          {/* Card 3 – Live Logs */}
          <div className={`rounded-lg border-l-4 border-blue-500 ${card}`}>
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg mt-0.5 flex-shrink-0 bg-blue-500/10">
                    <Terminal className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium text-sm ${textMain}`}>View Live Logs</p>
                    <p className={`text-xs mt-0.5 ${textSub}`}>
                      Stream real-time system and security logs tied to this alert event.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLogs((v) => !v)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    showLogs
                      ? darkMode
                        ? "bg-blue-900/40 text-blue-300"
                        : "bg-blue-100 text-blue-700"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  {showLogs ? "Hide Logs" : "Open Logs"}
                </button>
              </div>

              {/* Terminal window */}
              {showLogs && (
                <div className="mt-4 rounded-lg overflow-hidden border border-blue-900/40 bg-[#080d18]">
                  {/* Traffic-light title bar */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#0d1220] border-b border-blue-900/30">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-500/70" />
                      <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
                    </div>
                    <span className="text-gray-500 text-xs font-mono ml-1.5">
                      masipag-log-stream &mdash; alert #{alert.id}
                    </span>
                  </div>

                  {/* Log body */}
                  <div className="p-3 h-56 overflow-y-auto font-mono text-[11px] leading-5 space-y-0.5">
                    {logLoading && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Connecting to database log stream…</span>
                      </div>
                    )}
                    
                    {logError && (
                      <div className="text-red-400 font-bold p-2 bg-red-900/20 rounded">
                        [ERROR] {logError}
                      </div>
                    )}

                    {logLines.map((line, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-gray-600 flex-shrink-0 select-none">
                          {line.ts || new Date().toISOString().substring(11, 23)}
                        </span>
                        <span
                          className={`flex-shrink-0 min-w-[72px] font-bold ${logLevelColor(line.level)}`}
                        >
                          [{line.level}]
                        </span>
                        <span className="text-gray-300 break-all">{line.msg}</span>
                      </div>
                    ))}

                    {!logLoading && !logError && logLines.length > 0 && (
                      <div className="flex items-center gap-1 pt-0.5">
                        <span className="text-emerald-400">$</span>
                        <span className="w-2 h-3.5 bg-emerald-400 animate-pulse inline-block" />
                      </div>
                    )}

                    <div ref={logEndRef} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div
          className={`flex-shrink-0 px-6 py-3 border-t ${
            darkMode ? "border-blue-900/30" : "border-gray-200"
          }`}
        >
          <button
            type="button"
            onClick={onBack}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              darkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Alert Details
          </button>
        </div>
      </div>
    </div>
  );
}