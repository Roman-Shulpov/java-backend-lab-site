'use strict';
const button=document.getElementById('copy');
const status=document.getElementById('copy-status');
const code=document.getElementById('code');
button.disabled=true;
async function loadCode(){
  const response=await fetch('./Java-Lab-Widget.js',{cache:'no-store'});
  if(!response.ok)throw new Error('Код временно не загрузился. Обнови страницу.');
  const value=await response.text();
  if(!value.includes("Keychain.set(BRANCH_KEY")||!value.trimEnd().endsWith('main();'))throw new Error('Код загрузился не полностью. Обнови страницу.');
  code.value=value;
  return value;
}
button.addEventListener('click',async()=>{
  button.disabled=true;status.textContent='Копирую код…';
  try{
    await navigator.clipboard.writeText(code.value);
    status.textContent='✓ Готово! Вернись в Scriptable и вставь код.';
  }catch(error){
    status.textContent=error.message+' Ниже есть поле для ручного копирования.';
    document.getElementById('fallback').open=true;
  }finally{button.disabled=false;}
});
document.getElementById('fallback').addEventListener('toggle',async event=>{
  if(event.target.open&&!code.value){try{await loadCode();}catch(error){status.textContent=error.message;}}
});
code.addEventListener('focus',()=>code.select());
loadCode().then(()=>{button.disabled=false;}).catch(error=>{status.textContent=error.message;});
