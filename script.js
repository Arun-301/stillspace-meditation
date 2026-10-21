"use strict";
const KEY="stillspace-data-v1", $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>Array.from(p.querySelectorAll(s));
const PATTERNS={
 relaxation:[{name:"Breathe In",duration:4,scale:1.28},{name:"Hold",duration:4,scale:1.28},{name:"Breathe Out",duration:6,scale:.84},{name:"Hold",duration:4,scale:.84}],
 simple:[{name:"Breathe In",duration:4,scale:1.28},{name:"Breathe Out",duration:6,scale:.84}],
 box:[{name:"Breathe In",duration:4,scale:1.28},{name:"Hold",duration:4,scale:1.28},{name:"Breathe Out",duration:4,scale:.84},{name:"Hold",duration:4,scale:.84}]};
const music=new Audio("music/meditation.mp3"),bell=new Audio("music/bell.mp3");music.loop=true;music.preload="auto";music.volume=.35;bell.loop=true;bell.preload="auto";bell.volume=.55;
let bellTimeout=null,data=load(),duration=300,remaining=300,elapsedPaused=0,startedAt=null,interval=null,running=false,done=false,name="Mindful Breathing",patternName="relaxation",pattern=PATTERNS.relaxation,cycle=18,lastPhase=-1;
const orb=$("#breathOrb"),timer=$("#sessionTimer"),fill=$("#trackFill"),start=$("#startPauseBtn"),reset=$("#resetBtn"),durationButtons=$$(".duration-row [data-duration]");
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));return{sessions:Array.isArray(x?.sessions)?x.sessions:[],dailyGoal:Math.max(1,Math.min(20,Number(x?.dailyGoal)||3))}}catch{return{sessions:[],dailyGoal:3}}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch{toast("Unable to save progress in this browser.")}}
function keyDate(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function fmt(n){n=Math.max(0,Math.ceil(n));return `${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`}
function toast(msg){const el=$(".toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),2800)}
function showPage(id){$$(".page").forEach(p=>p.classList.toggle("active",p.id===id));$$(".nav-btn").forEach(b=>{const a=b.dataset.page===id;b.classList.toggle("active",a);if(a)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});window.scrollTo({top:0,behavior:"smooth"})}
$$(".nav-btn").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
$("#headerSettingsBtn").addEventListener("click",()=>showPage("settings"));
$("#heroStartBtn").addEventListener("click",()=>{setSession("Mindful Breathing",duration,"relaxation");showPage("breathe")});
function setPattern(p){patternName=PATTERNS[p]?p:"relaxation";pattern=PATTERNS[patternName];cycle=pattern.reduce((s,x)=>s+x.duration,0);lastPhase=-1;$("#patternLabel").textContent=patternName.toUpperCase();if(!running)resetOrb()}
function setSession(n,seconds,p){if(running)pause();name=n||"Mindful Breathing";$("#activeSessionName").textContent=name;duration=Math.max(60,Math.round(seconds));remaining=duration;elapsedPaused=0;startedAt=null;done=false;setPattern(p);updateTimer();resetOrb();start.textContent="Start session";durationButtons.forEach(b=>{const a=Number(b.dataset.duration)*60===duration;b.classList.toggle("active",a);b.setAttribute("aria-pressed",String(a))})}
$$(".session-card .play-btn").forEach(b=>b.addEventListener("click",()=>{const c=b.closest(".session-card");setSession(c.dataset.sessionName,Number(c.dataset.duration)*60,c.dataset.pattern);showPage("breathe");begin()}));
durationButtons.forEach(b=>b.addEventListener("click",()=>{if(running){toast("Pause the session before changing duration.");return}duration=Number(b.dataset.duration)*60;remaining=duration;elapsedPaused=0;startedAt=null;done=false;updateTimer();resetOrb();durationButtons.forEach(x=>{const a=x===b;x.classList.toggle("active",a);x.setAttribute("aria-pressed",String(a))})}));
function updateTimer(){timer.textContent=fmt(remaining);const pct=duration?Math.min(100,Math.max(0,(duration-remaining)/duration*100)):0;fill.style.width=pct+"%";fill.parentElement.setAttribute("aria-valuenow",String(Math.round(pct)))}
function elapsed(){return elapsedPaused+(startedAt===null?0:Math.max(0,(Date.now()-startedAt)/1000))}
function phaseAt(i,t){const p=pattern[i];if(!p)return;if(i!==lastPhase){lastPhase=i;orb.style.transition=`transform ${p.duration}s cubic-bezier(.37,0,.25,1)`;orb.style.transform=`scale(${p.scale})`;orb.dataset.phase=p.name.toLowerCase().replace(/\s+/g,"-");$(".breath-instruction",orb).textContent=p.name}$(".breath-countdown",orb).textContent=Math.max(1,p.duration-Math.floor(t))}
function updateBreathing(t){let pos=t%cycle,sum=0;for(let i=0;i<pattern.length;i++){if(pos<sum+pattern[i].duration){phaseAt(i,pos-sum);return}sum+=pattern[i].duration}}
function resetOrb(){lastPhase=-1;orb.style.transition="transform .5s ease";orb.style.transform="scale(1)";delete orb.dataset.phase;$(".breath-instruction",orb).textContent="Ready to breathe";$(".breath-countdown",orb).textContent="—"}
function playMusic(){if($("#ambientSetting").checked)music.play().catch(()=>toast("Add music/meditation.mp3 to enable music."))}
function stopMusic(){music.pause();try{music.currentTime=0}catch{}}
function stopBell(){if(bellTimeout!==null)clearTimeout(bellTimeout);bellTimeout=null;bell.pause();try{bell.currentTime=0}catch{}}
function playBell(){stopMusic();stopBell();try{bell.currentTime=0}catch{}bell.play().catch(()=>toast("Session complete. Add music/bell.mp3 for the bell."));bellTimeout=setTimeout(stopBell,12000)}
function begin(){if(done)resetSession();if(running)return;running=true;startedAt=Date.now();start.textContent="Pause session";playMusic();interval=setInterval(tick,200);tick()}
function pause(){if(!running)return;elapsedPaused=Math.min(duration,elapsed());startedAt=null;running=false;clearInterval(interval);interval=null;music.pause();start.textContent="Resume session";toast("Session paused")}
function tick(){if(!running)return;const e=elapsed();remaining=Math.max(0,Math.ceil(duration-e));updateTimer();updateBreathing(e);if(remaining<=0)finish()}
function finish(){if(done)return;done=true;running=false;clearInterval(interval);interval=null;remaining=0;elapsedPaused=duration;startedAt=null;updateTimer();start.textContent="Start again";data.sessions.push({id:String(Date.now()),name,minutes:Math.max(1,Math.round(duration/60)),date:keyDate(),completedAt:new Date().toISOString(),pattern:patternName});save();render();playBell();toast("Session complete. Take a moment to notice how you feel.")}
function resetSession(){clearInterval(interval);interval=null;running=false;done=false;startedAt=null;elapsedPaused=0;remaining=duration;stopMusic();stopBell();start.textContent="Start session";resetOrb();updateTimer()}
start.addEventListener("click",()=>running?pause():begin());reset.addEventListener("click",resetSession);
function today(){return data.sessions.filter(s=>s.date===keyDate())}
function streak(){const days=new Set(data.sessions.map(s=>s.date));const d=new Date();if(!days.has(keyDate(d)))d.setDate(d.getDate()-1);let n=0;while(days.has(keyDate(d))){n++;d.setDate(d.getDate()-1)}return n}
function renderStats(){$("#todaySessions").textContent=today().length;$("#streakValue").textContent=streak();$("#totalMinutes").textContent=data.sessions.reduce((s,x)=>s+(Number(x.minutes)||0),0)}
function renderWeek(){const grid=$("#weekGrid");grid.innerHTML="";const labels=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],now=new Date(),first=new Date(now);first.setDate(now.getDate()-now.getDay());first.setHours(0,0,0,0);for(let i=0;i<7;i++){const d=new Date(first);d.setDate(first.getDate()+i);const k=keyDate(d),count=data.sessions.filter(s=>s.date===k).length,el=document.createElement("div");el.className="week-day"+(k===keyDate()?" is-today":"")+(count?" has-session":"");const l=document.createElement("span");l.className="week-label";l.textContent=labels[d.getDay()];const dot=document.createElement("span");dot.className="week-dot";dot.textContent=count?count:"·";el.append(l,dot);grid.append(el)}}
function renderHistory(){const list=$("#historyList");list.innerHTML="";const items=[...data.sessions].reverse().slice(0,12);if(!items.length){const p=document.createElement("p");p.className="empty-history";p.textContent="Your completed sessions will appear here.";list.append(p);return}items.forEach(s=>{const row=document.createElement("div");row.className="history-item";const details=document.createElement("div");details.className="history-details";const title=document.createElement("strong");title.textContent=s.name||"Meditation";const date=document.createElement("span");date.textContent=s.date||"";details.append(title,date);const mins=document.createElement("span");mins.className="history-duration";mins.textContent=(s.minutes||0)+" min";row.append(details,mins);list.append(row)})}
function renderGoal(){const count=today().length;$("#goalValue").textContent=data.dailyGoal;$("#goalProgressText").textContent=`${count} / ${data.dailyGoal} sessions today`;$("#goalProgressFill").style.width=Math.min(100,count/data.dailyGoal*100)+"%"}
function render(){renderStats();renderWeek();renderHistory();renderGoal()}
$("#goalMinus").addEventListener("click",()=>{data.dailyGoal=Math.max(1,data.dailyGoal-1);save();renderGoal()});
$("#goalPlus").addEventListener("click",()=>{data.dailyGoal=Math.min(20,data.dailyGoal+1);save();renderGoal()});
$("#ambientSetting").addEventListener("change",e=>{if(!e.target.checked)music.pause();else if(running)playMusic()});
$("#clearHistoryBtn").addEventListener("click",()=>{if(!confirm("Clear all saved meditation history? This cannot be undone."))return;data.sessions=[];save();render();toast("History cleared.")});
$("#exportBtn").addEventListener("click",()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="stillspace-progress.json";a.click();URL.revokeObjectURL(url);toast("Progress exported.")});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&running)tick()});
updateTimer();resetOrb();render();
