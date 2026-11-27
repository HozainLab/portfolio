(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const letters = 'АБВГДЕЖЗИК';
  const limits = {4:1,3:2,2:3,1:4};
  const names = {4:'Линкор',3:'Крейсер',2:'Эсминец',1:'Катер'};
  const key = 'sea-battle-tablet-v1';
  let ships = [], marks = {}, selected = 4, vertical = false, removing = false, mode = 'miss', hover = null;
  const cellsOf = (r,c,n,v) => Array.from({length:n},(_,i)=>[r+(v?i:0),c+(v?0:i)]);
  function valid(cells, fleet=ships) {
    return cells.every(([r,c])=>r>=0&&r<10&&c>=0&&c<10&&fleet.every(s=>s.cells.every(([a,b])=>Math.abs(r-a)>1||Math.abs(c-b)>1)));
  }
  try {
    const data = JSON.parse(localStorage.getItem(key));
    if (data && Array.isArray(data.ships)) {
      for (const s of data.ships) {
        if (!s || !limits[s.size] || typeof s.vertical!=='boolean' || !Number.isInteger(s.r)||!Number.isInteger(s.c)) continue;
        const cells=cellsOf(s.r,s.c,s.size,s.vertical);
        if(ships.filter(x=>x.size===s.size).length<limits[s.size]&&valid(cells)) ships.push({...s,cells});
      }
      if (data.marks && typeof data.marks==='object') for(const [k,v] of Object.entries(data.marks)) if(/^([0-9]),([0-9])$/.test(k)&&['hit','miss'].includes(v)) marks[k]=v;
    }
  } catch {}
  function save() {try {localStorage.setItem(key,JSON.stringify({ships,marks}));} catch {$('#saveState').innerHTML='Прогресс доступен<br><small>до закрытия страницы</small>';}}
  function hint(text,type='') {$('#ownHint').textContent=text;$('#ownHint').className='hint '+type;}
  function remaining(n) {return limits[n]-ships.filter(s=>s.size===n).length;}
  function makeBoard(id,own) {
    const root=$(id);root.append(document.createElement('span'));
    for(let c=0;c<10;c++){const el=document.createElement('span');el.className='coord';el.textContent=letters[c];root.append(el);}
    for(let r=0;r<10;r++){
      const label=document.createElement('span');label.className='coord';label.textContent=r+1;root.append(label);
      for(let c=0;c<10;c++){
        const el=document.createElement('button');el.className='cell'+(r===0?' top':'')+(c===0?' left':'');el.dataset.r=r;el.dataset.c=c;
        el.addEventListener('click',()=>own?place(r,c):mark(r,c));
        if(own){el.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch'){hover=[r,c];preview();}});el.addEventListener('focus',()=>{hover=[r,c];preview();});}
        root.append(el);
      }
    }
    if(own){root.addEventListener('pointerleave',()=>{hover=null;preview();});root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget)){hover=null;preview();}});}
  }
  function render() {
    $('#fleet').innerHTML='';
    for(const n of [4,3,2,1]){
      const el=document.createElement('button');el.className='fleet-option'+(selected===n&&!removing?' active':'');el.disabled=remaining(n)===0;el.setAttribute('aria-pressed',String(selected===n&&!removing));el.setAttribute('aria-label',names[n]+', '+n+' палуб, осталось '+remaining(n));
      el.innerHTML='<span class="mini-ship">'+ '<i></i>'.repeat(n)+'</span><small>'+names[n]+'</small><strong>'+remaining(n)+'/'+limits[n]+'</strong>';
      el.onclick=()=>{selected=n;removing=false;hint('Выбран '+names[n].toLowerCase()+'. Нажмите на начальную клетку.');render();};$('#fleet').append(el);
    }
    $('#rotate').innerHTML=(vertical?'↕':'↔')+' <span>'+(vertical?'Вертикально':'Горизонтально')+'</span>';
    $('#remove').classList.toggle('active',removing);$('#remove').setAttribute('aria-pressed',String(removing));
    $('#fleetCount').textContent=ships.length+' из 10 кораблей';$('#fleetBadge').textContent=ships.length===10?'Флот готов ✓':'Расстановка';
    document.querySelectorAll('#ownBoard .cell').forEach(el=>{
      const r=+el.dataset.r,c=+el.dataset.c,s=ships.find(s=>s.cells.some(([a,b])=>a===r&&b===c));
      el.classList.toggle('ship',!!s);el.setAttribute('aria-label',letters[c]+(r+1)+(s?', '+names[s.size]:', пусто'));el.setAttribute('aria-pressed',String(!!s));
    });
    document.querySelectorAll('#enemyBoard .cell').forEach(el=>{
      const r=+el.dataset.r,c=+el.dataset.c,m=marks[r+','+c];el.classList.toggle('hit',m==='hit');el.classList.toggle('miss',m==='miss');el.setAttribute('aria-label',letters[c]+(r+1)+', '+(m==='hit'?'попал':m==='miss'?'мимо':'без отметки'));
    });
    const all=Object.values(marks),hits=all.filter(x=>x==='hit').length;
    $('#shotsCount').textContent=all.length;$('#hitsCount').textContent=hits;$('#accuracy').textContent=all.length?Math.round(100*hits/all.length)+'%':'—';preview();
  }
  function preview(){
    document.querySelectorAll('#ownBoard .cell').forEach(el=>el.classList.remove('preview','invalid'));
    if(!hover||removing||!remaining(selected))return;
    const cells=cellsOf(...hover,selected,vertical),ok=valid(cells);
    for(const [r,c] of cells){const el=$('#ownBoard .cell[data-r="'+r+'"][data-c="'+c+'"]');if(el)el.classList.add(ok?'preview':'invalid');}
  }
  function place(r,c){
    const index=ships.findIndex(s=>s.cells.some(([a,b])=>a===r&&b===c));
    if(removing){if(index<0){hint('Здесь нет корабля. Выберите занятую клетку.');return;}const [s]=ships.splice(index,1);selected=s.size;hint('Корабль удалён. Можно расставить его заново.');}
    else{
      if(!remaining(selected)){hint('Все корабли этого типа уже расставлены. Выберите другой.','error');return;}
      const cells=cellsOf(r,c,selected,vertical);
      if(!valid(cells)){hint('Нельзя поставить: корабль выходит за край или касается другого.','error');return;}
      ships.push({r,c,size:selected,vertical,cells});
      if(!remaining(selected))selected=[4,3,2,1].find(n=>remaining(n))||1;
      hint(ships.length===10?'Флот готов! Все 10 кораблей на своих местах.':'Корабль на месте. Продолжайте расстановку.',ships.length===10?'success':'');
    }
    save();render();
  }
  function mark(r,c){const k=r+','+c;if(mode==='erase')delete marks[k];else marks[k]=mode;save();render();$('#enemyHint').textContent=letters[c]+(r+1)+' — '+(mode==='erase'?'отметка удалена':mode==='hit'?'попадание':'промах')+'.';}
  function rotate(){vertical=!vertical;render();}
  function randomFleet(){
    let result=null;
    for(let attempt=0;attempt<300&&!result;attempt++){
      const next=[];let failed=false;
      for(const n of [4,3,3,2,2,2,1,1,1,1]){
        const options=[];
        for(let r=0;r<10;r++)for(let c=0;c<10;c++)for(const v of [false,true]){const cells=cellsOf(r,c,n,v);if(valid(cells,next))options.push({r,c,size:n,vertical:v,cells});}
        if(!options.length){failed=true;break;}next.push(options[Math.floor(Math.random()*options.length)]);
      }
      if(!failed)result=next;
    }
    if(result){ships=result;removing=false;save();render();hint('Флот готов! Все 10 кораблей на своих местах.','success');}else hint('Не удалось расставить флот. Попробуйте ещё раз.','error');
  }
  let action=null;
  function dialog(title,body,confirm='Понятно',callback=null){$('#modalTitle').textContent=title;$('#modalBody').innerHTML=body;$('#confirm').textContent=confirm;$('#cancel').classList.toggle('hidden',!callback);action=callback;$('#modal').showModal();}
  $('#confirm').onclick=()=>{const fn=action;action=null;$('#modal').close();if(fn)fn();};$('#cancel').onclick=()=>$('#modal').close();$('.close').onclick=()=>$('#modal').close();
  $('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const b=e.target.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)e.target.close();}});
  $('#rules').onclick=()=>dialog('Как играть','<p>Это планшет для игры с живым соперником: вы договариваетесь о ходах и называете координаты вслух.</p><ul><li>Ваш флот: 1 корабль на 4 палубы, 2 на 3, 3 на 2 и 4 на 1.</li><li>Выберите корабль, затем его начальную клетку. Поворот — кнопкой или клавишей R. Корабли не соприкасаются, даже углами.</li><li>Чтобы переставить корабль, выберите «Удалить», нажмите на него и расставьте заново.</li><li>На поле соперника выберите «Мимо» или «Попал» и нажмите клетку. Другой режим заменит отметку, «Ластик» удалит её.</li><li>Обе доски сохраняются в этом браузере. Сброс каждой доски работает отдельно.</li></ul>');
  $('#rotate').onclick=rotate;$('#remove').onclick=()=>{removing=!removing;hint(removing?'Нажмите на корабль, который хотите удалить.':'Выберите корабль и начальную клетку.');render();};
  $('#random').onclick=()=>ships.length?dialog('Новая расстановка?','<p>Текущий флот будет заменён случайной расстановкой. Отметки соперника сохранятся.</p>','Расставить',randomFleet):randomFleet();
  $('#resetFleet').onclick=()=>{if(!ships.length)return;dialog('Сбросить флот?','<p>Все ваши корабли будут убраны с поля. Отметки соперника сохранятся.</p>','Сбросить',()=>{ships=[];selected=4;removing=false;save();render();hint('Поле очищено. Выберите корабль и начальную клетку.');});};
  $('#resetShots').onclick=()=>{if(!Object.keys(marks).length)return;dialog('Сбросить отметки?','<p>Все выстрелы на поле соперника будут удалены. Ваш флот сохранится.</p>','Сбросить',()=>{marks={};save();render();$('#enemyHint').textContent='Поле очищено. Можно начинать разведку.';});};
  document.querySelectorAll('.shot-tool').forEach(el=>el.onclick=()=>{mode=el.dataset.mode;document.querySelectorAll('.shot-tool').forEach(b=>{b.classList.toggle('active',b===el);b.setAttribute('aria-pressed',String(b===el));});$('#enemyInstruction').textContent=mode==='erase'?'Нажмите на клетку, чтобы убрать отметку.':mode==='hit'?'Нажмите на клетку, чтобы отметить попадание.':'Нажмите на клетку, чтобы отметить промах.';});
  document.addEventListener('keydown',e=>{if((e.key.toLowerCase()==='r'||e.key.toLowerCase()==='к')&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!$('#modal').open){e.preventDefault();rotate();}});
  makeBoard('#ownBoard',true);makeBoard('#enemyBoard',false);selected=[4,3,2,1].find(n=>remaining(n))||1;render();if(ships.length===10)hint('Флот готов! Все 10 кораблей на своих местах.','success');
})();
