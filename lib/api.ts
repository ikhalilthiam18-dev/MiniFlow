const API_BASE =
  (typeof import.meta !== "undefined" &&
    (import.meta as ImportMeta & { env?: { VITE_API_URL?: string } }).env
      ?.VITE_API_URL) ||
  "http://127.0.0.1:8000";

const TOKEN_KEY = "courrier360-access";
const REFRESH_KEY = "courrier360-refresh";

export type ApiUser = {
  id: number;
  nom: string;
  email: string;
  role:
    | "Administrateur système"
    | "Secrétariat général / Bureau du courrier"
    | "DGS / Secrétaire municipal"
    | "Chef de service municipal"
    | "Agent communal";
  service: string;
  actif: boolean;
  avatar?: string;
};

export type ApiCourrier = {
  id: number;
  numero: string;
  sens: "Arrivée" | "Départ";
  date: string;
  tiers: string;
  objet: string;
  service: string;
  type: string;
  priorite: "Normale" | "Urgente";
  statut: string;
  echeance: string;
  responsable: string;
  signataire?: string;
  notes?: string;
};

export type ApiContact = {
  id: number;
  nom: string;
  categorie: string;
  email: string;
  telephone: string;
};

export type ApiNotification = {
  id: number;
  destinataire: string;
  courrier: string;
  message: string;
  date: string;
  lue: boolean;
};

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function storeTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return null;
  const res = await fetch(`${API_BASE}/api/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    clearSession();
    return null;
  }
  const data = (await res.json()) as { access: string; refresh?: string };
  localStorage.setItem(TOKEN_KEY, data.access);
  if (data.refresh) localStorage.setItem(REFRESH_KEY, data.refresh);
  return data.access;
}

/** Turns a DRF error body ({detail} or {field: [messages]}) into one readable message. */
function errorMessage(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const b = body as Record<string, unknown>;
  if (typeof b.detail === "string") return b.detail;
  return Object.values(b)
    .flatMap((v) => (Array.isArray(v) ? v : [v]))
    .filter((v): v is string => typeof v === "string")
    .join(" ");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let token = getStoredAccessToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401 && localStorage.getItem(REFRESH_KEY)) {
    token = await refreshAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    }
  }
  if (!res.ok) {
    let detail = "Erreur serveur";
    try {
      detail = errorMessage(await res.json()) || detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: ApiUser; access: string; refresh: string }> {
  const res = await fetch(`${API_BASE}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg =
      data.detail ||
      (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) ||
      "Identifiants incorrects.";
    throw new Error(msg);
  }
  storeTokens(data.access, data.refresh);
  return data;
}

export async function fetchMe(): Promise<ApiUser> {
  return apiFetch<ApiUser>("/api/auth/me/");
}

export async function changePassword(
  current_password: string,
  new_password: string,
): Promise<void> {
  await apiFetch("/api/auth/password/change/", {
    method: "POST",
    body: JSON.stringify({ current_password, new_password }),
  });
}

export async function updateProfileAvatar(avatar: string): Promise<ApiUser> {
  return apiFetch<ApiUser>("/api/auth/me/", {
    method: "PATCH",
    body: JSON.stringify({ avatar }),
  });
}

export async function fetchAccounts(): Promise<ApiUser[]> {
  return apiFetch<ApiUser[]>("/api/auth/accounts/");
}

export async function fetchAdminUsers(): Promise<ApiUser[]> {
  return apiFetch<ApiUser[]>("/api/auth/users/");
}

export async function createAdminUser(
  body: Omit<ApiUser, "id" | "actif"> & { password?: string },
): Promise<ApiUser> {
  return apiFetch<ApiUser>("/api/auth/users/", {
    method: "POST",
    body: JSON.stringify({ ...body, actif: true }),
  });
}

export async function patchAdminUser(
  id: number,
  body: Partial<ApiUser>,
): Promise<ApiUser> {
  return apiFetch<ApiUser>(`/api/auth/users/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function adminSetPassword(id: number, password: string): Promise<void> {
  await apiFetch(`/api/auth/users/${id}/set-password/`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export async function fetchCourriers(params?: {
  q?: string;
  statut?: string;
  service?: string;
}): Promise<ApiCourrier[]> {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.statut) sp.set("statut", params.statut);
  if (params?.service) sp.set("service", params.service);
  const q = sp.toString();
  return apiFetch<ApiCourrier[]>(`/api/courriers/${q ? `?${q}` : ""}`);
}

export async function createCourrier(
  body: Omit<ApiCourrier, "id" | "numero">,
): Promise<ApiCourrier> {
  return apiFetch<ApiCourrier>("/api/courriers/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchCourrier(
  id: number,
  body: Partial<ApiCourrier>,
): Promise<ApiCourrier> {
  return apiFetch<ApiCourrier>(`/api/courriers/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function fetchContacts(): Promise<ApiContact[]> {
  return apiFetch<ApiContact[]>("/api/contacts/");
}

export async function createContact(
  body: Omit<ApiContact, "id">,
): Promise<ApiContact> {
  return apiFetch<ApiContact>("/api/contacts/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchNotifications(): Promise<ApiNotification[]> {
  return apiFetch<ApiNotification[]>("/api/notifications/");
}

export async function markNotificationRead(id: number): Promise<void> {
  await apiFetch(`/api/notifications/${id}/lire/`, { method: "POST" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch("/api/notifications/tout_lire/", { method: "POST" });
}
