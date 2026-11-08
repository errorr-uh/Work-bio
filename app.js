const LS='opsdeck.v1',$=s=>document.querySelector(s);
const TAGS=[{n:'High risk',c:'#ff6b7a'},{n:'Risk',c:'#f0b35a'},{n:'Verified',c:'#4fd1a1'},{n:'Trusted',c:'#6cb6ff'},{n:'Watch',c:'#c18bff'},{n:'Alt',c:'#8a92a8'}];
let S=Object.assign({cfg:{client:'',bot:'',hook:'',shown:[],g:''},tags:{},audits:[],tagDefs:TAGS,user:null,token:'',guilds:[],demo:false},JSON.parse(localStorage.getItem(LS)||'{}'));
const save=()=>localStorage.setItem(LS,JSON.stringify(S));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let view='home',arg=null,last='',cache={};
const toast=m=>{const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(t._t);t._t=setTimeout(()=>t.style.display='none',2200)};
const copy=async(t,l)=>{try{await navigator.clipboard.writeText(t)}catch{const a=document.createElement('textarea');a.value=t;document.body.append(a);a.select();document.execCommand('copy');a.remove()}toast('Copied '+(l||t))};
const snow=id=>new Date(Number(BigInt(id)>>22n)+1420070400000);
const isId=s=>/^\d{17,20}$/.test(s);
const av=(id,u)=>u&&u.a?`https://cdn.discordapp.com/avatars/${id}/${u.a}.png?size=64`:`https://cdn.discordapp.com/embed/avatars/${isId(id)?Number((BigInt(id)>>22n)%6n):0}.png`;
async function api(p,o={}){const h={};
 if((o.as||'bot')==='bot'){if(!S.cfg.bot)throw Error('Add a bot token in Settings first');h.Authorization='Bot '+S.cfg.bot}else h.Authorization='Bearer '+S.token;
 if(o.body)h['Content-Type']='application/json';if(o.reason)h['X-Audit-Log-Reason']=encodeURIComponent(o.reason);
 const r=await fetch('https://discord.com/api/v10'+p,{method:o.method||'GET',headers:h,body:o.body?JSON.stringify(o.body):undefined});
 const t=await r.text();let j;try{j=t?JSON.parse(t):{}}catch{j=t}if(!r.ok)throw Error((j&&j.message)||('HTTP '+r.status));return j}
const ensure=id=>S.tags[id]||(S.tags[id]={tags:[],note:'',snap:[]});
function note(u){const e=S.tags[u.id];if(!e)return;const s={t:Date.now(),u:u.username,d:u.global_name||'',a:u.avatar||''},l=e.snap.at(-1);if(!l||l.u!==s.u||l.d!==s.d||l.a!==s.a){e.snap.push(s);save()}}
async function getUser(id){let u;if(S.demo)u={id,username:'demo_'+id.slice(-4),global_name:'Demo '+id.slice(-4),avatar:null};else u=await api('/users/'+id);cache[id]=u;note(u);return u}
const snapU=id=>{const c=cache[id];if(c)return{u:c.username,d:c.global_name,a:c.avatar};const s=S.tags[id]?.snap.at(-1);return s||{}};
const tdef=n=>S.tagDefs.find(t=>t.n===n)||{n,c:'#8a92a8'};
const chips=e=>(e?.tags||[]).map(n=>{const t=tdef(n);return`<span class="chip" style="color:${t.c}">${esc(n)}</span>`}).join('');
function row(id){const u=snapU(id);return`<div class="row" data-id="${id}"><img src="${av(id,u)}" alt=""><div class="nm"><b>${esc(u.d||u.u||'Unknown user')}</b><small>${u.u?'@'+esc(u.u)+' · ':''}${id}</small><div>${chips(S.tags[id])}</div>${S.tags[id]?.note?`<div class="hist">${esc(S.tags[id].note)}</div>`:''}</div>
<div class="acts"><button data-act="cid" title="Copy ID">Copy ID</button><button data-act="cmen" title="Copy mention">@</button><button data-act="tag">Tag</button><button data-act="aud">Audit</button><button data-act="menu">⋯</button></div></div>`}
const shownGuilds=()=>S.guilds.filter(g=>S.cfg.shown.includes(g.id));
const gName=id=>S.guilds.find(g=>g.id===id)?.name||id||'—';
// ---------- shell ----------
const NAV=[['home','Dashboard','1'],['lookup','Lookup','2'],['members','Members','3'],['tracked','Tracked users','4'],['audit','Audit cards','5'],['servers','Servers','6'],['dev','Dev tools','7'],['settings','Settings','8']];
function go(v,a){view=v;arg=a||null;render()}
function render(){
 if(!S.user&&!S.demo)return loginView();
 const gs=shownGuilds();
 $('#app').innerHTML=`<nav><h1>Opsdeck</h1>${NAV.map(n=>`<a data-nav="${n[0]}" class="${view===n[0]?'on':''}">${n[1]}<kbd>${n[2]}</kbd></a>`).join('')}<div class="me">${esc(S.user?S.user.username:'Demo mode')}<br><a style="padding:0;display:inline;cursor:pointer;color:var(--er)" data-act="logout">Sign out</a></div></nav>
 <main><div class="top"><select id="gsel" title="Active server">${gs.length?gs.map(g=>`<option value="${g.id}" ${S.cfg.g===g.id?'selected':''}>${esc(g.name)}</option>`).join(''):'<option value="">No servers selected</option>'}</select>
 <input id="quick" placeholder="Paste a user ID or mention, press Enter" style="max-width:340px"><span class="sp"></span><button data-act="pal">Command palette <span class="kb">Ctrl K</span></button></div><div id="view"></div></main>`;
 $('#gsel').onchange=e=>{S.cfg.g=e.target.value;save()};
 $('#quick').onkeydown=e=>{if(e.key==='Enter'){const m=e.target.value.match(/\d{17,20}/g);if(m){go('lookup',m.join('\n'));}}};
 if(!S.cfg.g&&gs[0])S.cfg.g=gs[0].id;
 ({home,lookup,members,tracked,audit,servers,dev,settings})[view]();
}
const V=h=>$('#view').innerHTML=h;
function loginView(){const ru=location.origin==='null'||location.protocol==='file:'?'(needs http — see note)':location.origin+location.pathname;
 $('#app').innerHTML=`<div class="login"><h2>Opsdeck</h2><p class="mu">A private workspace for Discord operations and moderation. Tags, notes and audit cards live in this browser and in your private audit server.</p>
 <div class="card"><label class="mu">Discord application client ID</label><input id="cid" value="${esc(S.cfg.client)}" placeholder="From discord.com/developers/applications"><p class="mu" style="font-size:12px">Add this redirect URI under OAuth2: <code>${esc(ru)}</code><br>Discord only accepts http(s) redirects, so for real sign-in run <code>python3 -m http.server 8000</code> in this folder and open <code>http://localhost:8000</code>.</p><div class="bar"><button class="pri" data-act="login">Sign in with Discord</button><button data-act="demo">Try demo mode</button></div></div></div>`}
// ---------- views ----------
function home(){const t=Object.entries(S.tags),hr=t.filter(([,e])=>e.tags.includes('High risk')).length,td=S.audits.filter(a=>Date.now()-a.t<864e5).length;
 V(`<h2>Dashboard</h2><div class="grid"><div class="card stat"><b>${t.length}</b><span>Tracked users</span></div><div class="card stat"><b style="color:var(--er)">${hr}</b><span>High risk</span></div><div class="card stat"><b>${td}</b><span>Audit cards today</span></div><div class="card stat"><b>${shownGuilds().length}</b><span>Servers shown</span></div></div>
 <h3>Recent audit cards</h3>${S.audits.slice(0,5).map(auditCard).join('')||'<p class="mu">Nothing saved yet. Press 5 to open Audit cards.</p>'}
 <h3>Shortcuts</h3><div class="card mono">Ctrl+K palette · / focus quick lookup · 1–8 switch tabs<br>Paste an ID anywhere (outside a field) to look it up · Alt+C copy last ID · Alt+A audit last user · Alt+T tag last user<br>Copy an ID anywhere in Discord, switch back here, and a banner offers one-click actions.</div>`)}
async function lookup(){V(`<h2>Lookup</h2><div class="card"><div class="mu" style="margin-bottom:6px">One or many IDs, mentions or any text containing IDs. Works without a profile open.</div><textarea id="lk" placeholder="123456789012345678">${esc(arg||'')}</textarea><div class="bar" style="margin:8px 0 0"><button class="pri" id="lkgo">Look up</button><button id="lkcopy">Copy all IDs found</button></div></div><div id="lkres"></div>`);
 const run=async()=>{const ids=[...new Set($('#lk').value.match(/\d{17,20}/g)||[])];$('#lkres').innerHTML='<p class="mu">Loading…</p>';let h='';
  for(const id of ids){try{await getUser(id)}catch(e){h+=`<p class="mu">${id}: ${esc(e.message)} (showing ID data only)</p>`}
   last=id;h+=row(id)+`<div class="hist" style="margin:-4px 0 10px 8px">Account created ${snow(id).toLocaleString()} · <a style="color:var(--ac);cursor:pointer" data-act="prof" data-id="${id}">open profile</a></div>`}
  $('#lkres').innerHTML=h||'<p class="mu">No IDs found.</p>'};
 $('#lkgo').onclick=run;$('#lkcopy').onclick=()=>copy(($('#lk').value.match(/\d{17,20}/g)||[]).join('\n'),'IDs');if(arg)run()}
async function members(){V(`<h2>Members</h2><div class="bar"><input id="mq" placeholder="Search username in the active server (empty = recent joins)"><button class="pri" id="mgo">Search</button></div><div id="mres" class="mu">Needs a bot in the server with Server Members intent.</div>`);
 const run=async()=>{if(!S.cfg.g)return toast('Pick a server in Servers first');$('#mres').textContent='Loading…';const q=$('#mq').value.trim();
  try{const m=S.demo?[...Array(5)].map((_,i)=>({user:{id:'1100000000000000'+(10+i)+'0',username:'demo_member'+i,avatar:null}})):await api(q?`/guilds/${S.cfg.g}/members/search?query=${encodeURIComponent(q)}&limit=40`:`/guilds/${S.cfg.g}/members?limit=40`);
   m.forEach(x=>{cache[x.user.id]=x.user;note(x.user)});$('#mres').innerHTML=m.map(x=>row(x.user.id)).join('')||'No matches.'}catch(e){$('#mres').textContent=e.message}};
 $('#mgo').onclick=run;$('#mq').onkeydown=e=>e.key==='Enter'&&run()}
const TF={sel:[],mode:'any',q:''};
function tracked(){if(typeof arg==='string'&&arg){TF.sel=[arg];arg=null}
 V(`<h2>Tracked users</h2><div class="card"><div class="mu" style="margin-bottom:4px">Click tags to filter. Alt+F opens this view from anywhere.</div><div id="tfc">${S.tagDefs.map(t=>`<span class="chip ${TF.sel.includes(t.n)?'':'off'}" data-ft="${esc(t.n)}" style="color:${t.c}">${esc(t.n)} (${Object.values(S.tags).filter(e=>e.tags.includes(t.n)).length})</span>`).join('')}</div>
 <div class="bar" style="margin:10px 0 0"><input id="tq" placeholder="Search name, ID or note" value="${esc(TF.q)}"><button id="tm">Match: ${TF.mode==='any'?'any selected tag':'all selected tags'}</button><button id="tcp">Copy shown IDs</button><button id="tref">Refresh names</button><button id="tadd">Track an ID</button></div></div><div id="tl"></div>`);
 const list=()=>{const q=TF.q.toLowerCase();const ids=Object.keys(S.tags).filter(i=>{const e=S.tags[i],u=snapU(i);const okT=!TF.sel.length||(TF.mode==='all'?TF.sel.every(t=>e.tags.includes(t)):TF.sel.some(t=>e.tags.includes(t)));return okT&&(!q||i.includes(q)||(u.u||'').toLowerCase().includes(q)||(u.d||'').toLowerCase().includes(q)||(e.note||'').toLowerCase().includes(q))});
  list.ids=ids;$('#tl').innerHTML=`<p class="mu">${ids.length} user${ids.length===1?'':'s'} shown</p>`+(ids.map(id=>{const e=S.tags[id];return row(id)+(e.snap.length>1?`<div class="hist" style="margin:-4px 0 10px 8px">${e.snap.slice(0,-1).map(s=>`was @${esc(s.u)}${s.d?' / '+esc(s.d):''} (${new Date(s.t).toLocaleDateString()})`).join(' → ')}</div>`:'')}).join('')||'<p class="mu">No users match. Tag someone from Lookup or Members.</p>')};
 list();
 $('#tfc').onclick=e=>{const t=e.target.dataset.ft;if(!t)return;TF.sel=TF.sel.includes(t)?TF.sel.filter(x=>x!==t):[...TF.sel,t];e.target.classList.toggle('off');list()};
 $('#tq').oninput=e=>{TF.q=e.target.value;list()};
 $('#tm').onclick=e=>{TF.mode=TF.mode==='any'?'all':'any';e.target.textContent='Match: '+(TF.mode==='any'?'any selected tag':'all selected tags');list()};
 $('#tcp').onclick=()=>copy(list.ids.join('\n'),list.ids.length+' IDs');
 $('#tadd').onclick=()=>{const v=prompt('User ID');if(isId(v?.trim()))tagDlg(v.trim());};
 $('#tref').onclick=async()=>{toast('Refreshing…');for(const id of list.ids){try{await getUser(id)}catch{}await new Promise(r=>setTimeout(r,350))}tracked();toast('Updated')}}
const AC={ban:'#ff6b7a',kick:'#f0b35a',timeout:'#c18bff',warn:'#6cb6ff',note:'#8a92a8',unban:'#4fd1a1'};
function auditCard(a){return`<div class="card" style="border-left:4px solid ${AC[a.action]}"><b style="color:${AC[a.action]}">${a.action.toUpperCase()}${a.dur?' · '+a.dur:''}</b> <span class="mu">${new Date(a.t).toLocaleString()} · ${esc(gName(a.guild))}</span><div class="mono" style="margin:4px 0">${a.uid}</div><div>${esc(a.reason)}</div>${a.ev?`<div class="mu">${esc(a.ev)}</div>`:''}<div class="acts" style="justify-content:flex-start;margin-top:8px" data-id="${a.uid}"><button data-act="cid">Copy ID</button><button data-act="tag">Tag</button><button data-act="redo">Reuse</button></div></div>`}
function audit(){const p=typeof arg==='object'&&arg?arg:{};
 V(`<h2>Audit cards</h2><div class="card"><div class="f"><div><label>User ID</label><input id="a_u" value="${p.uid||last}" class="mono"></div><div><label>Action</label><select id="a_a">${Object.keys(AC).map(k=>`<option ${p.action===k?'selected':''}>${k}</option>`).join('')}</select></div>
 <div><label>Duration (timeout)</label><select id="a_d"><option value="5">5 minutes</option><option value="60">1 hour</option><option value="1440">1 day</option><option value="10080">7 days</option><option value="40320">28 days</option></select></div>
 <div><label>Server</label><select id="a_g">${shownGuilds().map(g=>`<option value="${g.id}" ${S.cfg.g===g.id?'selected':''}>${esc(g.name)}</option>`).join('')}</select></div>
 <div class="full"><label>Reason</label><textarea id="a_r" placeholder="What happened?">${esc(p.reason||'')}</textarea></div><div class="full"><label>Evidence link or message ID (optional)</label><input id="a_e"></div></div>
 <div class="bar" style="margin-top:12px"><button class="pri" id="a_s">Save to audit server</button><label style="display:flex;gap:6px;align-items:center;margin:0"><input type="checkbox" id="a_x" style="width:auto"> Also run the action with the bot</label></div></div>
 <h3>Saved on this device</h3>${S.audits.map(auditCard).join('')||'<p class="mu">No cards yet.</p>'}`);
 $('#a_s').onclick=submitAudit}
async function submitAudit(){const a={uid:$('#a_u').value.trim(),action:$('#a_a').value,reason:$('#a_r').value.trim(),guild:$('#a_g').value,ev:$('#a_e').value.trim(),t:Date.now(),by:S.user?.username||'demo'};
 const mins=+$('#a_d').value;if(a.action==='timeout')a.dur=$('#a_d').selectedOptions[0].text;
 if(!isId(a.uid))return toast('Enter a valid user ID');if(!a.reason)return toast('Add a reason');
 try{if($('#a_x').checked&&!S.demo){const g=a.guild,r=a.reason.slice(0,400);
   if(a.action==='ban')await api(`/guilds/${g}/bans/${a.uid}`,{method:'PUT',body:{delete_message_seconds:0},reason:r});
   else if(a.action==='kick')await api(`/guilds/${g}/members/${a.uid}`,{method:'DELETE',reason:r});
   else if(a.action==='unban')await api(`/guilds/${g}/bans/${a.uid}`,{method:'DELETE',reason:r});
   else if(a.action==='timeout')await api(`/guilds/${g}/members/${a.uid}`,{method:'PATCH',body:{communication_disabled_until:new Date(Date.now()+mins*6e4).toISOString()},reason:r});}
  S.audits.unshift(a);save();
  if(S.cfg.hook){const res=await fetch(S.cfg.hook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'Opsdeck audit',embeds:[{title:a.action.toUpperCase()+(a.dur?' ('+a.dur+')':''),description:a.reason,color:parseInt(AC[a.action].slice(1),16),fields:[{name:'User ID',value:'`'+a.uid+'`',inline:true},{name:'User',value:'<@'+a.uid+'>',inline:true},{name:'Server',value:gName(a.guild),inline:true},...(a.ev?[{name:'Evidence',value:a.ev}]:[]),{name:'Moderator',value:a.by,inline:true}],timestamp:new Date(a.t).toISOString()}]})});if(!res.ok)throw Error('Webhook failed ('+res.status+')')}
  else toast('Saved locally only. Add a webhook in Settings.');
  toast('Audit card saved');audit()}catch(e){toast('Error: '+e.message)}}
async function servers(){V(`<h2>Servers</h2><p class="mu">Only the servers you tick appear in the dashboard.</p><div class="bar"><button id="sbot">Load servers the bot is in</button></div><div id="sl"></div>`);
 const draw=()=>$('#sl').innerHTML=S.guilds.map(g=>`<label class="row" style="cursor:pointer"><input type="checkbox" style="width:auto" data-g="${g.id}" ${S.cfg.shown.includes(g.id)?'checked':''}><div class="nm"><b>${esc(g.name)}</b><small>${g.id}</small></div><button data-act="cgid" data-id="${g.id}">Copy ID</button></label>`).join('')||'<p class="mu">No servers loaded.</p>';
 draw();$('#sl').onchange=e=>{const g=e.target.dataset.g;if(!g)return;S.cfg.shown=e.target.checked?[...S.cfg.shown,g]:S.cfg.shown.filter(x=>x!==g);save()};
 $('#sbot').onclick=async()=>{try{const b=await api('/users/@me/guilds');const m=new Map(S.guilds.map(g=>[g.id,g]));b.forEach(g=>m.set(g.id,{id:g.id,name:g.name}));S.guilds=[...m.values()];save();draw()}catch(e){toast(e.message)}}}
function dev(){V(`<h2>Dev tools</h2><div class="grid"><div class="card"><b>Snowflake decoder</b><input id="d1" class="mono" placeholder="ID" style="margin:8px 0"><pre id="d1o">—</pre></div>
 <div class="card"><b>Timestamp tags</b><input id="d2" type="datetime-local" style="margin:8px 0"><pre id="d2o">—</pre></div></div>
 <div class="card"><b>ID extractor</b><span class="mu"> paste logs, copy unique IDs</span><textarea id="d3" style="margin:8px 0"></textarea><button id="d3b">Copy unique IDs</button> <span id="d3o" class="mu"></span></div>
 <div class="card"><b>API console</b><span class="mu"> uses your bot token</span><div class="bar" style="margin:8px 0"><select id="d4m" style="width:90px"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select><input id="d4p" class="mono" value="/users/@me"><button class="pri" id="d4g">Send</button></div><textarea id="d4b" placeholder="JSON body (optional)"></textarea><pre id="d4o">—</pre></div>`);
 $('#d1').oninput=e=>{const v=e.target.value.trim();$('#d1o').textContent=isId(v)?`Created: ${snow(v).toISOString()}\nUnix ms: ${+snow(v)}\nWorker: ${(BigInt(v)>>17n)&31n}  Process: ${(BigInt(v)>>12n)&31n}  Increment: ${BigInt(v)&4095n}`:'Enter a 17–20 digit ID'};
 $('#d2').oninput=e=>{const s=Math.floor(new Date(e.target.value)/1000);$('#d2o').textContent=['t','T','d','D','f','F','R'].map(f=>`<t:${s}:${f}>`).join('\n')};
 $('#d3b').onclick=()=>{const u=[...new Set($('#d3').value.match(/\d{17,20}/g)||[])];copy(u.join('\n'),u.length+' IDs')};
 $('#d4g').onclick=async()=>{try{const b=$('#d4b').value.trim();$('#d4o').textContent=JSON.stringify(await api($('#d4p').value,{method:$('#d4m').value,body:b?JSON.parse(b):null}),null,2)}catch(e){$('#d4o').textContent='Error: '+e.message}}}
function settings(){V(`<h2>Settings</h2><div class="card f"><div class="full"><label>Audit webhook URL (stored only in this browser, treat it like a password)</label><input id="s_h" value="${esc(S.cfg.hook)}" placeholder="https://discord.com/api/webhooks/…"></div>
 <div class="full"><label>Bot token (optional: user lookup, member search, ban/kick/timeout)</label><input id="s_b" type="password" value="${esc(S.cfg.bot)}"></div><div><label>Client ID</label><input id="s_c" value="${esc(S.cfg.client)}"></div></div>
 <div class="bar"><button class="pri" id="s_save">Save</button><button id="s_test">Send test to webhook</button></div>
 <h3>Tags</h3><div class="card">${S.tagDefs.map(t=>`<span class="chip" style="color:${t.c}">${esc(t.n)}</span>`).join('')}<div class="bar" style="margin:10px 0 0"><input id="t_n" placeholder="New tag name"><input id="t_c" type="color" value="#8c9bff" style="width:60px;padding:2px"><button id="t_add">Add tag</button></div></div>
 <h3>Backup</h3><div class="bar"><button id="b_ex">Download JSON</button><button id="b_wh">Back up to webhook</button><button id="b_im">Import JSON</button><button class="dng" id="b_clr">Wipe local data</button></div><input type="file" id="b_f" hidden accept=".json">`);
 $('#s_save').onclick=()=>{S.cfg.hook=$('#s_h').value.trim();S.cfg.bot=$('#s_b').value.trim();S.cfg.client=$('#s_c').value.trim();save();toast('Saved')};
 $('#s_test').onclick=async()=>{S.cfg.hook=$('#s_h').value.trim();save();try{const r=await fetch(S.cfg.hook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:'Opsdeck connected.'})});toast(r.ok?'Test sent':'Failed: '+r.status)}catch(e){toast(e.message)}};
 $('#t_add').onclick=()=>{const n=$('#t_n').value.trim();if(n&&!S.tagDefs.some(t=>t.n===n)){S.tagDefs.push({n,c:$('#t_c').value});save();settings()}};
 const dump=()=>JSON.stringify({tags:S.tags,audits:S.audits,tagDefs:S.tagDefs},null,1);
 $('#b_ex').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([dump()],{type:'application/json'}));a.download='opsdeck-backup.json';a.click()};
 $('#b_wh').onclick=async()=>{const fd=new FormData();fd.append('content','Opsdeck backup '+new Date().toISOString());fd.append('file',new Blob([dump()],{type:'application/json'}),'opsdeck-backup.json');try{const r=await fetch(S.cfg.hook,{method:'POST',body:fd});toast(r.ok?'Backup posted':'Failed: '+r.status)}catch(e){toast(e.message)}};
 $('#b_im').onclick=()=>$('#b_f').click();$('#b_f').onchange=async e=>{try{const j=JSON.parse(await e.target.files[0].text());Object.assign(S,{tags:{...S.tags,...j.tags},audits:j.audits||S.audits,tagDefs:j.tagDefs||S.tagDefs});save();toast('Imported')}catch{toast('Invalid file')}};
 $('#b_clr').onclick=()=>{if(confirm('Delete all local tags, audits and settings?')){localStorage.removeItem(LS);location.reload()}}}
// ---------- dialogs ----------
function dlg(h){const o=document.createElement('div');o.className='ov';o.innerHTML=`<div class="dlg">${h}</div>`;o.onclick=e=>{if(e.target===o)o.remove()};document.body.append(o);return o}
function tagDlg(id){last=id;const e=ensure(id),o=dlg(`<b>Tags for ${id}</b><div id="tc" style="margin:10px 0">${S.tagDefs.map(t=>`<span class="chip ${e.tags.includes(t.n)?'':'off'}" data-t="${esc(t.n)}" style="color:${t.c}">${esc(t.n)}</span>`).join('')}</div><textarea id="tn" placeholder="Private note">${esc(e.note)}</textarea><div class="bar" style="margin:10px 0 0"><button class="pri" id="ts">Save</button><button class="dng" id="tr">Stop tracking</button></div>`);
 o.querySelector('#tc').onclick=ev=>{const t=ev.target.dataset.t;if(!t)return;e.tags=e.tags.includes(t)?e.tags.filter(x=>x!==t):[...e.tags,t];ev.target.classList.toggle('off')};
 o.querySelector('#ts').onclick=async()=>{e.note=o.querySelector('#tn').value;save();o.remove();if(!e.snap.length){try{await getUser(id)}catch{}}render();toast('Tags saved')};
 o.querySelector('#tr').onclick=()=>{delete S.tags[id];save();o.remove();render()}}
function menuDlg(id){last=id;const o=dlg(`<b class="mono">${id}</b><div style="margin-top:8px">${[['copy-name','Copy username'],['copy-av','Copy avatar URL'],['copy-created','Copy account creation date'],['prof','Open profile in Discord'],['q-timeout','Timeout card'],['q-kick','Kick card'],['q-ban','Ban card']].map(([k,l])=>`<div class="pi" data-k="${k}">${l}</div>`).join('')}</div>`);
 o.onclick=e=>{const k=e.target.dataset.k;if(!k){if(e.target===o)o.remove();return}o.remove();const u=snapU(id);
  if(k==='copy-name')copy(u.u||'','username');else if(k==='copy-av')copy(av(id,u),'avatar URL');else if(k==='copy-created')copy(snow(id).toISOString(),'date');else if(k==='prof')window.open('https://discord.com/users/'+id,'_blank');else go('audit',{uid:id,action:k.slice(2)})}}
const CMDS=[...NAV.map(n=>({l:'Go to '+n[1],k:n[2],f:()=>go(n[0])})),{l:'Add or edit tags for last user',k:'Alt T',f:()=>last&&tagDlg(last)},{l:'Audit last user',k:'Alt A',f:()=>go('audit',{uid:last})},{l:'Copy last ID',k:'Alt C',f:()=>last&&copy(last)}];
function palette(){let q='',sel=0;const o=dlg('<input id="pq" placeholder="Type a command, or paste an ID"><div id="pl" style="margin-top:8px"></div>');const inp=o.querySelector('#pq');inp.focus();let items=[];
 const draw=()=>{const m=q.match(/\d{17,20}/);items=[...(m?[{l:'Look up '+m[0],f:()=>go('lookup',m[0])},{l:'Copy ID '+m[0],f:()=>copy(m[0])},{l:'Tag '+m[0],f:()=>tagDlg(m[0])},{l:'Audit '+m[0],f:()=>go('audit',{uid:m[0]})}]:[]),...[...CMDS,...S.tagDefs.map(t=>({l:'Show tagged: '+t.n,f:()=>{TF.sel=[t.n];go('tracked')}}))].filter(c=>c.l.toLowerCase().includes(q.toLowerCase()))];sel=Math.min(sel,items.length-1);
  o.querySelector('#pl').innerHTML=items.map((c,i)=>`<div class="pi ${i===sel?'sel':''}" data-i="${i}">${esc(c.l)}<span class="kb">${c.k||''}</span></div>`).join('')};
 const run=i=>{o.remove();items[i]?.f()};draw();inp.oninput=()=>{q=inp.value;draw()};
 inp.onkeydown=e=>{if(e.key==='ArrowDown'){sel=Math.min(sel+1,items.length-1);draw();e.preventDefault()}else if(e.key==='ArrowUp'){sel=Math.max(sel-1,0);draw();e.preventDefault()}else if(e.key==='Enter')run(sel);else if(e.key==='Escape')o.remove()};
 o.querySelector('#pl').onclick=e=>{const i=e.target.closest('.pi')?.dataset.i;if(i!=null)run(+i)}}
// ---------- events ----------
document.addEventListener('click',async e=>{const n=e.target.closest('[data-nav]');if(n)return go(n.dataset.nav);
 const c=e.target.closest('[data-act]');if(c){const act=c.dataset.act,id=c.dataset.id||c.closest('[data-id]')?.dataset.id;if(id)last=id;
  if(act==='cid')copy(id);else if(act==='cgid')copy(id);else if(act==='cmen')copy('<@'+id+'>','mention');else if(act==='tag')tagDlg(id);else if(act==='aud')go('audit',{uid:id});
  else if(act==='menu')menuDlg(id);else if(act==='prof')window.open('https://discord.com/users/'+id,'_blank');else if(act==='pal')palette();
  else if(act==='redo'){const a=S.audits.find(x=>x.uid===id);go('audit',{uid:id,action:a?.action,reason:a?.reason})}
  else if(act==='demo'){S.demo=true;S.guilds=[{id:'900000000000000001',name:'Demo HQ'},{id:'900000000000000002',name:'Demo Community'}];S.cfg.shown=S.guilds.map(g=>g.id);save();render()}
  else if(act==='login'){const cid=$('#cid').value.trim();if(!cid)return toast('Enter your client ID');S.cfg.client=cid;save();location.href=`https://discord.com/oauth2/authorize?client_id=${cid}&response_type=token&scope=${encodeURIComponent('identify guilds')}&redirect_uri=${encodeURIComponent(location.origin+location.pathname)}`}
  else if(act==='logout'){S.user=null;S.token='';S.demo=false;save();render()}}});
document.addEventListener('keydown',e=>{const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
 if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();palette()}
 else if(e.altKey&&e.key==='c'&&last)copy(last);else if(e.altKey&&e.key==='a')go('audit',{uid:last});else if(e.altKey&&e.key==='t'&&last)tagDlg(last);else if(e.altKey&&e.key==='f'){e.preventDefault();go('tracked')}
 else if(!typing&&!e.ctrlKey&&!e.altKey&&!e.metaKey){if(e.key==='/'){e.preventDefault();$('#quick')?.focus()}else if(/^[1-8]$/.test(e.key)&&(S.user||S.demo))go(NAV[e.key-1][0])}});
document.addEventListener('paste',e=>{if(/INPUT|TEXTAREA/.test(document.activeElement.tagName)||!(S.user||S.demo))return;const m=(e.clipboardData.getData('text').match(/\d{17,20}/g)||[]);if(m.length)go('lookup',m.join('\n'))});
let seen='';window.addEventListener('focus',async()=>{if(!(S.user||S.demo))return;try{const t=(await navigator.clipboard.readText()).trim();if(isId(t)&&t!==seen){seen=t;last=t;const o=document.createElement('div');o.className='card';o.style.cssText='position:fixed;right:16px;top:16px;z-index:15;border-color:var(--ac)';o.innerHTML=`ID on clipboard <b class="mono">${t}</b><div class="bar" style="margin:8px 0 0"><button class="pri" data-k="l">Look up</button><button data-k="t">Tag</button><button data-k="a">Audit</button></div>`;o.onclick=ev=>{const k=ev.target.dataset.k;if(k==='l')go('lookup',t);if(k==='t')tagDlg(t);if(k==='a')go('audit',{uid:t});if(k)o.remove()};document.body.append(o);setTimeout(()=>o.remove(),8000)}}catch{}});
// ---------- boot ----------
(async()=>{const h=new URLSearchParams(location.hash.slice(1));
 if(h.get('access_token')){S.token=h.get('access_token');history.replaceState(null,'',location.pathname+location.search);save()}
 if(S.token&&!S.user){try{S.user=await api('/users/@me',{as:'user'});S.guilds=(await api('/users/@me/guilds',{as:'user'})).map(g=>({id:g.id,name:g.name}));save()}catch(e){S.token='';save();toast('Sign-in failed: '+e.message)}}
 render()})();
