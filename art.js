/* Original vector assets. Branding stays separate from learning rewards. */
(function(root){
 function flame(mode='lit',tier='amber'){
  const active=mode==='lit'||mode==='rest';
  const colours=tier==='ruby'?['#dc384b','#f16d4b','#ffe1ad']:tier==='aurora'?['#8149bf','#bd68d2','#f4cfec']:['#e88827','#f7b33d','#ffedb7'];
  const [a,b,c]=active?colours:['#b9b8b1','#d2d0c7','#eeece6'];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" role="img" aria-label="${active?'Огонёк серии':'Огонёк ждёт занятия'}"><defs><linearGradient id="fire-${mode}-${tier}" x1=".2" y1="0" x2=".7" y2="1"><stop stop-color="${a}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><path d="M59 5C63 32 36 39 44 60c7-5 11-13 13-22 0 18 27 29 29 49 2 20-15 32-36 32S12 105 13 85c0-18 11-30 19-45-2 20 3 24 7 29C26 42 52 30 59 5Z" fill="url(#fire-${mode}-${tier})"/><path d="M52 67c2 15 18 19 14 32-2 9-11 14-20 10-15-6-8-21-2-28 1 8 5 8 6 10-4-10 0-17 2-24Z" fill="${active?'#fff5da':'#f7f5ee'}" opacity=".85"/></svg>`;
 }
 function icon(name){const paths={code:'<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',book:'<path d="M12 5v15M3 4h5q4 0 4 3 0-3 4-3h5v15h-5q-4 0-4 2 0-2-4-2H3Z"/>',box:'<path d="m3 7 9-5 9 5v10l-9 5-9-5ZM3 7l9 5 9-5M12 12v10M7 4l10 6"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3v1"/>',arrow:'<path d="M4 12h15m-5-5 5 5-5 5"/>',check:'<path d="m5 12 4 4L19 6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>'};return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.arrow}</svg>`;}
 const api={flame,icon};root.LabArt=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
