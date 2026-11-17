import { useEffect, useState } from "react";
import { Check } from "lucide-react";

/*
 * Three estimate sheets (Excel, PDF, CSV) fan out, a scan line reads each one,
 * and every row receives a mark: within band, check, or act.
 * pose "idle"  : slow loop for the sign in screen
 * pose "read"  : faster loop while a file is being read
 * pose "open"  : one pass that folds the sheets into a finished report
 */
const SHEETS = [
  { kind: "xlsx", label: "XLSX", rows: ["ok", "ok", "bad", "ok", "warn"] },
  { kind: "pdf", label: "PDF", rows: ["ok", "warn", "ok", "ok", "ok"] },
  { kind: "csv", label: "CSV", rows: ["ok", "ok", "ok", "bad", "ok"] },
];

const Ledger3D = ({ captions = [], pose = "idle", success = "" }) => {
  const [step, setStep] = useState(0);
  const reduced = typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    setStep(0);
    if (reduced) {
      setStep(pose === "open" ? 2 : 1);
      return undefined;
    }

    if (pose === "open") {
      const a = window.setTimeout(() => setStep(1), 500);
      const b = window.setTimeout(() => setStep(2), 1400);
      return () => {
        window.clearTimeout(a);
        window.clearTimeout(b);
      };
    }

    const marks = pose === "read" ? [0, 1000, 2000] : [0, 1600, 3600];
    const cycle = pose === "read" ? 3000 : 6000;
    let timers = [];
    const arm = () => {
      timers.forEach((id) => window.clearTimeout(id));
      timers = marks.map((ms, index) => window.setTimeout(() => setStep(index), ms));
    };
    arm();
    const loop = window.setInterval(arm, cycle);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.clearInterval(loop);
    };
  }, [pose, reduced]);

  const label = pose === "open" && step >= 2
    ? (success || captions[2] || captions[0] || "")
    : (captions[step] || captions[0] || "");

  return (
    <div className={`folio pose-${pose}${reduced ? " is-reduced" : ""}`} data-step={step}>
      <div className="stack-stage" aria-hidden="true">
        <div className="stack-glow" />
        <div className="stack-floor" />
        {SHEETS.map((sheet, index) => (
          <div className={`sheet sheet-${index}`} key={sheet.kind} style={{ "--i": index }}>
            <div className="sheet-head">
              <span className={`sheet-kind k-${sheet.kind}`}>{sheet.label}</span>
              <i />
            </div>
            <div className="sheet-rows">
              {sheet.rows.map((tone, row) => (
                <div className="sheet-row" key={row} style={{ "--d": row }}>
                  <i />
                  <b className={`mark ${tone}`} />
                </div>
              ))}
            </div>
            <span className="sheet-beam" />
          </div>
        ))}
        <div className="stack-report">
          <div className="report-lamp"><i /><i /><i /></div>
          <span className="report-tick"><Check size={18} strokeWidth={3} /></span>
          <i className="report-line" />
          <i className="report-line short" />
        </div>
      </div>
      <p className="folio-caption" aria-live="polite">{label}</p>
    </div>
  );
};

export default Ledger3D;
