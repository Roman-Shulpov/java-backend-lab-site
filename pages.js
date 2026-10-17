/* Static GitHub Pages adapter. Lessons and notes work without a server.
   A repository-scoped token stays in this tab unless the user opts into device storage. */
'use strict';
(() => {
  const STORAGE = 'java-backend-lab-pages-progress-v1';
  const BRANCH = 'java-backend-lab-pages-branch';
  const REMOTE = 'https://api.github.com/repos/Roman-Shulpov/java-backend-lab/contents/progress/state.json';
  const AUTH='java-lab-device-key';
  let credential = localStorage.getItem(AUTH)||'';
  let selectedBranch = localStorage.getItem(BRANCH) || 'main';
  let lastSync = null;
  let working = {schema:1,revision:0,entries:{},sessions:[]};
  let baseline=null;
  const baseKey=()=>STORAGE+'-baseline-'+selectedBranch;
  const copy = value => JSON.parse(JSON.stringify(value));
  const reply = (data, status=200) => new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json'}});
  function valid(state) {return state && state.schema === 1 && Number.isInteger(state.revision) && state.revision >= 0 && state.entries && typeof state.entries === 'object' && Array.isArray(state.sessions);}
  try {const saved=JSON.parse(localStorage.getItem(STORAGE));if(valid(saved))working=saved;}catch{}
  try {const saved=JSON.parse(localStorage.getItem(baseKey()));if(valid(saved))baseline=saved;}catch{}
  const dateBarnaul = () => {
    const parts = new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Barnaul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const value=Object.fromEntries(parts.map(p=>[p.type,p.value]));
    return `${value.year}-${value.month}-${value.day}`;
  };
  function week(state) {
    const now=dateBarnaul(), one=86400000, today=Date.parse(now+'T00:00:00Z');
    const monday=today-((new Date(today).getUTCDay()+6)%7)*one;
    const seen=new Set(state.sessions.map(s=>s.date).filter(s=>/^\d{4}-\d{2}-\d{2}$/.test(s)));
    const weeks=new Map();
    for(const stamp of seen){const day=Date.parse(stamp+'T00:00:00Z');if(day>today)continue;const begin=day-((new Date(day).getUTCDay()+6)%7)*one;weeks.set(begin,(weeks.get(begin)||0)+1);}
    const count=weeks.get(monday)||0;let streak=0,cursor=count>=3?monday:monday-7*one;
    while((weeks.get(cursor)||0)>=3){streak++;cursor-=7*one;}
    return {count,target:3,streak,active:count>0||streak>0,weekStart:new Date(monday).toISOString().slice(0,10),days:Array.from({length:7},(_,i)=>seen.has(new Date(monday+i*one).toISOString().slice(0,10))),today:now};
  }
  const snapshot = () => ({state:copy(working),version:String(working.revision),week:week(working),lastSync,token:'pages'});
  const store = () => {
    try {localStorage.setItem(STORAGE,JSON.stringify(working));}
    catch {throw Error('Браузер не разрешил сохранить отметки. Проверь доступ к памяти сайта или сохрани работу в локальном кабинете.');}
  };
  function change(body){
    if(body.version!==String(working.revision))throw Error('Прогресс изменился в другой вкладке. Обнови страницу перед сохранением.');
    const match=/^(\d{1,2})-(\d{2})$/.exec(body.lesson||'');
    if(!match||+match[1]<1||+match[1]>45||+match[2]<1||+match[2]>12)throw Error('Неизвестное занятие.');
    const [n,d]=[+match[1],+match[2]];
    const action=body.action, note=String(body.note||'').trim(), checks=body.checks||{};
    if(!['save','practice','complete','undo'].includes(action))throw Error('Неизвестное действие.');
    if(note.length>4000)throw Error('Заметка должна быть короче 4000 символов.');
    if(['practice','complete'].includes(action)&&(note.length<10||checks.worked!==true))throw Error('Подтверди работу и напиши хотя бы 10 символов о результате.');
    if(action==='complete'&&['worked','checked','explain'].some(k=>checks[k]!==true))throw Error('Перед завершением подтверди три пункта самопроверки.');
    if(action==='complete'&&d===10&&Array.from({length:9},(_,i)=>`${n}-${String(i+1).padStart(2,'0')}`).some(k=>!working.entries[k]?.done))throw Error('Сначала заверши дни 1–9 этого месяца.');
    const next=copy(working),item=next.entries[body.lesson]||{done:false};
    item.note=note;item.checks={worked:checks.worked===true,checked:checks.checked===true,explain:checks.explain===true};
    const today=dateBarnaul();
    if(action==='complete'){item.done=true;item.completedOn=item.completedOn||today;}
    if(action==='undo'){for(const session of next.sessions)if(session.lesson===body.lesson||(d<10&&session.lesson===`${n}-10`))session.kind='practice';item.done=false;delete item.completedOn;if(d<10&&next.entries[`${n}-10`]){next.entries[`${n}-10`].done=false;delete next.entries[`${n}-10`].completedOn;}}
    next.entries[body.lesson]=item;
    if(action==='practice'||action==='complete'){
      const pos=next.sessions.findIndex(s=>s.date===today&&s.lesson===body.lesson);
      const session={date:today,lesson:body.lesson,note,kind:action==='complete'?'complete':(pos>=0&&next.sessions[pos].kind==='complete'?'complete':'practice')};
      if(pos>=0)next.sessions[pos]=session;else next.sessions.push(session);
    }
    next.revision++;
    const before=working;working=next;
    try{store();}catch(error){working=before;throw error;}
    return snapshot();
  }
  function credentials(){
    if(credential)return Promise.resolve(true);
    const dialog=document.getElementById('pages-connect');
    const token=dialog.querySelector('#pages-token');
    const branch=dialog.querySelector('#pages-branch');
    branch.value=selectedBranch;
    token.value='';
    dialog.returnValue='cancel';
    return new Promise(resolve=>{
      const finish=()=>{
        dialog.removeEventListener('close',finish);
        if(dialog.returnValue!=='connect'){resolve(false);return;}
        const value=token.value.trim(),name=branch.value.trim();
        token.value='';
        if(!value||!name||!(/^[A-Za-z0-9._/-]+$/.test(name))){resolve(false);return;}
        credential=value;selectedBranch=name;
        localStorage.setItem(BRANCH,name);
        if(dialog.querySelector('#pages-remember').checked)localStorage.setItem(AUTH,value);else localStorage.removeItem(AUTH);
        try{baseline=JSON.parse(localStorage.getItem(baseKey()));}catch{baseline=null;}
        resolve(true);
      };
      dialog.addEventListener('close',finish,{once:true});
      dialog.showModal();
      token.focus();
    });
  }
  async function remote(method,body){
    const response=await fetch(REMOTE+'?ref='+encodeURIComponent(selectedBranch),{method,headers:{Authorization:'Bearer '+credential,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
    if(response.status===401||response.status===403){credential='';localStorage.removeItem(AUTH);throw Error('GitHub не принял ключ. Подключи сайт заново: только java-backend-lab, Contents: Read and write. Ключ виджета Read-only остаётся отдельным.');}
    if(response.status===404)throw Error('Файл прогресса или ветка не найдены. Проверь ветку и доступ ключа к java-backend-lab.');
    if(response.status===409||response.status===422)throw Error('Ветка изменилась на GitHub. Перезагрузи страницу и повтори синхронизацию.');
    if(!response.ok)throw Error('GitHub временно не сохранил прогресс. Локальные отметки целы.');
    return response.json();
  }
  const decode=data=>JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(data.replace(/\s/g,'')),c=>c.charCodeAt(0))));
  const encode=data=>{const bytes=new TextEncoder().encode(JSON.stringify(data,null,2)+'\n');let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.slice(i,i+8192));return btoa(binary);};
  const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
  function mergeMap(base,local,remote){
    const result={};for(const key of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)])){
      const b=base[key],l=local[key],r=remote[key];let value;
      if(stable(l)===stable(r)||stable(r)===stable(b))value=l;
      else if(stable(l)===stable(b))value=r;
      else throw Error('Одна запись изменена на двух устройствах: '+key+'. Обе версии сохранены. Скачай резервную копию в разделе помощи; автоматическая отправка остановлена до разрешения конфликта.');
      if(value!==undefined)result[key]=value;
    }return result;
  }
  function merged(base,local,online){
    const sessions=s=>Object.fromEntries(s.sessions.map(v=>[v.date+'/'+v.lesson,v]));
    return {schema:1,revision:Math.max(local.revision,online.revision)+1,
      entries:mergeMap(base.entries,local.entries,online.entries),
      sessions:Object.values(mergeMap(sessions(base),sessions(local),sessions(online))).sort((a,b)=>(a.date+'/'+a.lesson).localeCompare(b.date+'/'+b.lesson))};
  }
  async function sync(interactive=true){
    if(!credential&&(!interactive||!await credentials()))throw Error('Подключи GitHub один раз для автоматического сохранения. Отметки уже сохранены на устройстве.');
    const file=await remote('GET');
    const online=decode(file.content);
    if(!valid(online))throw Error('Файл прогресса на GitHub имеет неизвестный формат. Ничего не перезаписано.');
    const before=copy(working),empty={schema:1,revision:0,entries:{},sessions:[]};
    const content=s=>stable({entries:s.entries,sessions:s.sessions});
    let next;
    if(content(before)===content(online))next=online;
    else if(!Object.keys(before.entries).length&&!before.sessions.length)next=online;
    else next=merged(baseline||empty,before,online);
    if(content(next)!==content(online))await remote('PUT',{message:'study: sync learning progress',content:encode(next),sha:file.sha,branch:selectedBranch});
    baseline=copy(next);localStorage.setItem(baseKey(),JSON.stringify(baseline));
    // A second tab can add work while the request is in flight. Retain it.
    working=content(working)===content(before)?next:merged(before,working,next);store();
    lastSync={branch:selectedBranch,at:new Date().toISOString()};
    return {...snapshot(),message:'Прогресс синхронизирован · '+selectedBranch};
  }
  window.addEventListener('storage',event=>{if(event.key===STORAGE){try{const changed=JSON.parse(event.newValue);if(valid(changed))working=changed;}catch{}}});
  window.LabPages={connected:()=>Boolean(credential),disconnect:()=>{credential='';localStorage.removeItem(AUTH);},fetch:async(path,options)=>{
    try{
      if(path==='/api/state')return reply(snapshot());
      if(path==='/api/export')return reply(copy(working));
      if(path==='/api/progress')return reply(change(JSON.parse(options.body)));
      if(path==='/api/sync')return reply(await sync(JSON.parse(options?.body||'{}').interactive!==false));
      return reply({error:'Неизвестное действие.'},404);
    }catch(error){return reply({error:error.message||'Не удалось сохранить.'},409);}
  }};
})();
