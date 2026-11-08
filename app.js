const LS='opsdeck.v1',$=s=>document.querySelector(s);
const TAGS=[{n:'High risk',c:'#ff6b7a'},{n:'Risk',c:'#f0b35a'},{n:'Verified',c:'#4fd1a1'},{n:'Trusted',c:'#6cb6ff'},{n:'Watch',c:'#c18bff'},{n:'Alt',c:'#8a92a8'}];
let S=Object.assign({cfg:{client:'',bot:'',hook:'',shown:[],g:''},tags:{},audits:[],words:[],alerts:[],tagDefs:TAGS,user:null,token:'',guilds:[],demo:false},JSON.parse(localStorage.getItem(LS)||'{}'));
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
const NAV=[['home','Dashboard','1'],['search','Search users','2'],['lookup','Lookup IDs','3'],['browse','Chat and members','4'],['alerts','Live alerts','5'],['tracked','Tracked','6'],['audit','Audit cards','7'],['servers','Servers','8'],['dev','Dev tools','9'],['settings','Settings','0']];
function go(v,a){view=v;arg=a||null;render()}
function render(){
 if(!S.user&&!S.demo)return loginView();
 const gs=shownGuilds().length?shownGuilds():S.guilds;
 $('#app').innerHTML=`<nav><h1>Opsdeck</h1>${NAV.map(n=>`<a data-nav="${n[0]}" class="${view===n[0]?'on':''}">${n[1]}<kbd>${n[2]}</kbd></a>`).join('')}<div class="me">${esc(S.user?S.user.username:'Demo mode')}<br><a style="padding:0;display:inline;cursor:pointer;color:var(--er)" data-act="logout">Sign out</a></div></nav>
 <main><div class="top"><img class="gi" src="${gIcon(G(S.cfg.g))}" alt=""><select id="gsel" title="Active server">${gs.length?gs.map(g=>`<option value="${g.id}" ${S.cfg.g===g.id?'selected':''}>${esc(g.name)}</option>`).join(''):'<option value="">No servers selected</option>'}</select>
 <input id="quick" placeholder="Search a username or paste an ID, press Enter" style="max-width:340px"><span id="gw" class="mu"></span><span class="sp"></span><button data-act="pal">Command palette <span class="kb">Ctrl K</span></button></div><div id="view"></div></main>`;
 $('#gsel').onchange=e=>{S.cfg.g=e.target.value;save();if(view==='browse')browse()};
 $('#quick').onkeydown=e=>{if(e.key==='Enter'){const m=e.target.value.match(/\d{17,20}/g);if(m)go('lookup',m.join('\n'));else if(e.target.value.trim())go('search',e.target.value.trim())}};
 if(!S.cfg.g&&gs[0])S.cfg.g=gs[0].id;
 ({home,lookup,search,browse,alerts,tracked,audit,servers,dev,settings})[view]();setStatus();
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
 <p class="mu" id="s_st"></p><div id="s_out"></div><div class="bar"><button class="pri" id="s_save">Save</button><button id="s_chk">Test bot connection</button><button id="s_inv">Copy bot invite link</button><button id="s_test">Send test to webhook</button></div>
 <h3>Tags</h3><div class="card">${S.tagDefs.map(t=>`<span class="chip" style="color:${t.c}">${esc(t.n)}</span>`).join('')}<div class="bar" style="margin:10px 0 0"><input id="t_n" placeholder="New tag name"><input id="t_c" type="color" value="#8c9bff" style="width:60px;padding:2px"><button id="t_add">Add tag</button></div></div>
 <h3>Backup</h3><div class="bar"><button id="b_ex">Download JSON</button><button id="b_wh">Back up to webhook</button><button id="b_im">Import JSON</button><button class="dng" id="b_clr">Wipe local data</button></div><input type="file" id="b_f" hidden accept=".json">`);
 const cleanTok=v=>v.trim().replace(/^Bot\s+/i,'').replace(/\s+/g,'');
 const st=()=>{$('#s_st').textContent=S.cfg.bot?'Bot token saved in this browser (ends …'+S.cfg.bot.slice(-4)+')':'No bot token saved yet'};
 const sv=()=>{S.cfg.hook=$('#s_h').value.trim();S.cfg.bot=cleanTok($('#s_b').value);S.cfg.client=$('#s_c').value.trim();save();st()};
 ['s_h','s_b','s_c'].forEach(i=>$('#'+i).oninput=sv);st();
 $('#s_save').onclick=()=>{sv();toast('Saved');gwStop();gwStart();loadBotGuilds(true)};
 $('#s_inv').onclick=()=>{sv();if(!S.cfg.client)return toast('Enter the Client ID first');copy('https://discord.com/oauth2/authorize?client_id='+S.cfg.client+'&scope=bot&permissions=1099511704710','bot invite link (open it in a new tab)')};
 $('#s_chk').onclick=async()=>{sv();const o=$('#s_out');o.textContent='Checking…';try{const me=await api('/users/@me'),gs=await api('/users/@me/guilds');o.innerHTML=`<div class="card">Bot <b>${esc(me.username)}</b> is working (ID ${me.id}).<br>It is in ${gs.length} server(s): ${gs.map(g=>esc(g.name)).join(', ')||'none yet. Use Copy bot invite link and add it to your server.'}<br>Live connection: ${gwOk?'on':'not connected yet'}</div>`;loadBotGuilds(true)}catch(e){o.innerHTML=`<div class="card" style="border-color:var(--er)">Failed: ${esc(e.message)}<br>${hint(e.message)||'Copy the token again from Developer Portal, Bot, Reset Token.'}</div>`}};
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
 else if(!typing&&!e.ctrlKey&&!e.altKey&&!e.metaKey){if(e.key==='/'){e.preventDefault();$('#quick')?.focus()}else if(/^[0-9]$/.test(e.key)&&(S.user||S.demo))go(NAV[(+e.key+9)%10][0])}});
document.addEventListener('paste',e=>{if(/INPUT|TEXTAREA/.test(document.activeElement.tagName)||!(S.user||S.demo))return;const m=(e.clipboardData.getData('text').match(/\d{17,20}/g)||[]);if(m.length)go('lookup',m.join('\n'))});
let seen='';window.addEventListener('focus',async()=>{if(!(S.user||S.demo))return;try{const t=(await navigator.clipboard.readText()).trim();if(isId(t)&&t!==seen){seen=t;last=t;const o=document.createElement('div');o.className='card';o.style.cssText='position:fixed;right:16px;top:16px;z-index:15;border-color:var(--ac)';o.innerHTML=`ID on clipboard <b class="mono">${t}</b><div class="bar" style="margin:8px 0 0"><button class="pri" data-k="l">Look up</button><button data-k="t">Tag</button><button data-k="a">Audit</button></div>`;o.onclick=ev=>{const k=ev.target.dataset.k;if(k==='l')go('lookup',t);if(k==='t')tagDlg(t);if(k==='a')go('audit',{uid:t});if(k)o.remove()};document.body.append(o);setTimeout(()=>o.remove(),8000)}}catch{}});

// ---------- v2: icons, chat, live alerts, search ----------
const gIcon=(g,s=64)=>g&&g.icon?`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.${g.icon.startsWith('a_')?'gif':'png'}?size=${s}`:'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#3b4a78"/><text x="32" y="41" font-size="26" text-anchor="middle" fill="#fff" font-family="sans-serif">${(g?.name||'?').slice(0,2).replace(/[<&>]/g,'')}</text></svg>`);
const gBanner=g=>g&&g.banner?`https://cdn.discordapp.com/banners/${g.id}/${g.banner}.png?size=480`:'';
const G=id=>S.guilds.find(g=>g.id===id);
const rxEsc=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const hits=t=>{const w=S.words.filter(Boolean);if(!w.length)return[];const m=(t||'').match(new RegExp('('+w.map(rxEsc).join('|')+')','gi'));return m?[...new Set(m.map(x=>x.toLowerCase()))]:[]};
const flag=t=>{const w=S.words.filter(Boolean),e=esc(t||'');return w.length?e.replace(new RegExp('('+w.map(x=>rxEsc(esc(x))).join('|')+')','gi'),'<mark class="flag">$1</mark>'):e};
let BR={ch:null,tab:'chat'},unread=0,detDone=false;const chans={},msgs={};
const chanName=(g,c)=>(chans[g]||[]).find(x=>x.id===c)?.name||c;
const hint=m=>/Missing Access|Unknown Guild|Unknown Channel/i.test(m)?'The bot is not in this server. Use Settings, Copy bot invite link.':/401|Unauthorized/i.test(m)?'The bot token is wrong. Reset it in the Developer Portal and paste the new one.':/Missing Permissions/i.test(m)?'Give the bot that permission in the server.':/Failed to fetch|NetworkError/i.test(m)?'Network or browser block. Check your connection, then use Settings, Test bot connection.':'';
const hex=c=>'#'+c.toString(16).padStart(6,'0');
function fmt(t){let e=flag(t||'');e=e.replace(/&lt;@!?(\d{17,20})&gt;/g,(m,id)=>`<span class="mn">@${esc(cache[id]?.global_name||cache[id]?.username||id)}</span>`);e=e.replace(/&lt;(a?):(\w+):(\d+)&gt;/g,(m,an,n,id)=>`<img class="em" alt=":${n}:" src="https://cdn.discordapp.com/emojis/${id}.${an?'gif':'png'}?size=32">`);return e.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')}
function msgHtml(m){const a=m.author;cache[a.id]=a;note(a);const bad=hits(m.content).length,mem=m.member||{};
 const att=(m.attachments||[]).map(x=>/^image\//.test(x.content_type||'')?`<a href="${esc(x.url)}" target="_blank" rel="noopener"><img class="att" src="${esc(x.url)}" alt=""></a>`:`<div><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.filename)}</a></div>`).join('');
 const emb=(m.embeds||[]).map(x=>`<div class="emb"><b>${esc(x.title||'')}</b><div>${esc((x.description||'').slice(0,300))}</div></div>`).join('');
 return`<div class="msg ${bad?'bad':''}" data-id="${a.id}" data-mid="${m.id}"><img src="${av(a.id,{a:a.avatar})}" alt=""><div class="nm"><b>${esc(mem.nick||a.global_name||a.username)}</b>${a.bot?' <span class="kb">BOT</span>':''} <small style="display:inline">@${esc(a.username)} · ${new Date(m.timestamp).toLocaleString()}</small>${chips(S.tags[a.id])}<div class="mt">${fmt(m.content)}</div>${att}${emb}</div><div class="acts"><button data-act="cid">ID</button><button data-act="tag">Tag</button><button data-act="aud">Audit</button><button data-act="del" class="dng">Del</button><button data-act="menu">⋯</button></div></div>`}
const demoMsgs=()=>[['111111111111111101','nova','hello everyone'],['111111111111111102','kite','anyone selling free nitro scam link?'],['111111111111111103','mira','thanks for the help!']].map((x,i)=>({id:'9'+i,content:x[2],timestamp:new Date(Date.now()-i*6e4).toISOString(),author:{id:x[0],username:x[1],global_name:x[1].toUpperCase(),avatar:null},attachments:[]})).reverse();
function drawMsgs(bottom){const el=$('#ml');if(!el)return;el.innerHTML=(msgs[BR.ch]||[]).map(m=>msgHtml(m)).join('')||'<p class="mu">No messages.</p>';if(bottom)el.scrollTop=el.scrollHeight}
const memb={},roles={};
async function browse(){
 if(!S.demo&&!S.cfg.bot)return V('<h2>Chat</h2><div class="card">Discord only lets a bot read server chats. Add your bot token in Settings first.<div class="bar" style="margin:10px 0 0"><button class="pri" data-nav="settings">Open Settings</button></div></div>');
 const gl=S.guilds.filter(g=>S.cfg.shown.includes(g.id)),rail=gl.length?gl:S.guilds;
 if(!rail.length)return V('<h2>Chat</h2><div class="card">No servers yet. In Settings press Test bot connection. If it says the bot is in 0 servers, use Copy bot invite link and add the bot to your server.</div>');
 const g=rail.some(x=>x.id===S.cfg.g)?S.cfg.g:rail[0].id;S.cfg.g=g;const gd=G(g);
 V(`<div class="ws" id="ws"><div class="rail">${rail.map(x=>`<img src="${gIcon(x)}" data-gs="${x.id}" title="${esc(x.name)}" class="${x.id===g?'on':''}" alt="">`).join('')}</div>
 <div class="chl"><div class="sh" style="${gBanner(gd)?`background-image:linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.75)),url(${gBanner(gd)})`:''}"><b>${esc(gd?.name||'')}</b><small>${gd?.count?gd.count+' members':''}</small></div><div id="chn" class="mu" style="padding:10px">Loading channels…</div></div>
 <div class="chat"><div class="chh"><select id="chs" class="mobsel"></select><b id="chtitle"></b><span class="sp"></span><button id="memt" class="mobsel">Members</button><button id="chr">Reload</button><button id="chc">Channel ID</button></div><div id="ml"></div><div class="cmp"><input id="cin" placeholder="Send a message as the bot" autocomplete="off"><button class="pri" id="csend">Send</button></div></div>
 <div class="mem"><div class="mh"><input id="mf" placeholder="Filter members"></div><div id="mb" class="mu" style="padding:10px">Loading members…</div></div></div>`);
 $('.rail').onclick=e=>{const id=e.target.dataset.gs;if(id){S.cfg.g=id;save();BR.ch=null;browse()}};
 let cs=chans[g];
 try{if(!cs)cs=chans[g]=S.demo?[{id:'d1',name:'general',type:0,position:0},{id:'d2',name:'support',type:0,position:1}]:await api(`/guilds/${g}/channels`)}catch(e){$('#chn').innerHTML=esc(e.message)+'<br>'+hint(e.message);$('#ml').innerHTML='';return loadMembers(g)}
 const cats=cs.filter(c=>c.type===4).sort((a,b)=>a.position-b.position),isT=c=>c.type===0||c.type===5,isV=c=>c.type===2||c.type===13;
 const by=p=>cs.filter(c=>(isT(c)||isV(c))&&(c.parent_id||null)===p).sort((a,b)=>(isV(a)-isV(b))||a.position-b.position);
 const chHtml=c=>isT(c)?`<div class="ch ${c.id===BR.ch?'on':''}" data-ch="${c.id}"># ${esc(c.name)}</div>`:`<div class="ch v">🔊 ${esc(c.name)}</div>`;
 const tx=cs.filter(isT);if(!tx.some(c=>c.id===BR.ch))BR.ch=(by(null).find(isT)||cats.map(k=>by(k.id).find(isT)).find(Boolean)||tx[0])?.id;
 $('#chn').innerHTML=by(null).map(chHtml).join('')+cats.map(k=>`<div class="cat">${esc(k.name)}</div>`+by(k.id).map(chHtml).join('')).join('');
 $('#chs').innerHTML=tx.map(c=>`<option value="${c.id}" ${c.id===BR.ch?'selected':''}># ${esc(c.name)}</option>`).join('');
 const open=async id=>{BR.ch=id;document.querySelectorAll('.ch').forEach(x=>x.classList.toggle('on',x.dataset.ch===id));$('#chs').value=id;$('#chtitle').textContent='# '+chanName(g,id);$('#ml').innerHTML='<p class="mu" style="padding:10px">Loading…</p>';
  try{if(S.demo)msgs[id]=msgs[id]||demoMsgs();else msgs[id]=(await api(`/channels/${id}/messages?limit=60`)).reverse();drawMsgs(true)}catch(e){$('#ml').innerHTML=`<p class="mu" style="padding:10px">${esc(e.message)}. ${hint(e.message)} The bot needs View Channel and Read Message History here, and Message Content Intent must be on.</p>`}};
 $('#chn').onclick=e=>{const id=e.target.dataset.ch;if(id)open(id)};$('#chs').onchange=e=>open(e.target.value);$('#chr').onclick=()=>BR.ch&&open(BR.ch);$('#chc').onclick=()=>copy(BR.ch,'channel ID');
 $('#memt').onclick=()=>$('#ws').classList.toggle('sm');
 const send=async()=>{const t=$('#cin').value.trim();if(!t||!BR.ch)return;if(S.demo)return toast('Demo mode: not sent');try{const m=await api(`/channels/${BR.ch}/messages`,{method:'POST',body:{content:t}});$('#cin').value='';if(!gwOk){(msgs[BR.ch]||(msgs[BR.ch]=[])).push(m);drawMsgs(true)}}catch(e){toast(e.message+' '+hint(e.message))}};
 $('#csend').onclick=send;$('#cin').onkeydown=e=>e.key==='Enter'&&send();
 if(BR.ch)open(BR.ch);else $('#ml').innerHTML='<p class="mu" style="padding:10px">No text channels visible to the bot.</p>';
 loadMembers(g)}
async function loadMembers(g){const el=$('#mb');if(!el)return;
 try{if(!memb[g]){if(S.demo)memb[g]=demoMsgs().map(x=>({user:x.author,roles:[]}));else{const [m,r]=await Promise.all([api(`/guilds/${g}/members?limit=1000`),api(`/guilds/${g}/roles`)]);memb[g]=m;roles[g]=r}}
  const draw=()=>{const f=($('#mf')?.value||'').toLowerCase(),rl=roles[g]||[],rs=rl.filter(r=>r.hoist).sort((a,b)=>b.position-a.position),rc=Object.fromEntries(rl.map(r=>[r.id,r]));
   const nm=x=>x.nick||x.user.global_name||x.user.username;
   const list=memb[g].filter(x=>!f||nm(x).toLowerCase().includes(f)||x.user.username.toLowerCase().includes(f)),grp=new Map();
   list.forEach(x=>{cache[x.user.id]=x.user;const top=rs.find(r=>x.roles.includes(r.id)),k=top?top.id:'_';(grp.get(k)||grp.set(k,[]).get(k)).push(x)});
   el.innerHTML=[...rs.map(r=>r.id),'_'].filter(k=>grp.has(k)).map(k=>`<div class="cat">${esc(k==='_'?'Members':rc[k].name)} - ${grp.get(k).length}</div>`+grp.get(k).slice(0,200).map(x=>{const cr=x.roles.map(i=>rc[i]).filter(r=>r&&r.color).sort((a,b)=>b.position-a.position)[0];
    return`<div class="mi" data-id="${x.user.id}"><img src="${av(x.user.id,{a:x.user.avatar})}" alt=""><span style="color:${cr?hex(cr.color):'inherit'}">${esc(nm(x))}${x.user.bot?' 🤖':''}</span>${(S.tags[x.user.id]?.tags||[]).map(n=>`<i class="dot" style="background:${tdef(n).c}" title="${esc(n)}"></i>`).join('')}<button data-act="cid">ID</button><button data-act="tag">Tag</button><button data-act="menu">⋯</button></div>`}).join('')).join('')||'No members.'};
  draw();$('#mf').oninput=draw}catch(e){el.textContent=e.message+' '+hint(e.message)+' (Server Members intent must be on.)'}}
async function loadBotGuilds(quiet){if(!S.cfg.bot||S.demo)return;
 try{const b=await api('/users/@me/guilds'),old=new Map(S.guilds.map(g=>[g.id,g])),ids=new Set(b.map(g=>g.id));
  S.guilds=[...b.map(g=>({...(old.get(g.id)||{}),id:g.id,name:g.name,icon:g.icon,bot:true})),...S.guilds.filter(g=>!ids.has(g.id)).map(g=>({...g,bot:false}))];
  if(!S.cfg.shown.length)S.cfg.shown=b.map(g=>g.id);if(!S.guilds.some(g=>g.id===S.cfg.g))S.cfg.g=b[0]?.id||'';save();if(!quiet)render();
  for(const g of S.guilds.filter(x=>x.bot)){try{const d=await api(`/guilds/${g.id}?with_counts=true`);Object.assign(g,{icon:d.icon,banner:d.banner,count:d.approximate_member_count})}catch{}}
  save();if(view==='servers')servers();else if(!quiet&&view==='home')render()}
 catch(e){toast('Bot: '+e.message+' '+hint(e.message))}}
function gwStop(){if(ws){ws.onclose=null;try{ws.close()}catch{}ws=null;gwOk=false;clearInterval(hb);setStatus()}}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-act="del"]');if(!b)return;const m=b.closest('.msg');if(!m||!confirm('Delete this message?'))return;
 try{await api(`/channels/${BR.ch}/messages/${m.dataset.mid}`,{method:'DELETE',reason:'Opsdeck moderation'});msgs[BR.ch]=(msgs[BR.ch]||[]).filter(x=>x.id!==m.dataset.mid);drawMsgs();toast('Deleted')}catch(err){toast(err.message+' '+hint(err.message))}});
function memTab(g){$('#bw').innerHTML='<div class="bar"><input id="mq" placeholder="Search members (empty = recent)"><button class="pri" id="mgo">Search</button></div><div id="mres" class="mu"></div>';
 const run=async()=>{$('#mres').textContent='Loading…';const q=$('#mq').value.trim();
  try{const m=S.demo?demoMsgs().map(x=>({user:x.author})):await api(q?`/guilds/${g}/members/search?query=${encodeURIComponent(q)}&limit=50`:`/guilds/${g}/members?limit=100`);m.forEach(x=>{cache[x.user.id]=x.user;note(x.user)});$('#mres').innerHTML=`<p class="mu">${m.length} members</p>`+(m.map(x=>row(x.user.id)).join('')||'No matches.')}catch(e){$('#mres').textContent=e.message+' (needs Server Members intent)'}};
 $('#mgo').onclick=run;$('#mq').onkeydown=e=>e.key==='Enter'&&run();run()}
async function search(){const q=typeof arg==='string'?arg:'';
 V(`<h2>Search users</h2><div class="bar"><input id="sq" value="${esc(q)}" placeholder="Username, display name, nickname or ID"><button class="pri" id="sg">Search</button></div><p class="mu">Discord has no search across every account. This checks your tracked users (including their old names) and all selected servers your bot is in.</p><div id="sr"></div>`);
 const run=async()=>{const v=$('#sq').value.trim();if(!v)return;const ids=v.match(/\d{17,20}/g);if(ids)return go('lookup',ids.join('\n'));
  let h='';const seen=new Set(),ql=v.toLowerCase(),has=x=>(x||'').toLowerCase().includes(ql);
  const tr=Object.keys(S.tags).filter(id=>S.tags[id].snap.some(s=>has(s.u)||has(s.d)));
  if(tr.length)h+='<h3>Tracked users (old names included)</h3>'+tr.map(id=>(seen.add(id),row(id))).join('');
  $('#sr').innerHTML=h+'<p class="mu">Searching servers…</p>';
  for(const g of shownGuilds()){try{const m=S.demo?[]:await api(`/guilds/${g.id}/members/search?query=${encodeURIComponent(v)}&limit=25`);m.forEach(x=>{cache[x.user.id]=x.user;note(x.user)});const f=m.filter(x=>!seen.has(x.user.id));f.forEach(x=>seen.add(x.user.id));if(f.length)h+=`<h3><img class="gi" src="${gIcon(g,32)}" alt=""> ${esc(g.name)}</h3>`+f.map(x=>row(x.user.id)).join('')}catch(e){h+=`<p class="mu">${esc(g.name)}: ${esc(e.message)}</p>`}$('#sr').innerHTML=h+'<p class="mu">Searching…</p>'}
  $('#sr').innerHTML=h||'<p class="mu">No matches. Add a bot token and select servers first.</p>'};
 $('#sg').onclick=run;$('#sq').onkeydown=e=>e.key==='Enter'&&run();if(q)run()}
function alerts(){unread=0;document.title='Opsdeck';
 V(`<h2>Live alerts</h2><div class="card"><b>Flagged words</b><div class="mu">When anyone says one in a selected server, you get a notification and the word shows in red.</div><div class="bar" style="margin-top:8px"><input id="fw" placeholder="Add words or phrases, comma separated"><button class="pri" id="fwa">Add</button><button id="fwn">Enable notifications</button></div><div id="fwl">${S.words.map(w=>`<span class="chip" data-fw="${esc(w)}" style="color:#ff8d98">${esc(w)} ✕</span>`).join('')||'<span class="mu">No words yet.</span>'}</div><p class="mu" id="gws" style="margin-bottom:0">${S.demo?'Demo mode has no live connection.':gwOk?'Live connection is on.':S.cfg.bot?'Connecting to Discord…':'Add a bot token in Settings to go live.'}</p></div>
 <div class="bar"><h3 style="margin:0;flex:1">Recent hits</h3><button id="fwc">Clear</button></div>${S.alerts.map(a=>`<div class="msg bad" data-id="${a.u}"><img src="${av(a.u,snapU(a.u))}" alt=""><div class="nm"><b>@${esc(a.un)}</b> <small style="display:inline">#${esc(chanName(a.g,a.c))} · ${esc(gName(a.g))} · ${new Date(a.t).toLocaleString()}</small><div class="mt">${fmt(a.txt)}</div></div><div class="acts"><button data-act="cid">ID</button><button data-act="tag">Tag</button><button data-act="aud">Audit</button><a href="https://discord.com/channels/${a.g}/${a.c}/${a.id}" target="_blank" rel="noopener"><button>Jump</button></a></div></div>`).join('')||'<p class="mu">No hits yet.</p>'}`);
 $('#fwa').onclick=()=>{$('#fw').value.split(',').map(x=>x.trim()).filter(x=>x&&!S.words.includes(x)).forEach(x=>S.words.push(x));save();alerts()};
 $('#fw').onkeydown=e=>e.key==='Enter'&&$('#fwa').click();
 $('#fwl').onclick=e=>{const w=e.target.dataset.fw;if(w){S.words=S.words.filter(x=>x!==w);save();alerts()}};
 $('#fwn').onclick=async()=>{if(!('Notification' in window))return toast('Notifications not supported here');toast('Permission: '+await Notification.requestPermission())};
 $('#fwc').onclick=()=>{S.alerts=[];save();alerts()}}
async function servers(){V('<h2>Servers</h2><p class="mu">Tick the servers you want in the dashboard, chat view and alerts.</p><div class="bar"><button class="pri" id="sbot">Load servers, icons and banners from bot</button></div><div id="sl"></div>');
 const draw=()=>$('#sl').innerHTML=S.guilds.map(g=>`<label class="row" style="cursor:pointer;${gBanner(g)?`background-image:linear-gradient(90deg,rgba(8,12,26,.85),rgba(8,12,26,.35)),url(${gBanner(g)});background-size:cover`:''}"><input type="checkbox" style="width:auto" data-g="${g.id}" ${S.cfg.shown.includes(g.id)?'checked':''}><img class="gi big" src="${gIcon(g)}" alt=""><div class="nm"><b>${esc(g.name)}</b><small>${g.id}${g.count?' · '+g.count+' members':''}</small></div><button data-act="cgid" data-id="${g.id}">Copy ID</button></label>`).join('')||'<p class="mu">No servers yet. Add a bot token in Settings, then load.</p>';
 draw();$('#sl').onchange=e=>{const g=e.target.dataset.g;if(!g)return;S.cfg.shown=e.target.checked?[...S.cfg.shown,g]:S.cfg.shown.filter(x=>x!==g);save()};
 $('#sbot').onclick=async()=>{try{const b=await api('/users/@me/guilds');const m=new Map(S.guilds.map(g=>[g.id,g]));b.forEach(g=>m.set(g.id,{...(m.get(g.id)||{}),id:g.id,name:g.name,icon:g.icon}));S.guilds=[...m.values()];save();draw();for(const g of S.guilds){try{const d=await api(`/guilds/${g.id}?with_counts=true`);Object.assign(g,{icon:d.icon,banner:d.banner,count:d.approximate_member_count});draw()}catch{}}save()}catch(e){toast(e.message)}};
 if(S.cfg.bot&&!detDone&&!S.demo){detDone=true;$('#sbot').click()}}
// live gateway
let ws,hb,seq=null,gwOk=false;
const setStatus=()=>{const e=$('#gw');if(e){e.textContent=S.demo?'demo':gwOk?'● live':(S.cfg.bot?'○ connecting':'○ no bot');e.style.color=gwOk?'var(--ok)':'var(--mu)'}};
function gwStart(){if(!S.cfg.bot||S.demo||ws)return;ws=new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
 ws.onmessage=e=>{const p=JSON.parse(e.data);if(p.s)seq=p.s;
  if(p.op===10){clearInterval(hb);hb=setInterval(()=>ws&&ws.readyState===1&&ws.send(JSON.stringify({op:1,d:seq})),p.d.heartbeat_interval);ws.send(JSON.stringify({op:2,d:{token:S.cfg.bot,intents:1|2|512|32768,properties:{os:'web',browser:'opsdeck',device:'opsdeck'}}}))}
  else if(p.op===0){if(p.t==='READY'){gwOk=true;setStatus()}
   else if(p.t==='GUILD_CREATE'){const d=p.d;chans[d.id]=d.channels||[];let g=G(d.id);if(!g){g={id:d.id,name:d.name};S.guilds.push(g)}Object.assign(g,{name:d.name,icon:d.icon,banner:d.banner,count:d.member_count})}
   else if(p.t==='MESSAGE_CREATE')onMsg(p.d)}};
 ws.onclose=e=>{clearInterval(hb);ws=null;gwOk=false;setStatus();if(e.code===4014)toast('Turn on Message Content Intent in the bot settings');else if(e.code===4004)toast('Bot token is invalid');else setTimeout(gwStart,5000)}}
function onMsg(d){if(!d.author||!S.cfg.shown.includes(d.guild_id))return;cache[d.author.id]=d.author;note(d.author);
 const l=msgs[d.channel_id]||(msgs[d.channel_id]=[]);l.push(d);if(l.length>200)l.shift();
 const h=hits(d.content);if(h.length){S.alerts.unshift({id:d.id,g:d.guild_id,c:d.channel_id,u:d.author.id,un:d.author.username,txt:(d.content||'').slice(0,500),w:h,t:Date.now()});S.alerts=S.alerts.slice(0,150);save();notify(d,h);if(view==='alerts')alerts()}
 if(view==='browse'&&BR.tab==='chat'&&BR.ch===d.channel_id)drawMsgs(true)}
function notify(d,h){const who=d.author.global_name||d.author.username;toast('Flagged "'+h[0]+'" by '+who);
 try{const a=new(window.AudioContext||webkitAudioContext)(),o=a.createOscillator();o.connect(a.destination);o.frequency.value=880;o.start();setTimeout(()=>o.stop(),160)}catch{}
 if('Notification' in window&&Notification.permission==='granted')new Notification('Flagged: '+h.join(', '),{body:who+' in #'+chanName(d.guild_id,d.channel_id)+': '+(d.content||'').slice(0,120),icon:'icon-192.png'});
 document.title='('+(++unread)+') Opsdeck'}

// ---------- boot ----------
(async()=>{const h=new URLSearchParams(location.hash.slice(1));
 if(h.get('access_token')){S.token=h.get('access_token');history.replaceState(null,'',location.pathname+location.search);save()}
 if(S.token&&!S.user){try{S.user=await api('/users/@me',{as:'user'});S.guilds=(await api('/users/@me/guilds',{as:'user'})).map(g=>({id:g.id,name:g.name,icon:g.icon}));save()}catch(e){S.token='';save();toast('Sign-in failed: '+e.message)}}
 render();loadBotGuilds();gwStart()})();
