import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";
const $=id=>document.getElementById(id), db=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
let scanner=null, user=null;
function result(t,good=false){$("result").textContent=t;$("result").className="message "+(good?"good":"bad");}
async function refresh(){const {data:{user:u}}=await db.auth.getUser();user=u;$("account").textContent=u?`로그인됨: ${u.email}`:"로그인하지 않았습니다.";$("logout").hidden=!u;}
$("login").onclick=async()=>{const {error}=await db.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error)return result(error.message);await refresh();result("로그인했습니다. 검표원 권한이 없으면 스캔할 수 없습니다.",true);};
$("logout").onclick=async()=>{await stop();await db.auth.signOut();await refresh();result("로그아웃했습니다.");};
async function verify(token){
 const {data,error}=await db.rpc("verify_ticket",{p_token:token});
 if(error)return result("검증 오류: "+error.message);
 const r=data?.[0]; if(!r)return result("검증 결과가 없습니다.");
 if(r.status==="valid")result("입장 승인: 유효한 티켓입니다.",true);
 else if(r.status==="already_used")result("입장 거부: 이미 사용된 티켓입니다.");
 else if(r.status==="expired")result("입장 거부: 만료된 티켓입니다.");
 else if(r.status==="forbidden")result("검표원 권한이 없습니다.");
 else result("입장 거부: 유효하지 않은 티켓입니다.");
}
async function start(){
 if(!user)return result("먼저 검표원 계정으로 로그인해 주세요.");
 if(!window.Html5Qrcode)return result("QR 스캔 라이브러리를 불러오지 못했습니다.");
 if(!scanner)scanner=new Html5Qrcode("reader");
 try{await scanner.start({facingMode:"environment"},{fps:10,qrbox:{width:230,height:230}},async text=>{await stop();await verify(text);});result("카메라가 실행 중입니다.",true);}
 catch(e){result("카메라 시작 실패: "+e);}
}
async function stop(){if(scanner&&scanner.isScanning){try{await scanner.stop();}catch{}}}
$("start").onclick=start;$("stop").onclick=stop;refresh();
