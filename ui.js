'use strict';
(() => {
 const search=document.getElementById('lesson-search'),input=document.getElementById('search-input'),results=document.getElementById('search-results');
 const normalize=value=>value.toLocaleLowerCase('ru-RU').replaceAll('ё','е');
 function searchLessons(){
  const query=normalize(input.value.trim());results.replaceChildren();
  const found=[];
  for(const m of months)for(const day of m.days){const title=normalize(day.title),module=normalize(m.title+' '+m.project+' '+m.n+'M'),body=normalize((day.html||'').replace(/<[^>]*>/g,' '));if(query&&query.split(/\s+/).every(term=>(title+' '+module+' '+body).includes(term)))found.push({m,day,rank:title.includes(query)?0:module.includes(query)?1:2});}found.sort((a,b)=>a.rank-b.rank||a.m.n-b.m.n||a.day.day-b.day.day);
  if(!query){const next=nextLesson();if(next){const m=months[next[0]-1];found.push({m,day:m.days[next[1]-1]});}}
  if(!found.length){const p=document.createElement('p');p.className='search-empty';p.textContent=query?'Ничего не найдено. Попробуй другое слово или название технологии.':'Уроки ещё загружаются. Попробуй через пару секунд.';results.append(p);return;}
  for(const {m,day} of found.slice(0,20)){
   const a=document.createElement('a');a.className='search-result';a.href='#lesson/'+m.n+'/'+day.day;
   const wrap=document.createElement('span'),b=document.createElement('b'),small=document.createElement('small');b.textContent=day.title;small.textContent=m.n+'M · день '+day.day+' · '+m.title;
   wrap.append(b,small);const arrow=document.createElement('span');arrow.textContent='→';a.append(wrap,arrow);a.addEventListener('click',()=>search.close());results.append(a);
  }
 }
 function openSearch(){search.showModal();input.value='';searchLessons();input.focus();}
 search.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();search.close();}});
 search.addEventListener('click',event=>{if(event.target===search){const box=search.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)search.close();}});
 document.getElementById('open-search').addEventListener('click',openSearch);document.getElementById('close-search').addEventListener('click',()=>search.close());input.addEventListener('input',searchLessons);
 input.addEventListener('keydown',event=>{if(event.key==='Enter'){const first=results.querySelector('a');if(first){event.preventDefault();first.click();}}});
 document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(!search.open)openSearch();}});
 document.querySelectorAll('[data-menu]').forEach(menu=>menu.addEventListener('toggle',()=>{if(menu.open){document.querySelectorAll('[data-menu]').forEach(other=>{if(other!==menu)other.open=false;});if(menu.id==='schedule-menu'){
  const r=LabRhythm.stats(snapshot?.state||{entries:{},sessions:[]});const box=document.getElementById('schedule-content');box.replaceChildren();
  const h=document.createElement('h2');h.textContent='Твоё расписание';const b=document.createElement('b');b.textContent=new Date(r.next+'T12:00:00Z').toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'});const p=document.createElement('p');p.textContent='ПН · СР · ПТ — по одному занятию. В дни отдыха серия сохраняется. Напоминания на телефон не включены.';const a=document.createElement('a');a.href='#activity';a.textContent='Посмотреть мой ритм →';a.addEventListener('click',()=>menu.open=false);box.append(h,b,p,a);
 }}}));
 document.addEventListener('pointerdown',event=>document.querySelectorAll('[data-menu]').forEach(menu=>{if(!menu.contains(event.target))menu.open=false;}));
 document.querySelectorAll('.profile-menu a').forEach(a=>a.addEventListener('click',()=>document.getElementById('profile-menu').open=false));
 document.addEventListener('keydown',event=>{const cell=event.target.closest?.('.heat-cell');if(cell&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)){const grid=cell.closest('.heat-grid'),all=[...grid.querySelectorAll('button')],index=all.indexOf(cell);let target=index+({ArrowLeft:-7,ArrowRight:7,ArrowUp:-1,ArrowDown:1}[event.key]||0);if(event.key==='Home')target=Math.floor(index/7)*7;if(event.key==='End')target=Math.floor(index/7)*7+6;const next=all[Math.max(0,Math.min(target,all.length-1))];if(next&&!next.disabled){grid.querySelectorAll('[tabindex="0"]').forEach(x=>x.tabIndex=-1);next.tabIndex=0;next.focus();document.getElementById('activity-detail').textContent=next.dataset.activityLabel;}event.preventDefault();}if(event.key==='Escape')document.querySelectorAll('[data-menu]').forEach(menu=>menu.open=false);});
})();
