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
