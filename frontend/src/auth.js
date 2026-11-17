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

const ensureDemo = () => {
  const list = readUsers().filter((user) => user.email !== DEMO.email);
  localStorage.setItem(USERS, JSON.stringify([...list, { ...DEMO }]));
};

ensureDemo();

export const currentUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION) || "null");
  } catch {
    return null;
  }
};

export const signup = ({ name, email, password }) => {
  const cleanEmail = email.trim().toLowerCase();
  const list = readUsers();
  if (list.some((user) => user.email === cleanEmail)) {
    throw new Error("exists");
  }
  const user = { name: name.trim(), email: cleanEmail, password };
  localStorage.setItem(USERS, JSON.stringify([...list, user]));
  const session = { name: user.name, email: user.email };
  sessionStorage.setItem(SESSION, JSON.stringify(session));
  return session;
};

const nameFromEmail = (email) => email
  .split("@")[0]
  .split(/[._-]+/)
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" ");

export const login = ({ email }) => {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail) throw new Error("mismatch");
  const known = readUsers().find((item) => item.email === cleanEmail);
  const session = { name: known?.name || nameFromEmail(cleanEmail) || cleanEmail, email: cleanEmail };
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
