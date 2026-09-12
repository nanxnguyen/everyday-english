import { env } from "cloudflare:workers";

const MAX_STATE_BYTES = 1_000_000;
const DEVICE_COOKIE = "ee-progress-device";
const DEVICE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type StoredProgress = { state_json: string; updated_at: number };

function cookieValue(request: Request, name: string) {
  const cookies = request.headers.get("cookie") || "";
  for (const item of cookies.split(";")) {
    const [key, ...parts] = item.trim().split("=");
    if (key === name) return decodeURIComponent(parts.join("="));
  }
  return null;
}

function accountOwner(request: Request) {
  const accountId = request.headers.get("oai-authenticated-user-id")?.trim();
  // Keep the original account key format so existing cloud progress remains readable.
  return accountId || null;
}

function previousDeviceOwner(request: Request) {
  const existing = cookieValue(request, DEVICE_COOKIE);
  return existing && DEVICE_ID_PATTERN.test(existing) ? `device:${existing}` : null;
}

function json(body: unknown, init: ResponseInit = {}) {
  const response = Response.json(body, init);
  response.headers.set("cache-control", "no-store");
  return response;
}

function object(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
}

function mergeProgress(currentValue: unknown, incomingValue: unknown) {
  const current = object(currentValue);
  const incoming = object(incomingValue);
  const records = { ...object(current.records) };
  for (const [id, value] of Object.entries(object(incoming.records))) {
    const old = object(records[id]);
    const next = object(value);
    const latest = Number(next.last) >= Number(old.last) ? next : old;
    records[id] = {
      ...old,
      ...next,
      ...latest,
      seen: Math.max(Number(old.seen) || 0, Number(next.seen) || 0),
      lapses: Math.max(Number(old.lapses) || 0, Number(next.lapses) || 0),
    };
  }

  const history = [...(Array.isArray(current.history) ? current.history : []), ...(Array.isArray(incoming.history) ? incoming.history : [])]
    .filter((entry) => entry && typeof entry === "object")
    .filter((entry, index, all) => index === all.findIndex((candidate) =>
      candidate.group === entry.group && candidate.mode === entry.mode && candidate.at === entry.at && candidate.percent === entry.percent
    ))
    .sort((a, b) => Number(a.at) - Number(b.at))
    .slice(-500);

  const skills = { ...object(current.skills) };
  for (const [group, value] of Object.entries(object(incoming.skills))) {
    const old = object(skills[group]);
    const next = object(value);
    skills[group] = {
      ...old,
      ...next,
      imagePassed: old.imagePassed === true || next.imagePassed === true,
      situationPassed: old.situationPassed === true || next.situationPassed === true,
    };
  }

  const completions = { ...object(current.completions) };
  for (const [group, value] of Object.entries(object(incoming.completions))) {
    const old = Number(completions[group]) || 0;
    const next = Number(value) || 0;
    if (next > 0) completions[group] = old > 0 ? Math.min(old, next) : next;
  }

  return {
    ...current,
    ...incoming,
    records,
    history,
    visual: { ...object(current.visual), ...object(incoming.visual) },
    skills,
    completions,
    meta: {
      ...object(current.meta),
      ...object(incoming.meta),
      schemaVersion: Math.max(Number(current.meta?.schemaVersion) || 1, Number(incoming.meta?.schemaVersion) || 1),
      updatedAt: Math.max(Number(current.meta?.updatedAt) || 0, Number(incoming.meta?.updatedAt) || 0),
    },
  };
}

function unavailable(error: unknown) {
  console.error("Learning progress storage error", error);
  return Response.json({ error: "Tạm thời chưa thể truy cập lịch sử học tập. Vui lòng thử lại." }, { status: 503 });
}

export async function GET(request: Request) {
  const owner = accountOwner(request);
  if (!owner) return json({ error: "Bạn cần đăng nhập bằng ChatGPT để đồng bộ tiến độ." }, { status: 401 });
  try {
    const row = await env.DB.prepare("SELECT state_json, updated_at FROM learning_progress WHERE user_id = ? LIMIT 1")
      .bind(owner).first<StoredProgress>();
    const deviceOwner = previousDeviceOwner(request);
    const deviceRow = deviceOwner
      ? await env.DB.prepare("SELECT state_json, updated_at FROM learning_progress WHERE user_id = ? LIMIT 1")
          .bind(deviceOwner).first<StoredProgress>()
      : null;
    const state = mergeProgress(
      row ? JSON.parse(row.state_json) : null,
      deviceRow ? JSON.parse(deviceRow.state_json) : null,
    );
    const hasState = row || deviceRow;
    return json({ state: hasState ? state : null, updatedAt: Math.max(row?.updated_at || 0, deviceRow?.updated_at || 0), owner: "account" });
  } catch (error) { return unavailable(error); }
}

export async function PUT(request: Request) {
  const owner = accountOwner(request);
  if (!owner) return json({ error: "Bạn cần đăng nhập bằng ChatGPT để lưu tiến độ." }, { status: 401 });
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) return json({ error: "Dữ liệu không hợp lệ." }, { status: 415 });
  try {
    const payload = await request.json() as { state?: unknown };
    if (!payload.state || typeof payload.state !== "object" || Array.isArray(payload.state)) return json({ error: "Dữ liệu tiến độ không hợp lệ." }, { status: 400 });

    for (let attempt = 0; attempt < 4; attempt++) {
      const stored = await env.DB.prepare("SELECT state_json, updated_at FROM learning_progress WHERE user_id = ? LIMIT 1")
        .bind(owner).first<StoredProgress>();
      const deviceOwner = previousDeviceOwner(request);
      const deviceRow = deviceOwner
        ? await env.DB.prepare("SELECT state_json FROM learning_progress WHERE user_id = ? LIMIT 1")
            .bind(deviceOwner).first<{ state_json: string }>()
        : null;
      const merged = mergeProgress(
        mergeProgress(stored ? JSON.parse(stored.state_json) : null, deviceRow ? JSON.parse(deviceRow.state_json) : null),
        payload.state,
      );
      const stateJson = JSON.stringify(merged);
      if (new TextEncoder().encode(stateJson).byteLength > MAX_STATE_BYTES) return json({ error: "Dữ liệu tiến độ quá lớn." }, { status: 413 });
      const now = Math.max(Date.now(), (stored?.updated_at || 0) + 1);
      const result = stored
        ? await env.DB.prepare("UPDATE learning_progress SET state_json = ?, updated_at = ? WHERE user_id = ? AND updated_at = ?")
            .bind(stateJson, now, owner, stored.updated_at).run()
        : await env.DB.prepare("INSERT INTO learning_progress (user_id, state_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO NOTHING")
            .bind(owner, stateJson, now).run();
      if (Number(result.meta.changes) > 0) return json({ saved: true, state: merged, updatedAt: now, owner: "account" });
    }
    return json({ error: "Tiến độ vừa thay đổi ở nơi khác. Vui lòng thử lại." }, { status: 409 });
  } catch (error) { return unavailable(error); }
}
