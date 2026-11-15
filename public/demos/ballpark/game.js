"use strict";
/* ---------------- Question bank: stable facts with numeric answers ---------------- */
const QUESTIONS = [
  {q:"How many keys are on a standard piano?", a:88},
  {q:"How many bones are in the adult human body?", a:206},
  {q:"In what year did the Berlin Wall fall?", a:1989},
  {q:"How many member states are in the United Nations?", a:193},
  {q:"How tall is Mount Everest, in meters?", a:8849},
  {q:"At sea level, water boils at how many degrees Fahrenheit?", a:212},
  {q:"In what year was the first iPhone released?", a:2007},
  {q:"How long is a marathon, in miles?", a:26.2},
  {q:"In what year did the Titanic sink?", a:1912},
  {q:"How many teeth are in a full adult set, wisdom teeth included?", a:32},
  {q:"How many seconds are in one day?", a:86400},
  {q:"In what year did humans first land on the Moon?", a:1969},
  {q:"How many elements are on the periodic table?", a:118},
  {q:"How many hearts does an octopus have?", a:3},
  {q:"How many justices sit on the U.S. Supreme Court?", a:9},
  {q:"In what year was William Shakespeare born?", a:1564},
  {q:"How many countries are in Africa (UN members)?", a:54},
  {q:"In what year did the Wright brothers make their first powered flight?", a:1903},
  {q:"How many bones are in one human hand?", a:27},
  {q:"How many feet are in a mile?", a:5280},
  {q:"How many amendments does the U.S. Constitution have?", a:27},
  {q:"How many minutes are in a week?", a:10080},
  {q:"At what temperature do Fahrenheit and Celsius read the same?", a:-40},
  {q:"In what year was the Eiffel Tower completed?", a:1889},
  {q:"How many U.S. states border Canada?", a:13},
  {q:"What is a perfect score in ten-pin bowling?", a:300},
  {q:"How long is an Olympic swimming pool, in meters?", a:50},
  {q:"In what year were the first modern Olympic Games held?", a:1896},
  {q:"How many squares are on a chessboard?", a:64},
  {q:"How many moons does Mars have?", a:2},
  {q:"How many players does each team have on the field in soccer?", a:11},
  {q:"How many time zones does Russia span?", a:11},
  {q:"Roughly how far is the Moon from Earth on average, in miles?", a:238900},
  {q:"Light travels about how many kilometers in one second?", a:299792},
  {q:"How many strings does a violin have?", a:4},
  {q:"How many hours are in a non-leap year?", a:8760},
];
const ROUNDS = 8, ROUND_MS = 35000, MAX_PLAYERS = 8;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOCAL = new URLSearchParams(location.search).has("local"); // same-browser test mode, no network

/* ---------------- helpers ---------------- */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt = (n, q) => esc(Number(n).toLocaleString("en-US", {maximumFractionDigits: 2, useGrouping: !/\byear\b/i.test(q||"")})); // no "1,903" for years
const parseGuess = s => { const t = String(s).replace(/[,\s]/g, ""); if (!/^-?\d*\.?\d+$/.test(t)) return null; const n = Number(t); return Number.isFinite(n) ? n : null; };
const randCode = () => Array.from({length:4}, () => CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)]).join("");
const shuffle = a => { a = a.slice(); for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
/* ---------------- untrusted input ----------------
   The relay is public, so anyone who knows the room code can publish to its topics. Every game
   state is checked against a strict schema and rebuilt from known fields before it is rendered,
   and every value that reaches innerHTML goes through esc().                                    */
const PHASES = ["lobby","question","reveal","final"];
const ID_RE = /^[0-9a-f]{32}$/;    // player ids are key fingerprints, see "identity" below
const isId = x => typeof x==="string" && ID_RE.test(x);
const isStr = (x, max) => typeof x==="string" && x.length<=max;
const isInt = (x, lo, hi) => Number.isInteger(x) && x>=lo && x<=hi;
const isNum = (x, lo, hi) => typeof x==="number" && Number.isFinite(x) && x>=lo && x<=hi;
const isObj = x => !!x && typeof x==="object" && !Array.isArray(x);
const MAXN = Number.MAX_VALUE;
function validPlayer(p){
  if(!isObj(p) || !isId(p.id) || !isStr(p.name,20) || !isInt(p.score,0,1e6) || !isInt(p.last,0,5)
     || typeof p.online!=="boolean" || typeof p.guessed!=="boolean") return null;
  return {id:p.id, name:p.name, score:p.score, last:p.last, online:p.online, guessed:p.guessed};
}
function validResult(x){
  if(!isObj(x) || !isId(x.id) || !isStr(x.name,20) || !isInt(x.pts,0,5)) return null;
  const missed = x.guess===null;
  if(missed ? (x.diff!==null || x.place!==null)
            : (!isNum(x.guess,-MAXN,MAXN) || !isNum(x.diff,0,MAXN) || !isInt(x.place,1,MAX_PLAYERS))) return null;
  return {id:x.id, name:x.name, guess:x.guess, diff:x.diff, place:x.place, pts:x.pts};
}
/* returns a clean copy of a game state, or null if anything is missing, mistyped or out of range */
function validState(s){
  if(!isObj(s) || typeof s.code!=="string" || !/^[A-Z]{4}$/.test(s.code) || !PHASES.includes(s.phase) || !isId(s.host)) return null;
  if(!isInt(s.total,1,100) || !isInt(s.round,0,s.total) || !isInt(s.v,0,Number.MAX_SAFE_INTEGER) || !isNum(s.msLeft,0,ROUND_MS)) return null;
  if(!Array.isArray(s.players) || s.players.length<1 || s.players.length>MAX_PLAYERS) return null;
  const players = s.players.map(validPlayer);
  if(players.includes(null) || new Set(players.map(p=>p.id)).size!==players.length) return null;
  const needQ = s.phase==="question" || s.phase==="reveal";
  if(needQ ? !(isStr(s.q,300) && s.q) : !(s.q===null || isStr(s.q,300))) return null;
  let reveal = null;
  if(s.phase==="reveal"){
    const r = s.reveal;
    if(!isObj(r) || !isNum(r.answer,-MAXN,MAXN) || !Array.isArray(r.results) || r.results.length>MAX_PLAYERS) return null;
    const results = r.results.map(validResult);
    if(results.includes(null)) return null;
    reveal = {answer:r.answer, results};
  }
  return {code:s.code, phase:s.phase, host:s.host, players, round:s.round, total:s.total,
          q:needQ ? s.q : null, msLeft:s.msLeft, reveal, v:s.v};
}
function savedName(){ try{ return localStorage.getItem("bp-name")||""; }catch(e){ return ""; } }
function saveName(n){ try{ localStorage.setItem("bp-name",n); }catch(e){} }

/* ---------------- identity: everything sent over the relay is signed ----------------
   Each tab makes an ECDSA P-256 key pair. The private key stays in this tab (sessionStorage, so a
   refresh keeps your seat) and is never published. A player's id is a fingerprint of their public
   key (first 128 bits of its SHA-256), so a seat is bound to one key and nobody else can sign for it.
   Players sign every message to the host with a fresh timestamp (the host drops anything not newer
   than the last one it accepted, so replays fail), and the host signs every state and dm. Players
   verify host messages against the fingerprint embedded in the invite.  */
const SIG = {name:"ECDSA", namedCurve:"P-256"}, SIGN = {name:"ECDSA", hash:"SHA-256"};
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const utf8 = s => new TextEncoder().encode(s);
async function fingerprint(pubB64){
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", unb64(pubB64)));
  return Array.from(h.slice(0,16), b => b.toString(16).padStart(2,"0")).join("");
}
let ME = "", MYPUB = "", MYKEY = null;
async function loadIdentity(){
  let kp = null;
  try{
    const saved = JSON.parse(sessionStorage.getItem("bp-id"));
    if(saved) kp = {privateKey: await crypto.subtle.importKey("jwk", saved.priv, SIG, false, ["sign"]),
                    publicKey: await crypto.subtle.importKey("jwk", saved.pub, SIG, true, ["verify"])};
  }catch(e){ kp = null; }
  if(!kp){
    kp = await crypto.subtle.generateKey(SIG, true, ["sign","verify"]);
    try{ sessionStorage.setItem("bp-id", JSON.stringify({priv: await crypto.subtle.exportKey("jwk", kp.privateKey),
                                                         pub: await crypto.subtle.exportKey("jwk", kp.publicKey)})); }catch(e){}
  }
  MYKEY = kp.privateKey;
  MYPUB = b64(await crypto.subtle.exportKey("raw", kp.publicKey));
  ME = await fingerprint(MYPUB);
}
const identity = loadIdentity();
identity.catch(()=>{});  // reported when hosting or joining
/* a signed envelope: b is the JSON body, g the signature over it, k the signer's public key */
async function seal(body){
  const b = JSON.stringify(body);
  return {b, g: b64(await crypto.subtle.sign(SIGN, MYKEY, utf8(b))), k: MYPUB};
}
/* returns the parsed body if env is validly signed by the key it names and that key's fingerprint is
   expectId (or the key is exactly expectKey); otherwise null */
async function unseal(env, {expectId, expectKey}){
  try{
    if(!isObj(env) || !isStr(env.b,20000) || !isStr(env.g,200) || !isStr(env.k,200)) return null;
    if(expectKey ? env.k!==expectKey : (await fingerprint(env.k))!==expectId) return null;
    if(!(await crypto.subtle.verify(SIGN, await crypto.subtle.importKey("raw",unb64(env.k),SIG,false,["verify"]), unb64(env.g), utf8(env.b)))) return null;
    return JSON.parse(env.b);
  }catch(e){ return null; }
}

/* The invite pins the host signing key and a random 256-bit room namespace.
   MQTT is a relay: only fresh signed host messages establish room state. */
const BROKER = "wss://broker.emqx.io:8084/mqtt";
const INVITE_RE = /^([A-HJ-NP-Z]{4})\.([A-Za-z0-9_-]{43})\.([0-9a-f]{32})$/;
const MAX_FRAME = 24000, STATE_MS = 8000, LEASE_MS = 45000;
const ECDH = {name:"ECDH", namedCurve:"P-256"};
const decoder = new TextDecoder("utf-8", {fatal:true});
const inviteText = location.hash.slice(1);
async function roomFor(invite){
  const parts = INVITE_RE.exec(invite);
  if(!parts) return null;
  const [,code, secret, host] = parts;
  const digest = await crypto.subtle.digest("SHA-256", utf8(secret));
  return {code, host, invite, id:b64(digest).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
}
async function newRoom(){
  const secret = b64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  return roomFor(randCode()+"."+secret+"."+ME);
}
const topic = (room, type) => `ballpark-ia/v2/${room.id}/${type}`;
function decodeFrame(raw){
  if(!raw || raw.length > MAX_FRAME) return null;
  try{ return JSON.parse(typeof raw==="string" ? raw : decoder.decode(raw)); }
  catch(e){ return null; }
}
function readBody(env, limit){
  if(!isObj(env) || !isStr(env.b,limit) || !isStr(env.k,88) || env.k.length!==88 ||
     !isStr(env.g,88) || env.g.length!==88) return null;
  return decodeFrame(env.b);
}
async function connect(subscriptions, onMessage, onConnect){
  const c = mqtt.connect(BROKER, {
    clientId:"bp_"+crypto.randomUUID(), clean:true, keepalive:15,
    reconnectPeriod:2000, connectTimeout:10000, queueQoSZero:false
  });
  c.on("error", ()=>{});
  c.on("message", (tp, bytes) => {
    // Limit parsing before allocating JSON objects on untrusted topics.
    if(bytes.length<=MAX_FRAME) onMessage(tp, bytes);
  });
  let timer;
  try{
    await new Promise((resolve,reject)=>{
      timer=setTimeout(()=>reject(new Error("relay connection timed out")),12000);
      c.once("connect", ()=>{
        c.subscribe(subscriptions, {qos:0}, error=>error ? reject(error) : resolve());
      });
    });
    c.on("connect", onConnect);
    return {
      send: (tp, env, retain=false, callback) => {
        if(c.connected) c.publish(tp, JSON.stringify(env), {qos:0, retain}, callback);
        else if(callback) callback();
      },
      close: () => c.end()
    };
  }catch(e){ c.end(true); throw e; }
  finally{ clearTimeout(timer); }
}
function localTransport(room, onMessage){
  const ch = new BroadcastChannel("bp-"+room.id);
  ch.onmessage = ({data}) => {
    if(isObj(data) && isStr(data.tp,128) && isStr(data.raw,MAX_FRAME)) onMessage(data.tp,data.raw);
  };
  return {
    send: (tp, env, _retain, callback) => {
      ch.postMessage({tp,raw:JSON.stringify(env)});
      if(callback) callback();
    },
    close: () => ch.close()
  };
}
async function openHost(room, onUp, announce){
  const up = topic(room,"up"), state = topic(room,"state");
  const receive = (tp, bytes) => { if(tp===up) onUp(bytes); };
  const relay = LOCAL ? localTransport(room,receive) : await connect([up],receive,announce);
  return {
    state: env => relay.send(state,env,true),
    dm: (id,env) => relay.send(topic(room,"dm/"+id),env),
    close: env => relay.send(state,env,true,()=>relay.close())
  };
}
async function openClient(room, h){
  const up = topic(room,"up"), state = topic(room,"state"), dm = topic(room,"dm/"+ME);
  const receive = (tp, bytes) => {
    if(tp===state) h.state(bytes);
    else if(tp===dm) h.dm(bytes);
  };
  const relay = LOCAL ? localTransport(room,receive) : await connect([state,dm],receive,h.reconnected);
  return {send: env=>relay.send(up,env), close:relay.close};
}

/* Encrypt guesses to the host's ECDH key from signed room state. Neither the
   relay nor another invite holder can read a guess before the host reveals it. */
async function guessKey(privateKey, encodedPublicKey){
  const publicKey = await crypto.subtle.importKey("raw",unb64(encodedPublicKey),ECDH,false,[]);
  return crypto.subtle.deriveKey({name:"ECDH",public:publicKey},privateKey,
    {name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
async function protectGuess(n){
  const keys = await crypto.subtle.generateKey(ECDH,true,["deriveKey"]);
  const k = await guessKey(keys.privateKey,hostEncryptionKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return {pub:b64(await crypto.subtle.exportKey("raw",keys.publicKey)), iv:b64(iv),
    ct:b64(await crypto.subtle.encrypt({name:"AES-GCM",iv},k,utf8(JSON.stringify(n))))};
}
async function readGuess(v, privateKey){
  if(!isObj(v) || !isStr(v.pub,88) || v.pub.length!==88 ||
     !isStr(v.iv,16) || v.iv.length!==16 || !isStr(v.ct,80)) return null;
  try{
    const k = await guessKey(privateKey,v.pub);
    const raw = await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(v.iv)},k,unb64(v.ct));
    const n = JSON.parse(decoder.decode(raw));
    return typeof n==="number" && Number.isFinite(n) ? n : null;
  }catch(e){ return null; }
}

/* ---------------- app state ---------------- */
let view = {screen:"home", error:"", invite:INVITE_RE.test(inviteText) ? inviteText : ""};
let pub = null, net = null, room = null, isHost = false;
let tick = null, recvAt = 0, myName = "", joinTimer = null, heartbeat = null, hostTimer = null;
let hostEncryptionKey = null, hostKey = null, hostSeq = 0, verifyingState = false, verifyingDM = false;
let pendingGuess = null;

const Host = {
  code:null, t:null, s:null, guesses:{}, deck:[], timer:null, seen:{}, lastTs:{},
  inbox:Promise.resolve(), pending:0, slots:24, refill:0, seq:0, publishing:false, dirty:false,
  async start(name){
    room = await newRoom();
    this.code = room.code;
    const keys = await crypto.subtle.generateKey(ECDH,true,["deriveKey"]);
    this.encryptionKey = keys.privateKey;
    this.encryptionPub = b64(await crypto.subtle.exportKey("raw",keys.publicKey));
    this.t = await openHost(room, raw=>this.onUp(raw), ()=>this.announce().catch(()=>{}));
    this.s = {code:this.code, phase:"lobby", host:ME, players:[{id:ME,name,score:0,online:true,guessed:false,last:0}], round:0, total:ROUNDS, q:null, msLeft:0, reveal:null, v:0};
    isHost = true;
    this.push();
    setInterval(()=>{ this.sweep(); this.announce().catch(()=>{}); }, STATE_MS);
    addEventListener("pagehide", ()=>{
      const last = this.closedFrame;
      if(last) this.t.close(last);
    }, {once:true});
  },
  onUp(raw){
    const now = performance.now();
    this.slots = Math.min(24,this.slots+(now-this.refill)*0.012);
    this.refill = now;
    if(!this.s || this.pending>=16 || this.slots<1 || raw.length>2048) return;
    this.slots--; this.pending++;
    this.inbox = this.inbox.then(()=>this.receive(decodeFrame(raw))).catch(()=>{}).finally(()=>{ this.pending--; });
  },
  async receive(env){
    const m = readBody(env,1024);
    if(!isObj(m) || m.room!==room.id || !isId(m.from) || m.from===ME ||
       !["join","hb","bye","guess"].includes(m.t)) return;
    const key = m.from;
    const p = this.s.players.find(p=>p.id===key);
    if(!p && m.t!=="join") return;
    if(!isInt(m.ts,1,Number.MAX_SAFE_INTEGER) || !fresh(m.ts) || m.ts<=(this.lastTs[key]||0)) return;
    if(m.t==="join" && !isStr(m.name,20)) return;
    if(!(await unseal(env,{expectId:key}))) return;
    if(m.t==="join" && !p && this.s.players.length>=MAX_PLAYERS){
      this.t.dm(key,await seal({t:"full", to:key, room:room.id, at:Date.now()}));
      return;
    }
    this.lastTs[key] = m.ts;
    this.seen[key] = Date.now();
    if(m.t==="join"){
      const name = m.name.trim() || "Player";
      if(!p) this.s.players.push({id:key,name,score:0,online:true,guessed:false,last:0});
      else { p.online=true; p.name=name; }
      this.push();
    } else if(m.t==="guess"){
      if(this.s.phase!=="question" || m.round!==this.s.round || !p.online || key in this.guesses) return;
      const n = await readGuess(m.v,this.encryptionKey);
      if(n!==null && this.s.phase==="question" && m.round===this.s.round) this.guess(key,n);
    } else if(m.t==="hb"){
      if(!p.online){ p.online=true; this.push(); }
    } else if(m.t==="bye"){ p.online=false; this.push(); this.maybeReveal(); }
  },
  sweep(){
    let changed=false; const now=Date.now();
    this.s.players = this.s.players.filter(p=>{
      if(p.id===ME) return true;
      const age = now-(this.seen[p.id]||0);
      // Finish scoring a round before removing a disconnected player.
      if(age>LEASE_MS && this.s.phase!=="question" && this.s.phase!=="reveal"){
        delete this.seen[p.id]; delete this.lastTs[p.id]; delete this.guesses[p.id];
        changed=true; return false;
      }
      if(p.online && age>20000){ p.online=false; changed=true; }
      return true;
    });
    if(changed){ this.push(); this.maybeReveal(); }
  },
  online(){ return this.s.players.filter(p=>p.online); },
  begin(){
    if(this.online().length<2) return;
    this.deck = shuffle(QUESTIONS).slice(0,ROUNDS);
    this.s.players.forEach(p=>{p.score=0;p.last=0;});
    this.s.round=0; this.next();
  },
  next(){
    if(this.s.round>=ROUNDS){ this.s.phase="final"; this.s.q=null; this.push(); return; }
    const item = this.deck[this.s.round];
    this.s.phase="lobby"; this.sweep();
    this.s.round++; this.s.phase="question"; this.s.q=item.q; this.s.reveal=null;
    this.guesses={}; this.s.players.forEach(p=>{p.guessed=false;p.last=0;});
    this.deadline = Date.now()+ROUND_MS;
    clearTimeout(this.timer); this.timer=setTimeout(()=>this.doReveal(), ROUND_MS);
    this.push();
  },
  guess(key, v){
    if(this.s.phase!=="question") return;
    const n = typeof v==="number" && Number.isFinite(v) ? v : null;
    const p = this.s.players.find(p=>p.id===key);
    if(n===null || !p || key in this.guesses) return;
    this.guesses[key]=n; p.guessed=true; this.push(); this.maybeReveal();
  },
  maybeReveal(){
    if(this.s.phase==="question" && this.online().every(p=>p.id in this.guesses)) this.doReveal();
  },
  doReveal(){
    if(this.s.phase!=="question") return;
    clearTimeout(this.timer);
    const a = this.deck[this.s.round-1].a;
    const rows = this.s.players.map(p=>({id:p.id,name:p.name,guess:(p.id in this.guesses)?this.guesses[p.id]:null}));
    const guessed = rows.filter(r=>r.guess!==null).map(r=>({...r,diff:Math.abs(r.guess-a)})).sort((x,y)=>x.diff-y.diff);
    // standard competition ranking: ties share a place
    let place=0, prev=null;
    guessed.forEach((r,i)=>{ if(prev===null||r.diff!==prev){place=i+1;prev=r.diff;} r.place=place; r.pts=(place===1?3:place===2?1:0)+(r.diff===0?2:0); });
    const missed = rows.filter(r=>r.guess===null).map(r=>({...r,diff:null,place:null,pts:0}));
    const results = guessed.concat(missed);
    results.forEach(r=>{ const p=this.s.players.find(p=>p.id===r.id); p.score+=r.pts; p.last=r.pts; });
    this.s.phase="reveal"; this.s.reveal={answer:a, results};
    this.push();
  },
  push(){
    this.s.msLeft = this.s.phase==="question" ? Math.max(0,this.deadline-Date.now()) : 0;
    this.s.v++;
    const snap = JSON.parse(JSON.stringify(this.s));
    this.announce().catch(()=>{});
    onState(snap);
  },
  async announce(){
    if(!this.s) return;
    this.dirty=true;
    if(this.publishing) return;
    this.publishing=true;
    try{
      while(this.dirty){
        this.dirty=false;
        const seq=++this.seq, at=Date.now();
        const state={...this.s,msLeft:this.s.phase==="question"?Math.max(0,this.deadline-at):0};
        const env=await seal({room:room.id,seq,at,state,key:this.encryptionPub});
        this.closedFrame=await seal({room:room.id,seq:seq+1,at,closed:true});
        this.t.state(env);
      }
    }finally{ this.publishing=false; }
  }
};

function fresh(at){
  return isInt(at,1,Number.MAX_SAFE_INTEGER) && Math.abs(Date.now()-at)<=LEASE_MS;
}
function stopClient(){
  clearInterval(joinTimer); clearInterval(heartbeat); clearTimeout(hostTimer);
  joinTimer=heartbeat=hostTimer=null;
  if(net) net.close();
  net=null; pendingGuess=null;
}
function endRoom(){
  stopClient();
  view.screen="ended"; render();
}
async function onSignedState(raw){
  if(verifyingState) return;
  const env=decodeFrame(raw), m=readBody(env,20000);
  if(!isObj(m) || m.room!==room.id || !fresh(m.at) ||
     !isInt(m.seq,hostSeq+1,Number.MAX_SAFE_INTEGER)) return;
  const state=m.closed===true ? null : validState(m.state);
  if(m.closed!==true && (!state || state.host!==room.host || state.code!==room.code ||
     !isStr(m.key,88) || m.key.length!==88 || (hostEncryptionKey && m.key!==hostEncryptionKey))) return;
  verifyingState=true;
  try{
    if(!(await unseal(env,{expectKey:hostKey,expectId:room.host}))) return;
    hostKey=env.k; hostSeq=m.seq;
    if(m.closed===true){ endRoom(); return; }
    hostEncryptionKey=m.key;
    clearTimeout(hostTimer); hostTimer=setTimeout(endRoom,LEASE_MS);
    onState(state);
  }finally{ verifyingState=false; }
}
let lastTs = 0, outbox = Promise.resolve(), sending=0;
const nextTs = () => (lastTs = Math.max(lastTs+1, Date.now()));
function sendUp(d){
  const transport=net, currentRoom=room;
  if(!transport || sending>=4) return;
  sending++;
  outbox=outbox.then(async()=>{
    if(transport!==net) return;
    transport.send(await seal({...d, from:ME, room:currentRoom.id, ts:nextTs()}));
  }).catch(()=>{}).finally(()=>{ sending--; });
}
function onState(raw){
  const s=validState(raw);
  if(!s || s.code!==room.code || (pub && s.v<=pub.v)) return;
  pub=s; recvAt=Date.now(); view.error="";
  if(!isHost){
    const player=s.players.find(p=>p.id===ME);
    if(!player){ if(view.screen==="game") endRoom(); return; }
    if(player.guessed || s.phase!=="question" || pendingGuess?.round!==s.round) pendingGuess=null;
    clearInterval(joinTimer); joinTimer=null;
  }
  view.screen="game";
  try{ history.replaceState(null,"","#"+room.invite); }catch(e){}
  render();
}
async function hostGame(){
  const name = ($("#name").value||"").trim();
  if(!name){ view.error="Enter your name first."; return render(); }
  saveName(name); view.screen="connecting"; render();
  try{ await identity; }catch(e){ view.screen="home"; view.error="This browser can't sign game messages. Open the game over https in a current browser."; return render(); }
  try{ await Host.start(name.slice(0,20)); }
  catch(e){ view.screen="home"; view.error="Couldn't open a game room. Check your connection and try again."; render(); }
}
async function joinGame(){
  const name=($("#name").value||"").trim();
  const pasted=($("#code").value||"").trim();
  const invite=pasted.includes("#") ? pasted.split("#").at(-1) : pasted;
  if(!name){ view.error="Enter your name first."; return render(); }
  if(!INVITE_RE.test(invite)){ view.error="Paste the full invite link from your host."; return render(); }
  saveName(name); myName=name.slice(0,20); view.invite=invite; view.screen="connecting"; render();
  stopClient();
  hostKey=hostEncryptionKey=pub=null; hostSeq=0;
  try{
    await identity;
    room=await roomFor(invite);
    net=await openClient(room,{
      state:onSignedState,
      dm:async raw=>{
        if(verifyingDM || view.screen!=="connecting") return;
        const env=decodeFrame(raw), m=readBody(env,1024);
        if(!m || m.t!=="full" || m.to!==ME || m.room!==room.id || !fresh(m.at)) return;
        verifyingDM=true;
        try{
          if(!(await unseal(env,{expectKey:hostKey,expectId:room.host}))) return;
          stopClient(); view.screen="home"; view.error="That game is full (8 players max)."; render();
        }finally{ verifyingDM=false; }
      },
      reconnected:()=>sendUp({t:"join",name:myName})
    });
    const hello=()=>sendUp({t:"join",name:myName});
    hello(); joinTimer=setInterval(hello,3000);
    heartbeat=setInterval(()=>{
      sendUp({t:"hb"});
      if(pendingGuess) sendUp(pendingGuess);
    },2500);
    addEventListener("pagehide",()=>stopClient(),{once:true});
    const joined=net;
    setTimeout(()=>{
      if(net===joined && view.screen==="connecting"){
        stopClient(); view.screen="home";
        view.error="The host didn't respond. Ask for a fresh invite."; render();
      }
    },15000);
  }catch(e){
    stopClient(); view.screen="home";
    view.error="Couldn't join the game. Check your connection and invite."; render();
  }
}
async function sendGuess(){
  const v=parseGuess($("#guess").value);
  if(v===null){ $("#gerr").textContent="Type a number, like 1200 or 26.2"; return; }
  if(isHost){ Host.guess(ME,v); return; }
  if(!hostEncryptionKey || !net || pendingGuess) return;
  const button=$("#gBtn"), round=pub.round;
  button.disabled=true; button.textContent="Sending…";
  try{
    const value=await protectGuess(v);
    if(!net || pub.phase!=="question" || pub.round!==round) return;
    pendingGuess={t:"guess",round,v:value};
    sendUp(pendingGuess);
  }catch(e){
    button.disabled=false; button.textContent="Lock guess";
    if($("#gerr")) $("#gerr").textContent="Couldn't protect that guess. Try again.";
  }
}
function copyLink(){
  const link = location.origin+location.pathname+location.search+"#"+room.invite;
  const btn=$("#copy");
  const done=()=>{btn.textContent="Copied"; setTimeout(()=>btn.textContent="Copy",1500);};
  if(navigator.clipboard) navigator.clipboard.writeText(link).then(done,()=>{});
}

/* ---------------- rendering ---------------- */
const RULES = `<ol class="rules">
  <li><span>One player hosts and shares a private invite link. Everyone else opens that link to join on their own phone or computer.</span></li>
  <li><span>Each round shows a question whose answer is a number. Type your best guess before the 35-second clock runs out. Guesses stay hidden until everyone is in.</span></li>
  <li><span>Closest guess scores <b>3 points</b>, second closest scores <b>1</b>. Hit the answer exactly for <b>+2 bonus</b>. Ties share the place.</span></li>
  <li><span>After ${ROUNDS} rounds, the highest score wins.</span></li>
</ol>`;

function render(){
  const app=$("#app"); clearInterval(tick);
  const head = `<div class="brand"><h1 class="lit">Ballpark</h1><small>Closest guess wins</small></div>`;
  if(view.screen==="home"){
    app.innerHTML = `${head}
    <section class="panel">
      <label for="name">Your name<input id="name" maxlength="20" autocomplete="nickname" value="${esc(savedName())}" placeholder="e.g. Jordan"></label>
      <button id="hostBtn">Host a new game</button>
    </section>
    <section class="panel">
      <span class="eyebrow">Have an invite?</span>
      <div class="row">
        <input id="code" maxlength="256" autocomplete="off" spellcheck="false" aria-label="Invite link" placeholder="Paste invite link" value="${esc(view.invite)}">
        <button id="joinBtn" class="ghost">Join game</button>
      </div>
    </section>
    <p class="err" role="alert">${esc(view.error)}</p>
    <section class="panel"><h2>How to play</h2>${RULES}<p class="note">2 to 8 players, each on their own device.</p></section>
    <footer>Ballpark · a party game of educated guesses</footer>`;
    $("#hostBtn").onclick=hostGame; $("#joinBtn").onclick=joinGame;
    $("#code").onkeydown=e=>{ if(e.key==="Enter") joinGame(); };
    return;
  }
  if(view.screen==="connecting"){ app.innerHTML=`${head}<section class="panel"><div class="waiting"><span class="dot"></span>Connecting…</div></section>`; return; }
  if(view.screen==="ended"){
    app.innerHTML=`${head}<section class="panel"><h2>Room disconnected</h2><p class="note">The host closed the room or could no longer be reached. Start a new one any time.</p><button id="home">Back to start</button></section>`;
    $("#home").onclick=()=>{ location.hash=""; location.reload(); }; return;
  }
  const s=pub, me=s.players.find(p=>p.id===ME);
  const playerList = (showGuess)=>`<ul class="players">${s.players.map(p=>`<li>
      <span class="name">${esc(p.name)}${p.id===ME?'<span class="you">YOU</span>':''}${p.id===s.host?' <span class="tag">host</span>':''}</span>
      ${!p.online?'<span class="tag off">offline</span>': showGuess ? (p.guessed?'<span class="tag ok">locked in</span>':'<span class="tag">thinking…</span>') : `<span class="score">${esc(p.score)}</span>`}
    </li>`).join("")}</ul>`;

  if(s.phase==="lobby"){
    const n = s.players.filter(p=>p.online).length;
    app.innerHTML = `${head}
    <section class="panel" style="text-align:center">
      <span class="eyebrow">Room code</span>
      <div class="bigcode">${esc(s.code)}</div>
      <div class="share"><code>${esc(location.origin+location.pathname+location.search+"#"+room.invite)}</code><button id="copy" class="ghost">Copy</button></div>
      <p class="note">Share this link only with players you want to invite. A room code alone cannot join a game.</p>
    </section>
    <section class="panel">
      <div class="meta"><h2>Players</h2><span class="tag">${n} / ${MAX_PLAYERS}</span></div>
      ${playerList(false)}
      ${isHost ? `<button id="startBtn" ${n<2?"disabled":""}>Start game</button>${n<2?'<p class="note">Waiting for at least one more player to join.</p>':''}`
               : `<div class="waiting"><span class="dot"></span>Waiting for the host to start…</div>`}
    </section>
    <section class="panel"><h2>How to play</h2>${RULES}</section>`;
    $("#copy").onclick=copyLink; if(isHost) $("#startBtn").onclick=()=>Host.begin();
    return;
  }
  if(s.phase==="question"){
    const deadline = recvAt + s.msLeft;
    const locked = me && me.guessed;
    app.innerHTML = `${head}
    <section class="panel">
      <div class="meta"><span class="eyebrow">Round ${esc(s.round)} of ${esc(s.total)}</span><span id="clock" class="clock">35</span></div>
      <p class="q">${esc(s.q)}</p>
      ${locked ? `<div class="waiting"><span class="dot"></span>Guess locked in. Waiting for the others…</div>`
      : `<label for="guess">Your guess<input id="guess" inputmode="decimal" autocomplete="off" placeholder="Type a number"></label>
         <button id="gBtn">Lock in guess</button><p id="gerr" class="err" role="alert"></p>`}
    </section>
    <section class="panel">${playerList(true)}${isHost?'<button id="revealBtn" class="ghost">Reveal now</button>':''}</section>`;
    const clock=$("#clock");
    const upd=()=>{ const left=Math.max(0,Math.ceil((deadline-Date.now())/1000)); clock.textContent=left; clock.classList.toggle("low",left<=10); };
    upd(); tick=setInterval(upd,250);
    if(!locked){ $("#gBtn").onclick=sendGuess; const g=$("#guess"); g.onkeydown=e=>{if(e.key==="Enter")sendGuess();}; g.focus(); }
    if(isHost) $("#revealBtn").onclick=()=>Host.doReveal();
    return;
  }
  if(s.phase==="reveal"){
    const r=s.reveal, last=s.round>=s.total;
    app.innerHTML = `${head}
    <section class="panel">
      <span class="eyebrow">Round ${esc(s.round)} of ${esc(s.total)}</span>
      <p class="q">${esc(s.q)}</p>
      <div class="answer"><span class="eyebrow">The answer</span><span class="num lit">${fmt(r.answer, s.q)}</span></div>
      <div style="overflow-x:auto"><table>
        <thead><tr><th>Player</th><th class="r">Guess</th><th class="r">Off by</th><th class="r">Pts</th></tr></thead>
        <tbody>${r.results.map(x=>`<tr><td><span class="name">${esc(x.name)}</span>${x.id===ME?'<span class="you">YOU</span>':''}</td>
          <td class="r">${x.guess===null?'<span class="note">no guess</span>':fmt(x.guess, s.q)}</td>
          <td class="r">${x.diff===null?'–':x.diff===0?'<b class="lit">EXACT</b>':fmt(x.diff)}</td>
          <td class="r"><span class="pts">${x.pts?'+'+esc(x.pts):'0'}</span></td></tr>`).join("")}</tbody>
      </table></div>
    </section>
    <section class="panel"><div class="meta"><h2>Scoreboard</h2></div>${playerList(false)}
      ${isHost?`<button id="nextBtn">${last?"See final results":"Next question"}</button>`:`<div class="waiting"><span class="dot"></span>Waiting for the host to continue…</div>`}
    </section>`;
    if(isHost) $("#nextBtn").onclick=()=>Host.next();
    return;
  }
  if(s.phase==="final"){
    const ranked=[...s.players].sort((a,b)=>b.score-a.score);
    const top=ranked[0].score, winners=ranked.filter(p=>p.score===top);
    app.innerHTML = `${head}
    <section class="panel podium">
      <span class="eyebrow">Final whistle</span>
      <h2>${winners.length>1?"It's a tie":"Winner"}</h2>
      <div class="num lit">${winners.map(w=>esc(w.name)).join(" & ")}</div>
      <p class="note">${esc(top)} points over ${esc(s.total)} rounds</p>
    </section>
    <section class="panel"><h2>Standings</h2>${`<ul class="players">${ranked.map((p,i)=>`<li><span class="name">${i+1}. ${esc(p.name)}${p.id===ME?'<span class="you">YOU</span>':''}</span><span class="score">${esc(p.score)}</span></li>`).join("")}</ul>`}
      ${isHost?'<button id="againBtn">Play again</button>':'<div class="waiting"><span class="dot"></span>The host can start a rematch.</div>'}
    </section>`;
    if(isHost) $("#againBtn").onclick=()=>Host.begin();
  }
}

/* host closing the tab ends the game for everyone; warn first */
addEventListener("beforeunload", e => { if(isHost && pub && pub.phase!=="lobby"){ e.preventDefault(); e.returnValue=""; } });
render();
