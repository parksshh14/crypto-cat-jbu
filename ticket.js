import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";
const $=id=>document.getElementById(id), db=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
let user=null, countdown=null, currentTicketId=null, ticketActive=false;
function usernameToEmail(v){const u=v.trim().toLowerCase();if(!/^[a-z0-9_-]{3,24}$/.test(u))throw Error("아이디는 영문 소문자·숫자·_ -를 사용해 3~24자로 입력해 주세요.");return `${u}@users.crypto-cat-jbu.com`;}
function creds(){return {email:usernameToEmail($("username").value),password:$("password").value};}
function message(t,type=""){const e=$("message");e.textContent=t;e.className="message "+type;}
function ticketMessage(t){$("ticket-status").textContent=t;}
function setTicketButton(active){ticketActive=active;$("issue").textContent=active?"QR 티켓 취소하기":"QR 티켓 발급하기";$("issue").className=active?"button secondary full":"button primary full";$("issue").disabled=!user;}
function clearTicket(text="발급된 티켓이 없습니다."){clearInterval(countdown);countdown=null;currentTicketId=null;setTicketButton(false);$("ticket").innerHTML='<div class="qr-placeholder">로그인 후<br>티켓을 발급해 주세요</div>';ticketMessage(text);}
async function history(){const {data,error}=await db.from("tickets").select("id,issued_at,expires_at,used_at").order("issued_at",{ascending:false}).limit(10);if(error){message(error.message,"bad");return;}const host=$("history");host.replaceChildren();if(!data?.length){host.innerHTML='<p class="subtle">아직 발급 내역이 없습니다.</p>';return;}for(const t of data){const el=document.createElement("div");el.className="history-item";el.textContent=`${new Date(t.issued_at).toLocaleString()} · ${t.used_at?"사용 완료":new Date(t.expires_at)<new Date()?"만료":"미사용"}`;host.append(el);}}
async function refresh(){const {data:{user:u}}=await db.auth.getUser();user=u;const name=u?.email?.split("@")[0]||"";$("account").textContent=u?`로그인됨 · ${name}`:"로그인하지 않았습니다.";
  $("login").textContent=u?"로그아웃":"로그인";
  $("login").className=u?"button secondary full":"button primary full";
  for(const id of ["username-label","username","password-label","password","signup"]) $(id).hidden=!!u;
  $("issue").disabled=!u;$("refresh").disabled=!u;if(u)await history();else {$("history").innerHTML='<p class="subtle">로그인하면 발급 내역을 확인할 수 있습니다.</p>';clearTicket("로그인 후 티켓을 발급해 주세요.");}}
$("signup").onclick=async()=>{try{const c=creds();if(c.password.length<6)return message("비밀번호는 6자 이상 입력해 주세요.","bad");const {data,error}=await db.auth.signUp(c);if(error)return message(error.message,"bad");if(data.session){message("회원가입 및 로그인 완료","good");await refresh();}else message("가입은 접수됐지만 세션이 생성되지 않았습니다. Supabase의 Email > Confirm email 설정을 확인해 주세요.","bad");}catch(e){message(e.message,"bad");}};
$("login").onclick=async()=>{if(user){const {error}=await db.auth.signOut();if(error)return message(error.message,"bad");clearTicket("로그아웃했습니다.");message("로그아웃했습니다.","good");await refresh();return;}try{const c=creds();const {error}=await db.auth.signInWithPassword(c);if(error)return message(error.message,"bad");message("로그인했습니다.","good");await refresh();}catch(e){message(e.message,"bad");}};
$("issue").onclick=()=>ticketActive?cancelTicket():issueTicket();
$("refresh").onclick=history;db.auth.onAuthStateChange(()=>setTimeout(refresh,0));refresh();
