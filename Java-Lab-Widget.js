// Java Lab for Scriptable. Secrets belong only in iPhone Keychain.
// Generated with the same calendar engine as the learning portal.
/* One calendar for the site and Scriptable. Dates are in Asia/Barnaul. */
(function(root){
  const DAY=86400000;
  const iso=t=>new Date(t).toISOString().slice(0,10);
  const time=s=>Date.parse(s+'T00:00:00Z');
  const dow=t=>(new Date(t).getUTCDay()+6)%7;
  const planned=t=>[0,2,4].includes(dow(t));
  function date(now=new Date()){return iso(now.getTime()+7*3600000);}
  function slot(t){while(!planned(t))t-=DAY;return t;}
  function stats(state,today=date()){
    const current=time(today),monday=current-dow(current)*DAY;
    const sessions=(state.sessions||[]).filter(s=>/^\d{4}-\d{2}-\d{2}$/.test(s.date)&&s.date<=today);
    const completed=new Set(sessions.filter(s=>s.kind==='complete'||(!s.kind&&state.entries?.[s.lesson]?.completedOn===s.date&&state.entries[s.lesson].done)).map(s=>s.date));
    const slots=new Set([...completed].map(d=>iso(slot(time(d)))));
    const latest=slot(current),isStudy=planned(current),done=slots.has(iso(latest));
    const active=done,mode=done?(isStudy?'lit':'rest'):(isStudy?'waiting':'idle');
    let cursor=isStudy&&!done?slot(current-DAY):latest,streak=0;
    while(slots.has(iso(cursor))){streak++;cursor=slot(cursor-DAY);}
    let next=current+(isStudy&&!done?0:DAY);while(!planned(next))next+=DAY;
    const days=Array.from({length:7},(_,i)=>{const t=monday+i*DAY;return {date:iso(t),planned:planned(t),done:slots.has(iso(t)),activity:sessions.some(s=>s.date===iso(t)),future:t>current};});
    const count=days.filter(d=>d.planned&&d.done).length;
    const activity={};for(const s of sessions){(activity[s.date]??=new Set()).add(s.lesson);}
    return {today,mode,active,isStudy,done,count,streak,next:iso(next),days,completedDays:completed.size,
      title:mode==='lit'?'Сегодня получилось!':mode==='rest'?'Сегодня отдых':mode==='waiting'?'Твой учебный день':'Отдых. Начнём спокойно',
      hint:mode==='lit'?'Огонёк зажжён. Хорошая работа.':mode==='rest'?'Огонёк с тобой. Можно выдохнуть.':mode==='waiting'?'Заверши один урок — зажги огонёк.':'Огонёк зажжётся после завершённого урока.',
      activity:Object.fromEntries(Object.entries(activity).map(([k,v])=>[k,v.size]))};
  }
  const api={stats,date,DAY};root.LabRhythm=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

async function main(){
  const HOME='https://roman-shulpov.github.io/java-backend-lab-site/#home';
  const KEY='java-backend-lab-read-token',BRANCH_KEY='java-backend-lab-branch';
  let reset=false;
  if(!config.runsInWidget&&Keychain.contains(KEY)){
    const menu=new Alert();menu.title='Java Lab';menu.addAction('Показать виджет');menu.addAction('Заменить ключ');menu.addCancelAction('Отмена');
    const choice=await menu.presentAlert();if(choice<0)return;reset=choice===1;
  }
  if(reset||!Keychain.contains(KEY)){
    if(config.runsInWidget){const w=new ListWidget();w.addText('Открой Java Lab в Scriptable для настройки.');w.url=HOME;Script.setWidget(w);Script.complete();return;}
    const setup=new Alert();setup.title='Java Lab';
    setup.message='Ключ только для java-backend-lab, Contents: Read-only. Вставь его сюда, не в код. Ветка обычно main.';
    setup.addSecureTextField('GitHub token');setup.addTextField('Ветка','main');setup.addAction('Сохранить');setup.addCancelAction('Отмена');
    if(await setup.presentAlert()<0)return;
    const value=setup.textFieldValue(0).trim();if(!value)return;
    Keychain.set(KEY,value);Keychain.set(BRANCH_KEY,setup.textFieldValue(1).trim()||'main');
  }
  const branch=String(args.widgetParameter||(Keychain.contains(BRANCH_KEY)?Keychain.get(BRANCH_KEY):'main')).trim();
  const fm=FileManager.local(),cache=fm.joinPath(fm.cacheDirectory(),'java-lab-'+encodeURIComponent(branch)+'.json');
  let state=null,stale=false,fetchedAt=null;
  try{
    const request=new Request('https://api.github.com/repos/Roman-Shulpov/java-backend-lab/contents/progress/state.json?ref='+encodeURIComponent(branch));
    request.headers={Authorization:'Bearer '+Keychain.get(KEY),Accept:'application/vnd.github.raw+json','X-GitHub-Api-Version':'2022-11-28'};request.timeoutInterval=12;
    state=await request.loadJSON();
    if(request.response.statusCode!==200||state.schema!==1||!Array.isArray(state.sessions)||!state.entries)throw Error('No progress');
    fetchedAt=new Date().toISOString();fm.writeString(cache,JSON.stringify({state,fetchedAt}));
  }catch(_){stale=true;try{const data=JSON.parse(fm.readString(cache));state=data.state;fetchedAt=data.fetchedAt;}catch(_){state=null;}}
  const r=state?LabRhythm.stats(state):null,mode=r?r.mode:'idle';
  const w=new ListWidget();w.backgroundColor=new Color(mode==='rest'?'375a88':'6249a6');w.setPadding(14,14,12,14);
  w.refreshAfterDate=new Date(Date.now()+15*60*1000);
  const artPath=fm.joinPath(fm.cacheDirectory(),'java-lab-art-v3-'+mode+'.png');
  try{w.backgroundImage=fm.readImage(artPath);}catch(_){try{const req=new Request('https://roman-shulpov.github.io/java-backend-lab-site/widget-'+mode+'.png');req.timeoutInterval=4;const pic=await req.loadImage();w.backgroundImage=pic;fm.writeImage(artPath,pic);}catch(_){}}
  const text=(value,size,color,bold=false)=>{const t=w.addText(value);t.font=bold?Font.boldSystemFont(size):Font.systemFont(size);t.textColor=new Color(color);t.lineLimit=1;t.minimumScaleFactor=.7;return t;};
  text('Java Lab',12,'fff6fd',true);w.addSpacer(7);
  if(r){
    text(r.count+' / 3',30,'fff1c8',true);w.addSpacer(4);
    text(r.mode==='lit'?'Урок завершён!':r.isStudy?'Время зажечь':'Сегодня отдых',11,'f7eafa',true);
    let next=null;outer:for(let n=1;n<=45;n++)for(let d=1;d<=10;d++){if(!state.entries[n+'-'+String(d).padStart(2,'0')]?.done){next=[n,d];break outer;}}
    w.addSpacer(5);text(next?next[0]+'M · день '+next[1]:'45 месяцев пройдены',10,'e5dcf8');
    text(r.streak+' уч. дней подряд',9,'dcd0f5');
  }else{text('Нет данных',22,'fff3e5',true);text('Проверь доступ к GitHub',10,'e8dff6');}
  w.addSpacer();
  text(stale?(state?'Копия · '+new Date(fetchedAt).toLocaleDateString('ru-RU'):'Открой Scriptable'):'ПН · СР · ПТ',8,'e5d8f3');
  w.url=HOME;Script.setWidget(w);if(!config.runsInWidget)await w.presentSmall();Script.complete();
}
await main();
