import { Fragment, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Database,
  Download,
  LayoutDashboard,
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
import { DEFAULT_PREFS, OVERS, SEVERES, THEMES, UNDERS, applyTheme, readPrefs, savePrefs } from "./engine/prefs.js";
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

const Auth = ({ mode, lang, onMode, onEnter }) => {
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
    const ready = snapshot();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!motion) await new Promise((resolve) => { window.setTimeout(resolve, 2200); });
    onEnter(session, ready);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const session = creating ? signup({ name, email, password }) : login({ email });
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
          <Ledger3D captions={copy[lang].scene} pose={accepted ? "open" : "idle"} success={text.opened} />
          {accepted ? null : <p className="login-art-foot">{copy[lang].independent}</p>}
        </section>
        <section className="login-form">
          <div key={mode} className="auth-panel">
            <div>
              <h2>{creating ? text.create : text.signIn}</h2>
              <p className="lede">{creating ? text.createLead : text.signInLead}</p>
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
              {creating ? (
                <label className="field">
                  <span>{text.password}</span>
                  <div className="password-wrap">
                    <input className="input" type={show ? "text" : "password"} required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={text.passwordPh} />
                    <button type="button" onClick={() => setShow((value) => !value)}>{show ? text.hide : text.show}</button>
                  </div>
                </label>
              ) : null}
              {creating ? null : (
                <button
                  type="button"
                  className="demo-link"
                  onClick={() => {
                    setError("");
                    setEmail(DEMO.email);
                    setPassword(DEMO.password);
                    finish(login(DEMO));
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

const Review = ({ lang, review, setReview }) => {
  const text = copy[lang];
  const [note, setNote] = useState("");
  const [codes, setCodes] = useState({});
  const [focus, setFocus] = useState("all");
  const name = (line) => (lang === "az" ? line.name_az : line.name_en);
  const actor = currentUser()?.name || "";
  const section = (line) => (lang === "az" ? line.section_az : line.section_en);
  const waiting = review.lines.filter((line) => line.match === "needs_review").length;
  const apply = (next) => { if (next) setReview(next); };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>{lang === "az" ? review.title_az : review.title_en}</h1>
          <p>{review.lines.length} {text.lines}{waiting ? ` · ${waiting} ${text.waitingShort}` : ""}</p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn btn-ghost" onClick={() => downloadBlob(`${review.title_en}.csv`, reportCsv(review.id), "text/csv")}>
            <Download size={15} /> {text.exportTable}
          </button>
          <button type="button" className="btn btn-ghost" onClick={async () => { const { downloadReportPdf } = await import("./engine/reportPdf.js"); await downloadReportPdf(review, lang); }}>
            <Download size={15} /> {text.exportReport}
          </button>
          {review.source === "sample" ? (
            <button type="button" className="btn btn-ghost" onClick={() => apply(resetSample())}>{text.reset}</button>
          ) : null}
        </div>
      </header>

      <section className="score">
        <div className="score-side">
          <div className={`lamp ${review.score.light}`} aria-hidden="true"><i /><i /><i /></div>
          <div>
            <div className="eyebrow">Risk</div>
            <strong>{text.light[review.score.light]}</strong>
          </div>
        </div>
        <div className="score-copy">
          <div className="eyebrow">{text.sample}</div>
          <h2>{lang === "az" ? review.score.sentence_az : review.score.sentence_en}</h2>
          {waiting ? <p className="wait">{text.waiting}</p> : null}
        </div>
        <div className="metrics">
          <div className="metric"><span>{text.contractor}</span><b>{money(review.score.contractor_total)}</b></div>
          <div className="metric"><span>{text.reference}</span><b>{money(review.score.reference_total)}</b></div>
          <div className="metric"><span>{text.difference}</span><b>{signed(review.score.deviation_pct)}</b></div>
        </div>
      </section>

      <section className="build">
        <div><span>{text.wage}</span><b>{money(review.score.parts?.wage)}</b></div>
        <div><span>{text.machine}</span><b>{money(review.score.parts?.machine)}</b></div>
        <div><span>{text.material}</span><b>{money(review.score.parts?.material)}</b></div>
        <div><span>{text.overhead}</span><b>{money(review.score.parts?.overhead)}</b></div>
        <div><span>{text.profit}</span><b>{money(review.score.parts?.profit)}</b></div>
      </section>

      {review.scope?.length ? (
        <section className="card scope-card">
          <h2>{text.scopeTitle}</h2>
          <div className="scope-list">
            {review.scope.map((item) => (
              <span className="tag tag-gap" key={item.code}>{lang === "az" ? item.name_az : item.name_en}</span>
            ))}
          </div>
        </section>
      ) : null}

      <div className="table-card wide">
        <div className="table-head">
          <h2>{text.lineItems}</h2>
          <div className="seg block wrap">
            {[
              ["all", text.focusAll],
              ["under", text.issues.under],
              ["over", text.issues.over],
              ["gap", text.issues.gap],
              ["unmatched", text.issues.unmatched],
              ["wait", `${text.focusWait}${review.lines.filter(needsPerson).length ? ` ${review.lines.filter(needsPerson).length}` : ""}`],
            ].map(([id, label]) => (
              <button key={id} type="button" className={focus === id ? "on" : ""} onClick={() => setFocus(id)}>{label}</button>
            ))}
          </div>
        </div>
        <table>
          <colgroup>
            <col style={{ width: "28%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "14%" }} />
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
            {review.lines.filter((line) => {
              if (focus === "under") return line.flag === "under";
              if (focus === "over") return line.flag === "over";
              if (focus === "gap") return line.flag === "gap";
              if (focus === "unmatched") return line.match === "needs_review" && !line.coded && Number(line.confidence) < 0.5;
              if (focus === "wait") return needsPerson(line);
              return true;
            }).map((line, index, list) => {
              const previous = list[index - 1];
              const showSection = !previous || previous.section_az !== line.section_az;
              return (
                <Fragment key={line.id}>
                  {showSection ? (
                    <tr className="section">
                      <td colSpan={7}>{section(line)}</td>
                    </tr>
                  ) : null}
                  <tr className={line.included ? "" : "out"}>
                    <td>
                      <span className="code">{line.code}</span>
                      <span className="work-name">{name(line)}</span>
                      {line.desn ? <span className="desn-ref">{line.desn.code} · {line.desn.title}</span> : null}
                      {line.unit_clash ? <span className="desn-ref">{line.unit} · {line.ref_unit}</span> : null}
                      {line.confirmed_by ? <span className="desn-ref">{line.confirmed_by}</span> : null}
                      {line.match === "needs_review" && !line.gap ? (
                        <span className="inline">
                          <select value={codes[line.id] || line.code} onChange={(event) => setCodes({ ...codes, [line.id]: event.target.value })} aria-label={text.suggested}>
                            {review.norm_choices.map((choice) => (
                              <option key={choice.code} value={choice.code}>
                                {choice.code} · {lang === "az" ? choice.name_az : choice.name_en}
                              </option>
                            ))}
                          </select>
                          <button type="button" className="btn btn-soft" onClick={() => apply(confirmLine(line.id, codes[line.id] || line.code, review.id, actor))}>
                            {text.confirm}
                          </button>
                        </span>
                      ) : null}
                    </td>
                    <td>{line.unit}</td>
                    <td className="num">{line.qty}</td>
                    <td className="num">{money(line.contractor_rate)}</td>
                    <td className="num">{money(line.reference_rate)}</td>
                    <td className="num"><Deviation value={line.deviation_pct} flag={line.flag} /></td>
                    <td>
                      <span className={`tag tag-${line.flag}`}>{text.flags[line.flag]}</span>
                      {line.gap ? (
                        <span className="inline">
                          <span className="seg">
                            <button type="button" className={line.included ? "on" : ""} onClick={() => apply(setGap(line.id, true, review.id))}>{text.required}</button>
                            <button type="button" className={!line.included ? "on" : ""} onClick={() => apply(setGap(line.id, false, review.id))}>{text.notNeeded}</button>
                          </span>
                        </span>
                      ) : null}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="decision">
        <div className="grow">
          <label htmlFor="note">{text.note}</label>
          <input id="note" value={note} onChange={(event) => setNote(event.target.value)} />
          {review.decision ? <p className="saved">{text.saved}: {text[review.decision.choice] || review.decision.choice}{review.decision.by ? ` · ${review.decision.by}` : ""}</p> : null}
        </div>
        <button type="button" className="btn btn-primary" onClick={() => apply(decide("accept", note, review.id, actor))}>{text.accept}</button>
        <button type="button" className="btn btn-ghost" onClick={() => apply(decide("query", note, review.id, actor))}>{text.query}</button>
        <button type="button" className="btn btn-ghost" onClick={() => apply(decide("reject", note, review.id, actor))}>{text.reject}</button>
      </section>
    </div>
  );
};

const Tenders = ({ lang, review, onOpen, onUpload, onRemove, onClear }) => {
  const text = copy[lang];
  const [reading, setReading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const projects = review.projects || [];
  const uploads = projects.filter((item) => item.source === "upload").length;

  const takeBytes = async (filename, bytes) => {
    setFileError("");
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

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>{text.tendersTitle}</h1>
        </div>
        <div className="head-actions">
          {uploads ? (
            <button type="button" className="btn btn-ghost" onClick={onClear}>
              <Trash2 size={15} /> {text.clearUploads}
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
      {reading ? (
        <div className="read-stage" role="status">
          <Brand onDark hint={copy[lang].product} />
          <Ledger3D pose="read" captions={copy[lang].readingSteps} />
        </div>
      ) : null}

      <section
        className={`dropzone${dragOver ? " is-over" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => { if (!reading) fileRef.current?.click(); }}
        onKeyDown={(event) => { if (event.key === "Enter" && !reading) fileRef.current?.click(); }}
        onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          takeFile(event.dataTransfer.files?.[0]);
        }}
      >
        <FileSpreadsheet size={22} />
        <div>
          <strong>{reading ? text.reading : text.dropTitle}</strong>
          <p>{fileError || text.dropHelp}</p>
        </div>
      </section>

      <div className="project-grid">
        {projects.map((item) => (
          <div className="card tender-card" key={item.id}>
            <button type="button" className="tender-open" onClick={() => onOpen(item.id, "review")}>
              <div className="tender-top">
                <span className="avatar"><img src="/abb-mark.png" alt="" /></span>
                <div style={{ flex: 1 }}>
                  <h3>{lang === "az" ? item.title_az : item.title_en}</h3>
                  <p>{item.lines} {text.lines}{item.waiting ? ` · ${item.waiting} ${text.waitingShort}` : ""}</p>
                </div>
                <ShieldCheck size={16} color="#1B63ED" />
              </div>
              <div className="tender-foot">
                <span className={`risk-${item.light}`}>{text.light[item.light]}</span>
                <span>{signed(item.deviation_pct)}</span>
              </div>
            </button>
            <div className="tender-actions">
              <button type="button" onClick={() => onOpen(item.id, "review")}>{text.nav.review}</button>
              <button type="button" onClick={() => onOpen(item.id, "compare")}>{text.nav.compare}</button>
            </div>
            {item.id !== "sample" ? (
              <button type="button" className="tender-remove" aria-label={text.removeProject} onClick={() => onRemove(item.id)}>
                <Trash2 size={14} />
              </button>
            ) : null}
          </div>
        ))}
      </div>
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
              if (next) setUser(next);
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
        <section className="card settings-panel">
          <h2>{text.rulesTitle}</h2>
          <div className="setting-row">
            <span>{text.underLabel}</span>
            <Choice value={prefs.under} options={UNDERS} format={(value) => `${value}%`} onPick={(under) => applyPrefs({ under })} />
          </div>
          <div className="setting-row">
            <span>{text.overLabel}</span>
            <Choice value={prefs.over} options={OVERS} format={(value) => `+${value}%`} onPick={(over) => applyPrefs({ over })} />
          </div>
          <div className="setting-row">
            <span>{text.severeLabel}</span>
            <Choice value={prefs.severe} options={SEVERES} format={(value) => `${value}%`} onPick={(severe) => applyPrefs({ severe })} />
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
              index: DEFAULT_PREFS.index,
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
            <button type="button" className="btn btn-ghost" onClick={() => priceRef.current?.click()}>{text.loadPrices}{priceNote ? ` · ${priceNote}` : ""}</button>
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
                setReview(snapshot());
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

const DatabasePage = ({ lang }) => {
  const text = copy[lang];
  const prefs = readPrefs();
  const rows = listNorms().map((norm) => {
    const parts = rateParts(norm.labor, norm.machinist, norm.machine, norm.material, prefs.workType, prefs.index);
    return { ...norm, parts, rate: referenceRate(norm, prefs.index) };
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
          <p>{text.sourcesTitle}</p>
        </div>
      </header>
      <div className="table-card" style={{ padding: "4px 18px 8px" }}>
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
        <div className="table-head" style={{ padding: 0 }}>
          <h2>{text.sampleBook}</h2>
          <span className="meta">{rows.length} {text.lines} · {PRICE_BOOK}</span>
        </div>
        <div className="mix-legend">
          <span><i className="wage" style={{ background: "#1b63ed" }} />{text.wage}</span>
          <span><i className="machine" style={{ background: "#7aa2f5" }} />{text.machine}</span>
          <span><i className="material" style={{ background: "#0f7a62" }} />{text.material}</span>
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
  const maxDev = Math.max(...lines.filter((line) => line.match === "confirmed").map((line) => Math.abs(Number(line.deviation_pct) || 0)), 1);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>{title}</h1>
          <p>{text.nav.compare}</p>
        </div>
      </header>
      <section className="stats dash-kpis">
        <div className="stat"><span>{text.lines}</span><strong>{lines.length}</strong></div>
        <div className="stat"><span>{text.contractor}</span><strong>{money(review.score.contractor_total)}</strong></div>
        <div className="stat"><span>{text.reference}</span><strong>{money(review.score.reference_total)}</strong></div>
        <div className="stat"><span>{text.difference}</span><strong>{signed(review.score.deviation_pct)}</strong></div>
      </section>
      <div className="table-card wide">
        <table>
          <colgroup>
            <col style={{ width: "36%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "22%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>{text.work}</th>
              <th className="num">{text.contractor}</th>
              <th className="num">{text.reference}</th>
              <th className="num">{text.lowest}</th>
              <th>{text.deviation}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const value = Number(line.deviation_pct) || 0;
              const tone = value < -5 ? "neg" : value > 5 ? "pos" : "ok";
              return (
                <tr key={line.id}>
                  <td>
                    <span className="code">{line.code}</span>
                    <span className="work-name">{lang === "az" ? line.name_az : line.name_en}</span>
                    {line.desn ? <span className="desn-ref">{line.desn.code} · {line.desn.title}</span> : null}
                  </td>
                  <td className="num">{money(line.contractor_rate)}</td>
                  <td className="num">{line.match === "confirmed" ? money(line.reference_rate) : ""}</td>
                  <td className="num">{line.match === "confirmed" && line.other ? money(line.other[1].rate) : ""}</td>
                  <td>
                    {line.match === "confirmed" ? (
                      <span className="bar-row">
                        <span className={`bar-track ${tone}`}><i style={{ width: `${(Math.abs(value) / maxDev) * 100}%` }} /></span>
                        <span>{signed(line.deviation_pct)}</span>
                      </span>
                    ) : <span className="muted">{text.waitingShort}</span>}
                  </td>
                </tr>
              );
            })}
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
            stroke={part.color}
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

const Desk = ({ lang, review, onOpen }) => {
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
    { key: "under", label: text.issues.under, value: included.filter((line) => line.flag === "under").length, color: "#c0261b" },
    { key: "over", label: text.issues.over, value: included.filter((line) => line.flag === "over").length, color: "#1b63ed" },
    { key: "close", label: text.issues.close, value: included.filter((line) => line.flag === "close").length, color: "#0f7a62" },
    { key: "arithmetic", label: text.issues.arithmetic, value: included.filter((line) => line.flag === "arithmetic").length, color: "#5b4b8a" },
    { key: "unit", label: text.issues.unit, value: rows.filter((line) => line.flag === "unit").length, color: "#9a5b00" },
    { key: "gap", label: text.issues.gap, value: rows.filter((line) => line.flag === "gap").length, color: "#8b95a5" },
    { key: "unmatched", label: text.issues.unmatched, value: unmatched, color: "#5c6770" },
    { key: "scope", label: text.issues.scope, value: scope, color: "#c0261b" },
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
    { key: "red", label: text.light.red, value: lights.red, color: "#c0261b" },
    { key: "amber", label: text.light.amber, value: lights.amber, color: "#c4841d" },
    { key: "green", label: text.light.green, value: lights.green, color: "#0f7a62" },
  ];

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>{text.deskTitle}</h1>
        </div>
      </header>
      <section className="stats dash-kpis">
        <div className="stat"><span>{text.light.red}</span><strong className="risk-red">{lights.red}</strong></div>
        <div className="stat"><span>{text.light.amber}</span><strong className="risk-amber">{lights.amber}</strong></div>
        <div className="stat"><span>{text.waitingShort}</span><strong>{waiting}</strong></div>
        <div className="stat"><span>{text.difference}</span><strong className={moneyGap < 0 ? "risk-red" : moneyGap > 0 ? "risk-amber" : ""}>{gapText}</strong></div>
      </section>
      <div className="chart-row">
        <section className="chart-card">
          <h2>{text.deskRisk}</h2>
          <div className="risk-panel">
            <Donut parts={riskParts} center={projects.length} />
            <div className="risk-counts">
              {riskParts.map((part) => (
                <div key={part.key}>
                  <strong style={{ color: part.color }}>{part.value}</strong>
                  <span>{part.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="chart-card">
          <h2>{text.statusMix}</h2>
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
          <h2>{text.gapChart}</h2>
          <div className="bar-list">
            {files.map((item) => {
              const value = Number(item.deviation_pct) || 0;
              const tone = item.light === "red" ? "neg" : item.light === "amber" ? "pos" : "ok";
              return (
                <button type="button" className="bar-row" key={item.id} onClick={() => onOpen(item.id)}>
                  <strong>{title(item)}</strong>
                  <span className={`bar-track ${tone}`}><i style={{ width: `${(Math.abs(value) / maxGap) * 100}%` }} /></span>
                  <span className={`risk-${item.light}`}>{signed(item.deviation_pct)}{item.waiting ? ` · ${item.waiting}` : ""}</span>
                </button>
              );
            })}
          </div>
        </section>
        <section className="chart-card">
          <h2>{text.deskMoney}</h2>
          <div className="legend">
            <span><i style={{ background: "#1b63ed" }} />{text.contractor}</span>
            <span><i style={{ background: "#9bb8f5" }} />{text.reference}</span>
          </div>
          <div className="bar-list">
            {fileMoney.map((file) => (
              <button type="button" className="bar-row" key={file.id} onClick={() => onOpen(file.id)}>
                <strong>{title(file)}</strong>
                <span className="bar-stack">
                  <span className="bar-track"><i className="contractor" style={{ width: `${(file.contractor / maxMoney) * 100}%` }} /></span>
                  <span className="bar-track"><i className="reference" style={{ width: `${(file.reference / maxMoney) * 100}%` }} /></span>
                </span>
                <span className={`risk-${file.light}`}>{signed(file.deviation_pct)}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
      <section className="chart-card">
        <h2>{text.deskSections}</h2>
        <div className="bar-list">
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

  return (
    <div className="app">
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
            <button type="button" className={view === "settings" ? "active" : ""} onClick={() => open("settings")}>{text.nav.settings}</button>
          </nav>
        </header>
        <div className="page-scroll">
          {view === "dashboard" ? (
            <Desk
              lang={lang}
              review={review}
              onOpen={(projectId) => openFile(projectId, "review")}
            />
          ) : null}
          {view === "projects" ? (
            <Tenders
              key="projects"
              lang={lang}
              review={review}
              onOpen={(projectId, next) => openFile(projectId, next)}
              onUpload={async (body) => {
                const data = await uploadProject(body);
                setReview(data);
                setOpened(data.id);
                setView("review");
              }}
              onRemove={(projectId) => {
                const data = removeProject(projectId);
                setReview(data);
                if (projectId === opened) closeFile();
              }}
              onClear={() => {
                setReview(clearUploads());
                if (opened && opened !== "sample" && opened !== "bench") closeFile();
              }}
            />
          ) : null}
          {opened && review.id === opened && view === "review" ? <Review key={review.id} lang={lang} review={review} setReview={setReview} /> : null}
          {opened && review.id === opened && view === "compare" ? <ComparePage key={review.id} lang={lang} review={review} /> : null}
          {view === "database" ? <DatabasePage key={`db-${readPrefs().index}`} lang={lang} /> : null}
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
      const samplesReady = localStorage.getItem("smeta.files.v7") === "1";
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
        localStorage.setItem("smeta.files.v7", "1");
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
    setUser(null);
  };

  if (!user) {
    return (
      <Auth
        mode={mode}
        lang={lang}
        onMode={setMode}
        onEnter={(session) => {
          setReview(null);
          setUser(session);
        }}
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
