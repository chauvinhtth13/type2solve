/* Shared fantasy presentation. Game controllers own outcomes. */
(function(root){
'use strict';
const chapters=[
['Sora','Vườn đồng hồ','Chiếc cầu ngủ quên rồi. Cùng mình đánh thức những con số nhé!','Những bông hoa mở cánh. Sora dựng lại chiếc cầu đầu tiên.','Sora giữ một phút yên tĩnh trong chiếc đồng hồ, dành cho những ai cần thêm thời gian.','#dceee3','#619b81','clock'],
['Sparky','Đồi tia chớp','Ngọn hải đăng thiếu một tia sáng. Em giúp mình nhé!','Ngọn đèn trên đồi sáng trở lại, chỉ đường cho các bạn đi xa.','Sparky từng sợ tiếng sấm. Giờ bạn ấy đếm nhịp mưa để thấy bình tĩnh hơn.','#e4e0f6','#8172b3','beacon'],
['Stitchwork','Thư viện lá','Những trang sách bị gió đảo lộn. Cùng tìm lại câu chuyện nhé!','Cánh cửa thư viện mở ra. Những trang sách tìm về đúng chỗ.','Miếng vá của Stitchwork là món quà từ một người bạn. Mỗi đường chỉ giữ một câu chuyện.','#f1e6d4','#ac8560','library'],
['Ignis','Hang lửa ấm','Lửa nhỏ cũng đủ thắp sáng đường dài. Cứ từng bước nhé!','Lò lửa thức dậy. Những viên đá trên đường phát sáng.','Ignis không thích thi xem ai phun lửa lớn nhất. Bạn thích nướng bánh cho cả làng.','#f5e1cd','#ba775b','cave'],
['Vex','Vườn kẹo','Lối đi đổi hướng mất rồi! Đọc kỹ và chọn thật khéo nhé.','Những cây kẹo nối thành một con đường mới qua khu vườn.','Vex hay bày trò, nhưng luôn để lại gợi ý cho bạn nào chưa tìm được đường.','#f6e2e8','#b87799','garden'],
['Nocturne','Hồ ánh trăng','Mặt hồ quên mất những vì sao. Cùng gọi ánh sáng về nhé!','Trăng soi xuống mặt hồ. Những chiếc thuyền giấy tìm được bến.','Nocturne dùng đôi tai lớn để tìm những người bạn lạc đường trong đêm.','#dfe5f3','#6d83ac','moon'],
['Glacius','Rừng pha lê','Trong lớp băng có một hạt mầm. Kiên nhẫn sẽ mở được lối đi.','Pha lê tách ra thành chiếc cổng. Chồi non vươn lên giữa tuyết.','Glacius cất những bông tuyết trong chiếc hộp, vì không bông nào giống bông nào.','#ddf1f5','#6ca2b5','crystal'],
['Sol-Kahn','Sân trời nắng','Vương miện sáng nhất khi mình biết giúp nhau. Em sẵn sàng chưa?','Những cánh cửa mặt trời mở ra. Thung lũng đón ngày mới.','Vương miện hơi rộng, nhưng Sol-Kahn vẫn đội mỗi khi chào đón một người bạn mới.','#f6edcf','#b49a52','sun'],
['Lumiel','Làng nấm','Rễ cây đang chờ lời giải. Cùng nối lại con đường nhé!','Những ngôi nhà nấm bật đèn. Rễ cây nối các miền đất với nhau.','Lumiel trồng một hạt giống mỗi lần học điều mới. Khu vườn chưa bao giờ ngừng lớn.','#e5edde','#839b66','mushroom'],
['Leviator','Đảo ngọc trai','Mảnh sao cuối cùng ở đây. Mang ánh sáng về Cây Sao nhé!','Mười mảnh sao trở về. Cây Sao bừng sáng, nối lại mười miền đất.','Leviator dùng tám chiếc xúc tu để ôm bạn bè. Viên ngọc quý nhất là một kỷ niệm.','#daeeed','#609e9d','pearl']
].map((c,i)=>Object.freeze({id:i,name:c[0],place:c[1],intro:c[2],restored:c[3],memory:c[4],sky:c[5],ink:c[6],landmark:c[7]}));
const motifs={
clock:'<circle cx="300" cy="82" r="42"/><circle cx="300" cy="82" r="32" fill="#fff8e8"/><path d="M300 57v25l18 12M275 126l-12 32m61-32 12 32" fill="none" stroke="currentColor" stroke-width="7"/>',
beacon:'<path d="M271 160l12-103h34l12 103Z"/><path d="M276 55l24-30 24 30Z"/><path d="m300 68-12 27h14l-5 24 21-34h-15l7-17Z" fill="#fff0a8"/>',
library:'<path d="M238 153V68q31-18 62 0 31-18 62 0v85q-31-18-62 0-31-18-62 0Z"/><path d="M300 75v68m-48-55h32m-32 18h32m32-18h32m-32 18h32" stroke="#fff4d8" stroke-width="5"/>',
cave:'<path d="m217 162 24-88 47-39 49 20 47 107Z"/><path d="M268 162v-35q32-73 64 0v35Z" fill="#fff0d6"/><path d="M288 151q-18-16 12-48-3 22 13 29 8 21-25 19" fill="#e99b61"/>',
garden:'<path d="M263 163V78m74 85V91" stroke="currentColor" stroke-width="9"/><circle cx="263" cy="71" r="30"/><circle cx="337" cy="87" r="25"/><path d="M245 70q18-22 34 0m-26 9 18-20" stroke="#fff3e6" stroke-width="7" fill="none"/>',
moon:'<path d="M324 28a53 53 0 1 0 24 85 48 48 0 0 1-24-85Z"/><path d="M240 154q60-18 120 0m-99 15h78" stroke="currentColor" stroke-width="5" fill="none"/>',
crystal:'<path d="m300 29 35 54-14 80h-42l-14-80Zm-41 78-22-35-17 55 34 36m87-56 22-35 17 55-34 36"/><path d="M300 37v119m-27-72 27 22 27-22" fill="none" stroke="#f4ffff" stroke-width="4"/>',
sun:'<circle cx="300" cy="80" r="37"/><path d="M300 22v12m0 93v12m-58-59h12m93 0h12m-100-41 9 9m64 64 9 9m0-82-9 9m-64 64-9 9" stroke="currentColor" stroke-width="7"/><path d="M240 169v-30h120v30Z"/>',
mushroom:'<path d="M268 162V97h64v65Z" fill="#fff1d5"/><path d="M235 104q65-129 130 0Z"/><circle cx="281" cy="77" r="10" fill="#fff1d5"/><circle cx="317" cy="67" r="8" fill="#fff1d5"/><path d="M290 162v-31q10-20 20 0v31Z"/>',
pearl:'<path d="M235 104q65 111 130 0l-27 9-8-32-30 26-30-26-8 32Z"/><circle cx="300" cy="103" r="25" fill="#fff7df"/><circle cx="291" cy="93" r="7" fill="white"/>'
};

function pine(x,y,size,color){
 return '<g transform="translate('+x+' '+y+') scale('+size+')"><path d="M-4 0h8v-74h-8Z" fill="#4b645a"/><path d="M0-144-38-73h22l-35 48h34L-49 0h98L17-25h34L16-73h22Z" fill="'+color+'"/><path d="M0-132v117" fill="none" stroke="#eaf3cd" stroke-width="1.5" opacity=".22"/></g>';
}
function landscape(index,restored=false){
 const c=chapters[Math.max(0,Math.min(9,Number(index)||0))];
 const moon=index===5||index===6;
 return '<svg xmlns="http://www.w3.org/2000/svg" class="world-landscape" viewBox="0 0 900 540" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'+
 '<path fill="'+c.sky+'" d="M0 0h900v540H0Z"/><circle cx="690" cy="106" r="57" fill="#fff4c9"/><circle cx="690" cy="106" r="74" fill="none" stroke="#fff8dc" stroke-width="12" opacity=".3"/>'+
 '<g fill="none" stroke="#fff9e6" stroke-width="5" opacity=".6"><path d="M68 108h160m-112 15h78m442 72h124M330 72h116"/></g>'+
 '<path d="m0 295 144-143 67 77 136-132 128 143 118-90 189 104 118-42v328H0Z" fill="'+c.ink+'" opacity=".19"/>'+
 '<path d="M0 329Q174 206 352 316T900 259v281H0Z" fill="'+c.ink+'" opacity=".38"/>'+
 '<path d="M0 385Q160 326 296 358T600 337T900 351v189H0Z" fill="'+(moon?'#98b4b3':'#95b9a0')+'"/>'+
 '<path d="M310 540q275-73 121-114t110-88h35q-210 50-79 75t-27 127Z" fill="#ecddaf"/>'+
 '<g transform="translate(360 186) scale(.65)"><path d="M190 164q100-37 213 0l-29 29H220Z" fill="#496c5d" opacity=".35"/><g fill="'+c.ink+'" color="'+c.ink+'">'+motifs[c.landmark]+'</g></g>'+
 pine(150,389,.8,'#668e79')+pine(773,377,.9,'#668e79')+pine(51,483,1.8,'#315e51')+pine(865,477,1.7,'#315e51')+
 '<path d="M0 486q151-59 290 17l-50 37H0Zm642 54q121-97 258-56v56Z" fill="#285347"/>'+
 '<g fill="#afc7a1"><ellipse cx="100" cy="484" rx="34" ry="10"/><ellipse cx="796" cy="499" rx="45" ry="12"/></g>'+
 '<g fill="#f6dc98"><path d="m120 448 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Zm612-173 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/><circle cx="289" cy="360" r="3"/><circle cx="681" cy="432" r="3"/></g>'+
 (restored?'<g fill="#fff4c4"><circle cx="551" cy="217" r="3"/><circle cx="603" cy="253" r="2"/><circle cx="575" cy="193" r="3"/></g>':'')+'</svg>';
}
const stops=[[16,76],[32,67],[19,48],[35,33],[49,46],[61,65],[76,53],[65,32],[79,21],[49,17]];
function mapArt(){
 return '<svg viewBox="0 0 900 600" preserveAspectRatio="none" aria-hidden="true"><path fill="#c9dfd5" d="M0 0h900v600H0Z"/><path d="M-30 358Q180 102 418 129T968 279v350H-30Z" fill="#abc9b2"/><path d="M58 435Q69 163 293 93t351 9 179 303Q708 558 511 496T58 435Z" fill="#dae5c4" stroke="#9fbfa7" stroke-width="12"/><path d="M405 0q-54 168 87 237t-74 363h93q174-280 35-356T504 0Z" fill="#94c4c4"/><path d="M403 0q-45 160 90 232t-68 368" fill="none" stroke="#e4f1df" stroke-width="7" opacity=".7"/>'+
 '<g opacity=".75">'+pine(102,320,.7,'#7ba88c')+pine(718,418,1.1,'#7ba88c')+pine(251,186,.7,'#7ba88c')+pine(641,104,.7,'#7ba88c')+pine(821,329,.8,'#7ba88c')+'</g>'+
 '<path d="M144 456 288 402 171 288 315 198 441 276 549 390 684 318 585 192 711 126 441 102" fill="none" stroke="#fff4d5" stroke-width="15" stroke-linejoin="round"/><path d="M144 456 288 402 171 288 315 198 441 276 549 390 684 318 585 192 711 126 441 102" fill="none" stroke="#bfa66b" stroke-width="2" stroke-dasharray="3 9"/>'+
 '<g transform="translate(60 80)" stroke="#406c62" fill="none"><circle r="29" stroke-width="1"/><path d="M0-38V38m-38-38h76M0-29l7 29-7 29-7-29Z" fill="#fff5d8"/><text y="-46" text-anchor="middle" fill="#406c62" stroke="none" font-size="12">BẮC</text></g>'+
 '<path d="M44 533q79-17 163 4m-124 10h72m567-50q63-16 118-1m-98 12h65" stroke="#6daba8" fill="none" stroke-width="3"/></svg>';
}
let selectedChapter=0;
let lastState='';
function selectChapter(index){
 selectedChapter=index;
 const c=chapters[index],state=GameStorage.load(),complete=index<state.story.fragments;
 document.querySelectorAll('.atlas-stop').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
 document.querySelector('.atlas-preview').innerHTML=landscape(index,complete);
 const portrait=document.querySelector('.atlas-portrait');portrait.replaceChildren(buildBeastArt(index));
 document.getElementById('atlasChapter').textContent='Chặng '+(index+1)+' · '+c.name;
 document.getElementById('atlasPlace').textContent=c.place;
 document.getElementById('atlasDialogue').textContent='“'+c.intro+'”';
 document.getElementById('atlasMemory').textContent=complete?c.memory:'Kỷ niệm của '+c.name+' sẽ mở khi em vượt qua chặng này.';
 document.getElementById('atlasMemory').dataset.unlocked=String(complete);
 const next=Math.min(9,Math.max(state.adventure.cleared+1,state.adventure.bossIndex||0));
 document.getElementById('atlasStart').textContent='Tiếp tục · '+chapters[next].name+' →';
 document.querySelector('[data-story-next]').textContent=index!==next?'Em đang xem '+c.place+'. Hành trình tiếp tục ở '+chapters[next].place+'.':'Trả lời từng câu để mang ánh sáng trở về.';
}
function renderHome(){
 const state=GameStorage.load(),n=state.story.fragments;
 document.body.dataset.storyCostume=state.story.costume;
 const signature=JSON.stringify([state.story,state.adventure.cleared,state.adventure.bossIndex]);
 if(signature===lastState)return;
 lastState=signature;
 document.querySelector('[data-story-progress]').textContent=n+'/10 mảnh sao';
 document.querySelector('[data-campaign-cover]').innerHTML=landscape(Math.min(n,9),n===10);
 const map=document.querySelector('.atlas-art');if(!map.childElementCount)map.innerHTML=mapArt();
 const list=document.querySelector('.atlas-stops');
 if(!list.childElementCount)chapters.forEach((c,i)=>{
  const b=document.createElement('button');b.type='button';b.className='atlas-stop';b.style.left=stops[i][0]+'%';b.style.top=stops[i][1]+'%';b.setAttribute('aria-label','Chặng '+(i+1)+': '+c.name+' · '+c.place);
  const art=buildBeastArt(i);art.setAttribute('aria-hidden','true');b.append(art);
  const label=document.createElement('span');label.textContent=c.name;b.append(label);b.onclick=()=>selectChapter(i);list.append(b);
 });
 [...list.children].forEach((b,i)=>{b.dataset.complete=String(i<n);b.dataset.current=String(i===Math.min(9,Math.max(state.adventure.cleared+1,state.adventure.bossIndex||0)));b.title=(i<n?'Đã hoàn thành · ':'')+chapters[i].place;});
 const focused=document.activeElement?.dataset.costume, costumes=document.querySelector('[data-costumes]');costumes.replaceChildren();
 [['cloud','Mây tím',0],['leaf','Lá non',3],['moon','Ánh trăng',6],['sun','Nắng vàng',10]].forEach(([id,label,at])=>{
  const b=document.createElement('button');b.type='button';b.dataset.costume=id;b.className='story-costume';b.textContent=label+(n<at?' · '+at+' mảnh':'');b.disabled=n<at;b.setAttribute('aria-pressed',String(state.story.costume===id));b.onclick=()=>GameStorage.save({story:{costume:id}});costumes.append(b);
 });
 document.querySelector('[data-story-tier]').value=String(state.story.questionTier);
 selectChapter(selectedChapter);
 if(focused)document.querySelector('[data-costume="'+focused+'"]')?.focus({preventScroll:true});
}
function scene(host,index){
if(!host)return;
let layer=host.querySelector(':scope > .world-scene');
if(!layer){layer=document.createElement('div');layer.className='world-scene';layer.setAttribute('aria-hidden','true');host.prepend(layer);}
if(layer.dataset.chapter!==String(index)){layer.dataset.chapter=String(index);layer.innerHTML=landscape(index,true);}
host.classList.add('has-world-scene');
}
const worlds={sudokuGame:2,duelGame:7,nimGame:4,hanoiGame:8};
function enter(id){
 if(id==='home'){renderHome();return;}
 if(id==='story'){
  renderHome();const saved=GameStorage.load();
  selectChapter(Math.min(9,Math.max(saved.adventure.cleared+1,saved.adventure.bossIndex||0)));
  return;
 }
 if(Object.hasOwn(worlds,id)){
  const board=document.querySelector('#'+id+' .hanoi-board,#'+id+' .nim-board,#'+id+' #duelArena');
  if(board&&!board.style.getPropertyValue('--world-background'))board.style.setProperty('--world-background','url("data:image/svg+xml,'+encodeURIComponent(landscape(worlds[id],true))+'")');
 }
if(id==='intro'){
const c=chapters[G.bossIndex],desc=document.getElementById('introDesc');
let p=desc.querySelector('.guardian-dialogue');if(!p){p=document.createElement('p');p.className='guardian-dialogue';desc.prepend(p);}
p.textContent=c.name+' · “'+c.intro+'”';
}
if(id==='battle'){scene(document.getElementById('arena'),G.mode==='blitz'?1:G.mode==='surv'?5:G.bossIndex);document.getElementById('arena').dataset.storyMode=G.mode;updateTrial();}
if(id==='bossWin'||id==='victory'){
const c=chapters[G.bossIndex],card=document.querySelector('#'+id+' > .card');
let p=card.querySelector('.story-restoration');if(!p){p=document.createElement('p');p.className='story-restoration';card.querySelector('h1,h2').after(p);}
p.textContent='✦ '+c.restored;
}}
function typingStage(index){
const c=chapters[Math.max(0,Math.min(9,index||0))],host=document.querySelector('#typingField .spell-forest');if(!host)return;
let landmark=host.querySelector('.chapter-landmark');
if(!landmark){landmark=document.createElement('div');landmark.className='chapter-landmark';landmark.setAttribute('aria-hidden','true');host.append(landmark);}
landmark.innerHTML='<svg viewBox="190 10 220 175" style="color:'+c.ink+'" fill="currentColor">'+motifs[c.landmark]+'</svg>';
}
function updateTrial(){
const arena=document.getElementById('arena');
let lamps=arena.querySelector('.trial-lanterns');
if(G.mode!=='surv'&&G.mode!=='blitz'){lamps?.remove();return;}
if(!lamps){lamps=document.createElement('div');lamps.className='trial-lanterns';lamps.setAttribute('aria-hidden','true');arena.append(lamps);}
const count=G.mode==='surv'?Math.max(0,G.lives):Math.min(3,Math.floor(G.score/5));
const signature=G.mode+':'+count;if(lamps.dataset.state===signature)return;lamps.dataset.state=signature;
lamps.replaceChildren();
for(let i=0;i<3;i++){const lamp=document.createElement('span');lamp.className=i<count?'lit':'';lamp.textContent='✦';lamps.append(lamp);}
}
function constellation(values){
const host=document.querySelector('#sudokuGame .sudoku-hud');if(!host)return;
let sky=host.querySelector('.constellation-progress');
if(!sky){sky=document.createElement('span');sky.className='constellation-progress';host.append(sky);}
let complete=0;
for(let r=0;r<9;r++){const row=values.slice(r*9,r*9+9);if(row.every(v=>v>=1&&v<=9)&&new Set(row).size===9)complete++;}
sky.textContent='✦'.repeat(complete)+'·'.repeat(9-complete);
sky.setAttribute('aria-label',complete+' hàng đủ chín số khác nhau');
}
root.StoryWorld=Object.freeze({chapters:Object.freeze(chapters),landscape,enter,typingStage,updateTrial,constellation});
document.querySelector('[data-story-tier]')?.addEventListener('change',e=>GameStorage.save({story:{questionTier:Number(e.target.value)}}));
root.addEventListener('game-storage:change',()=>{document.body.dataset.storyCostume=GameStorage.load().story.costume;if(document.querySelector('#home.active,#story.active'))renderHome();});
document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('story-document-hidden',document.hidden);});
renderHome();
})(window);
