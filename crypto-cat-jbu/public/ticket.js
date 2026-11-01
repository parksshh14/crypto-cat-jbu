import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";
const $ = id => document.getElementById(id);
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null, countdownTimer = null;
function msg(t, bad=false){$("message").textContent=t;$("message").className="message "+(bad?"bad":"");}
function credentials(){return {email:$("email").value.trim(),password:$("password").value};}
async function refreshUser(){
 const {data:{user}}=await db.auth.getUser(); currentUser=user;
 $("account").textContent=user?`로그인됨: ${user.email}`:"로그인하지 않았습니다.";
 $("logout").hidden=!user; $("issue").disabled=!user; $("refresh").disabled=!user;
 if(user) await history();
}
$("signup").onclick=async()=>{const c=credentials();const {error}=await db.auth.signUp(c);if(error)return msg(error.message,true);msg("회원가입 요청이 완료됐습니다. 이메일 확인이 필요하면 메일 인증 후 로그인해 주세요.");};
$("login").onclick=async()=>{const {error}=await db.auth.signInWithPassword(credentials());if(error)return msg(error.message,true);msg("로그인했습니다.");await refreshUser();};
$("logout").onclick=async()=>{await db.auth.signOut();$("ticket").replaceChildren();$("history").replaceChildren();msg("로그아웃했습니다.");await refreshUser();};
$("issue").onclick=async()=>{
 if(!currentUser)return msg("먼저 로그인해 주세요.",true);
 const {data,error}=await db.rpc("issue_ticket");
 if(error)return msg(error.message,true);
 const t=data[0]; $("ticket").replaceChildren();
 const canvas=document.createElement("div");$("ticket").append(canvas);
  const qrCanvas=document.createElement("canvas"); await QRCode.toCanvas(qrCanvas,t.token,{width:240,margin:2});$("ticket").replaceChildren(qrCanvas);
 const expiry=document.createElement("p");$("ticket").append(expiry);
 const expiresAt=new Date(t.expires_at).getTime();
 clearInterval(countdownTimer);
 const tick=()=>{const left=Math.max(0,Math.ceil((expiresAt-Date.now())/1000));expiry.textContent=left>0?`남은 유효시간: ${left}초`:"티켓이 만료됐습니다.";if(left===0)clearInterval(countdownTimer);};
 tick();countdownTimer=setInterval(tick,1000);msg("티켓을 발급했습니다.");
 await history();
};
async function history(){
 const {data,error}=await db.from("tickets").select("id,issued_at,expires_at,used_at").order("issued_at",{ascending:false}).limit(20);
 if(error)return msg(error.message,true);
 const host=$("history");host.replaceChildren();
 for(const t of data||[]){const d=document.createElement("div");d.className="history-item";d.textContent=`발급: ${new Date(t.issued_at).toLocaleString()} · ${t.used_at?"사용 완료":(new Date(t.expires_at)<new Date()?"만료":"미사용")}`;host.append(d);}
}
$("refresh").onclick=history;
db.auth.onAuthStateChange(()=>{setTimeout(refreshUser,0);});
refreshUser();
