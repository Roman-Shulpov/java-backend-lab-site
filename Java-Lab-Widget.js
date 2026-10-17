// Scriptable for iPhone. No token is stored in this script or sent to the lab.
// GitHub contents read-only, only Roman-Shulpov/java-backend-lab is needed.
async function main() {
  const KEY = 'java-backend-lab-read-token';
  const BRANCH_KEY = 'java-backend-lab-branch';
  if (!Keychain.contains(KEY)) {
    if (config.runsInWidget) {
      const w = new ListWidget();
      w.addText('Открой Java Lab в Scriptable для настройки.');
      Script.setWidget(w); Script.complete(); return;
    }
    const setup = new Alert();
    setup.title = 'Java Backend Lab';
    setup.message = 'Вставь GitHub fine-grained token: только java-backend-lab, Contents: Read-only. Он сохранится в Keychain телефона. Ветка должна совпадать с отправленным прогрессом.';
    setup.addSecureTextField('GitHub token');
    setup.addTextField('Ветка', 'main');
    setup.addAction('Сохранить'); setup.addCancelAction('Отмена');
    if (await setup.presentAlert() < 0) return;
    const value = setup.textFieldValue(0).trim();
    if (!value) return;
    Keychain.set(KEY, value);
    Keychain.set(BRANCH_KEY, setup.textFieldValue(1).trim() || 'main');
  }
  const branch = String(args.widgetParameter || (Keychain.contains(BRANCH_KEY) ? Keychain.get(BRANCH_KEY) : 'main')).trim();
  const fm = FileManager.local();
  const cache = fm.joinPath(fm.cacheDirectory(), 'java-lab-' + encodeURIComponent(branch) + '.json');
  let state = null, stale = false, fetchedAt = null;
  try {
    const request = new Request('https://api.github.com/repos/Roman-Shulpov/java-backend-lab/contents/progress/state.json?ref=' + encodeURIComponent(branch));
    request.headers = {Authorization: 'Bearer ' + Keychain.get(KEY), Accept: 'application/vnd.github.raw+json', 'X-GitHub-Api-Version': '2022-11-28'};
    request.timeoutInterval = 15;
    state = await request.loadJSON();
    if (request.response.statusCode !== 200 || state.schema !== 1 || !Array.isArray(state.sessions)) throw new Error('No progress');
    fetchedAt = new Date().toISOString();
    fm.writeString(cache, JSON.stringify({state, fetchedAt}));
  } catch (_) {
    stale = true;
    try { const cached = JSON.parse(fm.readString(cache)); state = cached.state; fetchedAt = cached.fetchedAt; } catch (_) { state = null; }
  }
  const w = new ListWidget();
  w.backgroundColor = new Color('183e35');
  w.setPadding(16, 16, 14, 16);
  w.refreshAfterDate = new Date(Date.now() + 60 * 60 * 1000);
  const top = w.addStack();
  const symbol = top.addImage(SFSymbol.named('flame.fill').image);
  symbol.imageSize = new Size(25, 30);
  top.addSpacer(8);
  const title = top.addText('JAVA LAB'); title.font = Font.semiboldSystemFont(12); title.textColor = new Color('d9edac');
  w.addSpacer(8);
  let next = [1,1];
  if (state) {
    const DAY = 86400000;
    const now = new Date(Date.now() + 7 * 3600000); // Barnaul calendar, independent of phone timezone.
    const stamp = now.toISOString().slice(0, 10);
    const today = Date.parse(stamp + 'T00:00:00Z');
    const monday = today - ((new Date(today).getUTCDay() + 6) % 7) * DAY;
    const dates = [...new Set(state.sessions.map(s => s.date))].filter(s=>/^\d{4}-\d{2}-\d{2}$/.test(s));
    const weeks = new Map();
    for (const s of dates) {
      const d = Date.parse(s + 'T00:00:00Z'); if (d > today) continue;
      const start = d - ((new Date(d).getUTCDay() + 6) % 7) * DAY;
      weeks.set(start, (weeks.get(start) || 0) + 1);
    }
    const count = weeks.get(monday) || 0;
    let cursor = count >= 3 ? monday : monday - 7 * DAY, streak = 0;
    while ((weeks.get(cursor) || 0) >= 3) { streak++; cursor -= 7 * DAY; }
    symbol.tintColor = new Color(count || streak ? 'ffad5c' : '8b9b8d');
    const number = w.addText(Math.min(count, 3) + ' / 3'); number.font = Font.boldSystemFont(29); number.textColor = Color.white();
    const caption = w.addText(streak ? streak + ' нед. подряд' : 'занятия на этой неделе'); caption.font = Font.systemFont(10); caption.textColor = new Color('c4d2c6');
    next = null;
    outer: for(let n=1;n<=45;n++) for(let d=1;d<=10;d++) { if(!state.entries[n+'-'+String(d).padStart(2,'0')]?.done){next=[n,d];break outer;} }
    w.addSpacer(5);
    const lesson = w.addText(next ? next[0] + 'M · день ' + next[1] : '45 месяцев пройдены'); lesson.font = Font.mediumSystemFont(11); lesson.textColor = new Color('e8f0d2');
  } else {
    symbol.tintColor = new Color('8b9b8d');
    const error = w.addText('Проверь доступ к GitHub'); error.font = Font.mediumSystemFont(13); error.textColor = Color.white();
  }
  w.addSpacer();
  const footer = w.addText(stale ? (state ? 'Нет сети · сохранённая копия' : 'Открой инструкцию') : 'Из GitHub · ' + branch);
  footer.font = Font.systemFont(8); footer.textColor = new Color('a8bfa9'); footer.lineLimit = 2;
  if (stale && fetchedAt) {
    const age = w.addText('Копия: ' + new Date(fetchedAt).toLocaleDateString('ru-RU'));
    age.font = Font.systemFont(8); age.textColor = new Color('a8bfa9');
  }
  w.url = next ? 'https://github.com/Roman-Shulpov/java-backend-lab/blob/main/learn/' + next[0] + 'M/' + String(next[1]).padStart(2,'0') + '.md' : 'https://github.com/Roman-Shulpov/java-backend-lab/blob/main/CAREER.md';
  Script.setWidget(w);
  if (!config.runsInWidget) await w.presentSmall();
  Script.complete();
}
await main();
