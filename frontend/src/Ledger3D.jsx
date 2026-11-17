import { useEffect, useState } from "react";

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
      const a = window.setTimeout(() => setStep(1), 450);
      const b = window.setTimeout(() => setStep(2), 1300);
      return () => {
        window.clearTimeout(a);
        window.clearTimeout(b);
      };
    }

    const marks = pose === "read" ? [0, 900, 1800] : [0, 1400, 3200];
    const cycle = pose === "read" ? 2800 : 5200;
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
      <div className="folio-stage" aria-hidden="true">
        <div className="folio-glow" />
        <div className="folio-shadow" />
        <div className="folio-book">
          <div className="folio-back">
            <span className="folio-tab" />
          </div>
          <div className="folio-page page-1"><i /><i /><i /></div>
          <div className="folio-page page-2"><i /><i /><i /></div>
          <div className="folio-page page-3"><i /><i /><i /></div>
          <div className="folio-cover">
            <span className="folio-mark" />
          </div>
        </div>
      </div>
      <p className="folio-caption" aria-live="polite">{label}</p>
    </div>
  );
};

export default Ledger3D;
