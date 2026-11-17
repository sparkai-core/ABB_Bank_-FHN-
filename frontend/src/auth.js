// Accounts live only in this browser. This keeps the pilot offline and private;
// production sign in should move to the client's own identity provider.
const USERS = "smeta.users";
const SESSION = "smeta.session";

export const DEMO = {
  name: "Leyla Mammadova",
  email: "leyla@example.com",
  password: "estimate1",
};

const readUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(USERS) || "[]");
  } catch {
    return [];
  }
};

const digest = async (text) => {
  const bytes = new TextEncoder().encode(`smeta:${text}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const ensureDemo = async () => {
  const list = readUsers().filter((user) => user.email !== DEMO.email);
  const hash = await digest(DEMO.password);
  localStorage.setItem(USERS, JSON.stringify([...list, { name: DEMO.name, email: DEMO.email, hash }]));
};

const ready = ensureDemo();

export const currentUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION) || "null");
  } catch {
    return null;
  }
};

export const signup = async ({ name, email, password }) => {
  await ready;
  const cleanEmail = email.trim().toLowerCase();
  const list = readUsers();
  if (list.some((user) => user.email === cleanEmail)) throw new Error("exists");
  const user = { name: name.trim(), email: cleanEmail, hash: await digest(password) };
  localStorage.setItem(USERS, JSON.stringify([...list, user]));
  const session = { name: user.name, email: user.email };
  sessionStorage.setItem(SESSION, JSON.stringify(session));
  return session;
};

export const login = async ({ email, password }) => {
  await ready;
  const cleanEmail = String(email || "").trim().toLowerCase();
  const known = readUsers().find((item) => item.email === cleanEmail);
  if (!known) throw new Error("mismatch");
  const hash = await digest(String(password || ""));
  const legacy = known.password != null && known.password === password;
  if (known.hash !== hash && !legacy) throw new Error("mismatch");
  const session = { name: known.name || cleanEmail, email: cleanEmail };
  sessionStorage.setItem(SESSION, JSON.stringify(session));
  return session;
};

export const logout = () => sessionStorage.removeItem(SESSION);

export const renameUser = (name) => {
  const session = currentUser();
  const nextName = String(name || "").trim();
  if (!session || !nextName) return session;
  const next = { ...session, name: nextName };
  sessionStorage.setItem(SESSION, JSON.stringify(next));
  const list = readUsers().map((user) => (user.email === session.email ? { ...user, name: nextName } : user));
  localStorage.setItem(USERS, JSON.stringify(list));
  return next;
};
