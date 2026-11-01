import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";

const $ = id => document.getElementById(id);
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let user = null, countdown = null, currentTicketId = null, ticketActive = false;

function usernameToEmail(value) {
  const username = value.trim().toLowerCase();
  if (!/^[a-z0-9_-]{3,24}$/.test(username)) throw Error("아이디는 영문 소문자·숫자·_ -를 사용해 3~24자로 입력해 주세요.");
  return `${username}@users.crypto-cat-jbu.com`;
}
function creds() { return { email: usernameToEmail($("username").value), password: $("password").value }; }
function message(text, type = "") { const el = $("message"); el.textContent = text; el.className = "message " + type; }
function ticketMessage(text) { $("ticket-status").textContent = text; }

function setTicketButton(active) {
  ticketActive = active;
  $("issue").textContent = active ? "QR 티켓 취소하기" : "QR 티켓 발급하기";
  $("issue").className = active ? "button secondary full" : "button primary full";
  $("issue").disabled = !user;
}
function clearTicket(text = "발급된 티켓이 없습니다.") {
  clearInterval(countdown); countdown = null; currentTicketId = null;
  setTicketButton(false);
  $("ticket").innerHTML = '<div class="qr-placeholder">로그인 후<br>티켓을 발급해 주세요</div>';
  ticketMessage(text);
}

async function history() {
  const { data, error } = await db.from("tickets")
    .select("id,issued_at,expires_at,used_at,cancelled_at")
    .order("issued_at", { ascending: false }).limit(10);
  if (error) { message(error.message, "bad"); return; }
  const host = $("history"); host.replaceChildren();
  if (!data?.length) { host.innerHTML = '<p class="subtle">아직 발급 내역이 없습니다.</p>'; return; }
  for (const t of data) {
    const item = document.createElement("div"); item.className = "history-item";
    const status = t.cancelled_at ? "취소됨" : t.used_at ? "사용 완료" : new Date(t.expires_at) < new Date() ? "만료" : "미사용";
    item.textContent = `${new Date(t.issued_at).toLocaleString()} · ${status}`;
    host.append(item);
  }
}

async function refresh() {
  const { data, error } = await db.auth.getUser();
  if (error) { message(error.message, "bad"); return; }
  user = data.user;
  const loggedIn = !!user;
  const username = user?.email?.split("@")[0] || "";
  $("account").textContent = loggedIn ? `로그인됨 · ${username}` : "로그인하지 않았습니다.";
  $("login").textContent = loggedIn ? "로그아웃" : "로그인";
  $("login").className = loggedIn ? "button secondary full" : "button primary full";
  for (const id of ["username-label", "username", "password-label", "password", "signup"]) $(id).hidden = loggedIn;
  $("issue").disabled = !loggedIn;
  $("refresh").disabled = !loggedIn;
  if (loggedIn) await history();
  else {
    $("history").innerHTML = '<p class="subtle">로그인하면 발급 내역을 확인할 수 있습니다.</p>';
    clearTicket("로그인 후 티켓을 발급해 주세요.");
  }
}

$("signup").onclick = async () => {
  try {
    const c = creds();
    if (c.password.length < 6) return message("비밀번호는 6자 이상 입력해 주세요.", "bad");
    const { data, error } = await db.auth.signUp(c);
    if (error) return message(error.message, "bad");
    if (data.session) { message("회원가입 및 로그인 완료", "good"); await refresh(); }
    else message("가입은 접수됐지만 로그인 세션이 없습니다. Supabase의 Email > Confirm email 설정을 확인해 주세요.", "bad");
  } catch (e) { message(e.message, "bad"); }
};

$("login").onclick = async () => {
  if (user) {
    const { error } = await db.auth.signOut();
    if (error) return message(error.message, "bad");
    clearTicket("로그아웃했습니다.");
    message("로그아웃했습니다.", "good");
    await refresh();
    return;
  }
  try {
    const c = creds();
    const { error } = await db.auth.signInWithPassword(c);
    if (error) return message(error.message, "bad");
    message("로그인했습니다.", "good");
    await refresh();
  } catch (e) { message(e.message, "bad"); }
};

async function issueTicket() {
  if (!user) return message("먼저 로그인해 주세요.", "bad");
  const { data, error } = await db.rpc("issue_ticket");
  if (error) return message(error.message, "bad");
  const t = Array.isArray(data) ? data[0] : data;
  if (!t?.token || !t?.expires_at || !t?.ticket_id) return message("티켓 응답 형식이 예상과 다릅니다. Supabase issue_ticket 함수의 반환값을 확인해 주세요.", "bad");
  const canvas = document.createElement("canvas");
  try { await QRCode.toCanvas(canvas, t.token, { width: 260, margin: 1, errorCorrectionLevel: "M" }); }
  catch (e) { return message("QR 생성 실패: " + e.message, "bad"); }
  $("ticket").replaceChildren(canvas);
  currentTicketId = t.ticket_id;
  const expiresAt = new Date(t.expires_at).getTime();
  clearInterval(countdown); setTicketButton(true);
  const tick = () => {
    const seconds = Math.min(60, Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    ticketMessage(seconds ? `유효시간 ${seconds}초 · 입장 직전에 스캔해 주세요` : "티켓 만료 · 새 티켓을 발급해 주세요");
    if (!seconds) { clearInterval(countdown); countdown = null; currentTicketId = null; setTicketButton(false); $("ticket").innerHTML = '<div class="qr-placeholder">티켓이 만료되었습니다.<br>새로 발급해 주세요</div>'; }
  };
  tick(); countdown = setInterval(tick, 1000);
  message("모바일 티켓을 발급했습니다.", "good");
  await history();
}

async function cancelTicket() {
  if (!currentTicketId) return message("취소할 활성 티켓이 없습니다.", "bad");
  const { data, error } = await db.rpc("cancel_ticket", { p_ticket_id: currentTicketId });
  if (error) return message("티켓 취소에 실패했습니다. 아래 안내의 SQL을 먼저 실행해 주세요. " + error.message, "bad");
  const result = Array.isArray(data) ? data[0] : data;
  if (result?.status !== "cancelled") return message("티켓을 취소할 수 없습니다. 이미 사용되었거나 만료되었을 수 있습니다.", "bad");
  clearTicket("티켓이 취소되었습니다.");
  $("ticket").innerHTML = '<div class="qr-placeholder">티켓이 취소되었습니다.<br>다시 발급할 수 있습니다</div>';
  message("QR 티켓을 취소했습니다.", "good");
  await history();
}

$("issue").onclick = () => ticketActive ? cancelTicket() : issueTicket();
$("refresh").onclick = history;
db.auth.onAuthStateChange(() => setTimeout(refresh, 0));
refresh();
