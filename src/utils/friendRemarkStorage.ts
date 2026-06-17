/** 本地持久化好友备注（仅在网络失败等兜底场景写入；GET/PATCH 成功后应以服务端为准并清理对应项） */
const KEY = 'taskflow_friend_remarks_v1';

function readRaw(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as unknown;
    return o && typeof o === 'object' && !Array.isArray(o) ? (o as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeRaw(map: Record<string, string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

export function loadFriendRemarks(): Record<number, string> {
  const raw = readRaw();
  const out: Record<number, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const id = Number(k);
    if (Number.isFinite(id) && typeof v === 'string' && v.trim()) out[id] = v.trim();
  }
  return out;
}

export function setFriendRemarkLocal(userId: number, remark: string) {
  const map = readRaw();
  const key = String(userId);
  const t = remark.trim();
  if (!t) delete map[key];
  else map[key] = t;
  writeRaw(map);
}

/** 删除某好友的本地备注条目（服务端已有权威数据时调用，避免陈旧兜底） */
export function removeFriendRemarkLocal(userId: number) {
  const map = readRaw();
  delete map[String(userId)];
  writeRaw(map);
}
