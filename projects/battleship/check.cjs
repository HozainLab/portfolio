const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
class El {
 constructor(){this.children=[];this.dataset={};this.events={};this.attributes={};this.className='';this.textContent='';this.disabled=false;this.open=false;}
 append(el){this.children.push(el);} set innerHTML(v){this.html=v;this.children=[];} get innerHTML(){return this.html;}
 setAttribute(k,v){this.attributes[k]=v;} addEventListener(k,fn){this.events[k]=fn;}
 get classList(){const self=this;return {toggle(k,on){let s=new Set(self.className.split(' '));if(on)s.add(k);else s.delete(k);self.className=[...s].join(' ');},remove(...keys){self.className=self.className.split(' ').filter(x=>!keys.includes(x)).join(' ');},add(k){self.className+=' '+k;}};}
 showModal(){this.open=true;}close(){this.open=false;}contains(el){return this.children.includes(el);}
 click(){if(!this.disabled)(this.onclick||this.events.click||(()=>{}))({target:this});}
}
const ids={};for(const id of [...fs.readFileSync('dist/index.html','utf8').matchAll(/id="([^"]+)"/g)].map(x=>x[1]))ids[id]=new El();
const close=new El(),modes=['miss','hit','erase'].map(mode=>{const el=new El();el.dataset.mode=mode;return el;});
function queryAll(s){if(s==='.shot-tool')return modes;if(/Board .cell/.test(s)){const id=s.includes('ownBoard')?'ownBoard':'enemyBoard';return ids[id].children.filter(e=>e.className.split(' ').includes('cell'));}return [];}
function query(s){if(s==='.close')return close;if(s.includes('.cell[')){const r=s.match(/data-r="(\d+)"/),c=s.match(/data-c="(\d+)"/);return queryAll(s).find(e=>+e.dataset.r===+r[1]&&+e.dataset.c===+c[1])||null;}return ids[s.slice(1)];}
let saved=null;const ctx={document:{querySelector:query,querySelectorAll:queryAll,createElement:()=>new El(),addEventListener(){}},localStorage:{getItem:()=>saved,setItem:(_,v)=>saved=v},console,Math};
vm.runInNewContext(fs.readFileSync('dist/app.js','utf8'),ctx);
const own=queryAll('#ownBoard .cell'),enemy=queryAll('#enemyBoard .cell');const cell=(arr,r,c)=>arr.find(e=>+e.dataset.r===r&&+e.dataset.c===c);const state=()=>JSON.parse(saved);
assert.equal(own.length,100);assert.equal(enemy.length,100);
cell(own,0,8).click();assert.match(ids.ownHint.textContent,/Нельзя/);assert.equal(saved,null);
cell(own,0,0).click();assert.equal(state().ships[0].size,4);
cell(own,1,4).click();assert.equal(state().ships.length,1);assert.match(ids.ownHint.textContent,/Нельзя/);
ids.rotate.click();cell(own,2,5).click();assert.equal(state().ships[1].vertical,true);
ids.remove.click();cell(own,3,5).click();assert.equal(state().ships.length,1);
cell(enemy,0,0).click();assert.equal(state().marks['0,0'],'miss');modes[1].click();cell(enemy,0,0).click();assert.equal(state().marks['0,0'],'hit');assert.equal(ids.shotsCount.textContent,1);assert.equal(ids.accuracy.textContent,'100%');modes[2].click();cell(enemy,0,0).click();assert.equal(Object.keys(state().marks).length,0);
for(let k=0;k<50;k++){ids.random.click();if(ids.modal.open)ids.confirm.click();const fleet=state().ships;assert.equal(fleet.length,10);assert.equal(fleet.reduce((a,s)=>a+s.cells.length,0),20);for(const s of fleet)for(const [r,c]of s.cells){assert.ok(r>=0&&r<10&&c>=0&&c<10);for(const t of fleet)if(t!==s)assert.ok(t.cells.every(([a,b])=>Math.abs(r-a)>1||Math.abs(c-b)>1));}}
modes[1].click();cell(enemy,3,4).click();ids.resetFleet.click();ids.cancel.click();assert.equal(state().ships.length,10);ids.resetFleet.click();ids.confirm.click();assert.equal(state().ships.length,0);assert.equal(state().marks['3,4'],'hit');cell(own,0,0).click();ids.resetShots.click();ids.confirm.click();assert.equal(state().ships.length,1);assert.equal(Object.keys(state().marks).length,0);
vm.runInNewContext(fs.readFileSync('dist/app.js','utf8'),ctx);assert.equal(ids.fleetCount.textContent,'1 из 10 кораблей');
console.log('PASS: 100 cells per board; boundaries; diagonal spacing; rotation; deletion; 50 complete random fleets; shot correction and erasing; isolated resets and cancel; reload persistence.');
