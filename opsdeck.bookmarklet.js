(()=>{if(window.__opsdeck){alert('Opsdeck is already running. Press Ctrl+Shift+O.');return}window.__opsdeck=1;
const _f=document.createElement('iframe');_f.style.display='none';document.body.append(_f);const _ls=_f.contentWindow.localStorage;
const GM_getValue=(k,d)=>{try{return _ls.getItem('opsdeck_'+k)??d}catch{return d}};
const GM_setValue=(k,v)=>{try{_ls.setItem('opsdeck_'+k,v)}catch{}};
const GM_setClipboard=t=>navigator.clipboard.writeText(t).catch(()=>{const a=document.createElement('textarea');a.value=t;document.body.append(a);a.select();document.execCommand('copy');a.remove()});
const GM_notification=o=>{try{if(Notification.permission==='granted'){const n=new Notification(o.title,{body:o.text});n.onclick=o.onclick}else Notification.requestPermission()}catch{}};
const GM_xmlhttpRequest=o=>{fetch(o.url,{method:o.method,headers:o.headers,body:o.data}).then(r=>o.onload&&o.onload({status:r.status})).catch(()=>o.onerror&&o.onerror())};
const unsafeWindow=window;
(()=>{'use strict';
const W=unsafeWindow;
const TAGS=[{n:'High risk',c:'#ff6b7a'},{n:'Risk',c:'#f0b35a'},{n:'Verified',c:'#4fd1a1'},{n:'Trusted',c:'#6cb6ff'},{n:'Watch',c:'#c18bff'},{n:'Alt',c:'#8a92a8'}];
let S=Object.assign({tags:{},audits:[],words:[],alerts:[],watch:[],hook:'',tagDefs:TAGS},JSON.parse(GM_getValue('od','{}')||'{}'));
const save=()=>GM_setValue('od',JSON.stringify(S));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isId=s=>/^\d{17,20}$/.test(s),snow=id=>new Date(Number(BigInt(id)>>22n)+1420070400000);
const rxEsc=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const tdef=n=>S.tagDefs.find(t=>t.n===n)||{n,c:'#8a92a8'};
const copy=(t,l)=>{GM_setClipboard(String(t));toast('Copied '+(l||t))};
let toastT;const toast=m=>{if(!root)return;const t=root.querySelector('#ts');t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,2200)};
// ---------- Discord internals (found at runtime, like Vencord does) ----------
const St={};let wp,mods=[];
function wpInit(){try{const c=W.webpackChunkdiscord_app;if(!c)return false;if(!wp){c.push([[Symbol('od')],{},r=>{wp=r}]);c.pop()}mods=Object.values(wp.c||{});return mods.length>50}catch{return false}}
function find(f){for(const m of mods){let e;try{e=m&&m.exports}catch{continue}if(!e)continue;let c=[e];try{c.push(e.default,e.Z,e.ZP,e.A,...Object.values(e))}catch{}for(const x of c){try{if(x&&(typeof x==='object'||typeof x==='function')&&f(x))return x}catch{}}}}
let tries=0;const linker=setInterval(()=>{if(!wpInit()){if(++tries>90)clearInterval(linker);return}
 St.fd=St.fd||find(e=>typeof e.subscribe==='function'&&typeof e.dispatch==='function'&&typeof e.unsubscribe==='function');
 St.users=St.users||find(e=>e.getUser&&e.getCurrentUser&&e.getUsers);
 St.guilds=St.guilds||find(e=>e.getGuilds&&e.getGuild&&e.getGuildCount);
 St.chan=St.chan||find(e=>e.getChannel&&e.hasChannel);
 St.rest=St.rest||find(e=>e.getAPIBaseURL&&e.get&&e.post&&e.put&&e.patch&&e.del);
 if(St.fd&&St.users&&St.guilds&&!St.ok){St.ok=true;St.me=St.users.getCurrentUser();St.fd.subscribe('MESSAGE_CREATE',onMsg);clearInterval(linker);if(root)render()}},1500);
// ---------- data helpers ----------
const gname=g=>St.guilds?.getGuild(g)?.name||g,cname=c=>St.chan?.getChannel(c)?.name||c;
const av=(id,h)=>h?`https://cdn.discordapp.com/avatars/${id}/${h}.png?size=64`:`https://cdn.discordapp.com/embed/avatars/${isId(id)?Number((BigInt(id)>>22n)%6n):0}.png`;
function uinfo(id){const u=St.users?.getUser(id),s=S.tags[id]?.snap.at(-1);return{u:u?.username??s?.u??'',d:(u?.globalName??u?.global_name)??s?.d??'',a:u?.avatar??s?.a??''}}
function note(u){const e=S.tags[u.id];if(!e)return;const s={t:Date.now(),u:u.username,d:u.globalName??u.global_name??'',a:u.avatar||''},l=e.snap.at(-1);if(!l||l.u!==s.u||l.d!==s.d||l.a!==s.a){e.snap.push(s);save()}}
const ensure=id=>S.tags[id]||(S.tags[id]={tags:[],note:'',snap:[]});
const hits=t=>{const w=S.words.filter(Boolean);if(!w.length||!t)return[];const m=t.match(new RegExp('('+w.map(rxEsc).join('|')+')','gi'));return m?[...new Set(m.map(x=>x.toLowerCase()))]:[]};
let unread=0,last='';
function onMsg(ev){const m=ev.message;if(!m||!m.author||ev.optimistic)return;const g=ev.guildId||m.guild_id;if(!g)return;if(S.watch.length&&!S.watch.includes(g))return;note(m.author);
 const h=hits(m.content);if(!h.length||m.author.id===St.me?.id)return;
 const a={id:m.id,g,c:ev.channelId||m.channel_id,u:m.author.id,un:m.author.username,txt:(m.content||'').slice(0,500),w:h,t:Date.now()};
 S.alerts.unshift(a);S.alerts=S.alerts.slice(0,150);save();unread++;ping(a);badge();if(UI.open&&UI.tab==='alerts')render()}
function ping(a){try{GM_notification({title:'Flagged: '+a.w.join(', '),text:`${a.un} in #${cname(a.c)} (${gname(a.g)}): ${a.txt.slice(0,120)}`,timeout:7000,onclick:()=>W.open(`https://discord.com/channels/${a.g}/${a.c}/${a.id}`,'_blank')})}catch{}
 try{const x=new(W.AudioContext||W.webkitAudioContext)(),o=x.createOscillator();o.connect(x.destination);o.frequency.value=880;o.start();setTimeout(()=>o.stop(),160)}catch{}}
const badge=()=>{const b=root?.querySelector('#bd');if(b){b.textContent=unread||'';b.hidden=!unread}};
// ---------- page decoration (tags, ID buttons, red flagged words) ----------
const fprops=(el,pred)=>{const k=Object.keys(el).find(k=>k.startsWith('__reactFiber$'));let f=k&&el[k];for(let i=0;f&&i<60;i++,f=f.return){const p=f.memoizedProps;if(p&&typeof p==='object'&&pred(p))return p}};
const msgOf=li=>fprops(li,p=>p.message&&p.message.author)?.message;
function mkBar(id,key,mem){const s=document.createElement('span');s.className='od-bar'+(mem?' od-m':'');s.dataset.k=key;
 s.innerHTML=(S.tags[id]?.tags||[]).map(n=>`<i class="od-chip" style="--c:${tdef(n).c}">${esc(n)}</i>`).join('')+'<b data-a="id" title="Copy user ID">ID</b><b data-a="tag" title="Tag user">Tag</b><b data-a="aud" title="Audit card">Audit</b>';
 s.onclick=e=>{const a=e.target.dataset.a;if(!a)return;e.stopPropagation();e.preventDefault();last=id;if(a==='id')copy(id);else if(a==='tag')tagDlg(id);else{UI.pre={uid:id};open('audit')}};return s}
function decorate(){
 document.querySelectorAll('li[id^="chat-messages-"]').forEach(li=>{const hd=li.querySelector('h3[class*="header"]');if(!hd)return;const m=msgOf(li);if(!m)return;const u=m.author,e=S.tags[u.id],key=u.id+'|'+(e?e.tags.join(','):'');const b=hd.querySelector('.od-bar');if(b&&b.dataset.k===key)return;b&&b.remove();note(u);hd.append(mkBar(u.id,key))});
 document.querySelectorAll('[class^="member_"]').forEach(row=>{const p=fprops(row,p=>p.user&&p.user.id&&!p.message);if(!p)return;const id=p.user.id,e=S.tags[id],key=id+'|'+(e?e.tags.join(','):'');const b=row.querySelector('.od-bar');if(b&&b.dataset.k===key)return;b&&b.remove();row.append(mkBar(id,key,true))})}
function highlight(){const C=W.CSS;if(!C||!C.highlights||!W.Highlight)return;C.highlights.delete('od-flag');const w=S.words.filter(Boolean);if(!w.length)return;const rx=new RegExp(w.map(rxEsc).join('|'),'gi'),rs=[];
 document.querySelectorAll('[id^="message-content-"]').forEach(el=>{const tw=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n;while((n=tw.nextNode())){let m;rx.lastIndex=0;while((m=rx.exec(n.data))){if(!m[0])break;const r=document.createRange();r.setStart(n,m.index);r.setEnd(n,m.index+m[0].length);rs.push(r)}}});
 if(rs.length)C.highlights.set('od-flag',new W.Highlight(...rs))}
let obT;new MutationObserver(()=>{clearTimeout(obT);obT=setTimeout(()=>{try{decorate();highlight()}catch(e){console.warn('[Opsdeck]',e)}},250)}).observe(document.body,{childList:true,subtree:true});
document.addEventListener('mouseover',e=>{const li=e.target.closest&&e.target.closest('li[id^="chat-messages-"]');if(li){const m=msgOf(li);if(m)last=m.author.id}},true);
const st=document.createElement('style');st.textContent=`::highlight(od-flag){color:#ff5a6e;background-color:rgba(255,60,80,.28);text-decoration:underline wavy #ff5a6e}
.od-bar{display:inline-flex;gap:3px;margin-left:6px;vertical-align:middle;align-items:center}
.od-bar b{font:600 10px/1 sans-serif;padding:3px 5px;border-radius:5px;background:rgba(120,130,255,.25);color:#cfd5ff;cursor:pointer}.od-bar b:hover{background:rgba(120,130,255,.5)}
.od-chip{font:600 10px/1 sans-serif;font-style:normal;padding:3px 6px;border-radius:9px;border:1px solid var(--c);color:var(--c)}
.od-m{position:absolute;right:4px;top:50%;transform:translateY(-50%);display:none}[class^="member_"]:hover .od-m{display:inline-flex}@media(hover:none){.od-m{display:inline-flex}}`;document.head.append(st);
// ---------- panel ----------
const UI={open:false,tab:'tracked',tf:{sel:[],mode:'any',q:''},pre:{},sq:''};let host,root;
const CSS=`*{box-sizing:border-box}:host{all:initial}
#fab{position:fixed;left:80px;bottom:16px;z-index:99999;width:42px;height:42px;border-radius:14px;border:1px solid rgba(255,255,255,.3);background:linear-gradient(135deg,#8d9dff,#5865f2);color:#fff;font:700 13px sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.4)}
#bd{position:absolute;top:-6px;right:-6px;background:#ff4d6a;border-radius:10px;font:700 10px sans-serif;padding:2px 5px;font-style:normal}
#pn{position:fixed;right:12px;top:12px;bottom:12px;width:min(460px,calc(100vw - 24px));z-index:99998;display:flex;flex-direction:column;color:#fff;font:14px/1.45 "Segoe UI",system-ui,sans-serif;border-radius:20px;border:1px solid rgba(255,255,255,.25);background:linear-gradient(135deg,rgba(255,255,255,.12),rgba(8,12,26,.5)),rgba(10,16,32,.9);backdrop-filter:blur(18px);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 16px 50px rgba(0,0,0,.5)}
#pn[hidden],#ts[hidden]{display:none}
.hd{display:flex;gap:4px;padding:10px;flex-wrap:wrap;border-bottom:1px solid rgba(255,255,255,.15)}.hd button.on{background:rgba(255,255,255,.22)}
#bd2{padding:12px;overflow:auto;flex:1}
button{font:inherit;color:#fff;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:9px;padding:5px 10px;cursor:pointer}button:hover{border-color:#a9b8ff}
button.pri{background:linear-gradient(180deg,#c3ceff,#8d9dff);color:#0c1230;font-weight:600}button.dng{border-color:#ff7f8d;color:#ff7f8d}
input,select,textarea{width:100%;font:inherit;color:#fff;background:rgba(5,8,20,.65);border:1px solid rgba(255,255,255,.22);border-radius:9px;padding:7px 9px}textarea{min-height:64px;resize:vertical}select option{color:#111}
label{display:block;color:#dfe6f7;font-size:12px;margin:8px 0 3px}.mu{color:#dfe6f7}.bar{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.bar input{flex:1;min-width:120px}
.row{display:flex;gap:10px;align-items:center;padding:8px;border-radius:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.15);margin-bottom:6px}.row img{width:38px;height:38px;border-radius:50%}
.nm{flex:1;min-width:0}.nm small{display:block;color:#dfe6f7;font:12px monospace;overflow:hidden;text-overflow:ellipsis}.acts{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}.acts button{padding:3px 7px;font-size:12px}
.chip{display:inline-block;border:1px solid currentColor;border-radius:14px;padding:0 8px;font-size:11.5px;margin:3px 4px 0 0;cursor:pointer;background:rgba(0,0,0,.35)}.chip.off{opacity:.45}
.card{padding:10px;border-radius:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.15);margin-bottom:8px}.bad{border-color:#ff6b7a;background:rgba(80,10,25,.5)}.fl{color:#ff8d98;font-weight:700}
.ov{position:absolute;inset:0;background:rgba(5,8,20,.7);display:flex;align-items:flex-start;justify-content:center;padding-top:60px;border-radius:20px}.dlg{width:90%;padding:14px;border-radius:14px;background:#141a2c;border:1px solid rgba(255,255,255,.25)}
#ts{position:fixed;bottom:70px;left:80px;z-index:100000;background:#141a2c;border:1px solid #a9b8ff;border-radius:10px;padding:7px 12px;color:#fff;font:13px sans-serif}pre{background:rgba(0,0,0,.4);padding:8px;border-radius:8px;overflow:auto}`;
function build(){host=document.createElement('div');document.body.append(host);root=host.attachShadow({mode:'open'});
 root.innerHTML=`<style>${CSS}</style><button id="fab" title="Opsdeck (Ctrl+Shift+O)">OD<i id="bd" hidden></i></button><div id="pn" hidden></div><div id="ts" hidden></div>`;
 root.querySelector('#fab').onclick=()=>open();root.addEventListener('click',onClick);root.addEventListener('input',onInput);badge()}
function open(tab){if(tab)UI.tab=tab;UI.open=true;if(UI.tab==='alerts'){unread=0;badge()}root.querySelector('#pn').hidden=false;render()}
const toggleP=()=>{if(UI.open&&!root.querySelector('#pn').hidden){UI.open=false;root.querySelector('#pn').hidden=true}else open()};
const TABS=[['tracked','Tracked'],['search','Search'],['audit','Audit'],['alerts','Alerts'],['servers','Servers'],['tools','Tools'],['settings','Settings']];
function render(){const pn=root.querySelector('#pn');if(pn.hidden)return;
 pn.innerHTML=`<div class="hd">${TABS.map(t=>`<button data-tab="${t[0]}" class="${UI.tab===t[0]?'on':''}">${t[1]}</button>`).join('')}<span style="flex:1"></span><button data-a="close">✕</button></div><div id="bd2">${({tracked,search,audit,alerts,servers,tools,settings})[UI.tab]()}</div>`;
 if(UI.tab==='tracked')list()}
const chips=e=>(e?.tags||[]).map(n=>`<span class="chip" style="color:${tdef(n).c}">${esc(n)}</span>`).join('');
function row(id){const u=uinfo(id);return`<div class="row" data-id="${id}"><img src="${av(id,u.a)}" alt=""><div class="nm"><b>${esc(u.d||u.u||'Unknown user')}</b><small>${u.u?'@'+esc(u.u)+' · ':''}${id}</small><div>${chips(S.tags[id])}</div>${S.tags[id]?.note?`<small>${esc(S.tags[id].note)}</small>`:''}</div><div class="acts"><button data-a="id">ID</button><button data-a="men">@</button><button data-a="tag">Tag</button><button data-a="aud">Audit</button></div></div>`}
function tracked(){const T=UI.tf;return`<div class="card"><div>${S.tagDefs.map(t=>`<span class="chip ${T.sel.includes(t.n)?'':'off'}" data-a="ft" data-v="${esc(t.n)}" style="color:${t.c}">${esc(t.n)} (${Object.values(S.tags).filter(e=>e.tags.includes(t.n)).length})</span>`).join('')}</div><div class="bar"><input id="tq" placeholder="Search name, ID or note" value="${esc(T.q)}"><button data-a="fm">Match: ${T.mode}</button><button data-a="cps">Copy shown IDs</button></div></div><div id="tl"></div>`}
let shown=[];function list(){const T=UI.tf,q=T.q.toLowerCase();shown=Object.keys(S.tags).filter(id=>{const e=S.tags[id],u=uinfo(id),ok=!T.sel.length||(T.mode==='all'?T.sel.every(t=>e.tags.includes(t)):T.sel.some(t=>e.tags.includes(t)));return ok&&(!q||id.includes(q)||u.u.toLowerCase().includes(q)||u.d.toLowerCase().includes(q)||(e.note||'').toLowerCase().includes(q))});
 const el=root.querySelector('#tl');if(el)el.innerHTML=`<p class="mu">${shown.length} user(s)</p>`+(shown.map(id=>{const e=S.tags[id];return row(id)+(e.snap.length>1?`<p class="mu" style="font-size:12px;margin:-2px 0 8px 6px">${e.snap.slice(0,-1).map(s=>`was @${esc(s.u)}${s.d?' / '+esc(s.d):''}`).join(' → ')}</p>`:'')}).join('')||'<p class="mu">Nobody tagged yet. Use the Tag button next to any name in chat.</p>')}
function search(){const q=UI.sq.trim().toLowerCase();let h='';if(q){const seen=new Set(),all=[];
  if(isId(q)){seen.add(q);all.push(q)}
  try{Object.values(St.users?.getUsers()||{}).forEach(u=>{if(seen.size<40&&((u.username||'').toLowerCase().includes(q)||(u.globalName||'').toLowerCase().includes(q))){seen.add(u.id);all.push(u.id)}})}catch{}
  Object.keys(S.tags).forEach(id=>{if(!seen.has(id)&&S.tags[id].snap.some(s=>(s.u||'').toLowerCase().includes(q)||(s.d||'').toLowerCase().includes(q))){seen.add(id);all.push(id)}});
  h=all.map(row).join('')||'<p class="mu">No match.</p>'}
 return`<input id="sq" placeholder="Username, display name or ID" value="${esc(UI.sq)}"><p class="mu">Searches every user your Discord client has loaded, plus old names of tracked users.</p><div id="sr">${h}</div>`}
function audit(){const p=UI.pre,cur=pathIds().g,gl=Object.values(St.guilds?.getGuilds()||{});
 return`<div class="card"><label>User ID</label><input id="a_u" value="${esc(p.uid||last)}"><label>Action</label><select id="a_a">${['timeout','ban','kick','warn','note','unban'].map(k=>`<option>${k}</option>`).join('')}</select><label>Timeout length</label><select id="a_d"><option value="5">5 minutes</option><option value="60">1 hour</option><option value="1440">1 day</option><option value="10080">7 days</option><option value="40320">28 days</option></select>
 <label>Server</label><select id="a_g">${gl.map(g=>`<option value="${g.id}" ${g.id===cur?'selected':''}>${esc(g.name)}</option>`).join('')}</select><label>Reason</label><textarea id="a_r"></textarea><label>Evidence (link or message ID)</label><input id="a_e">
 <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="a_x" style="width:auto"> Also run the action now (uses your own permissions)</label><div class="bar"><button class="pri" data-a="asub">Save audit card</button></div></div>
 <h3>Saved</h3>${S.audits.slice(0,30).map(a=>`<div class="card"><b>${a.action.toUpperCase()}${a.dur?' ('+a.dur+')':''}</b> <span class="mu">${new Date(a.t).toLocaleString()} · ${esc(gname(a.guild))}</span><div>${a.uid}</div><div>${esc(a.reason)}</div><div class="acts" data-id="${a.uid}" style="justify-content:flex-start;margin-top:6px"><button data-a="id">Copy ID</button><button data-a="tag">Tag</button></div></div>`).join('')||'<p class="mu">No cards yet.</p>'}`}
function alerts(){return`<div class="card"><b>Flagged words</b><div class="mu">Shown in red in chat. You get a notification when anyone says one in a watched server.</div><div class="bar"><input id="fw" placeholder="Words, comma separated"><button class="pri" data-a="wadd">Add</button></div><div>${S.words.map(w=>`<span class="chip fl" data-a="wrm" data-v="${esc(w)}">${esc(w)} ✕</span>`).join('')||'<span class="mu">None yet.</span>'}</div><p class="mu">${St.ok?'Live: listening to all watched servers.':'Connecting to Discord…'}</p></div>
 <div class="bar"><b style="flex:1">Recent hits</b><button data-a="wclr">Clear</button></div>${S.alerts.map(a=>`<div class="row bad" data-id="${a.u}"><img src="${av(a.u,uinfo(a.u).a)}" alt=""><div class="nm"><b>@${esc(a.un)}</b><small>#${esc(cname(a.c))} · ${esc(gname(a.g))} · ${new Date(a.t).toLocaleTimeString()}</small><div>${esc(a.txt).replace(new RegExp('('+S.words.filter(Boolean).map(x=>rxEsc(esc(x))).join('|')+')','gi'),'<span class="fl">$1</span>')}</div></div><div class="acts"><button data-a="id">ID</button><button data-a="aud">Audit</button><a href="https://discord.com/channels/${a.g}/${a.c}/${a.id}" target="_blank"><button>Jump</button></a></div></div>`).join('')||'<p class="mu">No hits yet.</p>'}`}
function servers(){const gl=Object.values(St.guilds?.getGuilds()||{});return`<p class="mu">Tick the servers to watch for flagged words. Nothing ticked means all servers.</p>`+(gl.map(g=>`<label class="row" style="cursor:pointer;margin:0 0 6px"><input type="checkbox" style="width:auto" data-a="srv" data-v="${g.id}" ${S.watch.includes(g.id)?'checked':''}><img src="${g.icon?`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64`:av(g.id)}" alt=""><div class="nm"><b>${esc(g.name)}</b><small>${g.id}</small></div><button data-a="cg" data-v="${g.id}">ID</button></label>`).join('')||'<p class="mu">Servers not loaded yet.</p>')}
const pathIds=()=>{const m=location.pathname.match(/\/channels\/(@me|\d+)(?:\/(\d+))?/);return{g:m&&m[1]!=='@me'?m[1]:'',c:m?m[2]||'':''}};
function tools(){const p=pathIds();return`<div class="card"><b>One-click copy</b><div class="bar"><button data-a="cg" data-v="${p.g}">Server ID</button><button data-a="cg" data-v="${p.c}">Channel ID</button><button data-a="cg" data-v="${St.me?.id||''}">My ID</button><button data-a="cg" data-v="${last}">Last user ID</button></div></div><div class="card"><b>Snowflake decoder</b><input id="sn" placeholder="Any ID" style="margin-top:6px"><pre id="sno">-</pre></div>
 <div class="card"><b>ID extractor</b><textarea id="ex" placeholder="Paste text with IDs"></textarea><div class="bar"><button data-a="exc">Copy unique IDs</button></div></div><p class="mu">Shortcuts: Ctrl+Shift+O panel · Alt+C copy hovered user ID · Alt+T tag · Alt+A audit · Alt+F tracked</p>`}
function settings(){return`<div class="card"><label>Audit webhook URL (kept in Tampermonkey storage on this browser)</label><input id="hk" value="${esc(S.hook)}" placeholder="https://discord.com/api/webhooks/…"><div class="bar"><button data-a="hkt">Send test</button></div></div>
 <div class="card"><b>Tags</b><div>${S.tagDefs.map(t=>`<span class="chip" style="color:${t.c}">${esc(t.n)}</span>`).join('')}</div><div class="bar"><input id="tn" placeholder="New tag"><input id="tc" type="color" value="#8c9bff" style="width:56px;padding:2px"><button data-a="tadd">Add</button></div></div>
 <div class="card"><b>Backup</b><div class="bar"><button data-a="exp">Copy JSON</button><button data-a="bwh">Back up to webhook</button><button data-a="imp">Import JSON</button><button class="dng" data-a="wipe">Wipe</button></div><textarea id="imj" placeholder="Paste a backup JSON here (from this script or from the website) and press Import"></textarea></div>`}
// ---------- dialogs and actions ----------
function tagDlg(id){last=id;const e=ensure(id),pn=root.querySelector('#pn');pn.hidden=false;UI.open=true;pn.querySelector('.ov')?.remove();
 const o=document.createElement('div');o.className='ov';o.innerHTML=`<div class="dlg"><b>Tags for ${id}</b><div id="dc" style="margin:8px 0">${S.tagDefs.map(t=>`<span class="chip ${e.tags.includes(t.n)?'':'off'}" data-dt="${esc(t.n)}" style="color:${t.c}">${esc(t.n)}</span>`).join('')}</div><textarea id="dn" placeholder="Private note">${esc(e.note)}</textarea><div class="bar"><button class="pri" data-dsave>Save</button><button class="dng" data-drm>Stop tracking</button><button data-dx>Close</button></div></div>`;
 o.onclick=ev=>{const t=ev.target;if(t.dataset.dt){e.tags=e.tags.includes(t.dataset.dt)?e.tags.filter(x=>x!==t.dataset.dt):[...e.tags,t.dataset.dt];t.classList.toggle('off')}
  else if('dsave'in t.dataset){e.note=o.querySelector('#dn').value;const u=St.users?.getUser(id);if(u)note(u);if(!e.snap.length&&u)e.snap.push({t:Date.now(),u:u.username,d:u.globalName||'',a:u.avatar||''});save();o.remove();decorate();render();toast('Saved')}
  else if('drm'in t.dataset){delete S.tags[id];save();o.remove();decorate();render()}else if('dx'in t.dataset||t===o)o.remove()};
 pn.append(o);if(pn.querySelector('.hd')==null)render()}
const post=b=>new Promise((res,rej)=>{if(!S.hook)return rej(Error('Add a webhook in Settings'));GM_xmlhttpRequest({method:'POST',url:S.hook,headers:{'Content-Type':'application/json'},data:JSON.stringify(b),onload:r=>r.status<300?res():rej(Error('Webhook '+r.status)),onerror:()=>rej(Error('Network error'))})});
const AC={ban:0xff6b7a,kick:0xf0b35a,timeout:0xc18bff,warn:0x6cb6ff,note:0x8a92a8,unban:0x4fd1a1};
async function doAct(a){const R=St.rest;if(!R)throw Error('Discord internals not found yet, wait a few seconds');const g=a.guild,reason=a.reason.slice(0,400);
 if(a.action==='ban')await R.put({url:`/guilds/${g}/bans/${a.uid}`,body:{delete_message_seconds:0},reason});
 else if(a.action==='unban')await R.del({url:`/guilds/${g}/bans/${a.uid}`,reason});
 else if(a.action==='kick')await R.del({url:`/guilds/${g}/members/${a.uid}`,reason});
 else if(a.action==='timeout')await R.patch({url:`/guilds/${g}/members/${a.uid}`,body:{communication_disabled_until:new Date(Date.now()+a.mins*6e4).toISOString()},reason})}
async function submitAudit(){const q=s=>root.querySelector(s),a={uid:q('#a_u').value.trim(),action:q('#a_a').value,reason:q('#a_r').value.trim(),guild:q('#a_g').value,ev:q('#a_e').value.trim(),t:Date.now(),by:St.me?.username||'me',mins:+q('#a_d').value};
 if(a.action==='timeout')a.dur=q('#a_d').selectedOptions[0].text;if(!isId(a.uid))return toast('Enter a valid user ID');if(!a.reason)return toast('Add a reason');
 try{if(q('#a_x').checked){if(!['timeout','ban','kick','unban'].includes(a.action))return toast('This action has nothing to run');if(!confirm(`${a.action.toUpperCase()} ${a.uid} in ${gname(a.guild)}?`))return;await doAct(a)}
  S.audits.unshift(a);save();
  if(S.hook)await post({username:'Opsdeck audit',embeds:[{title:a.action.toUpperCase()+(a.dur?' ('+a.dur+')':''),description:a.reason,color:AC[a.action],fields:[{name:'User ID',value:'`'+a.uid+'`',inline:true},{name:'User',value:'<@'+a.uid+'>',inline:true},{name:'Server',value:gname(a.guild),inline:true},...(a.ev?[{name:'Evidence',value:a.ev}]:[]),{name:'Moderator',value:a.by,inline:true}],timestamp:new Date(a.t).toISOString()}]});else toast('Saved locally only, add a webhook');
  toast('Audit card saved');UI.pre={};render()}catch(e){toast('Error: '+(e.message||e))}}
function onClick(e){const t=e.target.closest('[data-a],[data-tab]');if(!t)return;if(t.dataset.tab){UI.tab=t.dataset.tab;if(UI.tab==='alerts'){unread=0;badge()}return render()}
 const a=t.dataset.a,v=t.dataset.v,id=t.closest('[data-id]')?.dataset.id;if(id)last=id;
 if(a==='close'){UI.open=false;root.querySelector('#pn').hidden=true}
 else if(a==='id')copy(id);else if(a==='men')copy('<@'+id+'>','mention');else if(a==='tag')tagDlg(id);else if(a==='aud'){UI.pre={uid:id};UI.tab='audit';render()}
 else if(a==='ft'){const s=UI.tf.sel;UI.tf.sel=s.includes(v)?s.filter(x=>x!==v):[...s,v];t.classList.toggle('off');list()}
 else if(a==='fm'){UI.tf.mode=UI.tf.mode==='any'?'all':'any';t.textContent='Match: '+UI.tf.mode;list()}
 else if(a==='cps')copy(shown.join('\n'),shown.length+' IDs');
 else if(a==='asub')submitAudit();
 else if(a==='wadd'){root.querySelector('#fw').value.split(',').map(x=>x.trim()).filter(x=>x&&!S.words.includes(x)).forEach(x=>S.words.push(x));save();highlight();render()}
 else if(a==='wrm'){S.words=S.words.filter(x=>x!==v);save();highlight();render()}
 else if(a==='wclr'){S.alerts=[];save();render()}
 else if(a==='srv'){S.watch=t.checked?[...S.watch,v]:S.watch.filter(x=>x!==v);save()}
 else if(a==='cg'){v?copy(v):toast('Nothing to copy here')}
 else if(a==='exc')copy([...new Set(root.querySelector('#ex').value.match(/\d{17,20}/g)||[])].join('\n'),'IDs');
 else if(a==='hkt')post({content:'Opsdeck connected.'}).then(()=>toast('Test sent'),x=>toast(x.message));
 else if(a==='tadd'){const n=root.querySelector('#tn').value.trim();if(n&&!S.tagDefs.some(x=>x.n===n)){S.tagDefs.push({n,c:root.querySelector('#tc').value});save();render()}}
 else if(a==='exp')copy(JSON.stringify({tags:S.tags,audits:S.audits,tagDefs:S.tagDefs,words:S.words}),'backup JSON');
 else if(a==='bwh'){const fd=new FormData();fd.append('content','Opsdeck backup '+new Date().toISOString());fd.append('file',new Blob([JSON.stringify({tags:S.tags,audits:S.audits,tagDefs:S.tagDefs,words:S.words})],{type:'application/json'}),'opsdeck-backup.json');GM_xmlhttpRequest({method:'POST',url:S.hook,data:fd,onload:r=>toast(r.status<300?'Backup posted':'Failed '+r.status),onerror:()=>toast('Network error')})}
 else if(a==='imp'){try{const j=JSON.parse(root.querySelector('#imj').value);S.tags={...S.tags,...(j.tags||{})};S.audits=j.audits||S.audits;S.tagDefs=j.tagDefs||S.tagDefs;S.words=j.words||S.words;save();decorate();toast('Imported');render()}catch{toast('Invalid JSON')}}
 else if(a==='wipe'){if(confirm('Delete all Opsdeck data?')){S={tags:{},audits:[],words:[],alerts:[],watch:[],hook:'',tagDefs:TAGS};save();render()}}}
function onInput(e){const t=e.target;
 if(t.id==='tq'){UI.tf.q=t.value;list()}
 else if(t.id==='sq'){UI.sq=t.value;const p=t.selectionStart;root.querySelector('#bd2').innerHTML=search();const n=root.querySelector('#sq');n.focus();n.setSelectionRange(p,p)}
 else if(t.id==='hk'){S.hook=t.value.trim();save()}
 else if(t.id==='sn'){const v=t.value.trim();root.querySelector('#sno').textContent=isId(v)?`Created: ${snow(v).toISOString()}\nUnix ms: ${+snow(v)}`:'Enter a 17-20 digit ID'}}
document.addEventListener('keydown',e=>{if(!root)return;const typing=/INPUT|TEXTAREA/.test(e.target.tagName)||e.target.isContentEditable;
 if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='o'){e.preventDefault();toggleP()}
 else if(e.altKey&&e.key.toLowerCase()==='c'&&last){e.preventDefault();copy(last)}
 else if(e.altKey&&e.key.toLowerCase()==='t'&&last){e.preventDefault();tagDlg(last)}
 else if(e.altKey&&e.key.toLowerCase()==='a'){e.preventDefault();UI.pre={uid:last};open('audit')}
 else if(e.altKey&&e.key.toLowerCase()==='f'){e.preventDefault();open('tracked')}
 else if(e.key==='Escape'&&UI.open&&!typing){UI.open=false;root.querySelector('#pn').hidden=true}},true);
build();
})();
})();
