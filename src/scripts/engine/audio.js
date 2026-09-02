let SOUND_ON=true;
function toggleSound(){
  SOUND_ON=!SOUND_ON;
  // #sndBtnTyping trước đây bị bỏ sót: tắt tiếng ở màn Gõ Chữ thì nút của chính
  // màn đó vẫn hiện 🔊 trong khi nút trang chủ đã đổi sang 🔇.
  document.querySelectorAll('#sndBtn,#sndBtnHome,#sndBtnTyping').forEach(b=>{
    b.textContent=SOUND_ON?'🔊':'🔇';b.classList.toggle('muted',!SOUND_ON);
    b.setAttribute('aria-pressed',String(SOUND_ON));   // nút đang "bấm xuống" = âm thanh đang bật
  });
  window.GameStorage?.updateSettings?.({sound:SOUND_ON});
  if(SOUND_ON)SFX.click();
}
/* ============ ÂM THANH ============
   Vẫn tự sinh hoàn toàn bằng Web Audio, không kèm một file .mp3/.ogg nào — PWA giữ
   nguyên kích thước và chơi offline được. Khác bản 8-bit cũ ở bốn điểm:
     1. Có envelope ADSR thật: bản cũ nhảy gain 0→vol tức thì nên tiếng nào cũng "cụp"
        một phát ở đầu. Attack 6–20ms khử hẳn tiếng cụp đó.
     2. Mỗi tiếng đi qua lowpass; sawtooth/square thô được bo lại cho đỡ chói tai trẻ con.
     3. Có bus master: gain → compressor → loa, kèm một nhánh reverb dùng ConvolverNode
        với impulse response TỰ SINH (nhiễu tắt dần) nên vẫn không cần file.
     4. Cao độ dao động ngẫu nhiên ±1.5% và có giới hạn số giọng cùng lúc, để nghe
        100 lần không bị nhàm và không vỡ tiếng khi nhiều hiệu ứng chồng nhau. */
let AC=null, BUS=null, VOICES=0;
const MAX_VOICES=14;          // quá số này thì bỏ tiếng mới, tránh vỡ loa khi combo dài
function ac(){
  if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();
  return AC;
}
/* Chính sách autoplay: AudioContext sinh ra ở trạng thái suspended cho tới khi có
   thao tác thật của người dùng. Gọi lại resume() ở mỗi lần phát cho chắc. */
function audioBus(){
  const a=ac();
  if(a.state==='suspended')a.resume().catch(()=>{});
  if(BUS)return BUS;
  const master=a.createGain();master.gain.value=.9;
  const comp=a.createDynamicsCompressor();
  comp.threshold.value=-14;comp.knee.value=22;comp.ratio.value=8;
  comp.attack.value=.004;comp.release.value=.18;
  // Impulse response tự sinh: nhiễu trắng tắt dần theo hàm mũ = phòng nhỏ.
  const dur=1.1,rate=a.sampleRate,len=Math.floor(rate*dur);
  const ir=a.createBuffer(2,len,rate);
  for(let ch=0;ch<2;ch++){
    const d=ir.getChannelData(ch);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);
  }
  const conv=a.createConvolver();conv.buffer=ir;
  const wet=a.createGain();wet.gain.value=.16;   // vọng nhẹ thôi, đủ tạo chiều sâu
  master.connect(comp);comp.connect(a.destination);
  master.connect(conv);conv.connect(wet);wet.connect(comp);
  BUS={a,master};
  return BUS;
}
function voice(node,stopAt){
  VOICES++;
  node.onended=()=>{VOICES--};
  try{node.stop(stopAt)}catch(e){VOICES--}
}
/* Một nốt có nhạc tính: ADSR + lowpass + rung cao độ nhẹ. */
function tone(freq,dur,type='square',vol=.15,delay=0,opt){
  if(!SOUND_ON)return;
  if(VOICES>=MAX_VOICES)return;
  try{
    const {a,master}=audioBus();
    const o=a.createOscillator(),g=a.createGain(),lp=a.createBiquadFilter();
    const t=a.currentTime+delay;
    const wobble=1+(Math.random()-.5)*.03;        // ±1,5% để không nghe như máy
    o.type=type;o.frequency.setValueAtTime(freq*wobble,t);
    if(opt&&opt.glide)o.frequency.exponentialRampToValueAtTime(Math.max(20,opt.glide),t+dur);
    if(opt&&opt.detune)o.detune.setValueAtTime(opt.detune,t);
    lp.type='lowpass';
    lp.frequency.setValueAtTime((opt&&opt.cutoff)||Math.min(a.sampleRate/2-1000,freq*5+900),t);
    lp.Q.value=(opt&&opt.q)||.7;
    const atk=(opt&&opt.attack)||.008, rel=Math.max(.03,dur-atk);
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),t+atk);   // attack: hết tiếng "cụp"
    g.gain.exponentialRampToValueAtTime(.0001,t+atk+rel);
    o.connect(lp);lp.connect(g);g.connect(master);
    o.start(t);voice(o,t+atk+rel+.02);
  }catch(e){}
}
/* Nhiễu có bao hình — dùng cho tiếng va chạm, nổ, gõ. Đây là thứ bản cũ thiếu hẳn:
   sóng vuông không bao giờ ra được tiếng "bụp" của một cú đánh. */
function noise(dur,vol=.15,delay=0,opt){
  if(!SOUND_ON)return;
  if(VOICES>=MAX_VOICES)return;
  try{
    const {a,master}=audioBus();
    const len=Math.max(1,Math.floor(a.sampleRate*dur));
    const buf=a.createBuffer(1,len,a.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,(opt&&opt.shape)||1.8);
    const src=a.createBufferSource();src.buffer=buf;
    const f=a.createBiquadFilter();
    f.type=(opt&&opt.type)||'bandpass';
    const t=a.currentTime+delay;
    f.frequency.setValueAtTime((opt&&opt.freq)||900,t);
    if(opt&&opt.sweep)f.frequency.exponentialRampToValueAtTime(Math.max(60,opt.sweep),t+dur);
    f.Q.value=(opt&&opt.q)||1.1;
    const g=a.createGain();
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),t+.006);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    src.connect(f);f.connect(g);g.connect(master);
    src.start(t);voice(src,t+dur+.02);
  }catch(e){}
}
/* Hợp âm rải — dùng cho các khoảnh khắc vui (thắng, lên cấp, mua đồ). */
function arp(freqs,step,dur,type,vol,opt){
  freqs.forEach((f,i)=>tone(f,dur,type,vol,i*step,opt));
}
const SFX={
  // Chưởng bay: nhiễu quét xuống + một nốt trượt cao độ = tiếng "vút"
  shoot(){noise(.16,.09,0,{type:'bandpass',freq:2600,sweep:700,q:.9});
          tone(520,.14,'sawtooth',.07,0,{glide:240,cutoff:2200,attack:.006})},
  // Va chạm: cú "bụp" trầm + thân nhiễu, thay cho hai sóng vuông cũ
  hit(){noise(.2,.16,0,{type:'lowpass',freq:1500,sweep:200,shape:2.4});
        tone(120,.22,'triangle',.15,0,{glide:60,cutoff:900,attack:.004})},
  crit(){noise(.26,.15,0,{type:'lowpass',freq:2600,sweep:260,shape:2.2});
         arp([500,760,1010,1420],.055,.16,'triangle',.11,{attack:.006,cutoff:4200})},
  right(){arp([660,880,1180],.07,.16,'triangle',.11,{attack:.01,cutoff:4000})},
  wrong(){tone(210,.28,'sawtooth',.12,0,{glide:120,cutoff:900,attack:.01});
          tone(150,.32,'triangle',.1,.06,{glide:88,cutoff:700})},
  heal(){arp([523,659,784,1047],.075,.24,'sine',.11,{attack:.03,cutoff:5200})},
  win(){arp([523,659,784,1047,1319],.11,.42,'triangle',.11,{attack:.014,cutoff:6000});
        noise(.5,.05,.05,{type:'highpass',freq:2400,shape:1.1})},
  tick(){tone(1150,.045,'sine',.06,0,{attack:.003,cutoff:3600})},
  click(){tone(560,.055,'sine',.07,0,{attack:.003,cutoff:2600});
          tone(820,.05,'sine',.045,.035,{attack:.003,cutoff:3400})},
  open(){arp([392,523,698],.06,.2,'sine',.09,{attack:.02,cutoff:4200})},
  buy(){arp([523,659,784,1047],.055,.18,'triangle',.1,{attack:.008,cutoff:5000});
        noise(.12,.05,0,{type:'highpass',freq:3200,shape:1.4})},
  item(){tone(920,.1,'triangle',.1,0,{attack:.005,cutoff:5200});
         tone(1240,.14,'sine',.09,.06,{attack:.006,cutoff:6000})},
  shield(){tone(300,.3,'sine',.12,0,{glide:440,attack:.05,cutoff:2400});
           noise(.3,.05,0,{type:'bandpass',freq:1200,sweep:2600,q:2})},
  unlock(){tone(740,.07,'triangle',.08,0,{attack:.004,cutoff:4000});
           tone(1050,.1,'sine',.08,.05,{attack:.005,cutoff:5000})},
  // Boss gầm: hai dao động lệch nhau tạo nhịp đập, cộng nhiễu trầm
  bossRoar(){tone(92,.62,'sawtooth',.15,0,{glide:58,cutoff:520,attack:.03});
             tone(96,.6,'sawtooth',.12,0,{glide:61,cutoff:480,attack:.03,detune:14});
             noise(.55,.1,0,{type:'lowpass',freq:700,sweep:130,shape:1.5})},
  defeat(){arp([420,340,268,196],.16,.34,'sawtooth',.11,{attack:.02,cutoff:1400});
           noise(.5,.06,.2,{type:'lowpass',freq:900,sweep:150,shape:2})},
  levelup(){arp([523,659,784,1047,1319,1568],.065,.3,'triangle',.1,{attack:.008,cutoff:6500});
            noise(.35,.05,.1,{type:'highpass',freq:2800,shape:1.2})},
  gold(){arp([880,1175,1568,2093],.055,.2,'sine',.1,{attack:.004,cutoff:7000})},
  perk(){arp([440,554,659,880],.075,.26,'triangle',.11,{attack:.01,cutoff:4800})},
};
window.SFX=SFX;

