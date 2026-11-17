import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  CircleHelp,
  Cpu,
  Database,
  Download,
  FileText,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Ban,
  ScanText,
  Upload,
  UserCheck,
  X,
  FileSpreadsheet,
  FolderKanban,
  GitCompare,
  LogOut,
  Mail,
  Settings,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { copy, money, signed } from "./copy.js";
import { DEMO, currentUser, login, logout, renameUser, signup } from "./auth.js";
import Ledger3D from "./Ledger3D.jsx";
import { PRICE_BOOK, SAMPLES, importNormPrices, listNorms, referenceRate, resetAllNorms, scopeMissing } from "./engine/catalog.js";
import { SOURCES, WAGE_RATES } from "./engine/sources.js";
import catalogue from "./engine/desn-catalogue.json";
import arxkomSmeta from "./engine/arxkom-smeta.json";
import { rateParts } from "./engine/pricing.js";
import { BASE_YEARS, DEFAULT_PREFS, OVERS, SEVERES, THEMES, UNDERS, YEARS, applyTheme, readPrefs, savePrefs } from "./engine/prefs.js";
import {
  clearUploads,
  compareBoard,
  confirmLine,
  decide,
  dedupeProjects,
  downloadBlob,
  extractedRows,
  hasFile,
  openProject,
  removeProject,
  reportCsv,
  resetSample,
  setGap,
  snapshot,
  uploadProject,
} from "./engine/store.js";

const toast = (message) => {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("smeta-toast", { detail: message }));
};

const Toaster = () => {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const onToast = (event) => {
      const id = Date.now() + Math.random();
      setItems((list) => [...list.slice(-2), { id, message: event.detail }]);
      window.setTimeout(() => setItems((list) => list.filter((item) => item.id !== id)), 2600);
    };
    window.addEventListener("smeta-toast", onToast);
    return () => window.removeEventListener("smeta-toast", onToast);
  }, []);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((item) => (
        <div className="toast" key={item.id}><Check size={14} strokeWidth={3} /> {item.message}</div>
      ))}
    </div>
  );
};

const pct = (value) => (Number(value) < 0 ? `−${Math.abs(Number(value))}%` : `${value}%`);

const Amount = ({ value }) => (
  <span className="amt">{money(value)}<small>AZN</small></span>
);

const TrafficLight = ({ light }) => (
  <div className={`signal ${light}`} aria-hidden="true">
    <i className="r" /><i className="a" /><i className="g" />
  </div>
);

const greeting = (lang) => {
  const hour = new Date().getHours();
  if (lang === "az") return hour < 12 ? "Sabahınız xeyir" : hour < 18 ? "Günortanız xeyir" : "Axşamınız xeyir";
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
};

const codeClass = (light) => (light === "red" ? "s1" : light === "amber" ? "s2" : "s3");

const CodeMark = ({ light, text }) => (
  <span className={`code-mark ${codeClass(light)}`}>{text.light[light]}</span>
);

const Brand = ({ onDark = false, hint }) => (
  <div className={`brand${onDark ? " on-dark" : ""}`}>
    <img src="/abb-mark.png" alt="" />
    <div>
      <strong>ABB</strong>
      <span>{hint}</span>
    </div>
  </div>
);

const Loader = ({ lang }) => (
  <div className="loader">
    <div className="loader-stage">
      <Brand onDark hint={copy[lang].product} />
      <Ledger3D pose="read" captions={copy[lang].readingSteps} />
    </div>
  </div>
);

const LANG_KEY = "smeta.lang";
const readLang = () => (localStorage.getItem(LANG_KEY) === "az" ? "az" : "en");

const Auth = ({ mode, lang, onMode, onEnter, onDone }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const creating = mode === "signup";
  const text = copy[lang].auth;

  const finish = async (session) => {
    setAccepted(true);
    onEnter(session);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!motion) await new Promise((resolve) => { window.setTimeout(resolve, 2200); });
    onDone();
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const session = creating ? await signup({ name, email, password }) : await login({ email, password });
      await finish(session);
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      const known = { exists: text.errExists, mismatch: text.errMatch };
      setError(known[code] || text.errGeneric);
      setBusy(false);
    }
  };

  return (
    <div className={`login${accepted ? " is-open" : ""}`}>
      <div className="login-shell">
        <section className={`login-art${accepted ? " is-open" : ""}`}>
          <Brand onDark hint={copy[lang].product} />
          {accepted ? null : (
            <div className="login-pitch">
              <h1>{copy[lang].loginHead}</h1>
              <ul>
                {copy[lang].principles.map((item) => (
                  <li key={item}><span><Check size={12} strokeWidth={3} /></span>{item}</li>
                ))}
              </ul>
            </div>
          )}
          <Ledger3D captions={copy[lang].scene} pose={accepted ? "open" : "idle"} success={text.opened} />
          {accepted ? null : <p className="login-art-foot">{copy[lang].independent}</p>}
        </section>
        <section className="login-form">
          <div key={mode} className="auth-panel">
            <div>
              <h2>{creating ? text.create : text.signIn}</h2>
              {creating ? <p className="lede">{text.createLead}</p> : null}
            </div>
            <form className="form" onSubmit={submit}>
              {error ? <div className="banner" role="alert">{error}</div> : null}
              {creating ? (
                <label className="field">
                  <span>{text.name}</span>
                  <input className="input" required value={name} onChange={(event) => setName(event.target.value)} placeholder={text.namePh} />
                </label>
              ) : null}
              <label className="field">
                <span>{text.email}</span>
                <div className="input-group">
                  <Mail size={15} />
                  <input className="input" type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" />
                </div>
              </label>
              {(
                <label className="field">
                  <span>{text.password}</span>
                  <div className="password-wrap">
                    <input className="input" type={show ? "text" : "password"} required minLength={creating ? 8 : 1} autoComplete={creating ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={text.passwordPh} />
                    <button type="button" onClick={() => setShow((value) => !value)}>{show ? text.hide : text.show}</button>
                  </div>
                </label>
              )}
              {creating ? null : (
                <button
                  type="button"
                  className="demo-link"
                  onClick={() => {
                    setError("");
                    setEmail(DEMO.email);
                    setPassword(DEMO.password);
                    login(DEMO).then(finish).catch(() => setError(text.errGeneric));
                  }}
                >
                  {text.demo}
                  <span>{DEMO.email}</span>
                </button>
              )}
              <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
                {busy ? <span className="spinner" /> : null}
                {busy ? text.wait : creating ? text.create : text.signIn}
                {busy ? null : <ArrowRight size={16} />}
              </button>
            </form>
            <p className="switch-auth">
              {creating ? `${text.haveAccount} ` : `${text.newHere} `}
              <button type="button" onClick={() => onMode(creating ? "login" : "signup")}>
                {creating ? text.signIn : text.create}
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

const Deviation = ({ value, flag }) => {
  if (flag === "gap" || value === null || value === undefined) return <span className="muted" />;
  const number = Number(value);
  const width = `${(Math.min(Math.abs(number), 40) / 40) * 50}%`;
  const tone = Math.abs(number) <= 5 ? "ok" : number < 0 ? "neg" : "pos";
  return (
    <span className="dev">
      <span className="dev-track" aria-hidden="true">
        <span className={`dev-fill ${tone}`} style={{ width }} />
      </span>
      {signed(value)}
    </span>
  );
};

const needsPerson = (line) => line.match === "needs_review" || line.flag === "unit";

const FILTERS = {
  all: () => true,
  under: (line) => line.flag === "under",
  over: (line) => line.flag === "over",
  gap: (line) => line.flag === "gap",
  arithmetic: (line) => line.flag === "arithmetic",
  unmatched: (line) => line.match === "needs_review" && !line.coded && Number(line.confidence) < 0.5,
  wait: needsPerson,
};

const StatusCell = ({ line, text, onGap }) => (
  <div className="status-cell">
    <span className={`tag tag-${line.flag}`}>{text.flags[line.flag]}</span>
    {line.gap ? (
      <div className="pair" role="group" aria-label={text.flags.gap}>
        <button type="button" className={line.included ? "on" : ""} onClick={() => onGap(true)}>{text.required}</button>
        <button type="button" className={!line.included ? "on" : ""} onClick={() => onGap(false)}>{text.notNeeded}</button>
      </div>
    ) : null}
  </div>
);

const FileProgress = ({ review, text, waiting }) => {
  const total = review.lines.length;
  const matched = review.lines.filter((line) => line.match === "confirmed").length;
  const flagged = review.lines.filter((line) => line.flag && line.flag !== "close").length + (review.scope?.length || 0);
  const choice = review.decision?.choice;
  const steps = [
    { label: text.progress[0], value: `${total} ${text.linesRead}`, done: total > 0 },
    { label: text.progress[1], value: `${matched} ${text.matchedOf} ${total}`, done: waiting === 0 },
    { label: text.progress[2], value: `${flagged} ${text.flagged}`, done: waiting === 0 },
    { label: text.progress[3], value: choice ? text.decided[choice] : text.pending, done: Boolean(choice) },
  ];
  const current = steps.findIndex((step) => !step.done);
  const hint = waiting ? text.nextConfirm(waiting) : choice ? text.nextExport : text.nextDecide;
  return (
    <section className="progress-card">
      <ol className="progress">
        {steps.map((step, index) => (
          <li key={step.label} className={step.done ? "done" : index === current ? "now" : ""}>
            <span className="dot">{step.done ? <Check size={12} strokeWidth={3} /> : index + 1}</span>
            <div>
              <b>{step.label}</b>
              <small>{step.value}</small>
            </div>
          </li>
        ))}
      </ol>
      <p className="next-hint"><span className="eyebrow">{text.nextStep}</span>{hint}</p>
    </section>
  );
};

const Review = ({ lang, review, setReview }) => {
  const text = copy[lang];
  const [note, setNote] = useState(review.decision?.note || "");
  const [codes, setCodes] = useState({});
  const [focus, setFocus] = useState("all");
  const name = (line) => (lang === "az" ? line.name_az : line.name_en);
  const actor = currentUser()?.name || "";
  const section = (line) => (lang === "az" ? line.section_az : line.section_en);
  const waiting = review.lines.filter((line) => line.match === "needs_review").length;
  const apply = (next) => { if (next) setReview(next); };
  const scope = review.scope || [];
  const count = (id) => review.lines.filter(FILTERS[id]).length + (id === "gap" ? scope.length : 0);
  const visible = review.lines.filter(FILTERS[focus]);
  const showScope = (focus === "all" || focus === "gap") && scope.length > 0;
  const choice = review.decision?.choice;
  const exportPdf = async () => {
    const { downloadReportPdf } = await import("./engine/reportPdf.js");
    await downloadReportPdf(review, lang);
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>{lang === "az" ? review.title_az : review.title_en}</h1>
          <p>{review.lines.length} {text.lines}{waiting ? `, ${waiting} ${text.waitingShort}` : ""}, {text.indexShort} × {Number(review.index_factor).toFixed(4)}</p>
        </div>
        <div className="head-actions">
          {review.source === "sample" ? (
            <button type="button" className="btn btn-ghost" onClick={() => apply(resetSample())}>{text.reset}</button>
          ) : null}
          <button type="button" className="btn btn-ghost" onClick={() => downloadBlob(`${review.title_en.replace(/\.(csv|txt|xlsx?|xlsm|pdf|docx?)$/i, "")} check.csv`, reportCsv(review.id), "text/csv")}>
            <Download size={15} /> {text.exportTable}
          </button>
          <button type="button" className={`btn ${choice ? "btn-primary" : "btn-ghost"}`} onClick={exportPdf}>
            <FileText size={15} /> {text.exportReport}
          </button>
        </div>
      </header>

      <FileProgress review={review} text={text} waiting={waiting} />

      <section className="score">
        <div className="score-side">
          <TrafficLight light={review.score.light} />
          <div>
            <div className="eyebrow">{text.codeLabel}</div>
            <strong className={`score-code ${codeClass(review.score.light)}`}>{text.light[review.score.light]}</strong>
            <span>{text.lightNote[review.score.light]}</span>
          </div>
        </div>
        <div className="score-copy">
          <div className="eyebrow">{text.sample}</div>
          <h2>{lang === "az" ? review.score.sentence_az : review.score.sentence_en}</h2>
          {waiting ? <p className="wait">{text.waiting}</p> : null}
        </div>
        <div className="metrics">
          <div className="metric"><span>{text.contractor}</span><b><Amount value={review.score.contractor_total} /></b></div>
          <div className="metric"><span>{text.reference}</span><b><Amount value={review.score.reference_total} /></b></div>
          <div className="metric"><span>{text.difference}</span><b className={Number(review.score.deviation_pct) < 0 ? "risk-red" : ""}>{signed(review.score.deviation_pct)}</b></div>
        </div>
      </section>

      <section className="build">
        <div><span>{text.wage}</span><b>{money(review.score.parts?.wage)}</b></div>
        <div><span>{text.machine}</span><b>{money(review.score.parts?.machine)}</b></div>
        <div><span>{text.material}</span><b>{money(review.score.parts?.material)}</b></div>
        <div><span>{text.overhead}</span><b>{money(review.score.parts?.overhead)}</b></div>
        <div><span>{text.profit}</span><b>{money(review.score.parts?.profit)}</b></div>
      </section>

      <div className="table-card wide">
        <div className="table-head">
          <h2>{text.lineItems}</h2>
          <div className="seg block wrap filters">
            {[
              ["all", text.focusAll],
              ["under", text.issues.under],
              ["over", text.issues.over],
              ["gap", text.flags.gap],
              ["arithmetic", text.issues.arithmetic],
              ["unmatched", text.focusUnmatched],
              ["wait", text.focusWait],
            ].map(([id, label]) => {
              const n = count(id);
              if (id !== "all" && !n) return null;
              return (
                <button key={id} type="button" className={focus === id ? "on" : ""} onClick={() => setFocus(id)}>
                  {label} <em>{n}</em>
                </button>
              );
            })}
          </div>
        </div>
        <table className="lines-table">
          <colgroup>
            <col style={{ width: "31%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "18%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>{text.work}</th>
              <th>{text.unit}</th>
              <th className="num">{text.qty}</th>
              <th className="num">{text.theirRate}</th>
              <th className="num">{text.refRate}</th>
              <th className="num">{text.deviation}</th>
              <th>{text.status}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((line, index, list) => {
              const previous = list[index - 1];
              const showSection = !previous || previous.section_az !== line.section_az;
              return (
                <Fragment key={line.id}>
                  {showSection ? (
                    <tr className="section">
                      <td colSpan={7}>{section(line)}</td>
                    </tr>
                  ) : null}
                  <tr className={`${line.included ? "" : "out"}${line.match === "needs_review" ? " needs" : ""}`}>
                    <td>
                      <span className="code">{line.code}</span>
                      <span className="work-name">{name(line)}</span>
                      {line.desn ? <span className="desn-ref">{line.desn.code}, {line.desn.title}</span> : null}
                      {line.unit_clash ? <span className="desn-ref">{line.unit} / {line.ref_unit}</span> : null}
                      {line.gap ? <span className="row-note">{text.missingRow}</span> : null}
                      {line.confirmed_by ? <span className="row-note ok"><Check size={12} /> {line.confirmed_by}</span> : null}
                      {line.match === "needs_review" ? (
                        <div className="match-fix">
                          <small>{text.confirmHint}{Number(line.confidence) > 0 && Number(line.confidence) < 1 ? <b className="conf">{text.confidence(Math.round(Number(line.confidence) * 100))}</b> : null}</small>
                          <div>
                            <select value={codes[line.id] || line.code} onChange={(event) => setCodes({ ...codes, [line.id]: event.target.value })} aria-label={text.suggested}>
                              {review.norm_choices.map((option) => (
                                <option key={option.code} value={option.code}>
                                  {option.code} {lang === "az" ? option.name_az : option.name_en}
                                </option>
                              ))}
                            </select>
                            <button type="button" className="btn btn-soft" onClick={() => { apply(confirmLine(line.id, codes[line.id] || line.code, review.id, actor)); toast(text.toastConfirmed); }}>
                              <Check size={14} /> {text.confirm}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </td>
                    <td>{line.unit}</td>
                    <td className="num">{line.qty}</td>
                    <td className="num">{line.gap ? <span className="muted">0.00</span> : money(line.contractor_rate)}</td>
                    <td className="num">{money(line.reference_rate)}</td>
                    <td className="num"><Deviation value={line.deviation_pct} flag={line.flag} /></td>
                    <td><StatusCell line={line} text={text} onGap={(required) => apply(setGap(line.id, required, review.id))} /></td>
                  </tr>
                </Fragment>
              );
            })}
            {showScope ? (
              <>
                <tr className="section">
                  <td colSpan={7}>{text.scopeTitle}</td>
                </tr>
                {scope.map((item) => (
                  <tr key={`scope-${item.code}`} className="scope-row">
                    <td>
                      <span className="code">{item.code}</span>
                      <span className="work-name">{lang === "az" ? item.name_az : item.name_en}</span>
                      <span className="row-note">{text.scopeRow}</span>
                    </td>
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                    <td><div className="status-cell"><span className="tag tag-gap">{text.flags.gap}</span></div></td>
                  </tr>
                ))}
              </>
            ) : null}
            {!visible.length && !showScope ? (
              <tr><td colSpan={7} className="empty-row">{text.noLines}</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <section className="decision">
        <div className="decision-copy">
          <h2>{text.decisionTitle}</h2>
          <p>{text.decisionNote}</p>
          {review.decision ? (
            <p className="saved">
              <Check size={14} /> {text.decided[review.decision.choice] || review.decision.choice}
              {review.decision.by ? `, ${review.decision.by}` : ""}
              {review.decision.at ? `, ${new Date(review.decision.at).toLocaleString(lang === "az" ? "az-AZ" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}` : ""}
            </p>
          ) : null}
        </div>
        <div className="decision-form">
          <label htmlFor="note">{text.note}</label>
          <textarea id="note" rows={2} value={note} placeholder={text.notePh} onChange={(event) => setNote(event.target.value)} />
          {waiting ? <p className="warn-line">{text.unconfirmedWarn(waiting)}</p> : null}
          <div className="decision-buttons">
            <button type="button" className={`choice c-accept${choice === "accept" ? " on" : ""}`} onClick={() => { apply(decide("accept", note, review.id, actor)); toast(text.toastDecided); }}>
              <Check size={15} /> {text.accept}
            </button>
            <button type="button" className={`choice c-query${choice === "query" ? " on" : ""}`} onClick={() => { apply(decide("query", note, review.id, actor)); toast(text.toastDecided); }}>
              <MessageSquare size={15} /> {text.query}
            </button>
            <button type="button" className={`choice c-reject${choice === "reject" ? " on" : ""}`} onClick={() => { apply(decide("reject", note, review.id, actor)); toast(text.toastDecided); }}>
              <Ban size={15} /> {text.reject}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const fileKind = (item) => {
  const name = String(item.title_en || "").toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop() : "";
  if (["csv", "xlsx", "xls", "pdf", "docx", "txt"].includes(ext)) return ext === "xls" ? "xlsx" : ext;
  return "set";
};

const KindBadge = ({ item }) => {
  const kind = fileKind(item);
  return <span className={`kind-badge k-${kind}`}>{kind === "set" ? "FHN" : kind.toUpperCase()}</span>;
};

const DecisionPill = ({ choice, text }) => (
  <span className={`decision-pill d-${choice || "none"}`}>{text.decided[choice] || text.decided.none}</span>
);

const Tenders = ({ lang, review, onOpen, onUpload, onRemove, onClear }) => {
  const text = copy[lang];
  const [reading, setReading] = useState(false);
  const [readingName, setReadingName] = useState("");
  const [fileError, setFileError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [filter, setFilter] = useState("all");
  const [asking, setAsking] = useState("");
  const fileRef = useRef(null);
  const projects = review.projects || [];
  const uploads = projects.filter((item) => item.source === "upload").length;
  const openCount = projects.filter((item) => !item.decision).length;
  const shown = projects.filter((item) => {
    if (filter === "open") return !item.decision;
    if (filter === "done") return Boolean(item.decision);
    return true;
  });

  const takeBytes = async (filename, bytes) => {
    setFileError("");
    setReadingName(filename);
    setReading(true);
    try {
      await onUpload({ filename, bytes });
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Could not read the file");
      setReading(false);
    }
  };

  const takeFile = async (file) => {
    if (!file) return;
    const buffer = await file.arrayBuffer();
    await takeBytes(file.name, new Uint8Array(buffer));
  };

  const pick = () => { if (!reading) fileRef.current?.click(); };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>{text.tendersTitle}</h1>
          <p>{projects.length} {text.journeyFiles}, {openCount} {text.filterOpen.toLowerCase()}</p>
        </div>
        <div className="head-actions">
          {uploads ? (
            <button
              type="button"
              className={`btn ${asking === "all" ? "btn-danger" : "btn-ghost"}`}
              onBlur={() => setAsking("")}
              onClick={() => { if (asking === "all") { setAsking(""); onClear(); } else setAsking("all"); }}
            >
              <Trash2 size={15} /> {asking === "all" ? text.removeAsk : text.clearUploads}
            </button>
          ) : null}
        </div>
      </header>
      <input
        ref={fileRef}
        className="file-input"
        type="file"
        accept=".csv,.txt,.xlsx,.pdf,.docx,text/csv,text/plain,application/pdf"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          takeFile(file);
        }}
      />
      {reading ? createPortal(
        <div className="read-stage" role="status">
          <Brand onDark hint={copy[lang].product} />
          {readingName ? <p className="read-name"><FileText size={14} /> {readingName}</p> : null}
          <Ledger3D pose="read" captions={copy[lang].readingSteps} />
        </div>,
        document.body,
      ) : null}

      <section className="upload">
        <div
          className={`upload-drop${dragOver ? " is-over" : ""}`}
          role="button"
          tabIndex={0}
          onClick={pick}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); pick(); } }}
          onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            takeFile(event.dataTransfer.files?.[0]);
          }}
        >
          <div className="upload-art" aria-hidden="true">
            <span className="mini k-xlsx">XLSX</span>
            <span className="mini k-pdf">PDF</span>
            <span className="mini k-csv">CSV</span>
            <span className="upload-arrow"><Upload size={18} /></span>
          </div>
          <strong>{reading ? text.reading : text.dropTitle}</strong>
          <p>{text.dropHelp}</p>
          <span className="btn btn-primary upload-btn"><FileSpreadsheet size={15} /> {text.browse}</span>
          <div className="format-row">
            {text.formats.map((format) => <span key={format}>{format}</span>)}
          </div>
          {fileError ? <div className="banner" role="alert">{fileError}</div> : null}
          <p className="privacy"><Lock size={13} /> {text.privacy}</p>
        </div>
        <aside className="upload-help">
          <h2>{text.fileNeeds}</h2>
          <ol className="column-list">
            {text.columns.map((name) => (
              <li key={name}><b>{name}</b></li>
            ))}
          </ol>
          <p className="help-note">{text.fileNeedsNote}</p>
          <a className="btn btn-ghost" href={SAMPLES[0].file} download={SAMPLES[0].filename}>
            <Download size={15} /> {text.template}
          </a>
        </aside>
      </section>

      <div className="list-head">
        <div className="seg block wrap">
          {[
            ["all", text.filterAll, projects.length],
            ["open", text.filterOpen, openCount],
            ["done", text.filterDone, projects.length - openCount],
          ].map(([id, label, count]) => (
            <button key={id} type="button" className={filter === id ? "on" : ""} onClick={() => setFilter(id)}>
              {label} <em>{count}</em>
            </button>
          ))}
        </div>
      </div>

      {shown.length ? (
        <div className="project-grid">
          {shown.map((item) => (
            <div className={`card tender-card l-${item.light}`} key={item.id} onMouseLeave={() => { if (asking === item.id) setAsking(""); }}>
              <button type="button" className="tender-open" onClick={() => onOpen(item.id, "review")}>
                <div className="tender-top">
                  <KindBadge item={item} />
                  <div className="tender-name">
                    <h3 title={lang === "az" ? item.title_az : item.title_en}>{lang === "az" ? item.title_az : item.title_en}</h3>
                    <p>{item.lines} {text.lines}{item.waiting ? `, ${item.waiting} ${text.waitingShort}` : ""}</p>
                  </div>
                </div>
                <div className="tender-figure">
                  <div>
                    <strong>{item.deviation_pct == null ? "0.0%" : signed(item.deviation_pct)}</strong>
                    <small>{text.vsReference}</small>
                  </div>
                  <span className={`code-pill ${codeClass(item.light)}`}>{text.light[item.light]} {text.lightNote[item.light]}</span>
                </div>
                <div className="reasons">
                  {[
                    ["under", item.issues?.under],
                    ["arithmetic", item.issues?.arithmetic],
                    ["gap", item.issues?.gap],
                    ["over", item.issues?.over],
                  ].filter(([, n]) => n).map(([key, n]) => (
                    <span key={key} className={`reason r-${key}`}><i />{n} {n === 1 && text.reasonsOne?.[key] ? text.reasonsOne[key] : text.reasons[key]}</span>
                  ))}
                  {!item.issues?.under && !item.issues?.arithmetic && !item.issues?.gap && !item.issues?.over
                    ? <span className="reason r-clean"><i />{text.reasons.clean}</span> : null}
                </div>
                {item.decision ? <div className="tender-foot"><DecisionPill choice={item.decision} text={text} /></div> : null}
              </button>
              <div className="tender-actions">
                <button type="button" onClick={() => onOpen(item.id, "review")}><ShieldCheck size={14} /> {text.nav.review}</button>
                <button type="button" onClick={() => onOpen(item.id, "compare")}><GitCompare size={14} /> {text.nav.compare}</button>
              </div>
              {item.id !== "sample" ? (
                <button
                  type="button"
                  className={`tender-remove${asking === item.id ? " ask" : ""}`}
                  aria-label={text.removeProject}
                  onBlur={() => setAsking("")}
                  onClick={() => { if (asking === item.id) { setAsking(""); onRemove(item.id); } else setAsking(item.id); }}
                >
                  <Trash2 size={14} />{asking === item.id ? <span>{text.removeAsk}</span> : null}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : <div className="empty">{text.noFiles}</div>}
    </div>
  );
};

const Choice = ({ value, options, format, onPick }) => (
  <div className={`seg block n${options.length}`}>
    {options.map((option) => (
      <button key={option} type="button" className={String(value) === String(option) ? "on" : ""} onClick={() => onPick(option)}>
        {format(option)}
      </button>
    ))}
  </div>
);

const IndexPanel = ({ text, prefs, applyPrefs }) => {
  const [rate, setRate] = useState(String(prefs.annualIndex));
  const save = () => {
    applyPrefs({ annualIndex: Number(String(rate).replace(",", ".")) || 0 });
    toast(text.indexSaved);
  };
  const years = prefs.tenderYear - prefs.baseYear;
  return (
    <section className="card settings-panel">
      <h2>{text.indexTitle}</h2>
      <div className="setting-row">
        <span>{text.baseYear}</span>
        <select className="select" value={prefs.baseYear} onChange={(event) => applyPrefs({ baseYear: Number(event.target.value) })}>
          {BASE_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
      </div>
      <div className="setting-row">
        <span>{text.tenderYear}</span>
        <select className="select" value={prefs.tenderYear} onChange={(event) => applyPrefs({ tenderYear: Number(event.target.value) })}>
          {YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
      </div>
      <div className="setting-row">
        <span>{text.annualIndex}</span>
        <form className="rate-input" onSubmit={(event) => { event.preventDefault(); save(); }}>
          <input className="input" inputMode="decimal" value={rate} onChange={(event) => setRate(event.target.value)} onBlur={save} aria-label={text.annualIndex} />
          <em>% / {text.perYear}</em>
        </form>
      </div>
      <div className="setting-row">
        <span>{text.indexResult}</span>
        <div className="index-result">
          <b>× {prefs.index.toFixed(4)}</b>
          <small>(1 + {prefs.annualIndex}%) ^ {years}</small>
        </div>
      </div>
      <p className="setting-note">{text.indexNote}</p>
    </section>
  );
};

const SettingsPage = ({ lang, setLang, user, setUser, onLogout, setReview }) => {
  const text = copy[lang];
  const prefs = readPrefs();
  const [name, setName] = useState(user.name);
  const [priceNote, setPriceNote] = useState("");
  const priceRef = useRef(null);
  const initials = user.name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SY";

  const applyPrefs = (patch) => {
    savePrefs(patch);
    setReview(snapshot());
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>{text.settingsTitle}</h1>
        </div>
      </header>
      <div className="settings-stack">
        <section className="card settings-panel">
          <div className="account-top">
            <span className="avatar person">{initials}</span>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
            <button type="button" className="btn btn-ghost" onClick={onLogout}><LogOut size={15} /> {text.signOut}</button>
          </div>
          <form
            className="name-row"
            onSubmit={(event) => {
              event.preventDefault();
              const next = renameUser(name);
              if (next) { setUser(next); toast(text.toastNamed); }
            }}
          >
            <input className="input" aria-label={text.auth.name} value={name} onChange={(event) => setName(event.target.value)} />
            <button type="submit" className="btn btn-primary">{text.saveName}</button>
          </form>
        </section>
        <section className="card settings-panel">
          <h2>{text.platform}</h2>
          <div className="setting-row">
            <span>{text.appearance}</span>
            <Choice
              value={prefs.theme === "dark" ? "dark" : "light"}
              options={THEMES}
              format={(value) => (value === "dark" ? text.themeDark : text.themeLight)}
              onPick={(theme) => applyPrefs({ theme })}
            />
          </div>
          <div className="setting-row">
            <span>{text.language}</span>
            <Choice
              value={lang}
              options={["en", "az"]}
              format={(value) => (value === "az" ? text.azerbaijani : text.english)}
              onPick={setLang}
            />
          </div>
        </section>
        <IndexPanel text={text} prefs={prefs} applyPrefs={applyPrefs} />
        <section className="card settings-panel">
          <h2>{text.rulesTitle}</h2>
          <div className="setting-row">
            <span>{text.underLabel}</span>
            <Choice value={prefs.under} options={UNDERS} format={pct} onPick={(under) => applyPrefs({ under })} />
          </div>
          <div className="setting-row">
            <span>{text.overLabel}</span>
            <Choice value={prefs.over} options={OVERS} format={(value) => `+${value}%`} onPick={(over) => applyPrefs({ over })} />
          </div>
          <div className="setting-row">
            <span>{text.severeLabel}</span>
            <Choice value={prefs.severe} options={SEVERES} format={pct} onPick={(severe) => applyPrefs({ severe })} />
          </div>
          <div className="setting-row">
            <span>{text.issues.arithmetic}</span>
            <Choice value={prefs.redArithmetic} options={[true, false]} format={(value) => (String(value) === "true" ? text.on : text.off)} onPick={(redArithmetic) => applyPrefs({ redArithmetic })} />
          </div>
          <div className="setting-row">
            <span>{text.issues.gap}</span>
            <Choice value={prefs.redGap} options={[true, false]} format={(value) => (String(value) === "true" ? text.on : text.off)} onPick={(redGap) => applyPrefs({ redGap })} />
          </div>
          <div className="setting-row">
            <span>{text.scopeSetting}</span>
            <Choice value={prefs.scopeOn} options={[true, false]} format={(value) => (String(value) === "true" ? text.on : text.off)} onPick={(scopeOn) => applyPrefs({ scopeOn })} />
          </div>
          <div className="setting-row">
            <span>{text.reportSetting}</span>
            <Choice value={prefs.reportLines} options={["all", "flagged"]} format={(value) => (value === "flagged" ? text.reportFlagged : text.reportAll)} onPick={(reportLines) => applyPrefs({ reportLines })} />
          </div>
          <div className="settings-actions">
            <button type="button" className="btn btn-ghost" onClick={() => applyPrefs({
              under: DEFAULT_PREFS.under,
              over: DEFAULT_PREFS.over,
              severe: DEFAULT_PREFS.severe,
              redArithmetic: DEFAULT_PREFS.redArithmetic,
              redGap: DEFAULT_PREFS.redGap,
              scopeOn: DEFAULT_PREFS.scopeOn,
              reportLines: DEFAULT_PREFS.reportLines,
              workType: DEFAULT_PREFS.workType,
            })}>{text.resetRules}</button>
          </div>
        </section>
        <section className="card settings-panel">
          <h2>{text.dataTitle}</h2>
          <div className="settings-actions data-actions">
            <button type="button" className="btn btn-ghost" onClick={() => priceRef.current?.click()}>{text.loadPrices}{priceNote ? ` (${priceNote})` : ""}</button>
            <button type="button" className="btn btn-ghost" onClick={() => { resetAllNorms(); setPriceNote(""); setReview(snapshot()); }}>{text.resetBook}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setReview(clearUploads())}>{text.clearUploads}</button>
            <input
              ref={priceRef}
              className="file-input"
              type="file"
              accept=".csv,text/csv"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                const count = importNormPrices(await file.text());
                setPriceNote(String(count));
                toast(text.toastPrices);
                setReview(snapshot());
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

const DataNotice = ({ text, onLoaded }) => {
  const pickRef = useRef(null);
  return (
    <section className="data-notice" role="note">
      <div className="data-notice-head">
        <span className="data-notice-icon"><CircleHelp size={18} /></span>
        <div>
          <h2>{text.dataNoticeTitle}</h2>
          <p>{text.dataNoticeLead}</p>
        </div>
      </div>
      <div className="data-notice-cols">
        <div>
          <span className="eyebrow">{text.dataReal}</span>
          <ul className="ticks ok">{text.dataRealList.map((item) => <li key={item}><Check size={13} strokeWidth={3} />{item}</li>)}</ul>
        </div>
        <div>
          <span className="eyebrow">{text.dataNeed}</span>
          <ul className="ticks need">{text.dataNeedList.map((item) => <li key={item}><ArrowRight size={13} strokeWidth={2.5} />{item}</li>)}</ul>
        </div>
      </div>
      <div className="data-notice-foot">
        <code>code, labor, machinist, machine, material</code>
        <button type="button" className="btn btn-primary" onClick={() => pickRef.current?.click()}><Upload size={15} /> {text.loadPrices}</button>
        <input
          ref={pickRef}
          className="file-input"
          type="file"
          accept=".csv,text/csv"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            const count = importNormPrices(await file.text());
            toast(`${text.toastPrices}: ${count}`);
            onLoaded();
          }}
        />
      </div>
    </section>
  );
};

const DatabasePage = ({ lang, onChange }) => {
  const text = copy[lang];
  const prefs = readPrefs();
  const rows = listNorms().map((norm) => {
    const parts = rateParts(norm.labor, norm.machinist, norm.machine, norm.material, prefs.workType, prefs.index);
    return { ...norm, parts, rate: parts.total };
  });
  const sections = [...new Set(rows.map((row) => row.section_en))].map((section) => {
    const items = rows.filter((row) => row.section_en === section);
    const totals = items.reduce((sum, row) => ({
      wage: sum.wage + row.parts.wage,
      machine: sum.machine + row.parts.machine,
      material: sum.material + row.parts.material,
      total: sum.total + row.parts.total,
    }), { wage: 0, machine: 0, material: 0, total: 0 });
    return {
      key: section,
      label: lang === "az" ? items[0].section_az : section,
      count: items.length,
      totals,
    };
  });

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>{text.catalogTitle}</h1>
          <p>{text.sourcesLead}</p>
        </div>
      </header>
      <DataNotice text={text} onLoaded={onChange} />
      <div className="table-card">
        <div className="table-head">
          <h2>{text.sourcesTitle}</h2>
          <span className="meta">{SOURCES.length}</span>
        </div>
        <div className="source-list">
          {SOURCES.map((source) => (
            <article className="source-card" key={source.id}>
              <span className="source-prio">{source.priority}</span>
              <div>
                <a href={source.href} target="_blank" rel="noreferrer">{lang === "az" ? source.title_az : source.title_en}</a>
                <p className="source-name">{lang === "az" ? source.name_az : source.name_en}</p>
                <p className="source-provides">{lang === "az" ? source.provides_az : source.provides_en}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="table-card">
        <div className="table-head">
          <h2>{text.desnTitle}</h2>
        </div>
        <table className="source-table desn-table">
          <tbody>
            {catalogue.map((item) => (
              <tr key={item.code}>
                <td><span className="code">{item.code}</span>{item.title}</td>
                <td>{item.approval}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-card">
        <div className="table-head">
          <h2>ARXKOM</h2>
          <span className="meta">{arxkomSmeta.length}</span>
        </div>
        <div className="source-list">
          {arxkomSmeta.map((item) => (
            <article className="source-card" key={item.href}>
              <span className="source-prio">P0</span>
              <div>
                <a href={item.href} target="_blank" rel="noreferrer">{item.title}</a>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="table-card">
        <div className="table-head">
          <h2>{text.wageRates}</h2>
        </div>
        <table className="source-table">
          <thead>
            <tr>
              <th>{text.work}</th>
              <th className="num">{text.overhead}</th>
              <th className="num">{text.profit}</th>
            </tr>
          </thead>
          <tbody>
            {WAGE_RATES.map((row) => (
              <tr key={row.work_en}>
                <td>{lang === "az" ? row.work_az : row.work_en}</td>
                <td className="num">{row.overhead}%</td>
                <td className="num">{row.profit}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="card settings-card">
        <div className="table-head bare">
          <h2>{text.sampleBook}</h2>
          <span className="meta">{rows.length} {text.lines}, {PRICE_BOOK}</span>
        </div>
        <div className="mix-legend">
          <span><i style={{ background: "var(--brand)" }} />{text.wage}</span>
          <span><i style={{ background: "var(--ref-fill)" }} />{text.machine}</span>
          <span><i style={{ background: "var(--ok)" }} />{text.material}</span>
        </div>
        <div className="pattern-list">
          {sections.map((section) => {
            const base = section.totals.total || 1;
            return (
              <div className="pattern-row" key={section.key}>
                <strong>{section.label}</strong>
                <span className="pattern-track" aria-hidden="true">
                  <i className="wage" style={{ width: `${(section.totals.wage / base) * 100}%` }} />
                  <i className="machine" style={{ width: `${(section.totals.machine / base) * 100}%` }} />
                  <i className="material" style={{ width: `${(section.totals.material / base) * 100}%` }} />
                </span>
                <span>{section.count}</span>
              </div>
            );
          })}
        </div>
      </section>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>{text.work}</th>
              <th>{text.unit}</th>
              <th className="num">{text.wage}</th>
              <th className="num">{text.machine}</th>
              <th className="num">{text.material}</th>
              <th className="num">{text.refRate}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.code}>
                <td>
                  <span className="code">{row.code}</span>
                  <span className="work-name">{lang === "az" ? row.name_az : row.name_en}</span>
                </td>
                <td>{row.unit}</td>
                <td className="num">{money(row.parts.wage)}</td>
                <td className="num">{money(row.parts.machine)}</td>
                <td className="num">{money(row.parts.material)}</td>
                <td className="num">{money(row.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ComparePage = ({ lang, review }) => {
  const text = copy[lang];
  const title = lang === "az" ? review.title_az : review.title_en;
  const board = compareBoard();
  const lines = review.lines.map((line) => {
    const shared = board.rows.find((row) => row.code === line.code);
    const others = Object.entries(shared?.offers || {})
      .filter(([id, offer]) => id !== review.id && offer.rate != null)
      .sort((a, b) => a[1].rate - b[1].rate);
    return { ...line, other: others[0] || null };
  });
  const scope = review.scope || [];
  const maxDev = Math.max(...lines.filter((line) => line.match === "confirmed").map((line) => Math.abs(Number(line.deviation_pct) || 0)), 1);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>{title}</h1>
          <p>{text.nav.compare}</p>
        </div>
        <div className="code-key">
          <span><CodeMark light={review.score.light} text={text} /> {text.lightNote[review.score.light]}</span>
        </div>
      </header>
      <section className="stats dash-kpis">
        <div className="stat"><span>{text.lineItems}</span><strong>{lines.length}</strong></div>
        <div className="stat"><span>{text.contractor}</span><strong><Amount value={review.score.contractor_total} /></strong></div>
        <div className="stat"><span>{text.reference}</span><strong><Amount value={review.score.reference_total} /></strong></div>
        <div className="stat"><span>{text.difference}</span><strong className={Number(review.score.deviation_pct) < 0 ? "risk-red" : ""}>{signed(review.score.deviation_pct)}</strong></div>
      </section>
      <div className="table-card wide">
        <table className="lines-table compare-table">
          <colgroup>
            <col style={{ width: "32%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "14%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>{text.work}</th>
              <th className="num">{text.contractor}</th>
              <th className="num">{text.reference}</th>
              <th className="num">{text.lowest}</th>
              <th>{text.deviation}</th>
              <th>{text.status}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const value = Number(line.deviation_pct) || 0;
              const tone = value < -5 ? "neg" : value > 5 ? "pos" : "ok";
              const confirmed = line.match === "confirmed";
              return (
                <tr key={line.id} className={line.included ? "" : "out"}>
                  <td>
                    <span className="code">{line.code}</span>
                    <span className="work-name">{lang === "az" ? line.name_az : line.name_en}</span>
                    {line.desn ? <span className="desn-ref">{line.desn.code}, {line.desn.title}</span> : null}
                  </td>
                  <td className="num">{line.gap ? <span className="muted">0.00</span> : money(line.contractor_rate)}</td>
                  <td className="num">{confirmed ? money(line.reference_rate) : <span className="muted">{text.pending}</span>}</td>
                  <td className="num">{confirmed && line.other ? money(line.other[1].rate) : <span className="muted">{text.noOther}</span>}</td>
                  <td>
                    {confirmed && !line.gap ? (
                      <span className="bar-row">
                        <span className={`bar-track ${tone}`}><i style={{ width: `${(Math.abs(value) / maxDev) * 100}%` }} /></span>
                        <span>{signed(line.deviation_pct)}</span>
                      </span>
                    ) : <span className="muted">{line.gap ? text.missingRow : text.pending}</span>}
                  </td>
                  <td><div className="status-cell"><span className={`tag tag-${line.flag}`}>{text.flags[line.flag]}</span></div></td>
                </tr>
              );
            })}
            {scope.length ? (
              <>
                <tr className="section"><td colSpan={6}>{text.compareMissing}</td></tr>
                {scope.map((item) => (
                  <tr key={`scope-${item.code}`} className="scope-row">
                    <td>
                      <span className="code">{item.code}</span>
                      <span className="work-name">{lang === "az" ? item.name_az : item.name_en}</span>
                    </td>
                    <td className="num"><span className="muted">0.00</span></td>
                    <td />
                    <td />
                    <td><span className="muted">{text.scopeRow}</span></td>
                    <td><div className="status-cell"><span className="tag tag-gap">{text.flags.gap}</span></div></td>
                  </tr>
                ))}
              </>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Donut = ({ parts, center }) => {
  const total = parts.reduce((sum, part) => sum + part.value, 0) || 1;
  const radius = 42;
  const length = 2 * Math.PI * radius;
  let cursor = 0;
  return (
    <svg viewBox="0 0 120 120" role="img">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--surface-3)" strokeWidth="14" />
      {parts.filter((part) => part.value > 0).map((part) => {
        const slice = (part.value / total) * length;
        const node = (
          <circle
            key={part.key}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            style={{ stroke: part.color }}
            strokeWidth="14"
            strokeDasharray={`${slice} ${length - slice}`}
            transform={`rotate(${(cursor / total) * 360 - 90} 60 60)`}
          />
        );
        cursor += part.value;
        return node;
      })}
      <text x="60" y="64" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="600">{center}</text>
    </svg>
  );
};

const Desk = ({ lang, review, onOpen, onGo }) => {
  const text = copy[lang];
  const rows = extractedRows();
  const projects = review.projects || [];
  const included = rows.filter((line) => line.included);
  const sum = (list, pick) => list.reduce((total, line) => total + Number(pick(line) || 0), 0);
  const contractor = sum(included, (line) => line.contractor_amount);
  const reference = sum(included, (line) => line.reference_amount);
  const moneyGap = contractor - reference;
  const waiting = rows.filter((line) => line.match === "needs_review" || line.flag === "unit").length;
  const lights = { red: 0, amber: 0, green: 0 };
  projects.forEach((item) => { lights[item.light] += 1; });
  const scope = readPrefs().scopeOn === false ? 0 : projects.reduce((total, item) => {
    const lines = rows.filter((line) => line.project_id === item.id);
    return total + scopeMissing(lines.map((line) => ({
      coded: line.match === "confirmed",
      match: line.match,
      suggested_code: line.code,
    }))).length;
  }, 0);
  const unmatched = rows.filter((line) => line.match === "needs_review" && !line.coded && Number(line.confidence) < 0.5).length;
  const issues = [
    { key: "under", label: text.issues.under, value: included.filter((line) => line.flag === "under").length, color: "var(--bad)" },
    { key: "over", label: text.issues.over, value: included.filter((line) => line.flag === "over").length, color: "var(--brand)" },
    { key: "close", label: text.issues.close, value: included.filter((line) => line.flag === "close").length, color: "var(--ok)" },
    { key: "arithmetic", label: text.issues.arithmetic, value: included.filter((line) => line.flag === "arithmetic").length, color: "var(--violet)" },
    { key: "unit", label: text.issues.unit, value: rows.filter((line) => line.flag === "unit").length, color: "var(--warn-fill)" },
    { key: "gap", label: text.issues.gap, value: rows.filter((line) => line.flag === "gap").length, color: "var(--neutral-fill)" },
    { key: "unmatched", label: text.issues.unmatched, value: unmatched, color: "var(--neutral-fill)" },
    { key: "scope", label: text.issues.scope, value: scope, color: "var(--bad)" },
  ];
  const maxIssue = Math.max(...issues.map((item) => item.value), 1);
  const rank = { red: 0, amber: 1, green: 2 };
  const files = [...projects].sort((a, b) => rank[a.light] - rank[b.light] || (Number(a.deviation_pct) || 0) - (Number(b.deviation_pct) || 0));
  const maxGap = Math.max(...files.map((item) => Math.abs(Number(item.deviation_pct) || 0)), 1);
  const title = (item) => (lang === "az" ? item.title_az : item.title_en);
  const gapText = moneyGap < 0 ? `−${money(Math.abs(moneyGap))}` : moneyGap > 0 ? `+${money(moneyGap)}` : money(0);
  const fileMoney = files.map((item) => {
    const lines = included.filter((line) => line.project_id === item.id);
    return {
      ...item,
      contractor: sum(lines, (line) => line.contractor_amount),
      reference: sum(lines, (line) => line.reference_amount),
    };
  });
  const maxMoney = Math.max(...fileMoney.map((file) => Math.max(file.contractor, file.reference)), 1);
  const sectionMap = new Map();
  included.forEach((line) => {
    const key = line.section_en || "Other";
    const current = sectionMap.get(key) || { key, name_en: line.section_en, name_az: line.section_az, contractor: 0, reference: 0 };
    current.contractor += Number(line.contractor_amount) || 0;
    current.reference += Number(line.reference_amount) || 0;
    sectionMap.set(key, current);
  });
  const sections = [...sectionMap.values()]
    .map((section) => ({ ...section, deviation: section.reference ? ((section.contractor - section.reference) / section.reference) * 100 : 0 }))
    .sort((a, b) => a.deviation - b.deviation);
  const maxSection = Math.max(...sections.map((section) => Math.abs(section.deviation)), 1);
  const riskParts = [
    { key: "red", label: text.light.red, value: lights.red, color: "var(--bad)" },
    { key: "amber", label: text.light.amber, value: lights.amber, color: "var(--warn-fill)" },
    { key: "green", label: text.light.green, value: lights.green, color: "var(--ok)" },
  ];

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <span className="eyebrow greet">{greeting(lang)}, {(currentUser()?.name || "").split(" ")[0]}. {new Date().toLocaleDateString(lang === "az" ? "az-AZ" : "en-GB", { weekday: "long", day: "numeric", month: "long" })}</span>
          <h1>{text.deskTitle}</h1>
          <p>{text.deskLead(projects.length, waiting)}</p>
        </div>
      </header>
      <Journey text={text} projects={projects} rows={rows} onGo={onGo} />
      <NextUp text={text} lang={lang} projects={projects} onOpen={onOpen} onGo={onGo} />
      <section className="kpis">
        {["red", "amber", "green"].map((light) => (
          <div className="kpi" key={light}>
            <div className="kpi-label"><CodeMark light={light} text={text} /> {text.lightNote[light]}</div>
            <strong className={`kpi-value risk-${light}`}>{lights[light]}</strong>
            <span className="kpi-note">{text.ofFiles(lights[light], projects.length)}</span>
          </div>
        ))}
        <div className="kpi">
          <div className="kpi-label">{text.difference}</div>
          <strong className={`kpi-value ${moneyGap < 0 ? "risk-red" : moneyGap > 0 ? "risk-amber" : ""}`}>
            {gapText}<small>AZN</small>
          </strong>
          <span className="kpi-note">{reference ? signed(((contractor - reference) / reference) * 100) : ""} {text.vsReference}</span>
        </div>
      </section>
      <div className="chart-row">
        <section className="chart-card">
          <div className="chart-head">
            <h2>{text.deskRisk}</h2>
            <span>{projects.length}</span>
          </div>
          <div className="risk-panel">
            <Donut parts={riskParts} center={projects.length} />
            <div className="risk-counts">
              {riskParts.map((part) => (
                <div key={part.key}>
                  <CodeMark light={part.key} text={text} />
                  <span className="share"><i style={{ width: `${(part.value / (projects.length || 1)) * 100}%`, background: part.color }} /></span>
                  <span className="risk-name">{text.lightNote[part.key]}</span>
                  <strong className={`risk-${part.key}`}>{part.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="chart-card">
          <div className="chart-head">
            <h2>{text.statusMix}</h2>
            <span>{issues.reduce((total, item) => total + item.value, 0)}</span>
          </div>
          <div className="issue-grid">
            {issues.map((item) => (
              <div className="bar-row" key={item.key}>
                <strong>{item.label}</strong>
                <span className="bar-track"><i style={{ width: `${(item.value / maxIssue) * 100}%`, background: item.color }} /></span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="chart-row">
        <section className="chart-card">
          <div className="chart-head">
            <h2>{text.gapChart}</h2>
            <span>{files.length}</span>
          </div>
          <div className="bar-list">
            {files.map((item) => {
              const value = Number(item.deviation_pct) || 0;
              const tone = codeClass(item.light);
              return (
                <button type="button" className="bar-row" key={item.id} onClick={() => onOpen(item.id)}>
                  <strong>{title(item)}</strong>
                  <span className={`bar-track ${tone}`}><i style={{ width: `${(Math.abs(value) / maxGap) * 100}%` }} /></span>
                  <span className="bar-end">
                    <CodeMark light={item.light} text={text} />
                    <span className={`risk-${item.light}`}>{signed(item.deviation_pct)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
        <section className="chart-card">
          <div className="chart-head">
            <h2>{text.deskMoney}</h2>
            <span>{gapText}</span>
          </div>
          <div className="legend">
            <span><i style={{ background: "var(--brand)" }} />{text.contractor}</span>
            <span><i style={{ background: "var(--ref-fill)" }} />{text.reference}</span>
          </div>
          <div className="bar-list">
            {fileMoney.map((file) => (
              <button type="button" className="bar-row" key={file.id} onClick={() => onOpen(file.id)}>
                <strong>{title(file)}</strong>
                <span className="bar-stack">
                  <span className="bar-track"><i className="contractor" style={{ width: `${(file.contractor / maxMoney) * 100}%` }} /></span>
                  <span className="bar-track"><i className="reference" style={{ width: `${(file.reference / maxMoney) * 100}%` }} /></span>
                </span>
                <span className="bar-end">
                  <CodeMark light={file.light} text={text} />
                  <span className={`risk-${file.light}`}>{signed(file.deviation_pct)}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
      <section className="chart-card">
        <div className="chart-head">
          <h2>{text.deskSections}</h2>
          <span>{sections.length}</span>
        </div>
        <div className={`bar-list${sections.length > 3 ? " split" : ""}`}>
          {sections.map((section) => {
            const tone = section.deviation < -5 ? "neg" : section.deviation > 5 ? "pos" : "ok";
            return (
              <div className="bar-row" key={section.key}>
                <strong>{lang === "az" ? section.name_az : section.name_en}</strong>
                <span className={`bar-track ${tone}`}><i style={{ width: `${(Math.abs(section.deviation) / maxSection) * 100}%` }} /></span>
                <span className={tone === "neg" ? "risk-red" : tone === "pos" ? "risk-amber" : "risk-green"}>{signed(section.deviation)}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

const ROLE_ICON = { code: Cpu, ai: ScanText, person: UserCheck };

const Journey = ({ text, projects, rows, onGo }) => {
  const waiting = rows.filter((line) => line.match === "needs_review").length;
  const flagged = rows.filter((line) => line.flag && line.flag !== "close").length;
  const decided = projects.filter((item) => item.decision).length;
  const total = projects.length;
  const state = {
    upload: { value: `${total} ${text.journeyFiles}`, done: total > 0, view: "projects" },
    match: { value: `${waiting} ${text.journeyWaiting}`, done: waiting === 0, view: "projects" },
    check: { value: `${flagged} ${text.journeyFlags}`, done: total > 0, view: "projects" },
    decide: { value: `${decided} / ${total} ${text.journeyDecided}`, done: total > 0 && decided === total, view: "projects" },
    report: { value: `${decided} ${text.journeyReady}`, done: total > 0 && decided === total, view: "projects" },
  };
  const current = text.journey.findIndex((step) => !state[step.key].done);
  return (
    <section className="journey">
      <div className="journey-head">
        <h2>{text.journeyTitle}</h2>
        <button type="button" className="link-btn" onClick={() => onGo("guide")}><BookOpen size={14} /> {text.help}</button>
      </div>
      <ol>
        {text.journey.map((step, index) => {
          const info = state[step.key];
          const tone = info.done ? "done" : index === current ? "now" : "";
          return (
            <li key={step.key} className={tone}>
              <button type="button" onClick={() => onGo(info.view)}>
                <span className="dot">{info.done ? <Check size={12} strokeWidth={3} /> : index + 1}</span>
                <b>{step.title}</b>
                <em>{info.value}</em>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

const NextUp = ({ text, lang, projects, onOpen, onGo }) => {
  const rank = { red: 0, amber: 1, green: 2 };
  const open = projects
    .filter((item) => !item.decision)
    .sort((a, b) => rank[a.light] - rank[b.light] || (Number(a.deviation_pct) || 0) - (Number(b.deviation_pct) || 0))
    .slice(0, 5);
  return (
    <section className="chart-card next-up">
      <div className="chart-head">
        <h2>{text.nextUp}</h2>
        <button type="button" className="btn btn-primary" onClick={() => onGo("projects")}><Upload size={15} /> {text.upload}</button>
      </div>
      {open.length ? (
        <ul className="next-list">
          {open.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => onOpen(item.id)}>
                <KindBadge item={item} />
                <span className="next-name">
                  <b>{lang === "az" ? item.title_az : item.title_en}</b>
                  <small>{item.lines} {text.lines}{item.waiting ? `, ${item.waiting} ${text.waitingShort}` : ""}</small>
                </span>
                <CodeMark light={item.light} text={text} />
                <span className={`next-dev risk-${item.light}`}>{signed(item.deviation_pct)}</span>
                <span className="next-open">{text.open} <ArrowRight size={14} /></span>
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="empty">{text.allDecided}</p>}
    </section>
  );
};

const GuidePage = ({ lang, onGo }) => {
  const text = copy[lang];
  const prefs = readPrefs();
  return (
    <div className="page guide">
      <header className="page-head">
        <div>
          <h1>{text.guideTitle}</h1>
          <p>{text.guideLead}</p>
        </div>
      </header>

      <section className="card guide-block">
        <h2>{text.guideJourney}</h2>
        <ol className="guide-steps">
          {text.guideSteps.map((step, index) => {
            const Icon = ROLE_ICON[step.who];
            return (
              <li key={step.title}>
                <span className="step-num">{index + 1}</span>
                <div className="step-body">
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  <div className="step-meta">
                    <span className={`who w-${step.who}`}><Icon size={13} /> {text.who[step.who]}</span>
                    <button type="button" className="link-btn" onClick={() => onGo(step.view)}>{text.goTo} <ArrowRight size={13} /></button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="role-grid">
        {text.roles.map((role) => {
          const Icon = ROLE_ICON[role.key];
          return (
            <article className={`card role w-${role.key}`} key={role.key}>
              <span className="role-icon"><Icon size={18} /></span>
              <h3>{role.title}</h3>
              <p>{role.body}</p>
            </article>
          );
        })}
      </div>

      <section className="card guide-block">
        <h2>{text.guideCodes}</h2>
        <div className="code-rules">
          {["red", "amber", "green"].map((light) => (
            <div key={light} className="code-rule">
              <div className={`lamp ${light}`} aria-hidden="true"><i /><i /><i /></div>
              <div>
                <span className="code-rule-title"><CodeMark light={light} text={text} /> {text.lightNote[light]}</span>
                <p>{text.codeRules[light](prefs)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

const Shell = ({ user, setUser, onLogout, lang, setLang, review, setReview }) => {
  const [view, setView] = useState("dashboard");
  const [opened, setOpened] = useState(null);
  const text = copy[lang];
  const initials = user.name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SY";
  const openedCard = (review.projects || []).find((item) => item.id === opened);
  const fileTitle = opened
    ? (review.id === opened
      ? (lang === "az" ? review.title_az : review.title_en)
      : (lang === "az" ? openedCard?.title_az : openedCard?.title_en))
    : "";
  const crumb = opened && (view === "review" || view === "compare") ? fileTitle : (text.nav[view] || text.nav.projects);
  const openFile = (projectId, next = "review") => {
    const data = openProject(projectId);
    if (!data) return;
    setReview(data);
    setOpened(projectId);
    setView(next);
  };
  const closeFile = () => {
    setOpened(null);
    if (view === "review" || view === "compare") setView("projects");
  };
  const open = (next) => { if (next !== view) setView(next); };
  const scroller = useRef(null);
  const [bookVersion, setBookVersion] = useState(0);
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); }, [view, opened]);

  return (
    <div className="app">
      <Toaster />
      <aside className="rail">
        <div className="rail-brand">
          <Brand hint={text.product} />
        </div>
        <nav className="nav">
          <button type="button" className={view === "dashboard" ? "active" : ""} onClick={() => open("dashboard")}>
            <LayoutDashboard size={16} /> {text.nav.dashboard}
          </button>
          <button type="button" className={view === "projects" ? "active" : ""} onClick={() => open("projects")}>
            <FolderKanban size={16} /> {text.nav.projects}
            {(review.projects || []).filter((item) => !item.decision).length ? <em className="nav-count">{(review.projects || []).filter((item) => !item.decision).length}</em> : null}
          </button>
          {opened ? (
            <div className="file-context">
              <div className="file-context-head">
                <strong>{fileTitle}</strong>
                <button type="button" aria-label={text.closeFile} onClick={closeFile}><X size={14} /></button>
              </div>
              <button type="button" className={view === "review" ? "active" : ""} onClick={() => openFile(opened, "review")}>
                <ShieldCheck size={16} /> {text.nav.review}
              </button>
              <button type="button" className={view === "compare" ? "active" : ""} onClick={() => openFile(opened, "compare")}>
                <GitCompare size={16} /> {text.nav.compare}
              </button>
            </div>
          ) : null}
          <button type="button" className={view === "database" ? "active" : ""} onClick={() => open("database")}>
            <Database size={16} /> {text.nav.database}
          </button>
          <button type="button" className={view === "guide" ? "active" : ""} onClick={() => open("guide")}>
            <BookOpen size={16} /> {text.nav.guide}
          </button>
          <button type="button" className={view === "settings" ? "active" : ""} onClick={() => open("settings")}>
            <Settings size={16} /> {text.nav.settings}
          </button>
        </nav>
        <div className="rail-foot">
          <div className="user-chip">
            <span className="avatar person">{initials}</span>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onLogout}><LogOut size={15} /> {text.signOut}</button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="crumbs">
            <span>{text.product}</span>
            <span>/</span>
            <b>{crumb}</b>
          </div>
          <nav className="mobile-nav">
            <button type="button" className={view === "dashboard" ? "active" : ""} onClick={() => open("dashboard")}>{text.nav.dashboard}</button>
            <button type="button" className={view === "projects" ? "active" : ""} onClick={() => open("projects")}>{text.nav.projects}</button>
            {opened ? <button type="button" className={view === "review" ? "active" : ""} onClick={() => openFile(opened, "review")}>{text.nav.review}</button> : null}
            {opened ? <button type="button" className={view === "compare" ? "active" : ""} onClick={() => openFile(opened, "compare")}>{text.nav.compare}</button> : null}
            <button type="button" className={view === "database" ? "active" : ""} onClick={() => open("database")}>{text.nav.database}</button>
            <button type="button" className={view === "guide" ? "active" : ""} onClick={() => open("guide")}>{text.nav.guide}</button>
            <button type="button" className={view === "settings" ? "active" : ""} onClick={() => open("settings")}>{text.nav.settings}</button>
          </nav>
          <button type="button" className="help-btn" onClick={() => open("guide")}><CircleHelp size={16} /> {text.help}</button>
        </header>
        <div className="page-scroll" ref={scroller}>
          {view === "dashboard" ? (
            <Desk
              lang={lang}
              review={review}
              onOpen={(projectId) => openFile(projectId, "review")}
              onGo={open}
            />
          ) : null}
          {view === "projects" ? (
            <Tenders
              key="projects"
              lang={lang}
              review={review}
              onOpen={(projectId, next) => openFile(projectId, next)}
              onUpload={async (body) => {
                const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                const [data] = await Promise.all([
                  uploadProject(body),
                  new Promise((resolve) => { window.setTimeout(resolve, calm ? 0 : 1600); }),
                ]);
                setReview(data);
                setOpened(data.id);
                setView("review");
                toast(text.toastUploaded);
              }}
              onRemove={(projectId) => {
                const data = removeProject(projectId);
                setReview(data);
                toast(text.toastRemoved);
                if (projectId === opened) closeFile();
              }}
              onClear={() => {
                setReview(clearUploads());
                toast(text.toastCleared);
                if (opened && opened !== "sample" && opened !== "bench") closeFile();
              }}
            />
          ) : null}
          {opened && review.id === opened && view === "review" ? <Review key={review.id} lang={lang} review={review} setReview={setReview} /> : null}
          {opened && review.id === opened && view === "compare" ? <ComparePage key={review.id} lang={lang} review={review} /> : null}
          {view === "database" ? <DatabasePage key={`db-${readPrefs().index}-${readPrefs().workType}-${bookVersion}`} lang={lang} onChange={() => { setBookVersion((v) => v + 1); setReview(snapshot()); }} /> : null}
          {view === "guide" ? <GuidePage lang={lang} onGo={open} /> : null}
          {view === "settings" ? <SettingsPage key="settings" lang={lang} setLang={setLang} user={user} setUser={setUser} setReview={setReview} onLogout={onLogout} /> : null}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(() => currentUser());
  const [mode, setMode] = useState("login");
  const [lang, setLang] = useState(readLang);
  const [review, setReview] = useState(null);
  const [booting, setBooting] = useState(() => Boolean(currentUser()));
  const [curtain, setCurtain] = useState(false);
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    if (curtain && animDone && !booting && review) setCurtain(false);
  }, [curtain, animDone, booting, review]);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    applyTheme(readPrefs().theme);
  }, [review]);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    setBooting(true);
    const loadDesk = async () => {
      dedupeProjects();
      const samplesReady = localStorage.getItem("smeta.files.v8") === "1";
      if (!samplesReady) {
        SAMPLES.forEach((sample) => {
          const hit = (snapshot().projects || []).find((item) => item.title_en === sample.filename);
          if (hit) removeProject(hit.id);
        });
      }
      for (const sample of SAMPLES) {
        if (samplesReady && hasFile(sample.filename)) continue;
        const response = await fetch(sample.file);
        if (!response.ok) continue;
        const bytes = new Uint8Array(await response.arrayBuffer());
        const head = new TextDecoder().decode(bytes.slice(0, 24)).toLowerCase();
        if (head.includes("<!doctype") || head.includes("<html")) continue;
        await uploadProject({ filename: sample.filename, bytes });
      }
      if (SAMPLES.every((sample) => hasFile(sample.filename))) {
        localStorage.setItem("smeta.files.v8", "1");
      }
      return snapshot();
    };
    loadDesk()
      .then((data) => {
        if (!alive) return;
        setReview(data);
        setBooting(false);
      })
      .catch(() => {
        if (!alive) return;
        setReview(snapshot());
        setBooting(false);
      });
    return () => { alive = false; };
  }, [user]);

  const leave = () => {
    logout();
    setMode("login");
    setReview(null);
    setBooting(false);
    setCurtain(false);
    setAnimDone(false);
    setUser(null);
  };

  if (!user || curtain) {
    return (
      <Auth
        mode={mode}
        lang={lang}
        onMode={setMode}
        onEnter={(session) => {
          setReview(null);
          setAnimDone(false);
          setCurtain(true);
          setBooting(true);
          setUser(session);
        }}
        onDone={() => setAnimDone(true)}
      />
    );
  }
  if (booting || !review) return <Loader lang={lang} />;
  return (
    <Shell
      user={user}
      setUser={setUser}
      lang={lang}
      setLang={setLang}
      review={review}
      setReview={setReview}
      onLogout={leave}
    />
  );
};

export default App;
