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
function landscape(index,restored=false){
const c=chapters[Math.max(0,Math.min(9,Number(index)||0))];
return '<svg class="world-landscape" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style="--scene-sky:'+c.sky+';--scene-ink:'+c.ink+'"><path fill="var(--scene-sky)" d="M0 0h600v200H0Z"/><circle cx="485" cy="45" r="25" fill="#fff8df"/><path d="M0 140Q90 42 204 136T420 116T600 110V200H0" fill="var(--scene-ink)" opacity=".18"/><path d="M0 170Q140 120 280 163T600 143v57H0" fill="var(--scene-ink)" opacity=".28"/><g fill="var(--scene-ink)" color="var(--scene-ink)">'+motifs[c.landmark]+'</g><path d="M268 200q55-20 31-37h23q36 23 17 37" fill="#fff7e3"/><g fill="var(--scene-ink)" opacity=".55"><path d="m22 190 12-55 12 55Zm24 0 9-38 9 38Zm505 0 12-55 12 55Zm24 0 9-38 9 38Z"/></g>'+(restored?'<g fill="#fff8cf"><path d="m210 51 4 9 9 4-9 4-4 9-4-9-9-4 9-4Zm173 20 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/><circle cx="155" cy="116" r="4"/><circle cx="420" cy="138" r="4"/></g>':'')+'</svg>';
}
function tree(count){
return '<svg viewBox="0 0 600 230" aria-hidden="true"><path fill="#e3eee7" d="M0 0h600v230H0Z"/><circle cx="454" cy="55" r="30" fill="#fff6ce"/><path d="M0 188Q150 127 300 180T600 170V230H0" fill="#c2d9c7"/><path d="M263 224q28-54 16-100l-51-42 10-14 47 30 9-66h15l5 77 47-44 12 13-54 62q-5 53 25 84Z" fill="#827969"/><g fill="'+(count===10?'#76ad8e':'#a9c6b5')+'"><circle cx="241" cy="81" r="49"/><circle cx="306" cy="53" r="47"/><circle cx="365" cy="85" r="49"/><circle cx="296" cy="111" r="51"/></g>'+chapters.map((c,i)=>{const x=[217,259,302,344,388,235,278,322,365,300][i],y=[74,43,26,48,78,113,90,69,118,135][i];return '<path transform="translate('+x+' '+y+')" d="m0-10 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z" fill="'+(i<count?'#fff0a3':'#719180')+'"/>';}).join('')+'<path d="M255 230q46-18 44-36 37 18 46 36" fill="#fff4d8"/></svg>';
}
let lastHomeState = null;
function renderHome(){
const host=document.getElementById('storyHome');if(!host)return;
const state=GameStorage.load(),n=state.story.fragments;
const signature=JSON.stringify([state.story,state.records]);
if(signature===lastHomeState)return;
lastHomeState=signature;
const focused=document.activeElement;
const focusedCostume=focused?.dataset.costume;
const openChapters=[...host.querySelectorAll('.story-chapter[open]')].map(el=>el.dataset.chapter);
document.body.dataset.storyCostume=state.story.costume;
host.querySelector('.star-tree').innerHTML=tree(n);
host.querySelector('[data-story-progress]').textContent=n===10?'Cây Sao đã thức dậy · 10/10 mảnh sao':n+'/10 mảnh sao đã trở về';
host.querySelector('[data-story-next]').textContent=n===10?'Ghé lại những người bạn và khám phá các thử thách còn lại.':'Điểm đến tiếp theo: '+chapters[n].place;
const list=host.querySelector('.story-chapters');list.replaceChildren();
chapters.forEach((c,i)=>{
const detail=document.createElement('details');detail.className='story-chapter';detail.dataset.chapter=String(i);detail.open=openChapters.includes(String(i));detail.dataset.restored=String(i<n);
const summary=document.createElement('summary'),art=buildBeastArt(i);if(art){art.setAttribute('aria-hidden','true');summary.append(art);}
const label=document.createElement('span');label.textContent=(i<n?'✦ ':i===n?'→ ':'')+(i+1)+'. '+c.place;
const tag=document.createElement('small');tag.textContent=i<n?'Đã hồi sinh':i===n?'Điểm đến tiếp theo':'Chưa khám phá';label.append(tag);summary.append(label);detail.append(summary);
const scene=document.createElement('div');scene.innerHTML=landscape(i,i<n);detail.append(scene);
const text=document.createElement('p');text.textContent=i<n?c.memory:c.intro;detail.append(text);list.append(detail);
});
const costumes=host.querySelector('[data-costumes]');costumes.replaceChildren();
[['cloud','Mây tím',0],['leaf','Lá non',3],['moon','Ánh trăng',6],['sun','Nắng vàng',10]].forEach(([id,label,at])=>{
const b=document.createElement('button');b.type='button';b.dataset.costume=id;b.className='story-costume';b.textContent=label+(n<at?' · '+at+' mảnh':'');b.disabled=n<at;b.setAttribute('aria-pressed',String(state.story.costume===id));b.onclick=()=>GameStorage.save({story:{costume:id}});costumes.append(b);
});
const r=state.records,quests=[['Hải đăng của Sparky',r.blitz>0,'Hoàn thành một lượt 60 Giây có điểm.'],['Ba ngọn đèn',r.survival>0,'Ghi điểm trong thử thách 3 Trái Tim.'],['Cánh cổng phép chữ',r.typing.campaignCleared>=0,'Vượt một chặng Gõ Chữ Vui.'],['Bầu trời thư viện',r.sudoku.wins>0,'Giải một bàn Sudoku.'],['Cầu trên mây',r.hanoi.wins>0,'Hoàn thành một tháp Hà Nội.'],['Tinh thể khéo léo',r.nim.wins>0,'Thắng một ván Nim với máy.'],['Lễ hội bạn bè',r.duel.series>0,'Hoàn thành một trận Đối Kháng cùng bạn.']];
const journal=host.querySelector('[data-side-quests]');journal.replaceChildren();
const launch=[startBlitz,startSurvival,openTypingGame,openSudokuGame,openHanoiGame,openNimGame,openDuelGame];
quests.forEach(([title,done,hint],i)=>{
const row=document.createElement('div');row.className='story-quest';
const p=document.createElement('p');p.textContent=(done?'✓ ':'○ ')+title+' — '+(done?'Đã hoàn thành':hint);
const button=document.createElement('button');button.type='button';button.className='story-costume';button.textContent=done?'Chơi lại':'Khám phá';button.setAttribute('aria-label',(done?'Chơi lại ':'Khám phá ')+title);button.onclick=()=>{goHome();launch[i]();};
row.append(p,button);journal.append(row);
});
host.querySelector('[data-story-tier]').value=String(state.story.questionTier);
if(focusedCostume)host.querySelector('[data-costume="'+focusedCostume+'"]')?.focus({preventScroll:true});
}
function scene(host,index){
if(!host)return;
let layer=host.querySelector(':scope > .world-scene');
if(!layer){layer=document.createElement('div');layer.className='world-scene';layer.setAttribute('aria-hidden','true');host.prepend(layer);}
if(layer.dataset.chapter!==String(index)){layer.dataset.chapter=String(index);layer.innerHTML=landscape(index,true);}
host.classList.add('has-world-scene');
}
const worlds={sudokuGame:[2,'Thư viện chòm sao','Điền từng con số để nối lại bầu trời.'],duelGame:[7,'Lễ hội vệ binh','Cùng bạn thử tài trong đấu trường mặt trời.'],nimGame:[4,'Hang tinh thể của Vex','Chọn khéo từng viên. Người lấy viên cuối cùng sẽ thua.'],hanoiGame:[8,'Những tòa tháp trên mây','Chuyển từng đĩa để nối lại chiếc cầu của Lumiel.']};
function enter(id){
if(id==='home'||id==='story'){renderHome();return;}
const world=worlds[id];
if(world){
const card=document.querySelector('#'+id+' > .card');
if(card&&!card.querySelector('.world-banner')){
const banner=document.createElement('div');banner.className='world-banner';banner.innerHTML=landscape(world[0],true)+'<div><b>'+world[1]+'</b><span>'+world[2]+'</span></div>';card.querySelector('.game-topbar').after(banner);
const label=card.querySelector('.game-topbar .eyebrow');if(label)label.textContent=world[1];
const board=card.querySelector('.hanoi-board,.nim-board,#duelArena');
if(board){
const art=landscape(world[0],true).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
board.style.setProperty('--world-background','url("data:image/svg+xml,'+encodeURIComponent(art)+'")');
}

}}
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
