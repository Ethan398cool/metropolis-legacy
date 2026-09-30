export function initUI(){
  document.getElementById('district-val').innerText = '100';
  document.getElementById('restraint-val').innerText = '100';
}
export function setDistrict(v){
  document.getElementById('district-val').innerText = v;
}
export function setRestraint(v){
  document.getElementById('restraint-val').innerText = v;
}
export function setSavedTotal(saved, total){
  document.getElementById('saved-val').innerText = saved;
  document.getElementById('total-val').innerText = total;
}
export function showMessage(text, seconds=2){
  const el = document.getElementById('message');
  el.innerText = text; el.classList.remove('hidden');
  setTimeout(()=> el.classList.add('hidden'), seconds*1000);
}
