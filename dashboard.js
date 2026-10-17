/* Views derived from real study events; never manufacture activity. */
window.LabDashboard={
  fire(state){
    const r=LabRhythm.stats(state),labels=['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];
    return `<section class="card streak rhythm-${r.mode}" aria-label="Огонёк: понедельник, среда, пятница"><div class="rhythm-top"><span class="eyebrow">МОЙ ОГОНЁК</span><span class="rhythm-badge">${r.isStudy?'День учёбы':'День отдыха'}</span></div><div class="rhythm-main"><div><div class="streak-number">${r.count}<small> / 3</small></div><p>занятия по расписанию</p><strong>${r.title}</strong></div><div class="mascot">${LabArt.mascot(r.mode)}</div></div><p class="rhythm-hint">${r.hint}</p><div class="week-dots">${r.days.map((d,i)=>`<div class="week-day ${d.done?'done':''} ${d.date===r.today?'current':''} ${d.planned?'study':'rest'}"><b title="${d.date}: ${d.done?'выполнено':d.planned?'учебный день':'отдых'}">${d.done?'✓':d.planned?'·':'☾'}</b>${labels[i]}</div>`).join('')}</div><div class="streak-foot">${r.streak} учебных дней подряд · время Барнаула</div></section>`;
  },
  activity(state,compact=false){
    const r=LabRhythm.stats(state),end=Date.parse(r.today+'T00:00:00Z'),start=end-364*86400000;
    const startMonday=start-((new Date(start).getUTCDay()+6)%7)*86400000;
    const days=[],monthLabels=[];let lastMonth=-1;
    for(let t=startMonday;t<=end+(6-(new Date(end).getUTCDay()+6)%7)*86400000;t+=86400000){
      const date=new Date(t),stamp=date.toISOString().slice(0,10),count=r.activity[stamp]||0,outside=t<start||t>end;
      const col=Math.floor((t-startMonday)/604800000)+1;
      if(date.getUTCMonth()!==lastMonth&&t<=end){monthLabels.push(`<span data-column="${col}">${date.toLocaleDateString('ru-RU',{month:'short',timeZone:'UTC'})}</span>`);lastMonth=date.getUTCMonth();}
      const description=`${date.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})}: ${count?count+' задач с работой':'без отметок'}`;
      days.push(`<button class="heat-cell level-${Math.min(count,4)} ${outside?'outside':''}" ${outside?'disabled tabindex="-1"':''} data-activity-label="${description}" aria-label="${description}" title="${description}"></button>`);
    }
    const total=Object.entries(r.activity).filter(([date])=>Date.parse(date+'T00:00:00Z')>=start).length;
    return `<section class="card activity-card"><div class="section-heading"><div><span class="eyebrow">РАБОТА ВИДНА</span><h2>Мой год в коде</h2></div><span class="activity-total">${total} <small>дней с практикой</small></span></div><div class="heat-scroll" role="region" aria-label="Календарь активности за последний год" tabindex="0"><div class="heat-inner"><div class="heat-months">${monthLabels.join('')}</div><div class="heat-row"><div class="heat-labels"><span>ПН</span><span>СР</span><span>ПТ</span></div><div class="heat-grid">${days.join('')}</div></div></div></div><div class="heat-footer"><span id="activity-detail" aria-live="polite">Нажми на клетку — увидишь свой день.</span><div class="heat-legend">Меньше ${[0,1,2,3,4].map(n=>`<i class="level-${n}"></i>`).join('')} Больше</div></div>${compact?'':`<p class="mini-progress">Клетки показывают занятия и практику, а не коммиты GitHub. Несколько отметок одной задачи за день не увеличивают яркость. Пустые дни — нормальная часть пути.</p>`}</section>`;
  },
  schedule(){return `<section class="card schedule-card"><span class="eyebrow">ТВОЙ РИТМ</span><h2>Учёба · отдых · повторение</h2><div class="schedule-days"><div><b>ПН</b><span>Один следующий урок</span></div><div><b>СР</b><span>Продолжить проект</span></div><div><b>ПТ</b><span>Проверить и сохранить</span></div></div><p>Иди по порядку, независимо от названия дня. В учебный день огонёк ждёт завершения урока; в дни отдыха сохраняет состояние предыдущего учебного дня. Доделать пропущенное можно на ближайшем отдыхе. Новый учебный день снова ждёт своего результата.</p><p>«Поработал, продолжу позже» добавляет клетку в календарь, но огонёк зажигает завершённый урок. Пауза не удаляет уроки и проекты.</p></section>`;}
};
