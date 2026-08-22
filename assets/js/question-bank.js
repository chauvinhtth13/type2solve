/* ============================================================
   NGÂN HÀNG CÂU HỎI — PHONG CÁCH THI TOÁN QUỐC TẾ
   Mỗi câu đều kèm 💡 lời giải thích ngắn cho bé
============================================================ */
const TYPE_LABEL={arith:'🧮 Tính nhanh',missing:'❓ Tìm số',compare:'⚖️ So sánh',
  seq:'🔢 Quy luật',word:'📖 Toán đố',geo:'📐 Hình học',logic:'🧠 Tư duy',
  eq:'🍎 Cân bằng',magic:'🔮 Ô số ma thuật',back:'↩️ Suy luận ngược',
  count:'🌳 Đếm thông minh',combi:'🤝 Đếm cách',calen:'📅 Lịch & thời gian',
  olymp:'🏅 Olympic',cycle:'🔗 Chuỗi lặp',eng:'🔤 English',big:'💯 Số lớn',
  sasmo:'🏅 SASMO',imas:'🌏 IMAS',amc:'🎖️ AMC',tdn:'🎓 Trường chuyên',
  world:'🌍 Kinh điển',visual:'🎨 Nhìn hình',numsense:'🔟 Cảm nhận số',chance:'🎲 Xác suất',
  frac:'½ Phân số',dec:'🔢 Thập phân',pct:'💯 Phần trăm',geo5:'📐 Hình nâng cao',speed:'🚗 Vận tốc',
  unit:'📏 Đổi đơn vị',bar:'📊 Tổng-Tỉ/Hiệu-Tỉ',hsg:'🌟 Học sinh giỏi',brain:'💎 Thử thách mới',
  singapore:'🇸🇬 Singapore lớp 3'};

function genQuestion(tier){
  const pool={
    1:['arith','arith','compare','seq','geo','word','eq','count','logic','olymp','cycle','eng','sasmo','imas','amc','world','world','visual','visual','numsense','chance','brain','brain','singapore','singapore'],
    2:['arith','missing','seq','word','geo','logic','eq','eq','count','back','calen','olymp','olymp','cycle','eng','eng','big','big','sasmo','sasmo','imas','imas','amc','amc','world','world','visual','visual','numsense','numsense','chance','unit','unit','brain','brain','singapore','singapore'],
    3:['missing','word','geo','seq','logic','eq','magic','back','count','combi','calen','arith','olymp','olymp','cycle','eng','eng','big','big','big','sasmo','sasmo','sasmo','imas','imas','imas','amc','amc','amc','tdn','tdn','world','world','world','visual','visual','numsense','numsense','chance','chance','unit','unit','unit','bar','brain','brain','brain','singapore','singapore','singapore'],
    4:['word','geo','logic','eq','eq','magic','back','back','count','combi','calen','seq','missing','olymp','olymp','olymp','cycle','eng','eng','big','big','big','sasmo','sasmo','sasmo','sasmo','imas','imas','imas','imas','amc','amc','amc','amc','tdn','tdn','tdn','world','world','world','world','visual','visual','visual','numsense','numsense','chance','chance','frac','frac','pct','geo5','unit','unit','unit','bar','bar','hsg','brain','brain','brain','singapore','singapore','singapore'],
    5:['frac','frac','frac','dec','dec','dec','pct','pct','pct','geo5','geo5','geo5','speed','speed','speed',
       'world','world','visual','numsense','chance','sasmo','sasmo','imas','imas','amc','amc','tdn','tdn','tdn','olymp','big','big','word','logic','magic','back','combi','unit','unit','bar','bar','bar','hsg','hsg','hsg','hsg','hsg','brain','brain','brain','brain','singapore','singapore','singapore','singapore'],
  }[tier];
  CHOICE_TIER=tier;
  const type=pick(pool);
  const gen={arith:genArith,missing:genMissing,compare:genCompare,seq:genSeq,word:genWord,
    geo:genGeo,logic:genLogic,eq:genEmojiEq,magic:genMagic,back:genBackwards,
    count:genSmartCount,combi:genCombi,calen:genCalendar,
    olymp:genOlymp,cycle:genCycle,eng:genEnglish,big:genBigNum,
    sasmo:genSasmo,imas:genImas,amc:genAmc,tdn:genTDN,unit:genUnit,bar:genSumRatio,hsg:genHSG,brain:genBrainChallenge,
    singapore:genSingapore3,
    world:genWorld,visual:genVisual,numsense:genNumSense,chance:genChance,
    frac:genFraction,dec:genDecimal,pct:genPercent,geo5:genGeo5,speed:genSpeed}[type];
  const qq=gen(tier);qq.type=type;return qq;
}
/* ===== SINH ĐÁP ÁN NHIỄU CHỐNG ĐOÁN BỪA =====
   Nguyên tắc:
   1. Nhiễu là KẾT QUẢ CỦA SAI LẦM THƯỜNG GẶP (quên nhớ, lệch 1 đơn vị,
      nhân thay vì cộng, đảo chữ số...) nên "trông rất hợp lý" → không loại trừ được bằng cảm giác.
   2. Đáp án đúng KHÔNG bao giờ luôn là số lớn nhất / nhỏ nhất / ở giữa,
      và vị trí trong danh sách được đảo hoàn toàn ngẫu nhiên.
   3. Số lựa chọn tăng theo độ khó: 4 lựa chọn ở cấp thấp, 5 ở cấp cao
      → tỉ lệ đoán bừa đúng giảm từ 25% xuống 20%.
============================================== */
let CHOICE_TIER=1;
/* sinh các "sai lầm thường gặp" ở phía DƯỚI hoặc phía TRÊN đáp án */
function errPool(ans,spread,dir){ // dir = -1 (nhỏ hơn) | +1 (lớn hơn)
  const s=Math.max(2,Math.round(Math.abs(spread))||3);
  const raw=[];
  const add=v=>{v=Math.round(v);if(isFinite(v)&&v>=0&&((dir<0&&v<ans)||(dir>0&&v>ans)))raw.push(v);};
  // lệch 1–2 đơn vị: lỗi đếm thiếu/thừa
  add(ans+dir*1);add(ans+dir*2);add(ans+dir*3);
  // lỗi quên nhớ ở hàng chục / hàng trăm
  add(ans+dir*9);add(ans+dir*10);add(ans+dir*11);
  if(ans>=100){add(ans+dir*90);add(ans+dir*100);}
  if(ans>=1000){add(ans+dir*900);add(ans+dir*1000);}
  // lệch đúng một "bước" của bài toán (dùng sai số liệu trong đề)
  add(ans+dir*s);add(ans+dir*2*s);
  // dùng sai phép tính: nhân đôi / chia đôi
  if(dir>0)add(ans*2);
  if(dir<0&&ans%2===0)add(ans/2);
  // đảo hai chữ số cuối
  if(ans>=12&&ans<100){const t=Math.floor(ans/10),u=ans%10;if(t!==u)add(u*10+t);}
  // sắp theo độ gần đáp án: nhiễu càng sát càng khó loại bằng ước lượng
  return [...new Set(raw)].sort((a,b)=>Math.abs(a-ans)-Math.abs(b-ans));
}
function numChoices(ans,spread){
  const want=CHOICE_TIER>=3?5:4;   // cấp cao 5 lựa chọn → đoán bừa chỉ 20%
  const lo=errPool(ans,spread,-1), hi=errPool(ans,spread,+1);
  // Chọn TRƯỚC vị trí của đáp án (khi sắp tăng dần) một cách ngẫu nhiên đều
  // → đáp án không bao giờ "hay nằm ở giữa" hay "hay ở biên" ⇒ không có mẹo đoán.
  let below=ri(0,want-1);
  below=Math.min(below,lo.length);
  let above=want-1-below;
  if(above>hi.length){below=Math.min(want-1-hi.length+below-below+ (want-1-hi.length),lo.length);above=want-1-below;}
  const out=new Set([ans]);
  lo.slice(0,below).forEach(v=>out.add(v));
  hi.slice(0,above).forEach(v=>out.add(v));
  // bù thêm nếu thiếu (ưu tiên phía còn dư nguồn)
  let i=below,j=above,guard=0;
  while(out.size<want&&guard++<40){
    if(i<lo.length)out.add(lo[i++]);
    else if(j<hi.length)out.add(hi[j++]);
    else out.add(ans+(out.size)*Math.max(2,Math.round(Math.abs(spread))||3));
  }
  return shuffle([...out]);
}
function q(text,ans,spread,exp){return{q:text,ans,choices:numChoices(ans,spread),exp}}
function qs(text,ans,spread,exp){return{q:text,small:true,ans,choices:numChoices(ans,spread),exp}}

/* ---- 💯 SỐ LỚN: 3–4 chữ số & cộng nhiều số ---- */
function genBigNum(t){
  const k=t===2?pick(['add3','sub3','multiAdd','round'])
        :t===3?pick(['add3','sub3','multiAdd','multiAdd','round','mul3x1'])
        :pick(['add4','sub4','multiAdd4','round','round','mul3x1','multiMix']);
  if(k==='add3'){
    const a=ri(124,760),b=ri(115,985-a);
    return q(`${a} + ${b} = ?`,a+b,70,`Đặt tính rồi cộng từ phải sang trái (đơn vị → chục → trăm): ${a} + ${b} = ${a+b}.`);
  }
  if(k==='sub3'){
    const a=ri(320,990),b=ri(125,a-130);
    return q(`${a} − ${b} = ?`,a-b,70,`Đặt tính rồi trừ từ phải sang trái, nhớ "mượn" nếu không đủ: ${a} − ${b} = ${a-b}.`);
  }
  if(k==='add4'){
    const a=ri(1150,7600),b=ri(1050,9800-a);
    return q(`${a} + ${b} = ?`,a+b,400,`Cộng lần lượt từng hàng từ phải sang trái: ${a} + ${b} = ${a+b}.`);
  }
  if(k==='sub4'){
    const a=ri(3200,9900),b=ri(1100,a-1200);
    return q(`${a} − ${b} = ?`,a-b,400,`Trừ từng hàng từ phải sang trái, nhớ mượn khi cần: ${a} − ${b} = ${a-b}.`);
  }
  if(k==='multiAdd'){
    const a=ri(15,95),b=ri(15,95),c=ri(15,95);
    return q(`${a} + ${b} + ${c} = ?`,a+b+c,25,`Cộng lần lượt: ${a} + ${b} = ${a+b}, rồi ${a+b} + ${c} = ${a+b+c}.`);
  }
  if(k==='multiAdd4'){
    const a=ri(12,88),b=ri(12,88),c=ri(12,88),d=ri(12,88);
    return q(`${a} + ${b} + ${c} + ${d} = ?`,a+b+c+d,30,`Cộng từng cặp cho dễ: (${a}+${b}) + (${c}+${d}) = ${a+b} + ${c+d} = ${a+b+c+d}.`);
  }
  if(k==='multiMix'){
    const a=ri(250,800),b=ri(120,600),c=ri(100,a+b-150);
    return q(`${a} + ${b} − ${c} = ?`,a+b-c,60,`Tính từ trái sang phải: ${a} + ${b} = ${a+b}, rồi ${a+b} − ${c} = ${a+b-c}.`);
  }
  if(k==='mul3x1'){
    const a=ri(120,340),b=ri(2,4);
    return q(`${a} × ${b} = ?`,a*b,50,`Nhân từng hàng: ${b} × ${a} = ${a*b}. (Có thể tách: ${b}×${Math.floor(a/100)*100} + ${b}×${a%100}.)`);
  }
  // round: mẹo ghép số tròn trăm
  const a=ri(15,85),c=100-a,b=ri(110,480);
  return q(`Tính nhanh: ${a} + ${b} + ${c} = ?`,100+b,40,`Mẹo: ghép ${a} + ${c} = 100 trước, rồi 100 + ${b} = ${100+b}. Tìm cặp số tròn trăm là tính siêu nhanh!`);
}

/* ---- 🍎 CÂN BẰNG EMOJI ---- */
function genEmojiEq(t){
  const fruits=shuffle(['🍎','🍌','🍇','🍊','🍓']).slice(0,3);
  const [f1,f2,f3]=fruits;
  const a=ri(2,t<=2?6:9), b=ri(1,t<=2?6:9), c=ri(1,t<=2?5:8);
  const fr=s=>`<span class="fr">${s}</span>`;
  if(t===1){
    return {q:`Mỗi loại quả là một số. Hỏi ${f2} = ?`,small:true,
      svg:`<div class="eqlines">${fr(f1)} + ${fr(f1)} = ${2*a}<br>${fr(f1)} + ${fr(f2)} = ${a+b}<br>${fr(f2)} = ❓</div>`,
      ans:b,choices:numChoices(b,3),
      exp:`${f1} + ${f1} = ${2*a} nên ${f1} = ${a}. Vậy ${f2} = ${a+b} − ${a} = ${b}.`};
  }
  if(t===2){
    return {q:`Mỗi loại quả là một số. Hỏi ${f3} = ?`,small:true,
      svg:`<div class="eqlines">${fr(f1)} + ${fr(f1)} + ${fr(f1)} = ${3*a}<br>${fr(f1)} + ${fr(f2)} = ${a+b}<br>${fr(f2)} + ${fr(f3)} = ${b+c}<br>${fr(f3)} = ❓</div>`,
      ans:c,choices:numChoices(c,3),
      exp:`${f1} = ${3*a} : 3 = ${a} → ${f2} = ${a+b} − ${a} = ${b} → ${f3} = ${b+c} − ${b} = ${c}.`};
  }
  if(t===3){
    const aa=ri(2,6),bb=ri(2,7);
    return {q:`Mỗi loại quả là một số. Hỏi ${f2} × ${f1} = ?`,small:true,
      svg:`<div class="eqlines">${fr(f1)} × ${fr(f1)} = ${aa*aa}<br>${fr(f1)} + ${fr(f2)} = ${aa+bb}<br>${fr(f2)} × ${fr(f1)} = ❓</div>`,
      ans:aa*bb,choices:numChoices(aa*bb,6),
      exp:`${f1} × ${f1} = ${aa*aa} nên ${f1} = ${aa}. Suy ra ${f2} = ${aa+bb} − ${aa} = ${bb}. Vậy ${f2} × ${f1} = ${bb} × ${aa} = ${aa*bb}.`};
  }
  if(Math.random()<.5){
    const S=a+b+c;
    return {q:`Mỗi loại quả là một số. Hỏi ${f2} = ?`,small:true,
      svg:`<div class="eqlines">${fr(f1)} + ${fr(f2)} + ${fr(f3)} = ${S}<br>${fr(f1)} + ${fr(f2)} = ${a+b}<br>${fr(f2)} + ${fr(f3)} = ${b+c}</div>`,
      ans:b,choices:numChoices(b,3),
      exp:`Cả ba quả cộng lại = ${S}, mà ${f1}+${f2} = ${a+b} nên ${f3} = ${S}−${a+b} = ${c}. Từ ${f2}+${f3} = ${b+c} suy ra ${f2} = ${b}.`};
  }
  // ba cân thăng bằng, mỗi cân là tổng của HAI trong BA loại quả (đôi một)
  const x=ri(4,t<=4?12:16),y=ri(4,t<=4?12:16),z=ri(4,t<=4?12:16);
  const s1=x+y,s2=y+z,s3=x+z,half=(s1+s2+s3)/2;
  return {q:`Mỗi loại quả là một số. Hỏi ${f1} = ?`,small:true,
    svg:`<div class="eqlines">${fr(f1)} + ${fr(f2)} = ${s1}<br>${fr(f2)} + ${fr(f3)} = ${s2}<br>${fr(f1)} + ${fr(f3)} = ${s3}</div>`,
    ans:x,choices:numChoices(x,4),
    exp:`Cộng cả ba vế: (${f1}+${f2}) + (${f2}+${f3}) + (${f1}+${f3}) = ${s1}+${s2}+${s3} = ${s1+s2+s3}, tức 2×(${f1}+${f2}+${f3}) = ${s1+s2+s3} nên ${f1}+${f2}+${f3} = ${half}. Vậy ${f1} = ${half} − (${f2}+${f3}) = ${half} − ${s2} = ${x}.`};
}

/* ---- 🔮 Ô SỐ MA THUẬT ---- */
function genMagic(t){
  const [d1,d2]=pick([[1,3],[3,1],[2,3],[3,2]]);
  const c=ri(d1+d2+1, t>=4?14:10);
  const m=[[c+d1, c-d1-d2, c+d2],
           [c-d1+d2, c, c+d1-d2],
           [c-d2, c+d1+d2, c-d1]];
  const S=3*c;
  const hideR=ri(0,2),hideC=ri(0,2);
  const ans=m[hideR][hideC];
  const others=m[hideR].filter((_,i)=>i!==hideC);
  let html='<div class="magicgrid">';
  for(let r=0;r<3;r++)for(let col=0;col<3;col++){
    const hide=(r===hideR&&col===hideC);
    html+=`<div class="magiccell${hide?' qm':''}">${hide?'❓':m[r][col]}</div>`;
  }
  html+='</div>';
  return {q:`Ô số ma thuật: tổng mỗi hàng, mỗi cột, mỗi đường chéo đều bằng ${S}. Số ở ô ❓ là mấy?`,
    small:true,svg:html,ans,choices:numChoices(ans,4),
    exp:`Hàng chứa ô ❓ đã có ${others[0]} và ${others[1]}. Vậy ❓ = ${S} − ${others[0]} − ${others[1]} = ${ans}.`};
}

/* ---- ↩️ SUY LUẬN NGƯỢC ---- */
function genBackwards(t){
  if(t<=2){
    const x=ri(3,15),add=ri(2,9),sub=ri(1,8);
    return qs(`🎩 Nhà ảo thuật nghĩ ra một số. Ông cộng thêm ${add}, rồi trừ đi ${sub} thì được ${x+add-sub}. Hỏi số ban đầu là mấy?`,x,4,
      `Đi ngược lại: ${x+add-sub} + ${sub} = ${x+add}, rồi ${x+add} − ${add} = ${x}.`);
  }
  if(t===3){
    const x=ri(2,9),k=ri(2,4),add=ri(2,10);
    return qs(`🎩 Nhà ảo thuật nghĩ ra một số. Ông nhân số đó với ${k}, rồi cộng thêm ${add} thì được ${x*k+add}. Hỏi số ban đầu là mấy?`,x,3,
      `Đi ngược lại: ${x*k+add} − ${add} = ${x*k}, rồi ${x*k} : ${k} = ${x}.`);
  }
  const x=ri(2,8),k=ri(2,3),sub=ri(1,6),k2=ri(2,3);
  return qs(`🎩 Nhà ảo thuật nghĩ ra một số. Ông nhân với ${k}, trừ đi ${sub}, rồi lại nhân với ${k2} thì được ${(x*k-sub)*k2}. Hỏi số ban đầu là mấy?`,x,3,
    `Đi ngược từng bước: ${(x*k-sub)*k2} : ${k2} = ${x*k-sub} → cộng ${sub} được ${x*k} → chia ${k} được ${x}.`);
}

/* ---- 🌳 ĐẾM THÔNG MINH ---- */
function genSmartCount(t){
  const k=pick(t<=2?['tree','cut','stair']:['tree','cut','stair','treeRound','pageDigit','pageDigitReverse']);
  if(k==='pageDigitReverse'){
    const N=ri(120,850);
    const total=189+(N-99)*3;
    return qs(`📖 Một cuốn sách đánh số trang từ 1 đến N. Người ta đã dùng tất cả đúng ${total} lượt chữ số để in các số trang. Hỏi cuốn sách có tất cả bao nhiêu trang (N = ?)?`,N,15,
      `Trang 1–9 dùng 9 chữ số, trang 10–99 dùng thêm 90×2 = 180 chữ số → cộng dồn 189 chữ số. Còn lại ${total} − 189 = ${total-189} chữ số dùng cho các trang có 3 chữ số (từ 100 trở đi), mỗi trang tốn 3 chữ số nên có ${(total-189)/3} trang loại này. Vậy N = 99 + ${(total-189)/3} = ${N} trang.`);
  }
  if(k==='tree'){
    const d=pick([2,3,4,5]),n=ri(4,t<=2?7:12);
    return qs(`🌳 Người ta trồng cây dọc một con đường dài ${d*n} m, cây cách cây ${d} m, trồng ở CẢ HAI đầu đường. Hỏi cần bao nhiêu cây?`,n+1,3,
      `Số khoảng cách = ${d*n} : ${d} = ${n}. Trồng cả 2 đầu nên số cây = số khoảng + 1 = ${n+1}.`);
  }
  if(k==='treeRound'){
    const d=pick([2,3,4,5]),n=ri(5,12);
    return qs(`⭕ Trồng cây quanh một hồ nước hình tròn có chu vi ${d*n} m, cây cách cây ${d} m. Hỏi cần bao nhiêu cây?`,n,3,
      `Trên đường tròn khép kín, số cây = số khoảng = ${d*n} : ${d} = ${n} (không cộng 1 như đường thẳng!).`);
  }
  if(k==='cut'){
    if(t<=2||Math.random()<.5){
      const n=ri(3,8);
      return qs(`🪵 Bác thợ mộc cưa một khúc gỗ thành ${n} đoạn. Hỏi bác phải cưa bao nhiêu lần?`,n-1,2,
        `Mỗi lần cưa tăng thêm 1 đoạn. Muốn có ${n} đoạn chỉ cần cưa ${n}−1 = ${n-1} lần.`);
    }
    const n=ri(3,7),tm=pick([2,3,4]);
    return qs(`🪵 Cưa một khúc gỗ thành 2 đoạn mất ${tm} phút. Hỏi cưa khúc gỗ đó thành ${n} đoạn mất bao nhiêu phút?`,(n-1)*tm,tm,
      `Thành 2 đoạn = 1 lần cưa = ${tm} phút. Thành ${n} đoạn cần ${n-1} lần cưa = ${n-1} × ${tm} = ${(n-1)*tm} phút.`);
  }
  if(k==='stair'){
    const s=ri(8,14),n=ri(3,7);
    return qs(`🏠 Mỗi tầng nhà có ${s} bậc cầu thang. Bé Bo đi từ tầng 1 lên tầng ${n}. Hỏi bé leo bao nhiêu bậc?`,(n-1)*s,s,
      `Từ tầng 1 lên tầng ${n} chỉ đi qua ${n-1} đoạn thang, nên số bậc = ${n-1} × ${s} = ${(n-1)*s}.`);
  }
  const n=ri(12,30);
  const digits=9+(n-9)*2;
  return qs(`📖 Một quyển truyện có ${n} trang, đánh số từ 1 đến ${n}. Hỏi phải dùng tất cả bao nhiêu CHỮ SỐ?`,digits,5,
    `Trang 1–9: 9 trang × 1 chữ số = 9. Trang 10–${n}: ${n-9} trang × 2 chữ số = ${(n-9)*2}. Tổng: 9 + ${(n-9)*2} = ${digits}.`);
}

/* ---- 🤝 ĐẾM CÁCH ---- */
function genCombi(t){
  const k=pick(t<=3?['hand','outfit']:['hand','outfit','line']);
  if(k==='hand'){
    const n=ri(3,t>=4?6:5);
    return qs(`🤝 Có ${n} bạn nhỏ, mỗi bạn bắt tay TẤT CẢ các bạn còn lại đúng 1 lần. Hỏi có tất cả bao nhiêu cái bắt tay?`,n*(n-1)/2,3,
      `Mỗi bạn bắt tay ${n-1} bạn khác: ${n} × ${n-1} = ${n*(n-1)}. Nhưng mỗi cái bắt tay bị đếm 2 lần, nên chia 2: ${n*(n-1)/2}.`);
  }
  if(k==='outfit'){
    const a=ri(2,4),b=ri(2,4);
    return qs(`👕👖 Bé Na có ${a} chiếc áo và ${b} chiếc quần. Hỏi bé có bao nhiêu cách chọn 1 bộ áo–quần khác nhau?`,a*b,3,
      `Mỗi chiếc áo ghép được với ${b} chiếc quần, có ${a} chiếc áo nên: ${a} × ${b} = ${a*b} cách.`);
  }
  const n=pick([3,4]);
  const ans=n===3?6:24;
  return qs(`🚶 Có ${n} bạn xếp thành một hàng dọc. Hỏi có bao nhiêu cách xếp khác nhau?`,ans,n===3?3:8,
    `Vị trí đầu có ${n} cách chọn, vị trí sau còn ${n-1} cách... Nhân lại: ${n===3?'3×2×1 = 6':'4×3×2×1 = 24'}.`);
}

/* ---- 📅 LỊCH & THỜI GIAN ---- */
const DOW=['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'];
function genCalendar(t){
  if(t<=2||Math.random()<.5){
    const start=ri(0,6),plus=ri(3,t<=2?9:25);
    const ans=DOW[(start+plus)%7];
    const wrong=shuffle(DOW.filter(d=>d!==ans)).slice(0,3);
    return {q:`📅 Hôm nay là ${DOW[start]}. Hỏi ${plus} ngày nữa là thứ mấy?`,
      small:true,ans,choices:shuffle([ans,...wrong]),
      exp:`Cứ 7 ngày lại quay về thứ cũ. ${plus} : 7 dư ${plus%7}, nên chỉ cần đếm tới ${plus%7} ngày sau ${DOW[start]} → ${ans}.`};
  }
  const h=ri(1,9),m=pick([15,30,45]),dur=pick([30,45,60,90]);
  const total=h*60+m+dur;
  const eh=Math.floor(total/60),em=total%60;
  const ansStr=`${eh} giờ ${em===0?'đúng':em+' phút'}`;
  const wrongs=new Set();
  while(wrongs.size<3){
    const dd=pick([-30,-15,15,30,60]);const tt=total+dd;
    const s=`${Math.floor(tt/60)} giờ ${tt%60===0?'đúng':tt%60+' phút'}`;
    if(s!==ansStr)wrongs.add(s);
  }
  return {q:`🕐 Phim hoạt hình bắt đầu lúc ${h} giờ ${m} phút và kéo dài ${dur} phút. Hỏi phim kết thúc lúc mấy giờ?`,
    small:true,ans:ansStr,choices:shuffle([ansStr,...wrongs]),
    exp:`${h} giờ ${m} phút + ${dur} phút = ${ansStr}. (Cộng phút trước, cứ đủ 60 phút thì thêm 1 giờ.)`};
}

/* ---- 🏅 OLYMPIC / SASMO STYLE ---- */
function genOlymp(t){
  const k=pick(t<=2?['headlegs','sum1n','pages','lily','between']
                   :['headlegs','sum1n','pages','lily','between','squares','digitPuz','catmice','bottle','race']);
  if(k==='headlegs'){
    const ch=ri(2,t<=2?5:7),co=ri(2,t<=2?4:7);
    const H=ch+co,L=ch*2+co*4;
    return qs(`🐔🐄 Trong sân có gà và bò. Đếm được ${H} cái ĐẦU và ${L} cái CHÂN. Hỏi có bao nhiêu con GÀ?`,ch,2,
      `Giả sử cả ${H} con đều là bò thì có ${H*4} chân — thừa ${H*4-L} chân. Mỗi con gà ít hơn bò 2 chân, nên số gà = ${H*4-L} : 2 = ${ch}.`);
  }
  if(k==='sum1n'){
    const n=pick(t<=2?[10]:[10,15,20]);
    return qs(`🧮 Tính nhanh: 1 + 2 + 3 + ... + ${n} = ?`,n*(n+1)/2,n,
      `Mẹo Gauss: ghép số đầu với số cuối: 1+${n} = ${n+1}, 2+${n-1} = ${n+1}... Có ${n} số tạo thành ${n/2%1===0?n/2:'('+n+':2)'} cặp, mỗi cặp bằng ${n+1}. Kết quả: ${n*(n+1)/2}.`);
  }
  if(k==='pages'){
    const a=ri(5,40),len=ri(6,20);
    return qs(`📖 Bé đọc truyện từ trang ${a} đến hết trang ${a+len-1}. Hỏi bé đã đọc được bao nhiêu trang?`,len,3,
      `Số trang = trang cuối − trang đầu + 1 = ${a+len-1} − ${a} + 1 = ${len}. (Phải +1 vì đọc cả trang đầu!)`);
  }
  if(k==='lily'){
    const full=pick([8,10,12]);
    return qs(`🌸 Đám bèo trên mặt hồ mỗi ngày lại RỘNG GẤP ĐÔI hôm trước. Đến ngày thứ ${full} thì bèo phủ kín cả hồ. Hỏi ngày thứ mấy bèo phủ đúng NỬA hồ?`,full-1,2,
      `Suy nghĩ ngược: mỗi ngày bèo gấp đôi, vậy hôm TRƯỚC ngày kín hồ, bèo phủ đúng một nửa → ngày thứ ${full-1}.`);
  }
  if(k==='squares'){
    const n=t<=2?3:pick([3,4,5]);
    const sizes=Array.from({length:n},(_,i)=>n-i); // n,n-1,...,1
    const ans=sizes.reduce((s,side)=>s+side*side,0);
    const cell=Math.min(36,180/n);
    return {q:`🟦 Trong lưới ô vuông ${n}×${n} dưới đây có tất cả bao nhiêu HÌNH VUÔNG (tính cả các hình vuông to nhỏ khác nhau)?`,small:true,
      svg:`<svg viewBox="0 0 ${n*cell+20} ${n*cell+20}" width="${Math.min(150,n*cell+20)}"><g class="pulseShape">${
        Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>`<rect x="${10+c*cell}" y="${10+r*cell}" width="${cell}" height="${cell}" fill="#eef6ff" stroke="#2b2350" stroke-width="3"/>`).join('')).join('')
      }</g></svg>`,
      ans,choices:numChoices(ans,Math.max(3,n)),
      exp:`Đếm vuông từng cỡ: ${sizes.map(side=>`vuông ${side}×${side} có ${side*side} cái`).join(', ')}. Tổng: ${sizes.map(side=>side*side).join(' + ')} = ${ans}.`};
  }
  if(k==='digitPuz'){
    const u=ri(1,4),d=ri(1,Math.min(4,9-u));
    const num=(u+d)*10+u;
    return qs(`🔍 Tìm số có 2 chữ số: tổng hai chữ số bằng ${2*u+d}, và chữ số hàng CHỤC lớn hơn chữ số hàng ĐƠN VỊ đúng ${d} đơn vị. Số đó là số nào?`,num,11,
      `Gọi hàng đơn vị là ▢ thì hàng chục là ▢+${d}. Tổng: ▢+▢+${d} = ${2*u+d} → ▢ = ${u}. Vậy số đó là ${num}.`);
  }
  if(k==='catmice'){
    const n=pick([3,4,5]);
    return qs(`🐱 ${n} con mèo bắt được ${n} con chuột trong ${n} phút. Hỏi 100 con mèo bắt 100 con chuột trong bao nhiêu phút?`,n,ri(2,5),
      `${n} mèo bắt ${n} chuột trong ${n} phút nghĩa là MỖI con mèo bắt 1 con chuột hết ${n} phút. 100 mèo cùng lúc bắt 100 chuột thì vẫn chỉ mất ${n} phút!`);
  }
  if(k==='bottle'){
    const water=ri(2,5)*2, bottle=ri(1,3);
    return qs(`🍾 Chai đầy nước nặng ${water+bottle} kg. Riêng vỏ chai nặng ${bottle} kg. Uống hết MỘT NỬA nước thì cả chai còn nặng bao nhiêu kg?`,water/2+bottle,2,
      `Nước nặng ${water+bottle} − ${bottle} = ${water} kg. Uống nửa còn ${water/2} kg nước. Cộng vỏ chai: ${water/2} + ${bottle} = ${water/2+bottle} kg.`);
  }
  const posOr=pick(['secondPass','lastPass']);
  if(posOr==='secondPass'){
    return {q:`🏃 Trong cuộc đua, em vừa VƯỢT QUA bạn đang đứng thứ 2. Hỏi bây giờ em đứng thứ mấy?`,small:true,
      ans:'Thứ 2',choices:shuffle(['Thứ 1','Thứ 2','Thứ 3','Thứ 4']),
      exp:`Vượt qua người thứ 2 nghĩa là em CHIẾM CHỖ của người đó → em đứng thứ 2 (người thứ 1 vẫn ở phía trước!).`};
  }
  const n=ri(5,10);
  return qs(`🏃 Cuộc đua có ${n} bạn. Bạn Bo về đích TRƯỚC ${n-3} bạn. Hỏi Bo về thứ mấy?`,3,2,
    `Bo về trước ${n-3} bạn nghĩa là có ${n} − ${n-3} − 1 = 2 bạn về trước Bo. Vậy Bo về thứ 3.`);
}

/* ---- 🔗 CHUỖI LẶP ---- */
function genCycle(t){
  const sets=[['🔴','🔵','🟢'],['⭐','🌙','☀️'],['🍎','🍌','🍇','🍊'],['🐸','🐷'],['🔺','🟦','⚪'],['⭐','🔶','🔶','🔺','🔺','🔺']];
  const beads=pick(sets);
  const L=beads.length;
  const pos=ri(L*2+2, t<=2?16:t===3?30:50);
  const r=pos%L;
  const ans=beads[(pos-1)%L];
  const shownArr=Array.from({length:L*2+1},(_,i)=>beads[i%L]);
  const html=shownArr.map((s,i)=>`<span style="animation-delay:${(i*0.14)%1.6}s">${s}</span>`).join(' ')+' <b>...</b>';
  const wrongPool=[...beads.filter(x=>x!==ans),'⚫','🟡'].filter((v,i,arr)=>arr.indexOf(v)===i&&v!==ans);
  const choices=shuffle([ans,...shuffle(wrongPool).slice(0,3)]);
  return {q:`🔗 Chuỗi hạt cứ lặp đi lặp lại mãi theo quy luật. Hỏi hạt thứ ${pos} là hạt nào?`,small:true,
    svg:`<div class="countRow">${html}</div>`,ans,choices,
    exp:`Chu kỳ có ${L} hạt. ${pos} : ${L} = ${Math.floor(pos/L)} dư ${r}. ${r===0?`Dư 0 nghĩa là rơi đúng hạt CUỐI chu kỳ`:`Dư ${r} nghĩa là giống hạt thứ ${r} trong chu kỳ`} → ${ans}.`};
}

/* ---- 🔤 ENGLISH MATH ---- */
const EN_DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function genEnglish(t){
  const k=pick(t<=2?['plus','minus','animals','fruit','next']
                   :['plus','times','animals','fruit','next','days','dozen','half']);
  if(k==='plus'){
    const a=ri(t<=2?3:15,t<=2?20:60),b=ri(t<=2?2:10,t<=2?15:40);
    return qs(`🔤 What is ${a} plus ${b}?`,a+b,8,`"Plus" nghĩa là CỘNG: ${a} + ${b} = ${a+b}.`);
  }
  if(k==='minus'){
    const a=ri(10,30),b=ri(2,a-2);
    return qs(`🔤 What is ${a} minus ${b}?`,a-b,5,`"Minus" nghĩa là TRỪ: ${a} − ${b} = ${a-b}.`);
  }
  if(k==='times'){
    const a=ri(3,9),b=ri(3,9);
    return qs(`🔤 What is ${a} times ${b}?`,a*b,8,`"Times" nghĩa là NHÂN: ${a} × ${b} = ${a*b}.`);
  }
  if(k==='animals'){
    const n=ri(2,6);
    const anim=pick([['dog','dogs',4,'🐶'],['cat','cats',4,'🐱'],['chicken','chickens',2,'🐔'],['spider','spiders',8,'🕷️']]);
    return qs(`🔤 A ${anim[0]} has ${anim[2]} legs. How many legs do ${n} ${anim[1]} have? ${anim[3].repeat(n)}`,n*anim[2],anim[2],
      `Mỗi con có ${anim[2]} chân ("legs"), có ${n} con: ${n} × ${anim[2]} = ${n*anim[2]}.`);
  }
  if(k==='fruit'){
    const a=ri(5,15),b=ri(2,a-1);
    const who=pick(['Tom','Anna','Ben','Lucy']);
    return qs(`🔤 ${who} has ${a} apples 🍎. ${who} eats ${b} apples. How many apples are left?`,a-b,4,
      `"Eats" = ăn mất, "left" = còn lại: ${a} − ${b} = ${a-b} quả.`);
  }
  if(k==='next'){
    const step=pick([2,3,5,10]),s0=ri(1,10);
    const seq=[s0,s0+step,s0+step*2,s0+step*3];
    return qs(`🔤 What number comes next? ${seq.join(', ')}, __?`,s0+step*4,step,
      `Dãy tăng đều ${step} đơn vị ("comes next" = số tiếp theo): ${s0+step*3} + ${step} = ${s0+step*4}.`);
  }
  if(k==='days'){
    const st=ri(0,6),plus=ri(3,12);
    const ans=EN_DAYS[(st+plus)%7];
    const wrong=shuffle(EN_DAYS.filter(d=>d!==ans)).slice(0,3);
    return {q:`🔤 Today is ${EN_DAYS[st]}. What day will it be after ${plus} days?`,small:true,
      ans,choices:shuffle([ans,...wrong]),
      exp:`${plus} : 7 dư ${plus%7} → đếm ${plus%7} ngày sau ${EN_DAYS[st]} là ${ans}. (Sunday=Chủ nhật, Monday=Thứ hai...)`};
  }
  if(k==='dozen'){
    const n=pick([2,3,4]);
    return qs(`🔤 One dozen means 12. How many eggs 🥚 are there in ${n} dozen?`,n*12,12,
      `"Dozen" = 1 tá = 12. Vậy ${n} tá = ${n} × 12 = ${n*12} quả trứng.`);
  }
  const n=pick([8,12,16,20,24]);
  return qs(`🔤 What is HALF of ${n}?`,n/2,4,`"Half" = một nửa, tức chia 2: ${n} : 2 = ${n/2}.`);
}


/* ============================================================
   🏆 CÂU HỎI PHONG CÁCH CÁC KỲ THI QUỐC TẾ
   sasmo : SASMO (Singapore & Asian Schools Math Olympiad)
   imas  : IMAS (International Mathematics Assessment for Schools)
   amc   : AMC (American Mathematics Competitions - AMC 8)
   Tất cả đề đều được sinh ngẫu nhiên theo đúng DẠNG bài của mỗi kỳ thi.
============================================================ */

/* ---- 🏅 SASMO STYLE ---- */
function genSasmo(t){
  const k=pick(t<=2?['sock','sumdiffB','oddSum','stamp','ribbon']
                   :['sock','sumdiffB','oddSum','stamp','ribbon','coinPay','ageFuture','remainder','weigh']);

  if(k==='sock'){ // nguyên lý chuồng bồ câu
    const colors=pick([['đỏ','xanh'],['trắng','đen'],['vàng','tím']]);
    const c=colors.length;
    return qs(`🧦 Trong ngăn kéo tối om có rất nhiều tất màu ${colors[0]} và màu ${colors[1]} lẫn lộn. Không nhìn thấy gì, phải lấy ra ít nhất bao nhiêu chiếc để CHẮC CHẮN có 1 đôi cùng màu?`,3,2,
      `Có 2 màu. Lấy 2 chiếc có thể ra 2 màu khác nhau. Nhưng lấy 3 chiếc thì chắc chắn có 2 chiếc trùng màu → cần 3 chiếc.`);
  }
  if(k==='sumdiffB'){ // tổng - hiệu (SASMO rất hay ra)
    const small=ri(6,30),d=ri(2,12);
    const total=small*2+d;
    return qs(`🎁 Hai bạn có tất cả ${total} viên bi. Bạn An nhiều hơn bạn Bình ${d} viên. Hỏi bạn AN có bao nhiêu viên bi?`,small+d,5,
      `Số LỚN = (tổng + hiệu) : 2 = (${total} + ${d}) : 2 = ${(total+d)/2}. (Số bé là ${small}.)`);
  }
  if(k==='oddSum'){ // tổng dãy số lẻ / chẵn
    const n=pick([4,5,6,7]);
    const seq=Array.from({length:n},(_,i)=>2*i+1);
    return qs(`🔢 Tính tổng ${n} số lẻ đầu tiên: ${seq.join(' + ')} = ?`,n*n,n*2,
      `Mẹo SASMO: tổng ${n} số lẻ đầu tiên luôn bằng ${n} × ${n} = ${n*n}. Thử xem: 1+3=4=2×2 ✓`);
  }
  if(k==='stamp'){ // bài toán 2 loại vật, tổng số
    const a=ri(2,6),b=ri(2,6);
    const pA=pick([2,3]),pB=pA===2?5:2;
    const total=a*pA+b*pB;
    return qs(`🏷️ Một tờ tem loại A giá ${pA} nghìn, tem loại B giá ${pB} nghìn. Bé mua ${a} tem A và ${b} tem B. Hỏi bé trả tất cả bao nhiêu nghìn?`,total,6,
      `Tem A: ${a} × ${pA} = ${a*pA} nghìn. Tem B: ${b} × ${pB} = ${b*pB} nghìn. Tổng: ${a*pA} + ${b*pB} = ${total} nghìn.`);
  }
  if(k==='ribbon'){ // cắt dây
    const piece=ri(3,8),n=ri(3,7);
    return qs(`✂️ Một dải ruy băng dài ${piece*n} cm được cắt thành các đoạn dài ${piece} cm. Hỏi phải cắt bao nhiêu NHÁT kéo?`,n-1,2,
      `Số đoạn = ${piece*n} : ${piece} = ${n}. Số nhát cắt = số đoạn − 1 = ${n-1} (nhát cuối không cần vì đã đứt rời).`);
  }
  if(k==='coinPay'){ // đếm số cách chọn 2 món
    const n=ri(4,6);
    return qs(`🪙 Có ${n} món đồ chơi khác nhau, bé được chọn đúng 2 món. Hỏi bé có bao nhiêu cách chọn?`,n*(n-1)/2,3,
      `Món thứ nhất có ${n} cách, món thứ hai có ${n-1} cách → ${n*(n-1)}. Nhưng chọn (A,B) giống (B,A) nên chia 2: ${n*(n-1)/2} cách.`);
  }
  if(k==='ageFuture'){ // tuổi trong tương lai
    const now=ri(7,11),gap=ri(22,30),yr=ri(3,8);
    return qs(`👨‍👦 Năm nay con ${now} tuổi, bố hơn con ${gap} tuổi. Hỏi ${yr} năm nữa TỔNG số tuổi hai bố con là bao nhiêu?`,(now+yr)+(now+gap+yr),8,
      `${yr} năm nữa: con ${now+yr} tuổi, bố ${now+gap+yr} tuổi. Tổng = ${(now+yr)+(now+gap+yr)}. (Mẹo: mỗi năm tổng tăng 2 tuổi!)`);
  }
  if(k==='remainder'){ // chia có dư
    const d=ri(3,7),qq=ri(4,12),r=ri(1,d-1);
    return qs(`🍪 Có ${d*qq+r} chiếc bánh chia đều vào ${d} hộp, mỗi hộp số bánh bằng nhau và nhiều nhất có thể. Hỏi thừa ra mấy chiếc?`,r,2,
      `${d*qq+r} : ${d} = ${qq} dư ${r}. Mỗi hộp ${qq} chiếc, còn thừa ${r} chiếc.`);
  }
  // weigh: cân thăng bằng
  const w=ri(2,5),n1=ri(2,4);
  return qs(`⚖️ ${n1*w} quả cam nặng bằng ${n1} quả dưa. Hỏi 1 quả dưa nặng bằng mấy quả cam?`,w,2,
    `${n1*w} cam = ${n1} dưa. Chia cả hai bên cho ${n1}: ${w} cam = 1 dưa. Vậy 1 quả dưa nặng bằng ${w} quả cam.`);
}

/* ---- 🌏 IMAS STYLE ---- */
function genImas(t){
  const k=pick(t<=2?['perimShape','digitSum','pattern','clockAngleEasy','avgSimple']
                   :['perimShape','digitSum','pattern','avgSimple','unitPrice','speed','fracPart','cubes']);

  if(k==='perimShape'){ // chu vi hình ghép
    const n=ri(2,4),s=ri(2,5);
    const peri=(2*n+2)*s;
    return {q:`📏 Ghép ${n} hình vuông cạnh ${s} cm thành một hàng ngang (dán sát cạnh nhau). Hỏi chu vi hình chữ nhật thu được là bao nhiêu cm?`,small:true,
      svg:`<svg viewBox="0 0 ${n*34+20} 54" width="${Math.min(260,n*34+20)}"><g class="pulseShape">${
        Array.from({length:n},(_,i)=>`<rect x="${10+i*34}" y="10" width="34" height="34" fill="#bfe8ff" stroke="#2b2350" stroke-width="3"/>`).join('')
      }</g></svg>`,
      ans:peri,choices:numChoices(peri,s*2),
      exp:`Hình chữ nhật có chiều dài ${n}×${s} = ${n*s} cm, chiều rộng ${s} cm. Chu vi = (${n*s} + ${s}) × 2 = ${peri} cm.`};
  }
  if(k==='digitSum'){ // tổng các chữ số
    const num=ri(t<=2?100:1000, t<=2?999:9999);
    const ds=String(num).split('').reduce((a,b)=>a+ +b,0);
    return qs(`🔢 Tính TỔNG các chữ số của số ${num}.`,ds,5,
      `Cộng từng chữ số: ${String(num).split('').join(' + ')} = ${ds}.`);
  }
  if(k==='pattern'){ // dãy hình tăng dần
    const start=ri(1,4),step=ri(2,4),n=ri(5,9);
    const ans=start+step*(n-1);
    return qs(`🔷 Hình thứ 1 có ${start} chấm, hình thứ 2 có ${start+step} chấm, hình thứ 3 có ${start+2*step} chấm... (mỗi hình thêm ${step} chấm). Hỏi hình thứ ${n} có bao nhiêu chấm?`,ans,step*2,
      `Từ hình 1 đến hình ${n} tăng ${n-1} lần, mỗi lần ${step} chấm: ${start} + ${n-1}×${step} = ${ans} chấm.`);
  }
  if(k==='avgSimple'){ // trung bình cộng
    const n=pick([3,4]);
    const avg=ri(4,12);
    const vals=[];let s=0;
    for(let i=0;i<n-1;i++){const v=avg+pick([-3,-2,-1,1,2,3]);vals.push(v);s+=v;}
    const last=avg*n-s;
    if(last<1)return genImas(t);
    vals.push(last);
    return qs(`📊 ${n} bạn hái được lần lượt ${vals.join(', ')} bông hoa 🌸. Hỏi TRUNG BÌNH mỗi bạn hái được bao nhiêu bông?`,avg,3,
      `Tổng = ${vals.join(' + ')} = ${avg*n}. Trung bình = ${avg*n} : ${n} = ${avg} bông.`);
  }
  if(k==='unitPrice'){ // đơn giá
    const unit=ri(3,9),n1=ri(2,5),n2=ri(3,8);
    return qs(`🛒 Mua ${n1} quyển vở hết ${n1*unit} nghìn đồng. Hỏi mua ${n2} quyển vở như thế hết bao nhiêu nghìn đồng?`,n2*unit,unit*2,
      `Giá 1 quyển = ${n1*unit} : ${n1} = ${unit} nghìn. Mua ${n2} quyển = ${n2} × ${unit} = ${n2*unit} nghìn.`);
  }
  if(k==='speed'){ // vận tốc đơn giản
    const v=pick([3,4,5,6]),h=ri(2,5);
    return qs(`🚶 Bạn Nam đi bộ mỗi giờ được ${v} km. Hỏi ${h} giờ bạn đi được bao nhiêu km?`,v*h,5,
      `Quãng đường = vận tốc × thời gian = ${v} × ${h} = ${v*h} km.`);
  }
  if(k==='fracPart'){ // phân số của một số
    const parts=pick([2,3,4,5]);
    const each=ri(3,9);
    const total=parts*each;
    return qs(`🍰 Chiếc bánh được chia thành ${parts} phần bằng nhau, cả chiếc nặng ${total} gam. Hỏi 1 phần nặng bao nhiêu gam?`,each,4,
      `1 phần = ${total} : ${parts} = ${each} gam.`);
  }
  // cubes: đếm khối lập phương
  const a=ri(2,3),b=ri(2,3),c=ri(2,3);
  return {q:`🧊 Một khối hộp được xếp bằng các khối lập phương nhỏ: dài ${a} khối, rộng ${b} khối, cao ${c} khối. Hỏi có tất cả bao nhiêu khối lập phương nhỏ?`,small:true,
    svg:`<div class="countRow">${Array.from({length:a*b},(_,i)=>`<span style="animation-delay:${(i*0.12)%1.6}s">🧊</span>`).join('')}<br><span style="font-size:13px;font-family:Nunito">(một tầng có ${a}×${b} = ${a*b} khối, có ${c} tầng)</span></div>`,
    ans:a*b*c,choices:numChoices(a*b*c,4),
    exp:`Mỗi tầng có ${a} × ${b} = ${a*b} khối. Có ${c} tầng: ${a*b} × ${c} = ${a*b*c} khối.`};
}

/* ---- 🎖️ AMC 8 STYLE ---- */
function genAmc(t){
  const k=pick(t<=2?['moneyChange','oddEven','shapeCount','simplePercent']
                   :['moneyChange','oddEven','shapeCount','percent','ratio','workRate','lastDigit','average2']);

  if(k==='moneyChange'){ // tiền thừa
    const price=ri(12,45),pay=pick([50,100]);
    if(pay<=price)return genAmc(t);
    return qs(`💵 Bé mua đồ chơi hết ${price} nghìn đồng và đưa cho cô bán hàng tờ ${pay} nghìn. Hỏi cô trả lại bé bao nhiêu nghìn đồng?`,pay-price,8,
      `Tiền thừa = ${pay} − ${price} = ${pay-price} nghìn đồng.`);
  }
  if(k==='oddEven'){ // tính chất chẵn lẻ
    const a=ri(2,20)*2, b=ri(1,10)*2+1;
    const isSum=Math.random()<.5;
    const ans=isSum?a+b:a*b;
    return qs(`🧠 ${a} là số CHẴN, ${b} là số LẺ. Tính ${a} ${isSum?'+':'×'} ${b} = ?`,ans,6,
      `${a} ${isSum?'+':'×'} ${b} = ${ans} — kết quả là số ${ans%2===0?'CHẴN':'LẺ'}. Ghi nhớ: chẵn + lẻ = LẺ, còn chẵn × lẻ = CHẴN.`);
  }
  if(k==='shapeCount'){ // đếm hình trong lưới chữ nhật
    const w=pick([2,3]),hh=pick([2,3]);
    const rects=(w*(w+1)/2)*(hh*(hh+1)/2);
    return {q:`🔲 Lưới ô vuông ${w}×${hh} ô. Hỏi đếm được tất cả bao nhiêu HÌNH CHỮ NHẬT (tính cả hình vuông)?`,small:true,
      svg:`<svg viewBox="0 0 ${w*34+20} ${hh*34+20}" width="${w*34+20}"><g class="pulseShape">${
        Array.from({length:hh},(_,r)=>Array.from({length:w},(_,c)=>`<rect x="${10+c*34}" y="${10+r*34}" width="34" height="34" fill="#eef6ff" stroke="#2b2350" stroke-width="3"/>`).join('')).join('')
      }</g></svg>`,
      ans:rects,choices:numChoices(rects,4),
      exp:`Chọn 2 đường dọc trong ${w+1} đường: ${w*(w+1)/2} cách. Chọn 2 đường ngang trong ${hh+1} đường: ${hh*(hh+1)/2} cách. Nhân lại: ${w*(w+1)/2} × ${hh*(hh+1)/2} = ${rects}.`};
  }
  if(k==='simplePercent'||k==='percent'){ // phần trăm cơ bản
    const p=pick([10,20,25,50]);
    const base=p===25?ri(2,10)*4:p===20?ri(2,10)*5:p===10?ri(2,12)*10:ri(3,15)*2;
    const ans=base*p/100;
    return qs(`💯 Lớp có ${base} bạn, trong đó ${p}% số bạn đeo kính 👓. Hỏi có bao nhiêu bạn đeo kính?`,ans,4,
      `${p}% nghĩa là ${p===50?'một nửa':p===25?'một phần tư':p===20?'một phần năm':'một phần mười'}: ${base} ${p===50?': 2':p===25?': 4':p===20?': 5':': 10'} = ${ans} bạn.`);
  }
  if(k==='ratio'){ // tỉ số
    const r1=ri(1,3),r2=r1+ri(1,3),unit=ri(3,9);
    return qs(`⚖️ Số kẹo của An và Bình theo tỉ lệ ${r1} : ${r2}. Biết An có ${r1*unit} viên. Hỏi Bình có bao nhiêu viên?`,r2*unit,6,
      `An có ${r1*unit} viên ứng với ${r1} phần → 1 phần = ${r1*unit} : ${r1} = ${unit} viên. Bình có ${r2} phần = ${r2} × ${unit} = ${r2*unit} viên.`);
  }
  if(k==='workRate'){ // năng suất
    const perDay=ri(3,8),days=ri(3,7);
    return qs(`👷 Một máy làm được ${perDay} sản phẩm mỗi giờ. Hỏi trong ${days} giờ máy làm được bao nhiêu sản phẩm?`,perDay*days,6,
      `Mỗi giờ ${perDay} sản phẩm, ${days} giờ: ${perDay} × ${days} = ${perDay*days} sản phẩm.`);
  }
  if(k==='lastDigit'){ // chữ số tận cùng
    const a=ri(23,89),b=ri(3,9);
    const ans=(a*b)%10;
    return qs(`🔍 Tích ${a} × ${b} có chữ số TẬN CÙNG là chữ số nào?`,ans,3,
      `Chỉ cần nhân hàng đơn vị: ${a%10} × ${b} = ${(a%10)*b}, tận cùng là ${ans}. (Kiểm tra: ${a}×${b} = ${a*b} ✓)`);
  }
  // average2: tìm số còn thiếu để đạt trung bình
  const n=3,avg=ri(5,12);
  const v1=avg+ri(-3,3),v2=avg+ri(-3,3);
  const need=avg*n-v1-v2;
  if(need<1)return genAmc(t);
  return qs(`📈 Bạn Mai làm 3 bài kiểm tra, hai bài đầu được ${v1} và ${v2} điểm. Hỏi bài thứ ba phải được mấy điểm để TRUNG BÌNH cả 3 bài đúng bằng ${avg} điểm?`,need,3,
    `Tổng điểm cần có = ${avg} × 3 = ${avg*n}. Hai bài đầu được ${v1} + ${v2} = ${v1+v2}. Bài ba cần: ${avg*n} − ${v1+v2} = ${need} điểm.`);
}


/* ============================================================
   🎓 PHONG CÁCH ĐỀ THI TRƯỜNG CHUYÊN VIỆT NAM
   (Trần Đại Nghĩa, Hà Nội - Amsterdam, các trường chuyên...)
   Tuổi theo tỉ lệ quá khứ · Ca nô xuôi/ngược dòng ·
   Suy luận thứ tự · Vòi nước · Tìm số theo tỉ lệ chữ số
============================================================ */
function genTDN(t){
  const k=pick(t<=3?['orderRank','digit3','ageRatio']
                  :['orderRank','digit3','ageRatio','boatStream','pipeFill','ageDualRatio']);
  if(k==='ageDualRatio'){ // tuổi theo TỈ SỐ hiện tại và TỈ SỐ trong quá khứ (2 điều kiện tỉ số)
    const m=pick([2,3,4,5]), kk=m+pick([1,2,3,4]), y=ri(3,10);
    const denom=kk-m, numerator=y*(kk-1);
    if(numerator%denom!==0)return genTDN(t);
    const x=numerator/denom;
    if(x<=y||x>50)return genTDN(t);
    const dadNow=m*x;
    return qs(`🎓 Năm nay tuổi bố gấp ${m} lần tuổi con. Cách đây ${y} năm, tuổi bố gấp ${kk} lần tuổi con lúc đó. Hỏi năm nay con bao nhiêu tuổi?`,x,3,
      `Gọi tuổi con hiện nay là x thì tuổi bố là ${m}×x. Cách đây ${y} năm: con (x − ${y}) tuổi, bố (${m}x − ${y}) tuổi. Theo đề: ${m}x − ${y} = ${kk} × (x − ${y}). Giải ra: x = ${y}×(${kk}−1) : (${kk}−${m}) = ${y}×${kk-1} : ${denom} = ${x}. Vậy năm nay con ${x} tuổi (bố ${dadNow} tuổi).`);
  }

  if(k==='orderRank'){ // suy luận bắc cầu: xếp thứ tự từ các câu so sánh
    const names=shuffle(['An','Bình','Chi','Dũng','Hà','Khoa','Linh','Minh']).slice(0,4);
    const askTallest=Math.random()<.5;
    const ans=askTallest?names[0]:names[3];
    return {q:`🎓 (Phong cách phỏng vấn Trần Đại Nghĩa) ${names[0]} cao hơn ${names[1]}. ${names[1]} cao hơn ${names[2]}. ${names[2]} cao hơn ${names[3]}. Hỏi ai ${askTallest?'CAO NHẤT':'THẤP NHẤT'}?`,
      small:true,ans,choices:shuffle([...names]),
      exp:`Ghép các câu lại thành một chuỗi: ${names[0]} > ${names[1]} > ${names[2]} > ${names[3]} (về chiều cao). Vậy người ${askTallest?'đứng đầu chuỗi':'đứng cuối chuỗi'} là ${ans}.`};
  }
  if(k==='digit3'){ // tìm số 3 chữ số theo tỉ lệ giữa các hàng
    const d=ri(1,3), hundred=2*d, ones=3*d, sum=6*d;
    const num=hundred*100+d*10+ones;
    return qs(`🎓 Tìm số có 3 CHỮ SỐ, biết: chữ số hàng trăm gấp đôi chữ số hàng chục; chữ số hàng đơn vị bằng tổng chữ số hàng trăm và hàng chục; tổng cả ba chữ số bằng ${sum}. Số đó là số nào?`,num,111,
      `Gọi chữ số hàng chục là ▢, thì hàng trăm là 2×▢ và hàng đơn vị là ▢+2×▢ = 3×▢. Tổng ba chữ số: ▢+2×▢+3×▢ = 6×▢ = ${sum} → ▢ = ${d}. Vậy số đó là ${num}.`);
  }
  if(k==='ageRatio'){ // tuổi theo tỉ lệ ở một thời điểm trong quá khứ (hiệu tuổi không đổi)
    const diff=ri(2,6), m=ri(2,5), gap=diff*(m-1);
    if(gap<12||gap>35)return genTDN(t);
    const y=ri(3,10), c=diff+y;
    if(c<8||c>15)return genTDN(t);
    return qs(`🎓 Hiện nay bố hơn con ${gap} tuổi. Cách đây ${y} năm, tuổi bố gấp ${m} lần tuổi con. Hỏi năm nay con bao nhiêu tuổi?`,c,3,
      `Hiệu tuổi hai bố con LUÔN không đổi = ${gap}. Cách đây ${y} năm, bố gấp ${m} lần con nên hiệu đó ứng với ${m-1} phần tuổi con lúc đó: tuổi con lúc đó = ${gap} : ${m-1} = ${diff}. Vậy con hiện nay: ${diff} + ${y} = ${c} tuổi.`);
  }
  if(k==='boatStream'){ // ca nô xuôi dòng, ngược dòng
    const Vthuc=ri(8,14), Vnuoc=ri(2,4);
    const Vxuoi=Vthuc+Vnuoc, Vnguoc=Vthuc-Vnuoc;
    const distance=Vxuoi*Vnguoc, txuoi=Vnguoc, tnguoc=Vxuoi;
    return qs(`🎓 Một ca nô xuôi dòng từ A đến B dài ${distance} km hết ${txuoi} giờ, rồi ngược dòng từ B về A hết ${tnguoc} giờ. Hỏi vận tốc DÒNG NƯỚC là bao nhiêu km/giờ?`,Vnuoc,2,
      `Vận tốc xuôi dòng = ${distance} : ${txuoi} = ${Vxuoi} km/giờ. Vận tốc ngược dòng = ${distance} : ${tnguoc} = ${Vnguoc} km/giờ. Vận tốc dòng nước = (vận tốc xuôi − vận tốc ngược) : 2 = (${Vxuoi} − ${Vnguoc}) : 2 = ${Vnuoc} km/giờ.`);
  }
  // pipeFill: hai vòi nước cùng chảy
  const triples=[[7,42,6],[8,24,6],[9,18,6],[10,15,6],[12,12,6],[5,20,4],[6,12,4],[8,8,4],[4,12,3],[6,6,3],[3,6,2],[4,4,2]];
  let [a,b,tt]=pick(triples);
  if(Math.random()<.5)[a,b]=[b,a];
  return qs(`🎓 Vòi A chảy một mình thì sau ${a} giờ đầy bể. Vòi B chảy một mình thì sau ${b} giờ đầy bể. Nếu mở CẢ HAI vòi cùng lúc thì sau bao nhiêu giờ đầy bể?`,tt,2,
    `Mỗi giờ vòi A chảy được 1/${a} bể, vòi B chảy được 1/${b} bể. Cả hai vòi cùng chảy mỗi giờ được 1/${a} + 1/${b} = 1/${tt} bể. Vậy sau ${tt} giờ thì đầy bể.`);
}

/* ============================================================
   🌍 CÂU ĐỐ KINH ĐIỂN THẾ GIỚI
   Những bài toán tiểu học nổi tiếng được truyền nhau khắp nơi:
   ếch leo giếng, tháp Hà Nội, qua sông, đong nước, cân đồng xu giả,
   nguyên lý chuồng bồ câu, đếm đường đi ngắn nhất...
============================================================ */
function genWorld(t){
  const k=pick(t<=2?['frog','pigeonMonth','riverCross','coinFake','ladder']
                   :['frog','hanoi','riverCross','waterJug','coinFake','pigeonMonth','paths','ladder','sock3']);

  if(k==='frog'){ // Ếch leo giếng — bài toán kinh điển nhất thế giới
    const up=pick([3,4,5]), slip=up-pick([1,2]), depth=up+(slip>0?slip:1)*ri(3,7);
    const days=Math.ceil((depth-up)/(up-slip))+1;
    return qs(`🐸 Một chú ếch rơi xuống giếng sâu ${depth} m. Ban ngày ếch leo lên được ${up} m, nhưng ban đêm ngủ quên lại tụt xuống ${slip} m. Hỏi sau bao nhiêu NGÀY ếch lên tới miệng giếng?`,days,3,
      `Mỗi ngày đêm ếch chỉ thực sự lên được ${up} − ${slip} = ${up-slip} m. Nhưng vào ngày CUỐI, ếch leo ${up} m là ra khỏi giếng luôn, không tụt nữa! Nên cần leo ${depth} − ${up} = ${depth-up} m theo cách chậm: ${depth-up} : ${up-slip} = ${(depth-up)/(up-slip)} ngày, cộng thêm ngày cuối = ${days} ngày.`);
  }
  if(k==='hanoi'){ // Tháp Hà Nội
    const n=ri(3,t>=4?6:4);
    const ans=Math.pow(2,n)-1;
    return qs(`🗼 Trò chơi Tháp Hà Nội có ${n} chiếc đĩa to nhỏ khác nhau. Mỗi lần chỉ được chuyển 1 đĩa và không được đặt đĩa TO lên trên đĩa NHỎ. Hỏi cần ít nhất bao nhiêu lần chuyển để dời cả tháp sang cọc khác?`,ans,4,
      `Quy luật: 1 đĩa cần 1 lần, 2 đĩa cần 3 lần, 3 đĩa cần 7 lần... mỗi lần thêm 1 đĩa thì số bước GẤP ĐÔI rồi cộng 1. Với ${n} đĩa: 2×2×...×2 (${n} lần) − 1 = ${Math.pow(2,n)} − 1 = ${ans} lần.`);
  }
  if(k==='riverCross'){ // Sói, dê và bắp cải
    return {q:`🚣 Bác nông dân cần đưa một con SÓI, một con DÊ và một cây BẮP CẢI qua sông. Thuyền nhỏ, mỗi lần bác chỉ chở được 1 thứ. Nếu để sói ở lại với dê thì sói ăn dê; để dê ở lại với bắp cải thì dê ăn bắp cải. Hỏi bác phải chèo qua sông ít nhất mấy LƯỢT?`,small:true,
      ans:7,choices:shuffle([5,6,7,9]),
      exp:`Cách làm: đưa DÊ qua (1), quay về (2), đưa SÓI qua (3), chở DÊ về lại (4), đưa BẮP CẢI qua (5), quay về (6), đưa DÊ qua lần nữa (7). Mẹo mấu chốt là được phép CHỞ NGƯỢC con dê về!`};
  }
  if(k==='waterJug'){ // Đong nước
    const pair=pick([[3,5,4],[3,5,1],[5,8,6],[4,7,5],[3,7,2]]);
    const [a,b,goal]=pair;
    return qs(`🥤 Em chỉ có 2 chiếc bình: bình ${a} lít và bình ${b} lít, không có vạch chia. Hỏi có thể đong ra ĐÚNG mấy lít nếu đổ đầy bình ${b} rồi rót sang bình ${a} cho đầy?`,b-a,2,
      `Rót từ bình ${b} lít sang bình ${a} lít cho tới khi bình nhỏ đầy, phần còn lại trong bình lớn là ${b} − ${a} = ${b-a} lít. Đó là mẹo đong nước không cần vạch chia!`);
  }
  if(k==='coinFake'){ // Tìm đồng xu giả bằng cân thăng bằng
    const n=pick([3,9]);
    const ans=n===3?1:2;
    return qs(`⚖️ Có ${n} đồng xu trông y hệt nhau, trong đó 1 đồng GIẢ nhẹ hơn. Em có một chiếc cân thăng bằng (loại 2 đĩa). Hỏi cần cân ít nhất mấy LẦN để chắc chắn tìm ra đồng giả?`,ans,2,
      n===3?`Chia 3 đồng thành 3 nhóm 1 đồng. Đặt 2 đồng lên 2 đĩa: nếu lệch thì bên nhẹ là đồng giả, nếu cân bằng thì đồng còn lại là giả. Chỉ cần 1 lần cân!`
           :`Chia 9 đồng thành 3 nhóm, mỗi nhóm 3 đồng. Lần 1: cân 2 nhóm — tìm ra nhóm chứa đồng giả. Lần 2: lấy nhóm đó cân 2 trong 3 đồng — ra ngay đồng giả. Vậy chỉ cần 2 lần!`);
  }
  if(k==='pigeonMonth'){ // Nguyên lý chuồng bồ câu
    const kind=pick(['month','day']);
    if(kind==='month'){
      return qs(`📅 Trong một nhóm bạn, muốn CHẮC CHẮN có ít nhất 2 bạn sinh cùng một THÁNG thì nhóm đó phải có ít nhất bao nhiêu người?`,13,3,
        `Một năm có 12 tháng. Nếu chỉ có 12 người thì có thể mỗi người một tháng khác nhau. Nhưng người thứ 13 bắt buộc phải trùng tháng với ai đó → cần ít nhất 13 người.`);
    }
    const n=pick([7,12]);
    return qs(`🎨 Trong hộp có rất nhiều bút màu thuộc ${n} màu khác nhau, lẫn lộn. Nhắm mắt lấy ra ít nhất bao nhiêu chiếc để CHẮC CHẮN có 2 chiếc cùng màu?`,n+1,3,
      `Xấu nhất là ${n} chiếc đầu tiên mỗi chiếc một màu khác nhau. Chiếc thứ ${n+1} bắt buộc trùng màu với một chiếc đã lấy → cần ${n+1} chiếc.`);
  }
  if(k==='paths'){ // Đếm đường đi ngắn nhất trên lưới
    const g=pick([[2,2,6],[2,3,10],[3,3,20]]);
    const [w,hh,ans]=g;
    return {q:`🐜 Chú kiến ở góc dưới bên trái muốn tới góc trên bên phải của lưới ${w}×${hh} ô. Kiến chỉ được đi SANG PHẢI hoặc LÊN TRÊN theo các cạnh ô. Hỏi có bao nhiêu đường đi ngắn nhất?`,small:true,
      svg:`<svg viewBox="0 0 ${w*34+20} ${hh*34+20}" width="${Math.min(200,w*34+20)}"><g class="pulseShape">${
        Array.from({length:hh},(_,r)=>Array.from({length:w},(_,c)=>`<rect x="${10+c*34}" y="${10+r*34}" width="34" height="34" fill="#eef6ff" stroke="#2b2350" stroke-width="3"/>`).join('')).join('')
      }</g></svg>`,
      ans,choices:numChoices(ans,4),
      exp:`Ghi số cách đi tới từng nút: nút ở mép dưới và mép trái đều là 1 cách. Mỗi nút khác = số cách của nút BÊN TRÁI cộng nút BÊN DƯỚI. Cộng dần lên tới góc trên phải được ${ans} đường.`};
  }
  if(k==='sock3'){ // Chuồng bồ câu nâng cao: lấy đủ 1 ĐÔI cùng màu với 3 màu
    const c=pick([3,4]);
    return qs(`🧦 Ngăn kéo tối om có tất thuộc ${c} màu khác nhau lẫn lộn. Phải lấy ra ít nhất mấy chiếc để CHẮC CHẮN có được 1 đôi cùng màu?`,c+1,2,
      `Xấu nhất là ${c} chiếc đầu mỗi chiếc một màu. Chiếc thứ ${c+1} chắc chắn trùng màu với một chiếc rồi → ${c+1} chiếc.`);
  }
  // Đồng hồ đánh chuông — bài toán "khoảng cách" kinh điển
  const n1=pick([3,4,5]), sec=pick([2,3,4]);
  const total1=(n1-1)*sec, n2=pick([8,10,12]);
  return qs(`🔔 Một chiếc đồng hồ đánh ${n1} tiếng chuông hết ${total1} giây. Hỏi nó đánh ${n2} tiếng chuông thì hết bao nhiêu giây?`,(n2-1)*sec,4,
    `Bẫy ở chỗ phải đếm KHOẢNG NGHỈ giữa các tiếng chứ không phải số tiếng! ${n1} tiếng có ${n1-1} khoảng, hết ${total1} giây → mỗi khoảng ${total1} : ${n1-1} = ${sec} giây. ${n2} tiếng có ${n2-1} khoảng → ${n2-1} × ${sec} = ${(n2-1)*sec} giây.`);
}

/* ============================================================
   🎨 HÌNH HỌC TRỰC QUAN — nhìn hình mà suy luận
============================================================ */
function genVisual(t){
  const k=pick(t<=2?['solid','symmetry','dice','fold']
                   :['solid','symmetry','dice','fold','oneStroke','area2','angle']);

  if(k==='solid'){ // đặc điểm khối lập phương
    const q=pick([['mặt',6],['cạnh',12],['đỉnh',8]]);
    return {q:`🧊 Hình LẬP PHƯƠNG có bao nhiêu ${q[0]}?`,small:true,
      svg:`<svg viewBox="0 0 150 130" width="140"><g class="pulseShape">
        <polygon points="30,40 90,40 90,100 30,100" fill="#bfe8ff" stroke="#2b2350" stroke-width="4"/>
        <polygon points="30,40 55,18 115,18 90,40" fill="#8fd3ff" stroke="#2b2350" stroke-width="4"/>
        <polygon points="90,40 115,18 115,78 90,100" fill="#6ec1ee" stroke="#2b2350" stroke-width="4"/>
      </g></svg>`,
      ans:q[1],choices:shuffle([4,6,8,12].filter(v=>v!==q[1]).slice(0,3).concat(q[1])),
      exp:`Hình lập phương giống viên xúc xắc: có 6 MẶT vuông, 12 CẠNH và 8 ĐỈNH (góc). Đáp án ${q[0]} là ${q[1]}.`};
  }
  if(k==='symmetry'){ // trục đối xứng
    const sh=pick([['hình vuông','🟦',4],['hình chữ nhật','▭',2],['tam giác đều','🔺',3],['hình tròn','⚪','vô số']]);
    if(sh[2]==='vô số'){
      return {q:`🪞 Hình TRÒN ⚪ có bao nhiêu TRỤC ĐỐI XỨNG (đường gấp đôi lại thì hai nửa trùng khít)?`,small:true,
        ans:'Vô số',choices:shuffle(['1','2','4','Vô số']),
        exp:`Bất kỳ đường thẳng nào đi qua TÂM hình tròn cũng chia nó thành 2 nửa trùng khít. Vẽ được vô số đường như vậy nên hình tròn có VÔ SỐ trục đối xứng.`};
    }
    return {q:`🪞 ${sh[0].charAt(0).toUpperCase()+sh[0].slice(1)} ${sh[1]} có bao nhiêu TRỤC ĐỐI XỨNG (đường gấp đôi lại thì hai nửa trùng khít)?`,small:true,
      ans:sh[2],choices:shuffle([1,2,3,4,6].filter(v=>v!==sh[2]).slice(0,3).concat(sh[2])),
      exp:sh[2]===4?`Hình vuông gấp được theo 2 đường giữa (ngang, dọc) và 2 đường chéo → 4 trục đối xứng.`
          :sh[2]===2?`Hình chữ nhật chỉ gấp được theo 2 đường giữa (ngang và dọc). Đường chéo KHÔNG phải trục đối xứng vì hai nửa không trùng khít → 2 trục.`
          :`Tam giác đều gấp được theo 3 đường, mỗi đường đi từ một đỉnh xuống giữa cạnh đối diện → 3 trục đối xứng.`};
  }
  if(k==='dice'){ // xúc xắc: hai mặt đối diện cộng lại bằng 7
    const face=ri(1,6);
    return qs(`🎲 Trên con xúc xắc, tổng số chấm của HAI MẶT ĐỐI DIỆN luôn bằng 7. Hỏi mặt đối diện với mặt ${face} chấm có mấy chấm?`,7-face,2,
      `Hai mặt đối diện cộng lại bằng 7, nên mặt đối diện với ${face} là 7 − ${face} = ${7-face} chấm.`);
  }
  if(k==='fold'){ // gấp giấy rồi bấm lỗ
    const n=ri(1,t>=3?4:3);
    return qs(`✂️ Một tờ giấy được gấp đôi ${n} lần liên tiếp, rồi bấm 1 lỗ xuyên qua. Mở tờ giấy ra thì có bao nhiêu lỗ?`,Math.pow(2,n),3,
      `Mỗi lần gấp đôi thì số lớp giấy nhân đôi: gấp 1 lần được 2 lớp, 2 lần được 4 lớp... Gấp ${n} lần được ${Math.pow(2,n)} lớp, bấm 1 lỗ xuyên hết → ${Math.pow(2,n)} lỗ.`);
  }
  if(k==='oneStroke'){ // vẽ một nét — đếm đỉnh lẻ
    const shape=pick([['hình vuông có 1 đường chéo',2,true],['hình vuông có 2 đường chéo',4,false],['tam giác',0,true]]);
    return {q:`✏️ Với hình "${shape[0]}", có thể vẽ hết tất cả các nét mà KHÔNG nhấc bút và không tô lại nét nào hai lần không?`,small:true,
      ans:shape[2]?'Có thể':'Không thể',choices:shuffle(['Có thể','Không thể']),
      exp:`Mẹo của nhà toán học Euler: đếm số ĐỈNH LẺ (đỉnh có số nét lẻ nối vào). Hình này có ${shape[1]} đỉnh lẻ. Chỉ vẽ được một nét khi số đỉnh lẻ bằng 0 hoặc bằng 2 → ${shape[2]?'hình này VẼ ĐƯỢC':'hình này KHÔNG vẽ được'}.`};
  }
  if(k==='area2'){ // so sánh diện tích hai hình cùng chu vi
    const a=ri(4,9);
    const sq=a*a, rectW=a+2, rectH=a-2, rect=rectW*rectH;
    return qs(`📐 Hình vuông cạnh ${a} cm và hình chữ nhật ${rectW} × ${rectH} cm có CHU VI bằng nhau. Hỏi diện tích hình vuông LỚN HƠN hình chữ nhật bao nhiêu cm²?`,sq-rect,3,
      `Hình vuông: ${a}×${a} = ${sq} cm². Hình chữ nhật: ${rectW}×${rectH} = ${rect} cm². Chênh lệch ${sq} − ${rect} = ${sq-rect} cm². Điều thú vị: cùng chu vi thì hình vuông luôn có diện tích lớn nhất!`);
  }
  // angle: góc kim đồng hồ
  const hr=pick([3,6,9,2,4]);
  const ang=Math.min(hr,12-hr)*30;
  return qs(`🕐 Lúc đúng ${hr} giờ, hai kim đồng hồ tạo với nhau một góc bao nhiêu ĐỘ?`,ang,30,
    `Mặt đồng hồ có 12 số, cả vòng là 360°, nên mỗi khoảng giờ là 360 : 12 = 30°. Lúc ${hr} giờ hai kim cách nhau ${Math.min(hr,12-hr)} khoảng → ${Math.min(hr,12-hr)} × 30 = ${ang}°.`);
}

/* ============================================================
   🔟 CẢM NHẬN SỐ — dấu hiệu chia hết, số nguyên tố, số La Mã…
============================================================ */
function genNumSense(t){
  const k=pick(t<=2?['roman','div','palin','pyramid']
                   :['roman','div','palin','pyramid','prime','digitCount','crypt']);

  if(k==='roman'){
    const list=[['IV',4],['VI',6],['IX',9],['XI',11],['XIV',14],['XIX',19],['XL',40],['XXIV',24],['LX',60]];
    const [r,v]=pick(t<=2?list.slice(0,5):list);
    return qs(`🏛️ Số La Mã ${r} là số mấy? (I = 1, V = 5, X = 10, L = 50)`,v,5,
      `Quy tắc: chữ nhỏ đứng TRƯỚC chữ lớn thì TRỪ, đứng SAU thì CỘNG. ${r} = ${v}.`);
  }
  if(k==='div'){
    const d=pick([2,3,5,9]);
    let n;
    do{ n=ri(t<=2?20:120, t<=2?99:999); }while(n%d!==0);
    const wrongs=new Set();
    while(wrongs.size<3){const w=n+pick([1,2,-1,-2,3,-3]);if(w>0&&w%d!==0)wrongs.add(w);}
    const rule={2:'chữ số tận cùng là số chẵn',3:'tổng các chữ số chia hết cho 3',
                5:'chữ số tận cùng là 0 hoặc 5',9:'tổng các chữ số chia hết cho 9'}[d];
    const ds=String(n).split('').reduce((a,b)=>a+ +b,0);
    return {q:`🔍 Số nào dưới đây CHIA HẾT cho ${d}?`,small:true,
      ans:n,choices:shuffle([n,...wrongs]),
      exp:`Dấu hiệu chia hết cho ${d}: ${rule}. Với ${n}${d===3||d===9?`: tổng các chữ số là ${ds}, chia hết cho ${d} ✓`:` thì điều đó đúng ✓`}`};
  }
  if(k==='palin'){
    const p=pick([121,232,343,454,565,676,787,898,909,111]);
    const wrongs=new Set();
    while(wrongs.size<3){const w=ri(100,999);if(String(w)!==[...String(w)].reverse().join(''))wrongs.add(w);}
    return {q:`🔁 Số nào đọc XUÔI hay đọc NGƯỢC cũng giống nhau (số đối xứng)?`,small:true,
      ans:p,choices:shuffle([p,...wrongs]),
      exp:`${p} đọc ngược lại vẫn là ${p} nên nó là số đối xứng (palindrome). Các số kia đọc ngược sẽ ra số khác.`};
  }
  if(k==='pyramid'){ // kim tự tháp số: mỗi ô = tổng 2 ô dưới
    const a=ri(1,9),b=ri(1,9),c=ri(1,9);
    const ab=a+b, bc=b+c, top=ab+bc;
    const hide=pick(['top','mid']);
    const ans=hide==='top'?top:ab;
    const cell=(v,q)=>`<div class="magiccell${q?' qm':''}">${q?'❓':v}</div>`;
    const html=`<div style="display:inline-flex;flex-direction:column;gap:5px;align-items:center">
      <div style="display:flex;gap:5px">${cell(top,hide==='top')}</div>
      <div style="display:flex;gap:5px">${cell(ab,hide==='mid')}${cell(bc)}</div>
      <div style="display:flex;gap:5px">${cell(a)}${cell(b)}${cell(c)}</div>
    </div>`;
    return {q:`🧱 Kim tự tháp số: mỗi viên gạch bằng TỔNG hai viên ngay bên dưới nó. Số ở ô ❓ là mấy?`,small:true,
      svg:html,ans,choices:numChoices(ans,4),
      exp:hide==='top'?`Hàng giữa: ${a}+${b} = ${ab} và ${b}+${c} = ${bc}. Đỉnh tháp = ${ab} + ${bc} = ${top}.`
                      :`Ô ❓ nằm trên hai viên ${a} và ${b} nên bằng ${a} + ${b} = ${ab}. (Kiểm tra: ${ab} + ${bc} = ${top} ✓)`};
  }
  if(k==='prime'){
    const primes=[11,13,17,19,23,29,31,37,41,43];
    const p=pick(primes);
    const wrongs=new Set();
    while(wrongs.size<3){const w=ri(10,49);if(!primes.includes(w)&&w!==p&&(w%2===0||w%3===0||w%5===0))wrongs.add(w);}
    return {q:`🔢 Số nào là số NGUYÊN TỐ (chỉ chia hết cho 1 và chính nó)?`,small:true,
      ans:p,choices:shuffle([p,...wrongs]),
      exp:`${p} chỉ chia hết cho 1 và ${p} nên là số nguyên tố. Các số còn lại đều chia hết cho một số khác nữa (2, 3 hoặc 5).`};
  }
  if(k==='digitCount'){
    const upto=pick([20,30,50]);
    let cnt=0;
    for(let i=1;i<=upto;i++)cnt+=String(i).split('').filter(c=>c==='1').length;
    return qs(`🔎 Viết liền các số từ 1 đến ${upto}. Hỏi chữ số 1 xuất hiện bao nhiêu lần?`,cnt,4,
      `Đếm ở hàng đơn vị: 1, 11, 21... Đếm ở hàng chục: 10–19 có 10 số đều bắt đầu bằng 1. Cộng lại được ${cnt} lần.`);
  }
  // crypt: mật mã chữ số
  const A=ri(1,4),B=ri(1,4);
  const two=A*10+B, rev=B*10+A;
  return qs(`🔐 Số có 2 chữ số ${two}, viết ngược lại thành ${rev}. Hỏi TỔNG của hai số đó bằng bao nhiêu?`,two+rev,8,
    `${two} + ${rev} = ${two+rev}. Điều thú vị: tổng luôn bằng (${A}+${B}) × 11 = ${A+B} × 11 = ${two+rev}!`);
}

/* ============================================================
   🎲 XÁC SUẤT & TẬP HỢP
============================================================ */
function genChance(t){
  const k=pick(t<=2?['venn','marble','dieFace']:['venn','marble','dieFace','sum7','spinner']);

  if(k==='venn'){
    const both=ri(2,6), onlyA=ri(3,9), onlyB=ri(3,9), neither=ri(1,6);
    const total=both+onlyA+onlyB+neither;
    const A=onlyA+both, B=onlyB+both;
    const ask=pick(['neither','both']);
    if(ask==='neither'){
      return qs(`⚽🏀 Lớp có ${total} bạn: ${A} bạn thích bóng đá, ${B} bạn thích bóng rổ, trong đó ${both} bạn thích CẢ HAI. Hỏi có bao nhiêu bạn KHÔNG thích môn nào?`,neither,3,
        `Số bạn thích ít nhất một môn = ${A} + ${B} − ${both} = ${A+B-both} (phải trừ ${both} vì các bạn thích cả hai đã bị đếm 2 lần). Vậy số bạn không thích môn nào = ${total} − ${A+B-both} = ${neither}.`);
    }
    return qs(`⚽🏀 Lớp có ${total} bạn: ${A} bạn thích bóng đá, ${B} bạn thích bóng rổ, ${neither} bạn không thích môn nào. Hỏi bao nhiêu bạn thích CẢ HAI môn?`,both,3,
      `Số bạn thích ít nhất một môn = ${total} − ${neither} = ${total-neither}. Mà ${A} + ${B} = ${A+B}, nhiều hơn ${total-neither} đúng ${both} — đó chính là số bạn bị đếm hai lần, tức số bạn thích cả hai = ${both}.`);
  }
  if(k==='marble'){
    const r=ri(3,8), b=ri(3,8);
    return qs(`🔴🔵 Túi có ${r} viên bi đỏ và ${b} viên bi xanh. Nhắm mắt lấy ra ít nhất mấy viên để CHẮC CHẮN có 1 viên bi ĐỎ?`,b+1,3,
      `Xui nhất là lấy trúng cả ${b} viên xanh trước. Viên tiếp theo bắt buộc phải là bi đỏ → cần lấy ${b} + 1 = ${b+1} viên.`);
  }
  if(k==='dieFace'){
    const target=ri(1,6);
    return {q:`🎲 Gieo một con xúc xắc 6 mặt. Khả năng ra mặt ${target} chấm là mấy phần?`,small:true,
      ans:'1 phần 6',choices:shuffle(['1 phần 6','1 phần 2','1 phần 3','6 phần 1']),
      exp:`Xúc xắc có 6 mặt như nhau, mặt ${target} chỉ là 1 trong 6 khả năng → cơ hội là 1 phần 6.`};
  }
  if(k==='sum7'){
    return qs(`🎲🎲 Gieo hai con xúc xắc rồi cộng số chấm. Hỏi có bao nhiêu cách để tổng bằng 7?`,6,3,
      `Liệt kê: 1+6, 2+5, 3+4, 4+3, 5+2, 6+1 → 6 cách. (Tổng 7 là tổng dễ ra nhất khi gieo 2 xúc xắc đấy!)`);
  }
  const parts=pick([4,6,8]);
  const red=ri(1,parts-1);
  return qs(`🎡 Vòng quay may mắn chia thành ${parts} ô bằng nhau, trong đó ${red} ô màu đỏ. Nếu quay ${parts} lần thì TRUNG BÌNH kim dừng ở ô đỏ mấy lần?`,red,2,
    `Mỗi lần quay, cơ hội trúng ô đỏ là ${red} phần ${parts}. Quay ${parts} lần thì trung bình trúng đỏ ${red} lần.`);
}


/* ============================================================
   🎓 CẤP ĐỘ 5 — NỘI DUNG LỚP 5
   Phân số · Số thập phân · Tỉ số phần trăm · Diện tích hình
   tam giác/thang · Thể tích · Vận tốc–quãng đường–thời gian
============================================================ */
function gcd(a,b){return b?gcd(b,a%b):a}
function fracStr(n,d){const g=gcd(n,d);return `${n/g}/${d/g}`}
/* format số thập phân 2 chữ số, bỏ số 0 thừa, dùng dấu phẩy (dùng cho π×...) */
function fmtDec(v){let s=v.toFixed(2);while(s.endsWith('0'))s=s.slice(0,-1);if(s.endsWith('.'))s=s.slice(0,-1);return s.replace('.',',');}
/* nhặt 3 đáp án nhiễu duy nhất từ danh sách ứng viên, bù thêm bằng fallback nếu thiếu */
function pad3(ans,cands,fallback){
  const out=[];
  for(const c of cands){if(c!==ans&&!out.includes(c))out.push(c);if(out.length===3)break;}
  let k=1;
  while(out.length<3){const c=fallback(k++);if(c!==ans&&!out.includes(c))out.push(c)}
  return out;
}

/* ---- ½ Phân số ---- */
function genFraction(t){
  const k=pick(['addSame','addDiff','ofNumber','compare','simplify','mulInt']);
  if(k==='addSame'){
    const d=pick([4,5,6,8,10,12]);
    const a=ri(1,d-2), b=ri(1,d-a-1);
    const ans=fracStr(a+b,d);
    const wrongs=new Set([fracStr(a+b,d*2),fracStr(a+b+1,d),fracStr(a*b,d)]);
    const arr=[...wrongs].filter(v=>v!==ans).slice(0,3);
    while(arr.length<3)arr.push(fracStr(a+b+arr.length+1,d));
    return {q:`🍕 Tính: ${a}/${d} + ${b}/${d} = ?`,small:true,ans,choices:shuffle([ans,...arr]),
      exp:`Hai phân số CÙNG MẪU SỐ thì chỉ cộng tử số, giữ nguyên mẫu: (${a}+${b})/${d} = ${a+b}/${d}${fracStr(a+b,d)!==`${a+b}/${d}`?` = ${ans} (rút gọn)`:''}.`};
  }
  if(k==='addDiff'){
    const pairs=[[1,2,1,4,'3/4'],[1,2,1,3,'5/6'],[1,3,1,6,'1/2'],[1,4,1,4,'1/2'],[2,3,1,6,'5/6'],[1,2,1,6,'2/3'],[3,4,1,8,'7/8']];
    const [a,b,c,d,ans]=pick(pairs);
    const wrongs=['2/6','2/5','1/6','4/6','5/8','2/3','3/4','1/2'].filter(v=>v!==ans);
    return {q:`🍰 Tính: ${a}/${b} + ${c}/${d} = ?`,small:true,ans,
      choices:shuffle([ans,...shuffle(wrongs).slice(0,3)]),
      exp:`Quy đồng mẫu số rồi cộng tử số. ${a}/${b} + ${c}/${d} = ${ans}.`};
  }
  if(k==='ofNumber'){
    const d=pick([2,3,4,5]), n=ri(1,d-1), unit=ri(3,12);
    const total=d*unit, ans=n*unit;
    return qs(`🍎 Rổ có ${total} quả táo. Bé lấy ${n}/${d} số táo đó. Hỏi bé lấy mấy quả?`,ans,4,
      `Chia ${total} thành ${d} phần bằng nhau: mỗi phần ${total} : ${d} = ${unit} quả. Lấy ${n} phần: ${n} × ${unit} = ${ans} quả.`);
  }
  if(k==='compare'){
    const opts=[['1/2','1/3','1/2'],['2/3','3/4','3/4'],['3/5','1/2','3/5'],['1/4','2/5','2/5'],['5/6','4/5','5/6']];
    const [x,y,bigger]=pick(opts);
    return {q:`⚖️ Phân số nào LỚN HƠN: ${x} hay ${y}?`,small:true,ans:bigger,
      choices:shuffle([x,y]),
      exp:`Quy đồng để so sánh: ${bigger} lớn hơn. (Mẹo: khi tử số bằng nhau thì mẫu càng NHỎ phân số càng LỚN.)`};
  }
  if(k==='simplify'){
    const g=pick([2,3,4,5]), a=ri(1,6), b=a+ri(1,5);
    const ans=fracStr(a,b), full=`${a*g}/${b*g}`;
    const wrongs=[`${a*g}/${b}`,`${a}/${b*g}`,fracStr(a+1,b+1)].filter(v=>v!==ans);
    return {q:`✂️ Rút gọn phân số ${full} về dạng tối giản:`,small:true,ans,
      choices:shuffle([ans,...wrongs.slice(0,3)]),
      exp:`Chia cả tử và mẫu cho ${g}: ${a*g}:${g} = ${a} và ${b*g}:${g} = ${b} → ${ans}.`};
  }
  const d=pick([2,3,4,5]), n=ri(1,d-1), m=d*ri(2,6);
  return qs(`🔢 Tính: ${n}/${d} × ${m} = ?`,n*m/d,4,
    `Lấy ${m} chia cho mẫu số ${d} được ${m/d}, rồi nhân với tử số ${n}: ${m/d} × ${n} = ${n*m/d}.`);
}

/* ---- 0,5 Số thập phân ---- */
function genDecimal(t){
  const k=pick(['add','sub','mulInt','compare','toFrac']);
  // luôn có phần thập phân khác 0 để đúng chất "số thập phân"
  const d1=(min,max)=>{let v;do{v=ri(min,max)}while(v%10===0);return v/10};
  // đáp án nhiễu cũng phải có phần thập phân khác 0, nếu không trẻ sẽ
  // nhận ra ngay "cái nào trông khác" mà loại trừ chứ không cần tính
  const pick3=(ansStr,cands,fallback)=>{
    const out=[];
    for(const c of cands){
      if(c!==ansStr&&!/,0$/.test(c)&&!out.includes(c)&&!/^-/.test(c))out.push(c);
      if(out.length===3)return out;
    }
    let k=1;
    while(out.length<3){const c=fallback(k++);if(c!==ansStr&&!/,0$/.test(c)&&!out.includes(c))out.push(c)}
    return out;
  };
  const fmt=v=>v.toFixed(1).replace('.',',');
  const fmt2=v=>v.toFixed(2).replace('.',',');
  if(k==='add'){
    let a=d1(11,89), b=d1(11,89);
    while((Math.round(a*10)+Math.round(b*10))%10===0)b=d1(11,89);
    const ans=fmt(a+b);
    const wr=pick3(ans,[fmt(a+b+1),fmt(a+b-1),fmt(a+b+0.2),fmt(a+b-0.2),fmt(a+b+2)],k=>fmt(a+b+k*0.3));
    return {q:`➕ Tính: ${fmt(a)} + ${fmt(b)} = ?`,small:true,ans,choices:shuffle([ans,...wr]),
      exp:`Đặt tính sao cho dấu phẩy thẳng hàng rồi cộng như số tự nhiên: ${fmt(a)} + ${fmt(b)} = ${ans}.`};
  }
  if(k==='sub'){
    let a=d1(50,99), b=d1(11,49);
    while((Math.round(a*10)-Math.round(b*10))%10===0)b=d1(11,49);
    const ans=fmt(a-b);
    const wr=pick3(ans,[fmt(a-b+1),fmt(a-b-1),fmt(a-b+0.2),fmt(a-b-0.2),fmt(a-b+2)],k=>fmt(a-b+k*0.3));
    return {q:`➖ Tính: ${fmt(a)} − ${fmt(b)} = ?`,small:true,ans,choices:shuffle([ans,...wr]),
      exp:`Viết dấu phẩy thẳng cột rồi trừ như số tự nhiên: ${fmt(a)} − ${fmt(b)} = ${ans}.`};
  }
  if(k==='mulInt'){
    let a=d1(12,49), b=ri(2,6);
    while((Math.round(a*10)*b)%10===0)a=d1(12,49);
    const ans=fmt(a*b);
    const wr=pick3(ans,[fmt(a*b+1),fmt(a*b-1),fmt(a*b+0.2),fmt(a*b-0.2),fmt(a*b+2),fmt(a*b-2)],k=>fmt(a*b+k*0.3));
    return {q:`✖️ Tính: ${fmt(a)} × ${b} = ?`,small:true,ans,choices:shuffle([ans,...wr]),
      exp:`Nhân như số tự nhiên: ${Math.round(a*10)} × ${b} = ${Math.round(a*10*b)}, rồi đặt lại dấu phẩy 1 chữ số từ phải sang: ${ans}.`};
  }
  if(k==='compare'){
    const a=d1(10,99);
    let b10;do{b10=Math.round(a*10)+pick([-3,-1,1,3])}while(b10%10===0||b10<10);
    const b=b10/10;
    const ans=a>b?fmt(a):fmt(b);
    return {q:`⚖️ Số nào LỚN HƠN: ${fmt(a)} hay ${fmt(b)}?`,small:true,ans,choices:shuffle([fmt(a),fmt(b)]),
      exp:`So phần nguyên trước, nếu bằng nhau thì so tiếp phần thập phân: ${ans} lớn hơn.`};
  }
  const pairs=[['1/2','0,5'],['1/4','0,25'],['3/4','0,75'],['1/5','0,2'],['2/5','0,4'],['1/10','0,1'],['3/10','0,3']];
  const [fr,dec]=pick(pairs);
  const wr=['0,5','0,25','0,75','0,2','0,4','0,1','0,3'].filter(v=>v!==dec);
  return {q:`🔄 Phân số ${fr} viết dưới dạng số thập phân là bao nhiêu?`,small:true,ans:dec,
    choices:shuffle([dec,...shuffle(wr).slice(0,3)]),
    exp:`Lấy tử chia mẫu: ${fr} = ${dec}.`};
}

/* ---- % Tỉ số phần trăm ---- */
function genPercent(t){
  const k=pick(['of','find','discount','increase']);
  if(k==='of'){
    const p=pick([10,20,25,50,75]), base=p===25||p===75?ri(2,12)*4:p===20?ri(2,12)*5:p===10?ri(2,15)*10:ri(3,20)*2;
    const ans=base*p/100;
    return qs(`💯 Trường có ${base} học sinh, trong đó ${p}% là học sinh giỏi. Hỏi có bao nhiêu học sinh giỏi?`,ans,4,
      `${p}% của ${base} = ${base} × ${p} : 100 = ${ans} học sinh.`);
  }
  if(k==='find'){
    const total=pick([20,25,40,50]), part=total*pick([10,20,25,50])/100;
    const ans=part/total*100;
    return qs(`💯 Lớp có ${total} bạn, trong đó ${part} bạn đeo kính. Hỏi số bạn đeo kính chiếm bao nhiêu PHẦN TRĂM cả lớp?`,ans,10,
      `Tỉ số phần trăm = ${part} : ${total} × 100 = ${ans}%.`);
  }
  if(k==='discount'){
    const p=pick([10,20,25,50]);
    // giá luôn chia hết cho % để tiền giảm là số nguyên
    const price=p===25?ri(1,10)*20:ri(2,20)*10;
    const ans=price-price*p/100;
    return qs(`🏷️ Một món đồ giá ${price} nghìn đồng được giảm giá ${p}%. Hỏi phải trả bao nhiêu nghìn đồng?`,ans,10,
      `Số tiền giảm = ${price} × ${p} : 100 = ${price*p/100} nghìn. Còn phải trả ${price} − ${price*p/100} = ${ans} nghìn.`);
  }
  const p=pick([10,20,25,50]);
  const base=p===25?pick([20,40,80,100,120]):pick([20,40,50,80,100]);
  const ans=base+base*p/100;
  return qs(`📈 Năm ngoái vườn thu được ${base} kg cam, năm nay tăng ${p}% so với năm ngoái. Hỏi năm nay thu được bao nhiêu kg?`,ans,10,
    `Phần tăng thêm = ${base} × ${p} : 100 = ${base*p/100} kg. Năm nay: ${base} + ${base*p/100} = ${ans} kg.`);
}

/* ---- 📐 Hình học lớp 5: tam giác, hình thang, thể tích ---- */
function genGeo5(t){
  const k=pick(['tri','trap','box','circleD','circlePeri','circleArea','paintedCube','semicircleOverlap']);
  if(k==='paintedCube'){ // khối lập phương lớn sơn ngoài — đếm khối nhỏ KHÔNG bị sơn
    const n=pick([3,4,5]);
    const ans=Math.pow(n-2,3);
    return {q:`🧊 Một khối gỗ lập phương lớn ${n}×${n}×${n} được ghép từ ${n*n*n} khối lập phương nhỏ 1×1×1. Người ta sơn đỏ toàn bộ các mặt bên ngoài của khối lớn. Hỏi có bao nhiêu khối nhỏ KHÔNG bị dính sơn mặt nào?`,small:true,
      svg:`<svg viewBox="0 0 150 130" width="140"><g class="pulseShape">
        <polygon points="30,40 90,40 90,100 30,100" fill="#ffb3b3" stroke="#2b2350" stroke-width="4"/>
        <polygon points="30,40 55,18 115,18 90,40" fill="#ff8a8a" stroke="#2b2350" stroke-width="4"/>
        <polygon points="90,40 115,18 115,78 90,100" fill="#ff6f6f" stroke="#2b2350" stroke-width="4"/>
      </g></svg>`,
      ans,choices:numChoices(ans,Math.max(2,n)),
      exp:`Chỉ những khối nhỏ nằm HOÀN TOÀN BÊN TRONG (không đụng mặt ngoài nào) mới không dính sơn. Đó là khối con nhỏ hơn tạo bởi việc "lùi vào" 1 lớp mỗi phía: kích thước (${n}−2)×(${n}−2)×(${n}−2) = ${n-2}×${n-2}×${n-2} = ${ans} khối.`};
  }
  if(k==='semicircleOverlap'){ // 2 nửa hình tròn đường kính = 2 cạnh kề của hình vuông, chồng lên nhau
    const a=2*ri(3,10), r=a/2;
    const ans=fmtDec(r*r*(3.14/2-1));
    const wrongs=pad3(ans,[fmtDec(r*r*3.14/4),fmtDec(a*a*0.1),fmtDec(r*r*(3.14-2))],k2=>fmtDec(r*r*(3.14/2-1)+k2*0.5));
    return {q:`⭕ Hình vuông ABCD cạnh ${a} cm. Vẽ hai nửa hình tròn nằm TRONG hình vuông, có đường kính lần lượt là AB và AD. Tính diện tích phần hai nửa hình tròn CHỒNG LÊN NHAU (lấy π ≈ 3,14).`,small:true,
      svg:`<svg viewBox="0 0 130 130" width="120"><g class="pulseShape">
        <rect x="10" y="10" width="100" height="100" fill="#eef6ff" stroke="#2b2350" stroke-width="3"/>
        <path d="M10 10 A50 50 0 0 1 60 60 A50 50 0 0 1 10 10 Z" fill="#ffd6e0" stroke="#2b2350" stroke-width="2"/>
      </g></svg>`,
      ans,choices:shuffle([ans,...wrongs]),
      exp:`Gọi bán kính r = ${a}:2 = ${r} cm. Hai tâm nửa hình tròn là trung điểm AB và AD, cách đỉnh A đúng ${r} cm và vuông góc nhau, nên góc ở tâm chắn phần giao là 90°. Phần chung gồm 2 "viên phân" bằng nhau, mỗi viên phân = (1/2)×r²×(π/2 − 1). Diện tích chung = r²×(π/2 − 1) = ${r}×${r}×(${(3.14/2).toFixed(2)} − 1) = ${ans} cm².`};
  }
  if(k==='tri'){
    const b=ri(3,9)*2, hh=ri(3,9);
    const ans=b*hh/2;
    return {q:`📐 Hình TAM GIÁC có đáy ${b} cm và chiều cao ${hh} cm. Tính diện tích (cm²).`,small:true,
      svg:`<svg viewBox="0 0 190 130" width="180"><g class="pulseShape">
        <polygon points="25,105 165,105 95,20" fill="#ffd6e0" stroke="#2b2350" stroke-width="4"/>
        <line x1="95" y1="20" x2="95" y2="105" stroke="#2b2350" stroke-width="3" stroke-dasharray="6 5"/>
      </g>
      <text x="95" y="125" font-size="13" font-weight="bold" text-anchor="middle" fill="#2b2350">đáy ${b} cm</text>
      <text x="104" y="65" font-size="13" font-weight="bold" fill="#2b2350">${hh}</text></svg>`,
      ans,choices:numChoices(ans,6),
      exp:`Diện tích tam giác = đáy × chiều cao : 2 = ${b} × ${hh} : 2 = ${ans} cm².`};
  }
  if(k==='trap'){
    const a=ri(3,8), b=a+ri(2,6), hh=ri(2,8)*2/2*2;
    const H=ri(2,5)*2;
    const ans=(a+b)*H/2;
    return {q:`📐 Hình THANG có đáy bé ${a} cm, đáy lớn ${b} cm, chiều cao ${H} cm. Tính diện tích (cm²).`,small:true,
      svg:`<svg viewBox="0 0 200 130" width="190"><g class="pulseShape">
        <polygon points="55,25 145,25 175,100 25,100" fill="#d9f2c4" stroke="#2b2350" stroke-width="4"/>
        <line x1="100" y1="25" x2="100" y2="100" stroke="#2b2350" stroke-width="3" stroke-dasharray="6 5"/>
      </g>
      <text x="100" y="18" font-size="12" font-weight="bold" text-anchor="middle" fill="#2b2350">${a} cm</text>
      <text x="100" y="119" font-size="12" font-weight="bold" text-anchor="middle" fill="#2b2350">${b} cm</text>
      <text x="108" y="66" font-size="12" font-weight="bold" fill="#2b2350">${H}</text></svg>`,
      ans,choices:numChoices(ans,8),
      exp:`Diện tích hình thang = (đáy bé + đáy lớn) × chiều cao : 2 = (${a} + ${b}) × ${H} : 2 = ${ans} cm².`};
  }
  if(k==='box'){
    const a=ri(2,8), b=ri(2,7), c=ri(2,6);
    return {q:`📦 Hình HỘP CHỮ NHẬT dài ${a} cm, rộng ${b} cm, cao ${c} cm. Tính THỂ TÍCH (cm³).`,small:true,
      svg:`<svg viewBox="0 0 160 130" width="150"><g class="pulseShape">
        <polygon points="25,45 95,45 95,105 25,105" fill="#cfe6ff" stroke="#2b2350" stroke-width="4"/>
        <polygon points="25,45 55,22 125,22 95,45" fill="#a8d4f7" stroke="#2b2350" stroke-width="4"/>
        <polygon points="95,45 125,22 125,82 95,105" fill="#87bff0" stroke="#2b2350" stroke-width="4"/>
      </g></svg>`,
      ans:a*b*c,choices:numChoices(a*b*c,10),
      exp:`Thể tích hình hộp chữ nhật = dài × rộng × cao = ${a} × ${b} × ${c} = ${a*b*c} cm³.`};
  }
  if(k==='circleD'){
    const r=ri(2,9);
    return qs(`⭕ Hình tròn có bán kính ${r} cm. Hỏi ĐƯỜNG KÍNH dài bao nhiêu cm?`,r*2,3,
      `Đường kính = 2 × bán kính = 2 × ${r} = ${r*2} cm.`);
  }
  if(k==='circlePeri'){
    const r=ri(2,15), d=r*2;
    const ans=fmtDec(d*3.14);
    const wrongs=pad3(ans,[fmtDec(r*3.14),fmtDec(d*3),fmtDec(d*3.14+3.14)],k2=>fmtDec(d*3.14+k2*0.5));
    return {q:`⭕ Hình tròn có bán kính ${r} cm. Tính CHU VI hình tròn (lấy π ≈ 3,14).`,small:true,ans,
      choices:shuffle([ans,...wrongs]),
      exp:`Chu vi = đường kính × π = (${r}×2) × 3,14 = ${d} × 3,14 = ${ans} cm. (Nhớ nhân ĐƯỜNG KÍNH chứ không phải bán kính!)`};
  }
  const r=ri(2,15);
  const ans=fmtDec(r*r*3.14);
  const wrongs=pad3(ans,[fmtDec(r*2*3.14),fmtDec(r*3.14),fmtDec(r*r*3)],k2=>fmtDec(r*r*3.14+k2*0.5));
  return {q:`⭕ Hình tròn có bán kính ${r} cm. Tính DIỆN TÍCH hình tròn (lấy π ≈ 3,14).`,small:true,ans,
    choices:shuffle([ans,...wrongs]),
    exp:`Diện tích = bán kính × bán kính × π = ${r} × ${r} × 3,14 = ${ans} cm². (Đừng nhầm với chu vi!)`};
}

/* ---- 🚗 Vận tốc – quãng đường – thời gian ---- */
function genSpeed(t){
  const k=pick(['dist','speed','time','meet','catchup']);
  const v=pick([4,5,6,8,10,12,15,20,30,40,60]);
  if(k==='dist'){
    const h=ri(2,5);
    return qs(`🚗 Một ô tô đi với vận tốc ${v} km/giờ trong ${h} giờ. Hỏi ô tô đi được bao nhiêu km?`,v*h,10,
      `Quãng đường = vận tốc × thời gian = ${v} × ${h} = ${v*h} km.`);
  }
  if(k==='speed'){
    const h=ri(2,5), s=v*h;
    return qs(`🚴 Bạn Nam đi xe đạp ${s} km hết ${h} giờ. Hỏi vận tốc của bạn là bao nhiêu km/giờ?`,v,5,
      `Vận tốc = quãng đường : thời gian = ${s} : ${h} = ${v} km/giờ.`);
  }
  if(k==='time'){
    const h=ri(2,6), s=v*h;
    return qs(`🚶 Đi bộ với vận tốc ${v} km/giờ thì hết bao nhiêu GIỜ để đi được ${s} km?`,h,3,
      `Thời gian = quãng đường : vận tốc = ${s} : ${v} = ${h} giờ.`);
  }
  if(k==='meet'){
    const v1=pick([4,5,6]), v2=pick([8,10,12]), h=ri(2,4);
    const s=(v1+v2)*h;
    return qs(`🚙🚕 Hai xe xuất phát cùng lúc từ hai đầu quãng đường dài ${s} km và đi ngược chiều nhau. Xe A đi ${v1} km/giờ, xe B đi ${v2} km/giờ. Hỏi sau bao nhiêu GIỜ hai xe gặp nhau?`,h,2,
      `Mỗi giờ hai xe cùng nhau đi được ${v1} + ${v2} = ${v1+v2} km. Thời gian gặp nhau = ${s} : ${v1+v2} = ${h} giờ.`);
  }
  // catchup: chuyển động cùng chiều, đuổi kịp
  const v1=pick([20,25,30,35,40]), h1=ri(1,3);
  const v2=v1+pick([10,15,20,25,30]);
  const gap=v1*h1, diff=v2-v1;
  if(gap%diff!==0)return genSpeed(t);
  const catchTime=gap/diff;
  if(catchTime<1||catchTime>8)return genSpeed(t);
  return qs(`🏍️🚗 Một xe máy xuất phát từ A với vận tốc ${v1} km/giờ. Đi được ${h1} giờ thì một ô tô cũng xuất phát từ A, đuổi theo cùng hướng với vận tốc ${v2} km/giờ. Hỏi sau bao nhiêu GIỜ (kể từ lúc ô tô xuất phát) thì ô tô đuổi kịp xe máy?`,catchTime,2,
    `Khi ô tô xuất phát, xe máy đã đi trước ${gap} km (= ${v1} × ${h1}). Mỗi giờ ô tô rút ngắn khoảng cách ${diff} km (= ${v2} − ${v1}). Thời gian đuổi kịp = ${gap} : ${diff} = ${catchTime} giờ.`);
}

/* ---- 📏 Đổi đơn vị đo (độ dài, khối lượng, thời gian, dung tích) ---- */
const UNIT_TABLE=[
  ['km','m',1000],['m','dm',10],['m','cm',100],['m','mm',1000],['dm','cm',10],['cm','mm',10],
  ['tấn','kg',1000],['tạ','kg',100],['yến','kg',10],['kg','g',1000],['kg','hg',10],
  ['giờ','phút',60],['phút','giây',60],['ngày','giờ',24],['năm','tháng',12],['tuần','ngày',7],
  ['lít','ml',1000],
];
function genUnit(t){
  const [big,small,factor]=pick(UNIT_TABLE);
  const n=ri(2,12);
  if(Math.random()<.6){
    const ans=n*factor;
    return qs(`📏 Đổi: ${n} ${big} = ? ${small}`,ans,Math.max(2,Math.round(factor*0.1)),
      `1 ${big} = ${factor} ${small}, nên ${n} ${big} = ${n} × ${factor} = ${ans} ${small}.`);
  }
  const total=n*factor;
  return qs(`📏 Đổi: ${total} ${small} = ? ${big}`,n,2,
    `${factor} ${small} = 1 ${big}, nên ${total} ${small} = ${total} : ${factor} = ${n} ${big}.`);
}

/* ---- 📊 Tổng-Tỉ / Hiệu-Tỉ (toán điển hình lớp 4-5) ---- */
function genSumRatio(t){
  const pairs=[[1,2],[1,3],[2,3],[1,4],[3,4],[2,5],[3,5],[1,5],[4,5],[2,7],[3,7],[4,7]];
  const [r1,r2]=pick(pairs);
  const unit=ri(3,t>=4?20:12);
  const small=r1*unit, big=r2*unit;
  const askBig=Math.random()<.5;
  const kids=['An','Bình','Chi','Dũng'];
  const A=pick(kids);let B=pick(kids);while(B===A)B=pick(kids);
  if(Math.random()<.5){
    const total=small+big;
    return qs(`📊 ${A} và ${B} có tổng cộng ${total} viên bi. Tỉ số giữa số bi của ${A} và ${B} là ${r1} : ${r2} (${A} có ít hơn). Hỏi bạn ${askBig?B:A} có bao nhiêu viên bi?`,askBig?big:small,unit,
      `Tổng số phần bằng nhau: ${r1} + ${r2} = ${r1+r2} phần. Giá trị 1 phần = ${total} : ${r1+r2} = ${unit}. Số bi của ${A} = ${unit}×${r1} = ${small}, của ${B} = ${unit}×${r2} = ${big}.`);
  }
  const diff=big-small;
  return qs(`📊 ${A} có nhiều hơn ${B} ${diff} viên bi. Tỉ số giữa số bi của ${B} và ${A} là ${r1} : ${r2}. Hỏi bạn ${askBig?A:B} có bao nhiêu viên bi?`,askBig?big:small,unit,
    `Hiệu số phần bằng nhau: ${r2} − ${r1} = ${r2-r1} phần. Giá trị 1 phần = ${diff} : ${r2-r1} = ${unit}. Số bi của ${B} = ${unit}×${r1} = ${small}, của ${A} = ${unit}×${r2} = ${big}.`);
}

/* ============================================================
   🇸🇬 TOÁN TƯ DUY SINGAPORE LỚP 3
   Biên soạn từ các bài người dùng cung cấp và các dạng chuyên đề công khai:
   quy luật, trồng cây, đếm, tính ngược, thay thế và IQ. Các bài trùng đã
   được khử; hai phép chữ số vô nghiệm được giữ như câu bẫy logic.
============================================================ */
const SINGAPORE3_LEVEL_KINDS={
  1:['stairCubes','matchstickTerm','lineTreesBothEnds','lineTreeSpacing','oneEndTrees'],
  2:['stairCubes','matchstickTerm','snailWell','circleRoses','calendarAfterDays','leapCalendar','seriesCount','lineTreesBothEnds'],
  3:['circleRoses','calendarAfterDays','calendarNextYear','leapCalendar','triangleBDE','lastDigit2023','groupGift','snailWell'],
  4:['ratioProducts','aaAbaTrap','calendarNextYear','lastDigit2023','triangleBDE','groupGift','rectangleIntersection','circleRoses'],
  5:['ratioProducts','aaAbaTrap','abBaCccTrap','calendarNextYear','lastDigit2023','triangleBDE','groupGift','rectangleIntersection'],
};
const SINGAPORE3_KINDS=[...new Set(Object.values(SINGAPORE3_LEVEL_KINDS).flat())];

function markSingapore(kind,question){question.sgKind=kind;return question}
function singaporeNumber(kind,text,ans,spread,exp){return markSingapore(kind,qs(text,ans,spread,exp))}
function singaporeCustom(kind,text,ans,choices,exp,acceptedAnswers=[]){
  return {q:text,small:true,ans,choices:shuffle([...new Set(choices)]),exp,acceptedAnswers,sgKind:kind};
}
function singaporeDay(kind,text,dayIndex,exp){
  const ans=DOW[(dayIndex+7)%7];
  const wrong=shuffle(DOW.filter(day=>day!==ans)).slice(0,4);
  return singaporeCustom(kind,text,ans,[ans,...wrong],exp);
}
function singaporeQuestion(kind,t=3){
  if(kind==='ratioProducts'){
    return singaporeCustom(kind,
      'Tính A = (1×2×3 + 2×4×6 + 3×6×9 + 4×8×12 + 5×10×15) : (1×3×5 + 2×6×10 + 3×9×15 + 4×12×20 + 5×15×25).',
      '2/5',['2/5','3/5','2/3','5/2','3/2'],
      'Hạng tử thứ k ở tử số là k×2k×3k = 6k³; hạng tử tương ứng ở mẫu là k×3k×5k = 15k³. Hai tổng có chung thừa số (1³+2³+3³+4³+5³), nên A = 6/15 = 2/5 = 0,4.',
      ['0,4','0.4','2:5']);
  }
  if(kind==='aaAbaTrap'){
    return singaporeCustom(kind,
      'Câu bẫy chữ số: AA + BB = ABA, trong đó AA là số có hai chữ số đều bằng A, còn ABA là số có ba chữ số A–B–A. Biết A, B khác 0 và A ≠ B. Cặp nào thỏa mãn?',
      'Không tồn tại',['Không tồn tại','A=1, B=8','A=1, B=9','A=2, B=7','A=9, B=1'],
      'AA = 11A, BB = 11B và ABA = 101A+10B. Do đó 11A+11B = 101A+10B, suy ra B = 90A. Với A từ 1 đến 9 thì B không thể là một chữ số. Vậy đề bài không có nghiệm; nhận xét A=1 từ tổng tối đa 198 mới chỉ là điều kiện cần, chưa phải đáp án.',
      ['không có nghiệm','vô nghiệm','không tồn tại cặp chữ số']);
  }
  if(kind==='abBaCccTrap'){
    return singaporeCustom(kind,
      'Câu bẫy chữ số: AB + BA = CCC, trong đó AB và BA là các số có hai chữ số theo đúng thứ tự đã viết. Các chữ A, B, C khác nhau, đều từ 1 đến 9 và A > B. Số AB nào thỏa mãn?',
      'Không tồn tại',['Không tồn tại','AB=21','AB=32','AB=54','AB=91'],
      'AB+BA = (10A+B)+(10B+A) = 11(A+B), luôn chia hết cho 11. Nhưng CCC = 111C; chia 111C cho 11 còn dư C. Vì C từ 1 đến 9 nên CCC không chia hết cho 11. Do đó không có số AB nào thỏa mãn.',
      ['không có nghiệm','vô nghiệm','không tồn tại số ab']);
  }
  if(kind==='calendarAfterDays'){
    const day=ri(1,25),month=ri(1,12),after=pick([100,365,500,999,2023,2026,10000]);
    const offset=after%7,answerIndex=(3+offset)%7;
    return singaporeDay(kind,`Biết ngày ${day} tháng ${month} là Thứ Tư. Hỏi ${after} ngày sau là thứ mấy?`,answerIndex,
      `${after} = ${Math.floor(after/7)}×7 + ${offset}. Mỗi ${Math.floor(after/7)} tuần trọn vẹn không đổi thứ, nên chỉ dịch ${offset} ngày từ Thứ Tư → ${DOW[answerIndex]}.`);
  }
  if(kind==='calendarNextYear'){
    const date=pick([[1,1,2024],[15,1,2024],[1,3,2023],[1,6,2024],[20,11,2023],[10,7,2025]]);
    const [day,month,year]=date;
    const days=Math.round((Date.UTC(year+1,month-1,day)-Date.UTC(year,month-1,day))/86400000);
    const offset=days%7,answerIndex=(3+offset)%7;
    const leapNote=days===366?'quãng thời gian này đi qua ngày 29/2':'quãng thời gian này có 365 ngày';
    return singaporeDay(kind,`Biết ngày ${day}/${month}/${year} là Thứ Tư. Hỏi đúng ngày ${day}/${month}/${year+1} là thứ mấy?`,answerIndex,
      `Từ hai ngày cùng ngày–tháng này cách nhau ${days} ngày vì ${leapNote}. ${days} chia 7 dư ${offset}, nên dịch ${offset} ngày từ Thứ Tư → ${DOW[answerIndex]}.`);
  }
  if(kind==='leapCalendar'){
    return singaporeDay(kind,'Ngày 1 tháng 3 của một năm nhuận là Thứ Ba. Hỏi ngày 1 tháng 6 cùng năm đó là thứ mấy?',3,
      'Từ 1/3 đến 1/6 có 31+30+31 = 92 ngày. 92 chia 7 dư 1, nên sau Thứ Ba một ngày là Thứ Tư. Ngày 29/2 không còn nằm trong quãng đang đếm.');
  }
  if(kind==='lastDigit2023'){
    return singaporeNumber(kind,'Tìm chữ số tận cùng của tích 3×13×23×…×2023.',7,3,
      'Dãy có (2023−3):10+1 = 203 thừa số, tất cả đều tận cùng bằng 3. Chữ số tận cùng cần tìm giống 3^203. Chu kỳ là 3, 9, 7, 1; 203 chia 4 dư 3 nên chữ số tận cùng là 7.');
  }
  if(kind==='stairCubes'){
    return singaporeNumber(kind,'Xếp các khối lập phương nhỏ thành bậc thang 3 tầng: tầng dưới 3×3, tầng giữa 2×2, tầng trên 1×1. Có tất cả bao nhiêu khối?',14,4,
      'Mỗi tầng dày 1 khối. Số khối là 3×3 + 2×2 + 1×1 = 9+4+1 = 14.');
  }
  if(kind==='circleRoses'){
    return singaporeNumber(kind,'Một hồ tròn có chu vi 120 m. Cứ cách 6 m trồng 1 cây liễu; giữa hai cây liễu liên tiếp trồng 2 cây hoa hồng. Có tất cả bao nhiêu cây hoa hồng?',40,8,
      'Có 120:6 = 20 cây liễu. Trên đường tròn, số khoảng bằng số cây nên cũng có 20 khoảng. Mỗi khoảng có 2 cây hoa hồng: 20×2 = 40 cây.');
  }
  if(kind==='triangleBDE'){
    const question=singaporeNumber(kind,'Tam giác ABC có diện tích 60 cm². D thuộc BC sao cho BD = 2DC. E là trung điểm của AD. Tính diện tích tam giác BDE.',20,6,
      'BD chiếm 2/3 cạnh BC nên S(ABD) = 2/3×60 = 40 cm². E là trung điểm AD, vì vậy DE = 1/2 AD. Hai tam giác BDE và BDA chung chiều cao từ B, nên S(BDE) = 1/2×40 = 20 cm².');
    question.svg='<svg viewBox="0 0 240 145" width="230" aria-label="Tam giác ABC với D trên BC và E là trung điểm AD"><polygon points="115,12 18,128 222,128" fill="#eef6ff" stroke="#2b2350" stroke-width="4"/><line x1="115" y1="12" x2="154" y2="128" stroke="#7a56c2" stroke-width="3"/><circle cx="135" cy="70" r="5" fill="#ef5b78"/><text x="112" y="10" font-weight="bold">A</text><text x="5" y="140" font-weight="bold">B</text><text x="224" y="140" font-weight="bold">C</text><text x="151" y="141" font-weight="bold">D</text><text x="139" y="65" font-weight="bold">E</text></svg>';
    return question;
  }
  if(kind==='matchstickTerm'){
    return singaporeNumber(kind,'Một dãy hình lần lượt dùng 1, 4, 7, 10, … que diêm. Hình thứ 8 cần bao nhiêu que?',22,5,
      'Mỗi hình sau thêm 3 que. Hình thứ n dùng 1+(n−1)×3 que. Hình thứ 8 dùng 1+7×3 = 22 que.');
  }
  if(kind==='snailWell'){
    return singaporeNumber(kind,'Ốc sên ở đáy giếng sâu 10 m. Ban ngày bò lên 3 m, ban đêm tụt 2 m. Sau bao nhiêu ngày ốc sên lên tới miệng giếng?',8,3,
      'Sau mỗi ngày–đêm trọn vẹn, ốc tăng 1 m. Sau 7 đêm ốc ở độ cao 7 m; ban ngày thứ 8 bò thêm 3 m tới miệng giếng và thoát ngay, không bị tụt nữa. Vậy cần 8 ngày.');
  }
  if(kind==='groupGift'){
    return singaporeNumber(kind,'Một nhóm góp mua quà. Nếu mỗi người góp 8 đô la thì thiếu 14 đô; nếu mỗi người góp 11 đô thì thừa 16 đô. Món quà giá bao nhiêu?',94,10,
      'Đổi từ 8 lên 11 đô làm số tiền tăng 3 đô mỗi người và chuyển từ thiếu 14 sang thừa 16, tức tăng 30 đô. Có 30:3 = 10 người. Giá quà = 8×10+14 = 94 đô la.');
  }
  if(kind==='rectangleIntersection'){
    const question=singaporeCustom(kind,
      'Hình chữ nhật ABCD có diện tích 72 cm². M thuộc AB với AM = 2MB; N thuộc AD với AN = 2ND. BN cắt DM tại P. Tính diện tích tam giác AMP.',
      '9,6',['9,6','8','12','14,4','19,2'],
      'Đặt AB=3a, AD=3d nên 9ad=72. Từ hai đường thẳng BN và DM suy ra P cách AB một đoạn bằng 2/5 AD = 6d/5. Do AM=2a, S(AMP)=1/2×2a×6d/5 = 6ad/5. Vì ad=8 nên diện tích là 48/5 = 9,6 cm².',
      ['9.6','48/5','48:5']);
    question.svg='<svg viewBox="0 0 270 165" width="250" aria-label="Hình chữ nhật ABCD với BN cắt DM tại P"><rect x="20" y="18" width="230" height="125" fill="#fff8da" stroke="#2b2350" stroke-width="4"/><line x1="250" y1="18" x2="20" y2="101" stroke="#4e91d8" stroke-width="3"/><line x1="20" y1="143" x2="173" y2="18" stroke="#e36b83" stroke-width="3"/><circle cx="112" cy="68" r="5" fill="#744bb6"/><text x="5" y="16" font-weight="bold">A</text><text x="254" y="16" font-weight="bold">B</text><text x="254" y="158" font-weight="bold">C</text><text x="5" y="158" font-weight="bold">D</text><text x="170" y="14" font-weight="bold">M</text><text x="5" y="102" font-weight="bold">N</text><text x="118" y="65" font-weight="bold">P</text></svg>';
    return question;
  }
  if(kind==='lineTreesBothEnds'){
    const gap=pick([3,4,5,6,8]),spaces=ri(5,12),length=gap*spaces;
    return singaporeNumber(kind,`Một đoạn đường dài ${length} m, cứ ${gap} m trồng một cây và CẢ HAI đầu đều có cây. Cần bao nhiêu cây?`,spaces+1,3,
      `Có ${length}:${gap} = ${spaces} khoảng cách. Trên đoạn thẳng có cây ở cả hai đầu, số cây = số khoảng + 1 = ${spaces+1}.`);
  }
  if(kind==='lineTreeSpacing'){
    const trees=ri(6,15),gap=pick([2,3,4,5,6,8]),length=(trees-1)*gap;
    return singaporeNumber(kind,`Trên đoạn đường dài ${length} m có ${trees} cây cách đều, cả hai đầu đều trồng cây. Hai cây liền nhau cách bao nhiêu mét?`,gap,2,
      `${trees} cây tạo ${trees-1} khoảng cách. Mỗi khoảng dài ${length}:${trees-1} = ${gap} m.`);
  }
  if(kind==='oneEndTrees'){
    const gap=pick([2,3,4,5,6]),trees=ri(6,15),length=gap*trees;
    return singaporeNumber(kind,`Một đoạn đường dài ${length} m, cây cách nhau ${gap} m. Chỉ trồng cây ở MỘT đầu đoạn đường, đầu kia không trồng. Có bao nhiêu cây?`,trees,3,
      `Có ${length}:${gap} = ${trees} khoảng. Khi chỉ một đầu có cây, số cây bằng đúng số khoảng nên có ${trees} cây.`);
  }
  if(kind==='seriesCount'){
    const start=ri(1,8),step=pick([2,3,4,5]),count=ri(8,18),last=start+(count-1)*step;
    return singaporeNumber(kind,`Dãy ${start}, ${start+step}, ${start+2*step}, …, ${last} có bao nhiêu số hạng?`,count,4,
      `Số khoảng cách = (${last}−${start}):${step} = ${count-1}. Số số hạng = số khoảng + 1 = ${count}.`);
  }
  return singaporeQuestion('matchstickTerm',t);
}

function genSingapore3(t){
  const pool=SINGAPORE3_LEVEL_KINDS[t]||SINGAPORE3_LEVEL_KINDS[3];
  return singaporeQuestion(pick(pool),t);
}

/* ============================================================
   💎 THỬ THÁCH MỚI — MỖI CẤP MỘT KIỂU SUY LUẬN
   Không chỉ tăng số lớn: cấp cao thêm tổ hợp, bao hàm–loại trừ,
   số dư, ước số và bài toán nghiệm nguyên.
============================================================ */
function combinationCount(n,k){
  const m=Math.min(k,n-k);let result=1;
  for(let i=1;i<=m;i++)result=result*(n-m+i)/i;
  return Math.round(result);
}
function genBrainChallenge(t){
  if(t===1){
    const kind=pick(['consecutive3','oddCount','oddStepSequence','pairTarget']);
    if(kind==='consecutive3'){
      const middle=ri(3,12),sum=middle*3;
      return qs(`💎 Ba số tự nhiên LIÊN TIẾP có tổng bằng ${sum}. Số lớn nhất là bao nhiêu?`,middle+1,3,
        `Ba số liên tiếp nằm cân bằng quanh số ở giữa. Số giữa = ${sum} : 3 = ${middle}, nên ba số là ${middle-1}, ${middle}, ${middle+1}. Số lớn nhất là ${middle+1}.`);
    }
    if(kind==='oddCount'){
      const n=ri(5,15),last=2*n+1;
      return qs(`💎 Từ 1 đến ${last} (kể cả 1 và ${last}) có bao nhiêu số LẺ?`,n+1,3,
        `Các số lẻ là 1, 3, 5, …, ${last}. Mỗi số lẻ có dạng 2×k+1 với k từ 0 đến ${n}, nên có ${n+1} số.`);
    }
    if(kind==='oddStepSequence'){
      const start=ri(1,5),values=[start];
      [3,5,7,9].forEach(step=>values.push(values.at(-1)+step));
      const ans=values.at(-1)+11;
      return qs(`💎 Tìm số tiếp theo: ${values.join(', ')}, ❓`,ans,5,
        `Hiệu giữa hai số liên tiếp là các số lẻ tăng dần: +3, +5, +7, +9; bước tiếp theo là +11. Vậy ${values.at(-1)} + 11 = ${ans}.`);
    }
    const target=pick([10,12,15,18,20]),known=ri(2,target-2);
    return qs(`💎 Hai thẻ số có tổng bằng ${target}. Một thẻ ghi ${known}. Nếu TĂNG số trên thẻ còn lại thêm 2 đơn vị thì thẻ đó ghi số nào?`,target-known+2,3,
      `Thẻ còn lại ban đầu là ${target} − ${known} = ${target-known}. Tăng thêm 2 đơn vị được ${target-known} + 2 = ${target-known+2}.`);
  }

  if(t===2){
    const kind=pick(['oddPair','matchstickRow','digitClue']);
    if(kind==='oddPair'){
      const small=2*ri(2,12)+1,large=small+2,sum=small+large;
      return qs(`💎 Hai số LẺ liên tiếp có tổng bằng ${sum}. Số lớn hơn là bao nhiêu?`,large,4,
        `Hai số lẻ liên tiếp cách nhau 2. Số ở giữa chúng là ${sum} : 2 = ${sum/2}, nên số lớn hơn = ${sum/2} + 1 = ${large}.`);
    }
    if(kind==='matchstickRow'){
      const squares=ri(3,10),sticks=3*squares+1;
      return qs(`💎 Xếp ${squares} hình vuông bằng nhau thành MỘT HÀNG, hai hình cạnh nhau dùng chung một cạnh. Cần tất cả bao nhiêu que diêm?`,sticks,5,
        `Hình đầu cần 4 que. Mỗi hình tiếp theo dùng chung 1 cạnh nên chỉ thêm 3 que. Tổng = 4 + ${squares-1}×3 = ${sticks} que.`);
    }
    const tens=ri(2,8),ones=ri(1,9),number=tens*10+ones;
    return qs(`💎 Một số có hai chữ số. Chữ số hàng chục là ${tens}; tổng hai chữ số là ${tens+ones}. Số đó là số nào?`,number,10,
      `Chữ số hàng đơn vị = ${tens+ones} − ${tens} = ${ones}. Ghép ${tens} chục và ${ones} đơn vị được số ${number}.`);
  }

  if(t===3){
    const kind=pick(['inclusion2','gridPaths','formDigits']);
    if(kind==='inclusion2'){
      const both=ri(3,8),onlyA=ri(6,15),onlyB=ri(6,15);
      const a=onlyA+both,b=onlyB+both,union=onlyA+onlyB+both;
      return qs(`💎 Một lớp có ${a} bạn thích cờ vua, ${b} bạn thích bóng đá và ${both} bạn thích CẢ HAI. Có bao nhiêu bạn thích ít nhất một trong hai môn?`,union,5,
        `Cộng ${a} + ${b} thì ${both} bạn thích cả hai bị đếm hai lần. Chỉ giữ mỗi bạn một lần: ${a} + ${b} − ${both} = ${union}.`);
    }
    if(kind==='gridPaths'){
      const right=ri(2,4),up=ri(2,3),steps=right+up,ans=combinationCount(steps,up);
      return qs(`💎 Trên lưới ô vuông, An đi từ A đến B bằng đúng ${right} bước sang PHẢI và ${up} bước lên TRÊN (không đi lùi). Có bao nhiêu đường đi ngắn nhất khác nhau?`,ans,Math.max(3,right+up),
        `Mỗi đường ngắn nhất gồm ${steps} bước, chỉ khác vị trí đặt ${up} bước lên. Chọn ${up} vị trí trong ${steps} vị trí: có ${ans} cách.`);
    }
    const maxDigit=ri(3,6),ans=maxDigit*maxDigit;
    return qs(`💎 Dùng các chữ số 0, 1, 2, …, ${maxDigit}, lập số có HAI chữ số khác nhau. Có bao nhiêu số lập được?`,ans,Math.max(4,maxDigit),
      `Hàng chục không thể là 0 nên có ${maxDigit} cách chọn (1 đến ${maxDigit}). Chọn xong hàng chục, hàng đơn vị có ${maxDigit} chữ số còn lại, kể cả 0. Vậy có ${maxDigit}×${maxDigit} = ${ans} số.`);
  }

  if(t===4){
    const kind=pick(['sameRemainder','workTogether','divisorCount','reverseNumber']);
    if(kind==='sameRemainder'){
      const [a,b]=pick([[3,4],[4,6],[5,6],[6,8],[7,9]]),r=ri(1,Math.min(a,b)-1);
      const L=a*b/gcd(a,b),ans=L+r;
      return qs(`💎 Tìm số tự nhiên NHỎ NHẤT lớn hơn ${Math.max(a,b)} mà khi chia cho ${a} và chia cho ${b} đều dư ${r}.`,ans,Math.max(4,Math.round(L/5)),
        `Bớt đi số dư ${r}, số còn lại phải chia hết cho cả ${a} và ${b}. BCNN(${a}, ${b}) = ${L}; vì cần số lớn hơn ${Math.max(a,b)}, đáp án nhỏ nhất là ${L} + ${r} = ${ans}.`);
    }
    if(kind==='workTogether'){
      const [a,b,hours]=pick([[3,6,2],[4,4,2],[4,12,3],[6,6,3],[6,12,4],[8,8,4],[10,10,5]]);
      return qs(`💎 Một mình máy A làm xong việc trong ${a} giờ, máy B làm xong trong ${b} giờ. Hai máy cùng làm với năng suất không đổi thì sau bao lâu xong việc?`,hours,3,
        `Mỗi giờ A làm 1/${a} công việc, B làm 1/${b}. Cùng làm được 1/${a} + 1/${b} = 1/${hours} công việc mỗi giờ, nên cần ${hours} giờ.`);
    }
    if(kind==='divisorCount'){
      const p=2,q2=3,a=ri(2,4),b=ri(1,3),number=(p**a)*(q2**b),ans=(a+1)*(b+1);
      return qs(`💎 Số ${number} có tất cả bao nhiêu ƯỚC SỐ dương?`,ans,4,
        `${number} = 2^${a} × 3^${b}. Trong một ước số, số mũ của 2 có ${a+1} cách chọn (0 đến ${a}), số mũ của 3 có ${b+1} cách. Tổng số ước = (${a}+1)×(${b}+1) = ${ans}.`);
    }
    const tens=ri(5,9),ones=ri(1,tens-1),number=tens*10+ones,reversed=ones*10+tens;
    return qs(`💎 Một số có hai chữ số, tổng hai chữ số bằng ${tens+ones}. Khi đảo vị trí hai chữ số, số mới bé hơn số cũ ${number-reversed} đơn vị. Số ban đầu là bao nhiêu?`,number,9,
      `Gọi hai chữ số là a > b. Ta có a+b=${tens+ones}; hiệu số ban đầu và số đảo là 9×(a−b)=${number-reversed}, nên a−b=${tens-ones}. Giải hai điều kiện được a=${tens}, b=${ones}; số cần tìm là ${number}.`);
  }

  const kind=pick(['tripleRemainder','inclusion3','blockedGrid','coinEquation','factorialZeros','digitPosition','zigzagGrid']);
  if(kind==='digitPosition'){ // chữ số ở vị trí thứ N khi viết liền 1,2,3,4,...
    const pos=ri(150,3000);
    let p=pos,d=1,count=9,start=1;
    while(p>d*count){p-=d*count;d++;count*=10;start*=10;}
    const num=start+Math.floor((p-1)/d),digitIndex=(p-1)%d,ans=+String(num)[digitIndex];
    const usedBefore=pos-p;
    const wrongs=new Set();while(wrongs.size<3){const w=ri(0,9);if(w!==ans)wrongs.add(w);}
    return {q:`💎 Viết liền các số tự nhiên 1, 2, 3, 4, ... để được dãy số S = 123456789101112... Hỏi chữ số đứng ở vị trí thứ ${pos} (tính từ trái sang phải) là chữ số nào?`,small:true,
      ans,choices:shuffle([ans,...wrongs]),
      exp:`Các nhóm số 1, 2, 3... chữ số dùng lần lượt 9, 180, 2700... chữ số. Trừ dần các nhóm trước, vị trí ${pos} rơi vào nhóm số có ${d} chữ số (đã dùng hết ${usedBefore} chữ số của các nhóm trước đó), còn dư ${p} chữ số kể từ số ${start}. Mỗi số trong nhóm này chiếm ${d} chữ số nên vị trí ${p} nằm ở số thứ ${Math.floor((p-1)/d)+1} tính từ ${start}, tức là số ${num}, và là chữ số thứ ${digitIndex+1} của số đó → chữ số ${ans}.`};
  }
  if(kind==='zigzagGrid'){ // các số tự nhiên xếp theo đường chéo zic-zac vào hàng/cột
    const N=ri(20,80);
    let d=1;while(d*(d+1)/2<N)d++;
    const Tprev=(d-1)*d/2,kPos=N-Tprev,row=d-kPos+1,col=kPos;
    const ansStr=`Hàng ${row}, Cột ${col}`;
    const wrongs=new Set();
    while(wrongs.size<3){
      const cand=`Hàng ${Math.max(1,row+pick([-1,0,1]))}, Cột ${Math.max(1,col+pick([-1,0,1]))}`;
      if(cand!==ansStr)wrongs.add(cand);
    }
    return {q:`💎 Số ${N} nằm ở Hàng nào, Cột nào trong cách sắp xếp zic-zac dưới đây?`,small:true,
      svg:`<div class="eqlines">Hàng 1: 1, 3, 6, 10, ...<br>Hàng 2: 2, 5, 9, ...<br>Hàng 3: 4, 8, ...<br>Hàng 4: 7, ...</div>`,
      ans:ansStr,choices:shuffle([ansStr,...wrongs]),
      exp:`Đường chéo thứ ${d} gồm ${d} số liên tiếp, từ ${Tprev+1} đến ${d}×(${d}+1):2 = ${d*(d+1)/2} (vì 1+2+...+${d} = ${d*(d+1)/2}). Vì ${Tprev} < ${N} ≤ ${d*(d+1)/2}, số ${N} thuộc đường chéo ${d}, là số thứ ${kPos} kể từ đầu (đầu đường chéo ở Hàng ${d}, Cột 1). Trong mỗi đường chéo, càng về sau hàng càng giảm và cột càng tăng, nên số thứ ${kPos} nằm ở Hàng ${d}−${kPos}+1 = ${row}, Cột ${kPos} = ${col}.`};
  }
  if(kind==='tripleRemainder'){
    const [a,b,c]=pick([[3,5,7],[4,5,9],[5,7,8]]);
    const ab=a*b/gcd(a,b),L=ab*c/gcd(ab,c),ans=L-1;
    return qs(`💎 Tìm số nguyên dương nhỏ nhất n sao cho chia n cho ${a} dư ${a-1}, chia cho ${b} dư ${b-1}, và chia cho ${c} dư ${c-1}.`,ans,Math.max(6,Math.round(L/10)),
      `Cả ba điều kiện đều nói n + 1 chia hết cho ${a}, ${b} và ${c}. BCNN(${a}, ${b}, ${c}) = ${L}, nên giá trị nhỏ nhất là n = ${L} − 1 = ${ans}.`);
  }
  if(kind==='inclusion3'){
    const onlyA=ri(5,9),onlyB=ri(5,9),onlyC=ri(5,9),onlyAB=ri(1,4),onlyAC=ri(1,4),onlyBC=ri(1,4),all=ri(1,3);
    const A=onlyA+onlyAB+onlyAC+all,B=onlyB+onlyAB+onlyBC+all,C=onlyC+onlyAC+onlyBC+all;
    const AB=onlyAB+all,AC=onlyAC+all,BC=onlyBC+all,union=onlyA+onlyB+onlyC+onlyAB+onlyAC+onlyBC+all;
    return qs(`💎 Trong một nhóm: ${A} bạn học cờ, ${B} bạn học nhạc, ${C} bạn học vẽ; có ${AB} bạn học cả cờ–nhạc, ${AC} bạn học cả cờ–vẽ, ${BC} bạn học cả nhạc–vẽ và ${all} bạn học CẢ BA. Có bao nhiêu bạn học ít nhất một môn?`,union,6,
      `Dùng nguyên lý bao hàm–loại trừ: ${A}+${B}+${C} − ${AB}−${AC}−${BC} + ${all} = ${union}. Cộng lại phần học cả ba vì phần đó đã bị trừ thừa một lần.`);
  }
  if(kind==='blockedGrid'){
    const right=pick([3,4]),up=pick([3,4]),blockX=ri(1,right-1),blockY=ri(1,up-1);
    const total=combinationCount(right+up,up);
    const through=combinationCount(blockX+blockY,blockY)*combinationCount(right-blockX+up-blockY,up-blockY);
    const ans=total-through;
    return qs(`💎 Trên lưới, đường ngắn nhất từ A đến B gồm ${right} bước sang phải và ${up} bước lên. Một giao điểm nằm sau ${blockX} bước phải và ${blockY} bước lên bị CHẶN. Có bao nhiêu đường ngắn nhất không đi qua điểm bị chặn?`,ans,Math.max(5,Math.round(total/8)),
      `Nếu không chặn có ${total} đường. Số đường đi qua điểm chặn = số cách đi tới đó × số cách đi từ đó đến B = ${combinationCount(blockX+blockY,blockY)} × ${combinationCount(right-blockX+up-blockY,up-blockY)} = ${through}. Còn ${total} − ${through} = ${ans} đường.`);
  }
  if(kind==='coinEquation'){
    const total=pick([20,24,30,34,40,44,50]);let ans=0;
    for(let five=0;five*5<=total;five++)if((total-five*5)%2===0)ans++;
    return qs(`💎 Có vô hạn đồng 2 nghìn và 5 nghìn. Có bao nhiêu cách chọn số lượng hai loại đồng (có thể chọn 0 đồng một loại) để được đúng ${total} nghìn?`,ans,3,
      `Gọi số đồng 5 nghìn lần lượt từ 0 đến ${Math.floor(total/5)}. Chỉ giữ trường hợp ${total} − 5×(số đồng 5 nghìn) là số chẵn để phần còn lại đổi được bằng đồng 2 nghìn. Đếm được ${ans} cách.`);
  }
  const n=pick([20,25,30,35,40,45,50]),ans=Math.floor(n/5)+Math.floor(n/25);
  return qs(`💎 Tích 1×2×3×…×${n} (tức ${n}!) có bao nhiêu chữ số 0 liên tiếp ở TẬN CÙNG?`,ans,3,
    `Mỗi số 0 tận cùng cần một cặp 2×5; thừa số 2 luôn nhiều hơn nên chỉ đếm thừa số 5. Có ${Math.floor(n/5)} bội của 5 và thêm ${Math.floor(n/25)} thừa số 5 nữa từ các bội của 25. Tổng = ${Math.floor(n/5)} + ${Math.floor(n/25)} = ${ans}.`);
}

/* ============================================================
   🌟 NÂNG CAO — DÀNH CHO HỌC SINH GIỎI
   Vận tốc trung bình (bẫy kinh điển) · Tổng dãy số cách đều tổng quát ·
   Chữ số tận cùng của lũy thừa (chu kỳ lặp) · BCNN ·
   Vòi chảy vào/tháo ra · Tính nhanh bằng kỹ thuật triệt tiêu
============================================================ */
function genHSG(t){
  const k=pick(['avgSpeedTrap','arithSeries','lastDigitPow','lcmMultiple','drainPipe','telescopeProduct',
                'triRatioArea','midSquare','polyDiag','circleGap','telescopeSum','twoCevianArea']);

  if(k==='telescopeSum'){ // tổng phân số dạng 1/(a·(a+d)) triệt tiêu qua từng cặp
    const d=pick([2,3,4,5,6]), n=ri(6,40);
    const last=1+n*d, ansNum=n, ansDen=1+n*d;
    const g=gcd(ansNum,ansDen), fracAns=`${ansNum/g}/${ansDen/g}`;
    const terms=[]; for(let i=0;i<n;i++)terms.push(`1/(${1+i*d}×${1+(i+1)*d})`);
    const shown=n>3?`${terms[0]} + ${terms[1]} + ... + ${terms[terms.length-1]}`:terms.join(' + ');
    const wrongs=new Set();
    while(wrongs.size<3){
      const dd=pick([-2,-1,1,2]);const num2=Math.max(1,ansNum+dd),den2=ansDen+dd*d;
      const g2=gcd(num2,Math.max(1,den2)),cand=`${num2/g2}/${Math.max(1,den2)/g2}`;
      if(cand!==fracAns)wrongs.add(cand);
    }
    return {q:`🌟 Tính nhanh: S = ${shown} = ?`,small:true,ans:fracAns,choices:shuffle([fracAns,...wrongs]),
      exp:`Mẹo triệt tiêu: 1/(k×(k+${d})) = (1/${d})×[1/k − 1/(k+${d})]. Cộng dồn thì các số ở giữa TRIỆT TIÊU hết, chỉ còn: (1/${d})×[1/1 − 1/${last}] = (1/${d})×(${n}×${d})/${last} = ${ansNum}/${ansDen} = ${fracAns}.`};
  }
  if(k==='twoCevianArea'){ // hai đường thẳng BN, CM cắt nhau trong tam giác — diện tích tam giác con
    const m=ri(1,4), n2=ri(1,4);
    const K=m+n2+1, S=K*ri(2,8);
    const ans=S/K;
    return {q:`🌟📐 Tam giác ABC có diện tích ${S} cm². Điểm M trên AB sao cho AM = ${m}×MB. Điểm N trên AC sao cho AN = ${n2}×NC. Đoạn BN và CM cắt nhau tại O. Tính diện tích tam giác BOC.`,small:true,
      svg:`<svg viewBox="0 0 190 130" width="180"><g class="pulseShape">
        <polygon points="95,20 25,105 165,105" fill="#ffd6e0" stroke="#2b2350" stroke-width="4"/>
        <line x1="25" y1="105" x2="128" y2="47" stroke="#2b2350" stroke-width="2.5" stroke-dasharray="5 4"/>
        <line x1="165" y1="105" x2="61" y2="47" stroke="#2b2350" stroke-width="2.5" stroke-dasharray="5 4"/>
      </g>
      <text x="95" y="14" font-size="13" font-weight="bold" text-anchor="middle" fill="#2b2350">A</text>
      <text x="14" y="120" font-size="13" font-weight="bold" fill="#2b2350">B</text>
      <text x="168" y="120" font-size="13" font-weight="bold" fill="#2b2350">C</text></svg>`,
      ans,choices:numChoices(ans,Math.max(2,Math.round(S/K))),
      exp:`Với AM = ${m}×MB và AN = ${n2}×NC, có công thức đẹp: S(BOC) = S(ABC) : (${m}+${n2}+1) = S(ABC) : ${K}. Vậy S(BOC) = ${S} : ${K} = ${ans} cm².`};
  }

  if(k==='avgSpeedTrap'){ // vận tốc trung bình cả quãng đường — không phải trung bình cộng!
    const speeds=[4,5,6,8,9,10,12,14,15,16,18,20,21,24];
    const v1=pick(speeds), v2=pick(speeds);
    const half=v1*v2, totalTime=v1+v2, totalDist=2*half;
    if(v1===v2||totalDist%totalTime!==0)return genHSG(t);
    const avg=totalDist/totalTime, t1=v2, t2=v1;
    return qs(`🌟 Một ô tô đi từ tỉnh A đến tỉnh B: NỬA quãng đường đầu chạy với vận tốc ${v1} km/giờ, NỬA quãng đường sau chạy với vận tốc ${v2} km/giờ. Hỏi vận tốc TRUNG BÌNH của ô tô trên CẢ quãng đường là bao nhiêu km/giờ? (Đây KHÔNG phải trung bình cộng hai vận tốc!)`,avg,5,
      `Bẫy: đáp án KHÔNG phải là (${v1}+${v2}):2 = ${(v1+v2)/2}! Giả sử nửa quãng đường dài ${half} km: đi nửa đầu hết ${half}:${v1} = ${t1} giờ, nửa sau hết ${half}:${v2} = ${t2} giờ. Cả quãng đường dài ${totalDist} km, hết ${t1+t2} giờ. Vận tốc trung bình = quãng đường : thời gian = ${totalDist} : ${t1+t2} = ${avg} km/giờ.`);
  }
  if(k==='arithSeries'){ // tổng dãy số cách đều — phải tìm số số hạng trước
    const a=ri(1,15), d=pick([2,3,4,5,6]), n=ri(6,15);
    const last=a+(n-1)*d, sum=n*(a+last)/2;
    return qs(`🌟 Tính tổng dãy số cách đều nhau ${d} đơn vị: ${a} + ${a+d} + ${a+2*d} + ... + ${last} = ?`,sum,n*d,
      `Trước tiên tìm SỐ SỐ HẠNG = (số cuối − số đầu) : khoảng cách + 1 = (${last} − ${a}) : ${d} + 1 = ${n}. Sau đó Tổng = (số đầu + số cuối) × số số hạng : 2 = (${a} + ${last}) × ${n} : 2 = ${sum}.`);
  }
  if(k==='lastDigitPow'){ // chữ số tận cùng của tích nhiều thừa số giống nhau — dùng chu kỳ lặp
    const cycles={2:[2,4,8,6],3:[3,9,7,1],4:[4,6],7:[7,9,3,1],8:[8,4,2,6],9:[9,1]};
    const ld=pick([2,3,4,7,8,9]), cyc=cycles[ld];
    const base=ri(1,9)*10+ld, n=ri(15,60);
    const r=n%cyc.length;
    const ans=cyc[r===0?cyc.length-1:r-1];
    const wrongPool=[...new Set(cyc)].filter(v=>v!==ans);
    while(wrongPool.length<3){const d2=ri(0,9);if(d2!==ans&&!wrongPool.includes(d2))wrongPool.push(d2);}
    return {q:`🌟 Tìm chữ số tận cùng của tích ${n} thừa số ${base} (tức là ${base} × ${base} × ... × ${base}, có ${n} thừa số).`,small:true,
      ans,choices:shuffle([ans,...wrongPool.slice(0,3)]),
      exp:`Chữ số tận cùng của một tích chỉ phụ thuộc chữ số tận cùng của các thừa số, ở đây là ${ld}. Các lũy thừa của ${ld} có chữ số tận cùng lặp lại theo chu kỳ ${cyc.length}: ${cyc.join(', ')}, rồi lặp lại. Vì ${n} : ${cyc.length} ${r===0?'chia hết':'dư '+r}, chữ số tận cùng cần tìm là ${r===0?'số CUỐI':'số thứ '+r} trong chu kỳ: ${ans}.`};
  }
  if(k==='lcmMultiple'){ // bội chung nhỏ nhất của 3 số
    const nums=shuffle([2,3,4,5,6,7,8,9,10]).slice(0,3);
    const [a,b,c]=nums;
    const lcmAB=a*b/gcd(a,b), L=lcmAB*c/gcd(lcmAB,c);
    if(L>800||L<2)return genHSG(t);
    return qs(`🌟 Tìm số tự nhiên nhỏ nhất khác 0 mà chia hết cho CẢ ${a}, ${b} và ${c}.`,L,Math.max(3,Math.round(L/8)),
      `Đây là bài toán tìm BỘI CHUNG NHỎ NHẤT (BCNN). BCNN(${a}, ${b}) = ${lcmAB}. Rồi BCNN(${lcmAB}, ${c}) = ${L}. Vậy số cần tìm là ${L}.`);
  }
  if(k==='drainPipe'){ // vòi chảy vào + vòi tháo ra cùng lúc
    const triples=[[4,12,6],[3,6,6],[6,12,12],[4,6,12],[3,12,4],[2,6,3],[2,4,4],[3,4,12],[6,8,24],[8,12,24],[4,20,5]];
    const [a,b,tt]=pick(triples);
    return qs(`🌟 Một bể nước có 1 vòi CHẢY VÀO và 1 vòi THÁO RA. Chỉ mở vòi chảy vào thì sau ${a} giờ đầy bể. Chỉ mở vòi tháo ra (khi bể đầy) thì sau ${b} giờ bể cạn hết. Hỏi nếu bể đang cạn mà mở ĐỒNG THỜI cả hai vòi thì sau bao lâu đầy bể?`,tt,3,
      `Mỗi giờ vòi chảy vào được 1/${a} bể, vòi tháo ra làm cạn 1/${b} bể. Mở cùng lúc, mỗi giờ bể đầy thêm 1/${a} − 1/${b} = 1/${tt} bể. Vậy sau ${tt} giờ thì đầy bể.`);
  }
  if(k==='telescopeProduct'){ // tính nhanh tổng các tích số liên tiếp bằng kỹ thuật triệt tiêu
    const n=ri(4,10);
    const sum=n*(n+1)*(n+2)/3;
    return qs(`🌟 Tính nhanh: 1×2 + 2×3 + 3×4 + ... + ${n}×${n+1} = ?`,sum,n*3,
      `Mẹo: mỗi số hạng k×(k+1) = [k×(k+1)×(k+2) − (k−1)×k×(k+1)] : 3, nên khi cộng dồn các số ở giữa TRIỆT TIÊU hết, chỉ còn: ${n}×${n+1}×${n+2} : 3 = ${sum}.`);
  }
  if(k==='triRatioArea'){ // tam giác chung đường cao — diện tích tỉ lệ với đáy
    const whole=pick([2,3,4,5]), part=ri(1,whole-1);
    const S=whole*ri(2,10);
    const ans=S*part/whole;
    const g=gcd(part,whole), dp=part/g, dw=whole/g;
    return {q:`🌟📐 Tam giác ABC có diện tích ${S} cm². Trên cạnh BC lấy điểm M sao cho BM = ${dp}/${dw} BC. Tính diện tích tam giác ABM.`,small:true,
      svg:`<svg viewBox="0 0 190 130" width="180"><g class="pulseShape">
        <polygon points="95,20 25,105 165,105" fill="#ffd6e0" stroke="#2b2350" stroke-width="4"/>
        <line x1="95" y1="20" x2="80" y2="105" stroke="#2b2350" stroke-width="3" stroke-dasharray="6 5"/>
      </g>
      <text x="95" y="14" font-size="13" font-weight="bold" text-anchor="middle" fill="#2b2350">A</text>
      <text x="14" y="120" font-size="13" font-weight="bold" fill="#2b2350">B</text>
      <text x="168" y="120" font-size="13" font-weight="bold" fill="#2b2350">C</text>
      <text x="80" y="122" font-size="13" font-weight="bold" fill="#2b2350">M</text></svg>`,
      ans,choices:numChoices(ans,Math.max(2,Math.round(S/whole))),
      exp:`Tam giác ABM và ABC có CHUNG đường cao hạ từ đỉnh A xuống đường thẳng BC, nên diện tích tỉ lệ thuận với độ dài đáy: S(ABM) : S(ABC) = BM : BC = ${dp} : ${dw}. Vậy S(ABM) = ${S} × ${dp}/${dw} = ${ans} cm².`};
  }
  if(k==='midSquare'){ // nối trung điểm hình vuông → hình vuông mới bằng nửa diện tích
    const a=2*ri(2,8);
    const outerArea=a*a, innerArea=outerArea/2;
    return {q:`🌟📐 Hình vuông ABCD cạnh ${a} cm. Nối các trung điểm của 4 cạnh liên tiếp để tạo thành hình vuông MNPQ nằm bên trong (xoay 45°). Tính diện tích hình vuông MNPQ.`,small:true,
      svg:`<svg viewBox="0 0 130 130" width="130"><g class="pulseShape">
        <rect x="10" y="10" width="100" height="100" fill="#eef6ff" stroke="#2b2350" stroke-width="3"/>
        <polygon points="60,10 110,60 60,110 10,60" fill="#ffd6e0" stroke="#2b2350" stroke-width="3"/>
      </g></svg>`,
      ans:innerArea,choices:numChoices(innerArea,Math.max(4,Math.round(outerArea*0.15))),
      exp:`Diện tích hình vuông lớn = ${a} × ${a} = ${outerArea} cm². Tính chất đẹp: khi nối trung điểm 4 cạnh của một hình vuông, hình vuông tạo thành luôn có diện tích bằng ĐÚNG MỘT NỬA hình vuông ban đầu: ${outerArea} : 2 = ${innerArea} cm².`};
  }
  if(k==='polyDiag'){ // số đường chéo của đa giác đều
    const names={5:'ngũ giác',6:'lục giác',7:'thất giác (7 cạnh)',8:'bát giác',9:'cửu giác (9 cạnh)',10:'thập giác'};
    const n=pick([5,6,7,8,9,10]);
    const ans=n*(n-3)/2;
    return qs(`🌟📐 Một đa giác đều có ${n} cạnh (hình ${names[n]}). Hỏi đa giác đó có tất cả bao nhiêu ĐƯỜNG CHÉO?`,ans,3,
      `Mỗi đỉnh nối được với ${n-3} đỉnh khác để tạo đường chéo (trừ chính nó và 2 đỉnh liền kề). Có ${n} đỉnh nên có ${n} × ${n-3} = ${n*(n-3)} lượt nối, nhưng mỗi đường chéo bị đếm 2 lần (từ 2 đầu mút) nên số đường chéo thực = ${n*(n-3)} : 2 = ${ans}.`);
  }
  // circleGap: hình tròn nội tiếp hình vuông — diện tích phần thừa
  const a=2*ri(3,10), r=a/2;
  const squareArea=a*a, circleArea=r*r*3.14, gap=squareArea-circleArea;
  const circleAreaStr=fmtDec(circleArea), ans=fmtDec(gap);
  const wrongs=pad3(ans,[fmtDec(squareArea-r*3.14),fmtDec(squareArea/2),fmtDec(gap+3.14)],k2=>fmtDec(gap+k2*0.5));
  return {q:`🌟📐 Một hình vuông cạnh ${a} cm, bên trong vẽ một hình tròn LỚN NHẤT có thể (đường tròn tiếp xúc cả 4 cạnh hình vuông). Tính phần diện tích hình vuông nằm NGOÀI hình tròn (lấy π ≈ 3,14).`,small:true,
    svg:`<svg viewBox="0 0 130 130" width="130"><g class="pulseShape">
      <rect x="10" y="10" width="100" height="100" fill="#eef6ff" stroke="#2b2350" stroke-width="3"/>
      <circle cx="60" cy="60" r="50" fill="#ffd6e0" stroke="#2b2350" stroke-width="3"/>
    </g></svg>`,
    ans,choices:shuffle([ans,...wrongs]),
    exp:`Hình tròn lớn nhất vẽ vừa trong hình vuông có đường kính bằng cạnh hình vuông = ${a} cm, nên bán kính = ${r} cm. Diện tích hình vuông = ${a} × ${a} = ${squareArea} cm². Diện tích hình tròn = ${r} × ${r} × 3,14 = ${circleAreaStr} cm². Phần diện tích ngoài hình tròn = ${squareArea} − ${circleAreaStr} = ${ans} cm².`};
}

/* ---- Các dạng cơ bản ---- */
function genArith(t){
  if(t===1){
    if(Math.random()<.5){const a=ri(3,18),b=ri(2,Math.max(2,20-a));return q(`${a} + ${b} = ?`,a+b,6,`Đếm thêm ${b} từ ${a}: được ${a+b}.`)}
    const a=ri(8,25),b=ri(2,a-1);return q(`${a} − ${b} = ?`,a-b,6,`Bớt ${b} từ ${a}: còn ${a-b}.`);
  }
  if(t===2){
    const k=pick(['mix','mul','div']);
    if(k==='mix'){const a=ri(10,50),b=ri(5,30),c=ri(2,15);return q(`${a} + ${b} − ${c} = ?`,a+b-c,8,`Từ trái sang phải: ${a}+${b} = ${a+b}, rồi trừ ${c} còn ${a+b-c}.`)}
    if(k==='mul'){const x=pick([3,4,5,6]),b=ri(3,9);return q(`${x} × ${b} = ?`,x*b,8,`${x} × ${b} nghĩa là cộng ${x} tổng cộng ${b} lần = ${x*b}. (Thuộc bảng nhân ${x}!)`)}
    const x=pick([3,4,5,6]),b=ri(3,9);return q(`${x*b} : ${x} = ?`,b,3,`Nhớ bảng nhân: ${x} × ${b} = ${x*b}, nên ${x*b} : ${x} = ${b}.`);
  }
  if(t===3){
    const k=pick(['mixmul','mul2','div','mix']);
    if(k==='mixmul'){const x=ri(3,9),b=ri(2,9),c=ri(2,20);return q(`${x} × ${b} + ${c} = ?`,x*b+c,8,`Nhân trước: ${x}×${b} = ${x*b}, rồi cộng ${c} được ${x*b+c}.`)}
    if(k==='mul2'){const a=ri(12,48),b=ri(3,7);return q(`${a} × ${b} = ?`,a*b,15,`Tách ra cho dễ: ${a}×${b} = ${Math.floor(a/10)*10}×${b} + ${a%10}×${b} = ${Math.floor(a/10)*10*b} + ${(a%10)*b} = ${a*b}.`)}
    if(k==='mix'){const a=ri(150,600),b=ri(50,a-60),c=ri(20,150);return q(`${a} − ${b} + ${c} = ?`,a-b+c,40,`Từ trái sang phải: ${a}−${b} = ${a-b}, rồi cộng ${c} được ${a-b+c}.`)}
    const x=ri(6,9),b=ri(4,12);return q(`${x*b} : ${x} = ?`,b,4,`Vì ${x} × ${b} = ${x*b} nên ${x*b} : ${x} = ${b}.`);
  }
  const k=pick(['order','mul2','divBig','mixmul']);
  if(k==='order'){const a=ri(3,9),b=ri(3,9),c=ri(2,9);return q(`${a} + ${b} × ${c} = ?`,a+b*c,b,`Quy tắc: NHÂN CHIA trước, CỘNG TRỪ sau! ${b}×${c} = ${b*c}, rồi ${a} + ${b*c} = ${a+b*c}.`)}
  if(k==='mul2'){const a=ri(15,60),b=ri(11,19);return q(`${a} × ${b} = ?`,a*b,30,`Tách: ${a}×${b} = ${a}×10 + ${a}×${b-10} = ${a*10} + ${a*(b-10)} = ${a*b}.`)}
  if(k==='mixmul'){const x=ri(6,12),b=ri(4,9),c=ri(10,40);return q(`${x} × ${b} − ${c} = ?`,x*b-c,10,`Nhân trước: ${x}×${b} = ${x*b}, rồi trừ ${c} còn ${x*b-c}.`)}
  const b=ri(13,45),x=ri(4,9);return q(`${b*x} : ${x} = ?`,b,7,`Thử nhân ngược: ${x} × ${b} = ${b*x} ✓. Vậy đáp án là ${b}.`);
}
function genMissing(t){
  if(t<=2){
    if(Math.random()<.5){const a=ri(4,40),b=ri(3,40);return q(`${a} + ❓ = ${a+b}`,b,8,`❓ = ${a+b} − ${a} = ${b}. (Muốn tìm số hạng, lấy tổng trừ số hạng kia.)`)}
    const a=ri(15,90),b=ri(3,a-3);return q(`❓ − ${b} = ${a-b}`,a,8,`❓ = ${a-b} + ${b} = ${a}. (Muốn tìm số bị trừ, lấy hiệu cộng số trừ.)`);
  }
  if(t===3){
    if(Math.random()<.5){const x=pick([4,6,7,8,9]),b=ri(3,9);return q(`${x} × ❓ = ${x*b}`,b,3,`❓ = ${x*b} : ${x} = ${b}. (Muốn tìm thừa số, lấy tích chia thừa số kia.)`)}
    const x=ri(3,9),b=ri(2,9),c=ri(2,15);return q(`${x} × ${b} + ❓ = ${x*b+c}`,c,5,`${x}×${b} = ${x*b}, nên ❓ = ${x*b+c} − ${x*b} = ${c}.`);
  }
  const x=ri(6,12),b=ri(4,12);
  if(Math.random()<.5)return q(`❓ : ${x} = ${b}`,x*b,12,`❓ = ${b} × ${x} = ${x*b}. (Muốn tìm số bị chia, lấy thương nhân số chia.)`);
  const kk=ri(2,4),aa=ri(2,9);
  return q(`(❓ + ${b}) × ${kk} = ${(aa+b)*kk}`,aa,4,`Chia trước: ${(aa+b)*kk} : ${kk} = ${aa+b}. Vậy ❓ = ${aa+b} − ${b} = ${aa}.`);
}
function genCompare(t){
  const x=ri(2,9),y=ri(2,9),u=ri(2,9),v=ri(2,9);
  const a=x*y,b=u*v;
  const ans=a>b?'>':a<b?'<':'=';
  return {q:`Điền dấu:  ${x} × ${y} 🔲 ${u} × ${v}`,ans,choices:['>','<','='],three:true,
    exp:`${x}×${y} = ${a} và ${u}×${v} = ${b}. Vì ${a} ${ans} ${b} nên điền dấu "${ans}".`};
}
function genSeq(t){
  const kind=t<=2?pick(['step','step','double']):pick(['step','double','fib','squareish','stepstep','accelStep','tribonacci']);
  if(kind==='accelStep'){ // hiệu hai số liền kề tăng dần 1,2,3,4,5...
    const s0=ri(1,6);const vals=[s0];
    for(let i=1;i<=5;i++)vals.push(vals[vals.length-1]+i);
    const ans=vals[vals.length-1]+6;
    return q(`Quy luật gì nhỉ? ${vals.join(', ')}, ❓`,ans,6,
      `Hiệu giữa hai số liền kề tăng dần: +1, +2, +3, +4, +5, rồi tiếp theo +6. Vậy ${vals[vals.length-1]} + 6 = ${ans}.`);
  }
  if(kind==='tribonacci'){ // mỗi số bằng tổng BA số liền trước
    const a=ri(1,3),b=ri(1,3),c=a+b;
    const seq=[a,b,c];
    for(let i=0;i<4;i++)seq.push(seq[seq.length-1]+seq[seq.length-2]+seq[seq.length-3]);
    const ans=seq[seq.length-1]+seq[seq.length-2]+seq[seq.length-3];
    return q(`Mỗi số bằng tổng BA số liền trước: ${seq.join(', ')}, ❓`,ans,5,
      `Cộng 3 số cuối: ${seq[seq.length-3]} + ${seq[seq.length-2]} + ${seq[seq.length-1]} = ${ans}.`);
  }
  if(kind==='step'){
    const step=t===1?pick([2,3]):t===2?pick([3,4,5,10]):pick([6,7,8,9,11,15]);
    const s0=ri(1,t*8);const seq=[0,1,2,3].map(i=>s0+step*i);
    return q(`Quy luật gì nhỉ? ${seq.join(', ')}, ❓`,s0+step*4,step,`Mỗi số tăng thêm ${step}: ${s0+step*3} + ${step} = ${s0+step*4}.`);
  }
  if(kind==='double'){
    const s0=pick([1,2,3]);const seq=[s0,s0*2,s0*4,s0*8];
    return q(`Quy luật gì nhỉ? ${seq.join(', ')}, ❓`,s0*16,s0*8,`Mỗi số GẤP ĐÔI số trước: ${s0*8} × 2 = ${s0*16}.`);
  }
  if(kind==='fib'){
    const a=ri(1,3),b=ri(1,4);const seq=[a,b,a+b,a+2*b,2*a+3*b];
    return q(`Mỗi số bằng tổng 2 số liền trước: ${seq.join(', ')}, ❓`,3*a+5*b,4,`Cộng 2 số cuối: ${a+2*b} + ${2*a+3*b} = ${3*a+5*b}.`);
  }
  if(kind==='squareish'){
    return q(`Quy luật gì nhỉ? 1, 4, 9, 16, ❓`,25,6,`Đó là các số chính phương: 1×1, 2×2, 3×3, 4×4... Tiếp theo là 5×5 = 25.`);
  }
  const s0=ri(1,10);const seq=[s0,s0+2,s0+5,s0+9];
  return q(`Bước nhảy tăng dần: ${seq.join(', ')}, ❓`,s0+14,4,`Bước nhảy là +2, +3, +4 nên bước tiếp theo là +5: ${s0+9} + 5 = ${s0+14}.`);
}
function genWord(t){
  const kids=['Lan','Minh','Hoa','Nam','Mai','Tú','Bin','Na'];
  const items=[['quả táo','🍎'],['viên kẹo','🍬'],['quyển vở','📒'],['viên bi','🔵'],['bông hoa','🌸'],['cái bánh','🧁']];
  const [it,em]=pick(items);const A=pick(kids);let B=pick(kids);while(B===A)B=pick(kids);
  if(t===1){
    const a=ri(3,12),b=ri(2,9),c=ri(1,5);
    return qs(`${em} ${A} có ${a} ${it}. Mẹ cho thêm ${b} ${it}, rồi ${A} tặng bạn ${c} ${it}. Hỏi ${A} còn bao nhiêu ${it}?`,a+b-c,4,
      `${a} + ${b} = ${a+b}, rồi tặng đi ${c} còn: ${a+b} − ${c} = ${a+b-c}.`);
  }
  if(t===2){
    const k=pick(['double','box','give']);
    if(k==='double'){const a=ri(5,20);
      return qs(`${em} ${A} có ${a} ${it}. ${B} có nhiều gấp ĐÔI ${A}. Hỏi cả hai bạn có tất cả bao nhiêu ${it}?`,a*3,a,
        `${B} có ${a}×2 = ${a*2}. Cả hai: ${a} + ${a*2} = ${a*3}.`)}
    if(k==='box'){const x=ri(3,6),b=ri(3,8),c=ri(2,9);
      return qs(`${em} Mỗi hộp có ${x} ${it}. ${A} mua ${b} hộp và ăn mất ${c} ${it}. Hỏi còn lại bao nhiêu ${it}?`,x*b-c,6,
        `Mua: ${x}×${b} = ${x*b} ${it}. Ăn mất ${c} còn: ${x*b} − ${c} = ${x*b-c}.`)}
    const b=ri(2,6),a=2*b+ri(2,14);
    return qs(`${em} ${A} có ${a} ${it}. Nếu ${A} cho ${B} ${b} ${it} thì hai bạn có số ${it} BẰNG NHAU. Hỏi ${B} đang có bao nhiêu ${it}?`,a-2*b,4,
      `Sau khi cho, mỗi bạn có ${a}−${b} = ${a-b}. Vậy ${B} đang có ${a-b} − ${b} = ${a-2*b} (ít hơn ${A} đúng ${2*b}).`);
  }
  if(t===3){
    const k=pick(['share','times','left']);
    if(k==='share'){const x=ri(4,9),b=ri(3,9),extra=ri(1,x-1);
      return qs(`${em} Cô giáo có ${x*b+extra} ${it}, chia đều cho ${x} bạn, mỗi bạn được nhiều nhất có thể. Hỏi còn THỪA mấy ${it}?`,extra,2,
        `${x*b+extra} : ${x} = ${b} dư ${extra}. Mỗi bạn được ${b}, còn thừa ${extra}.`)}
    if(k==='times'){const a=ri(6,15),x=ri(2,4),d=ri(2,10);
      return qs(`${em} ${A} có ${a} ${it}. ${B} có gấp ${x} lần ${A} nhưng làm rơi mất ${d} ${it}. Hỏi ${B} còn bao nhiêu ${it}?`,a*x-d,8,
        `${B} có ${a}×${x} = ${a*x}, rơi mất ${d} còn ${a*x-d}.`)}
    const total=ri(6,12)*4;
    return qs(`${em} Một cửa hàng có ${total} ${it}. Buổi sáng bán MỘT NỬA, buổi chiều bán MỘT NỬA số còn lại. Hỏi cuối ngày còn bao nhiêu ${it}?`,total/4,total/4,
      `Sáng bán còn ${total}:2 = ${total/2}. Chiều bán nửa số đó còn ${total/2}:2 = ${total/4}.`);
  }
  const k=pick(['sumdiff','avg','half']);
  if(k==='sumdiff'){const tsum=ri(15,45)*2,d=ri(2,10)*2;
    return qs(`${em} Hai bạn có tổng cộng ${tsum} ${it}. ${A} nhiều hơn ${B} là ${d} ${it}. Hỏi ${B} có bao nhiêu ${it}?`,(tsum-d)/2,5,
      `Bài tổng–hiệu: số BÉ = (tổng − hiệu) : 2 = (${tsum} − ${d}) : 2 = ${(tsum-d)/2}.`)}
  if(k==='avg'){const v1=ri(2,9)*2,v2=ri(2,9)*2;let s=v1+v2+ri(2,9)*2;const s3=s%3===0?s:s+(3-s%3);const v3=s3-v1-v2;
    return qs(`${em} Ba bạn có lần lượt ${v1}, ${v2} và ${v3} ${it}. Hỏi TRUNG BÌNH mỗi bạn có bao nhiêu ${it}?`,s3/3,4,
      `Trung bình cộng = tổng : số bạn = (${v1}+${v2}+${v3}) : 3 = ${s3} : 3 = ${s3/3}.`)}
  const x=ri(3,9);
  return qs(`${em} ${A} nghĩ: "Nếu mình có thêm ${x} ${it} nữa thì mình sẽ có gấp đôi số ${it} hiện tại." Hỏi ${A} đang có bao nhiêu ${it}?`,x,3,
    `Thêm ${x} mà thành gấp đôi, nghĩa là phần thêm ${x} đúng bằng số đang có → ${A} có ${x} ${it}.`);
}
function genGeo(t){
  if(t===1){
    const shapes=[['🔺','hình tam giác'],['🔵','hình tròn'],['🟩','hình vuông'],['⭐','ngôi sao']];
    const [target,tname]=pick(shapes);
    const n=ri(4,8);
    let arr=Array(n).fill(target);
    shapes.forEach(([s])=>{if(s!==target){for(let i=0;i<ri(2,4);i++)arr.push(s)}});
    arr=shuffle(arr);
    const html=arr.map((s,i)=>`<span style="animation-delay:${(i*0.13)%1.6}s">${s}</span>`).join('');
    return {q:`Đếm xem có bao nhiêu ${tname} ${target}?`,small:true,
      svg:`<div class="countRow">${html}</div>`,ans:n,choices:numChoices(n,2),
      exp:`Chỉ đếm ${target}, bỏ qua các hình khác — có đúng ${n} ${tname}.`};
  }
  if(t===2){
    if(Math.random()<.5){
      return {q:`Hình vuông kẻ cả 2 đường chéo. Hỏi có tất cả bao nhiêu hình TAM GIÁC?`,small:true,
        svg:`<svg viewBox="0 0 140 140" width="130"><g class="pulseShape"><rect x="10" y="10" width="120" height="120" fill="#eef6ff" stroke="#2b2350" stroke-width="4"/><line x1="10" y1="10" x2="130" y2="130" stroke="#2b2350" stroke-width="4"/><line x1="130" y1="10" x2="10" y2="130" stroke="#2b2350" stroke-width="4"/></g></svg>`,
        ans:8,choices:shuffle([4,6,8,10]),
        exp:`4 tam giác NHỎ (mỗi góc chéo) + 4 tam giác TO (mỗi tam giác to gồm 2 tam giác nhỏ cạnh nhau) = 8.`};
    }
    const a=ri(3,10);
    return {q:`Chu vi hình vuông có cạnh ${a} cm là bao nhiêu cm?`,small:true,svg:svgSquare(a),ans:a*4,choices:numChoices(a*4,8),
      exp:`Hình vuông có 4 cạnh bằng nhau: chu vi = ${a} × 4 = ${a*4} cm.`};
  }
  if(t===3){
    const k=pick(['peri','area','stick']);
    if(k==='stick'){
      const n=ri(2,5);
      return qs(`🔥 Xếp ${n} hình vuông thành một HÀNG NGANG bằng que diêm (các hình vuông kề nhau dùng chung 1 que). Hỏi cần tất cả bao nhiêu que diêm?`,3*n+1,3,
        `Hình vuông đầu cần 4 que, mỗi hình sau chỉ cần thêm 3 que (dùng chung 1 cạnh): 4 + 3×${n-1} = ${3*n+1}.`);
    }
    if(k==='peri'){const a=ri(5,14),b=ri(3,a-1);
      return {q:`Chu vi hình chữ nhật (dài ${a} cm, rộng ${b} cm) là bao nhiêu cm?`,small:true,svg:svgRect(a,b),ans:(a+b)*2,choices:numChoices((a+b)*2,8),
        exp:`Chu vi = (dài + rộng) × 2 = (${a} + ${b}) × 2 = ${(a+b)*2} cm.`}}
    const a=ri(4,12);
    return {q:`Diện tích hình vuông có cạnh ${a} cm là bao nhiêu cm²?`,small:true,svg:svgSquare(a),ans:a*a,choices:numChoices(a*a,10),
      exp:`Diện tích hình vuông = cạnh × cạnh = ${a} × ${a} = ${a*a} cm².`};
  }
  const k=pick(['areaL','periTrick','area','cornerCutPeri']);
  if(k==='cornerCutPeri'){ // cắt 4 góc hình chữ nhật — chu vi KHÔNG đổi (mẹo kinh điển)
    const a=ri(10,18),b=ri(6,a-2),c=ri(1,Math.floor(b/2)-1)||1,d=ri(1,Math.min(3,c+1));
    const peri=(a+b)*2;
    return {q:`✂️ Một mảnh giấy hình chữ nhật kích thước ${a} cm × ${b} cm. Người ta cắt bỏ ở mỗi góc một hình chữ nhật nhỏ kích thước ${c} cm × ${d} cm. Hỏi chu vi của hình mới sau khi cắt là bao nhiêu cm?`,small:true,
      svg:svgRect(a,b),
      ans:peri,choices:numChoices(peri,4*(c+d)),
      exp:`Mẹo kinh điển: mỗi góc bị cắt mất 2 cạnh (dài ${c} và ${d}) nhưng lại XUẤT HIỆN 2 cạnh mới đúng bằng ${c} và ${d} thay vào chỗ khuyết → chu vi KHÔNG ĐỔI! Chu vi mới vẫn bằng chu vi ban đầu = (${a} + ${b}) × 2 = ${peri} cm.`};
  }
  if(k==='areaL'){
    const a=ri(6,10),b=ri(6,10),c=ri(2,4),d=ri(2,4);
    const ans=a*b-c*d;
    return {q:`Hình chữ L: lấy hình chữ nhật ${a}×${b} cm rồi CẮT đi một góc hình chữ nhật ${c}×${d} cm. Hỏi diện tích còn lại bao nhiêu cm²?`,small:true,
      svg:`<svg viewBox="0 0 170 130" width="170"><g class="pulseShape"><path d="M20 20 H150 V${20+(b*8)-d*8} H${150-c*8} V${20+b*8} H20 Z" fill="#ffe3b3" stroke="#2b2350" stroke-width="4"/></g><text x="85" y="14" font-size="12" font-weight="bold" text-anchor="middle" fill="#2b2350">${a} cm</text><text x="10" y="70" font-size="12" font-weight="bold" fill="#2b2350">${b}</text></svg>`,
      ans,choices:numChoices(ans,10),
      exp:`Diện tích hình to: ${a}×${b} = ${a*b}. Diện tích phần cắt: ${c}×${d} = ${c*d}. Còn lại: ${a*b} − ${c*d} = ${ans} cm².`};
  }
  if(k==='periTrick'){
    let a=ri(6,12),b=ri(3,a-1);
    if((a+b)%2!==0)b=b>3?b-1:b+1;
    return qs(`🧩 Một sợi dây thép dài đúng bằng chu vi hình chữ nhật ${a}×${b} cm. Người ta uốn sợi dây thành một HÌNH VUÔNG. Hỏi cạnh hình vuông dài bao nhiêu cm?`,(a+b)/2,3,
      `Dây dài = chu vi HCN = (${a}+${b})×2 = ${(a+b)*2} cm. Hình vuông có 4 cạnh bằng nhau: ${(a+b)*2} : 4 = ${(a+b)/2} cm.`);
  }
  const a=ri(6,15),b=ri(3,9);
  return {q:`Diện tích hình chữ nhật (dài ${a} cm, rộng ${b} cm) là bao nhiêu cm²?`,small:true,svg:svgRect(a,b),ans:a*b,choices:numChoices(a*b,12),
    exp:`Diện tích = dài × rộng = ${a} × ${b} = ${a*b} cm².`};
}
function svgSquare(a){
  return `<svg viewBox="0 0 200 120" width="200"><g class="pulseShape"><rect x="55" y="15" width="90" height="90" fill="#bfe8ff" stroke="#2b2350" stroke-width="4" rx="4"/></g>
  <text x="100" y="10" font-size="14" font-weight="bold" text-anchor="middle" fill="#2b2350">${a} cm</text></svg>`;
}
function svgRect(a,b){
  const w=140,h=Math.max(40,Math.round(140*b/a*0.8));
  return `<svg viewBox="0 0 220 ${h+40}" width="220"><g class="pulseShape"><rect x="40" y="25" width="${w}" height="${h}" fill="#ffe3b3" stroke="#2b2350" stroke-width="4" rx="4"/></g>
  <text x="${40+w/2}" y="18" font-size="14" font-weight="bold" text-anchor="middle" fill="#2b2350">${a} cm</text>
  <text x="24" y="${25+h/2+5}" font-size="14" font-weight="bold" text-anchor="middle" fill="#2b2350">${b}</text></svg>`;
}
function genLogic(t){
  const k=pick(t<=2?['legs','odd','share2']:['legs','ageSum','double3','odd','duck','halfPlus','triadPattern']);
  if(k==='triadPattern'){ // cụm 3 đỉnh (trên, trái, phải liên tiếp) → số giữa = (đỉnh trái)² + 1
    const n0=ri(2,6);
    const cluster=i=>{const top=n0+i,left=top+1,right=top+2;return{top,left,right,mid:left*left+1}};
    const ex=[0,1,2].map(cluster), c4=cluster(3);
    const lines=ex.map((e,i)=>`Cụm ${i+1}: đỉnh trên là ${e.top}, đỉnh trái là ${e.left}, đỉnh phải là ${e.right} → Số ở giữa là ${e.mid}.`).join('<br>')
      +`<br>Cụm 4: đỉnh trên là ${c4.top}, đỉnh trái là ${c4.left}, đỉnh phải là ${c4.right} → Số ở giữa là ❓.`;
    return {q:`🧠 Quan sát quy luật các cụm số dưới đây và tìm số ở giữa của Cụm 4.`,small:true,
      svg:`<div class="eqlines">${lines}</div>`,ans:c4.mid,choices:numChoices(c4.mid,8),
      exp:`Nhận xét: số ở giữa luôn bằng (đỉnh trái)² + 1. Kiểm tra Cụm 1: đỉnh trái ${ex[0].left} → ${ex[0].left}²+1 = ${ex[0].mid} ✓. Áp dụng cho Cụm 4: đỉnh trái ${c4.left} → ${c4.left}² + 1 = ${c4.mid}.`};
  }
  if(k==='legs'){
    const g=ri(2,t<=2?5:7),d=ri(2,t<=2?4:6);
    const row='🐔'.repeat(g)+'🐶'.repeat(d);
    const html=[...row].map((s,i)=>`<span style="animation-delay:${(i*0.15)%1.6}s">${s}</span>`).join('');
    return {q:`Trong sân có ${g} con gà và ${d} con chó. Hỏi có tất cả bao nhiêu cái CHÂN?`,small:true,
      svg:`<div class="countRow">${html}</div>`,ans:g*2+d*4,choices:numChoices(g*2+d*4,6),
      exp:`Gà 2 chân: ${g}×2 = ${g*2}. Chó 4 chân: ${d}×4 = ${d*4}. Tổng: ${g*2} + ${d*4} = ${g*2+d*4} chân.`};
  }
  if(k==='duck'){
    const n=ri(3,7);
    return qs(`🦆 Một đàn vịt đi hàng dọc: có ${n-1} con đi TRƯỚC 1 con, và ${n-1} con đi SAU 1 con. Hỏi đàn vịt có ít nhất mấy con?`,n,2,
      `Chỉ cần ${n} con đi hàng dọc: con CUỐI có ${n-1} con đi trước, con ĐẦU có ${n-1} con đi sau. Vậy ít nhất ${n} con.`);
  }
  if(k==='ageSum'){
    const em=ri(6,10),gap=pick([20,22,24,25,26,28]);
    return qs(`🎂 Năm nay con ${em} tuổi, mẹ hơn con ${gap} tuổi. Hỏi TỔNG số tuổi của hai mẹ con là bao nhiêu?`,em*2+gap,6,
      `Mẹ ${em} + ${gap} = ${em+gap} tuổi. Tổng: ${em} + ${em+gap} = ${em*2+gap} tuổi.`);
  }
  if(k==='double3'){
    const st=pick([2,3]);
    return qs(`🧠 Số bí ẩn: gấp 3 liên tục ${st} → ${st*3} → ${st*9} → ❓`,st*27,st*9,
      `Mỗi lần nhân 3: ${st*9} × 3 = ${st*27}.`);
  }
  if(k==='share2'){
    const n=ri(1,5)*4;
    return qs(`🍕 Có ${n} chiếc bánh chia đều cho 2 bạn. Sau đó mỗi bạn lại chia đôi phần của mình để ăn 2 bữa. Hỏi MỖI BỮA mỗi bạn ăn mấy chiếc?`,n/4,2,
      `Mỗi bạn được ${n}:2 = ${n/2} chiếc, chia làm 2 bữa: ${n/2}:2 = ${n/4} chiếc mỗi bữa.`);
  }
  if(k==='halfPlus'){
    const x=ri(2,8);
    return qs(`🧱 Viên gạch nặng bằng ${x} kg cộng thêm NỬA viên gạch. Hỏi viên gạch nặng bao nhiêu kg?`,x*2,x,
      `NỬA viên gạch nặng đúng ${x} kg (vì cả viên = ${x} kg + nửa viên). Vậy cả viên = ${x}×2 = ${x*2} kg.`);
  }
  // Tìm số khác quy luật — 3 kiểu, không gợi ý sẵn
  const rule=pick(['evenOdd','oddEven','table']);
  if(rule==='evenOdd'){ // toàn chẵn, lẫn 1 lẻ
    const evens=shuffle([2,4,6,8,10,12,14,16,18,20]).slice(0,3);
    const odd=pick([3,5,7,9,11,13,15]);
    const arr=shuffle([...evens,odd]);
    return {q:`🧠 Số nào KHÁC quy luật với các số còn lại? ${arr.join(', ')}`,small:true,ans:odd,choices:shuffle([...arr]),
      exp:`${evens.sort((x,y)=>x-y).join(', ')} đều là số CHẴN (chia hết cho 2), riêng ${odd} là số LẺ.`};
  }
  if(rule==='oddEven'){ // toàn lẻ, lẫn 1 chẵn
    const odds=shuffle([3,5,7,9,11,13,15,17,19]).slice(0,3);
    const even=pick([2,4,6,8,10,12,14]);
    const arr=shuffle([...odds,even]);
    return {q:`🧠 Số nào KHÁC quy luật với các số còn lại? ${arr.join(', ')}`,small:true,ans:even,choices:shuffle([...arr]),
      exp:`${odds.sort((x,y)=>x-y).join(', ')} đều là số LẺ, riêng ${even} là số CHẴN.`};
  }
  // table: toàn bội của một số, lẫn 1 số không phải bội
  const base=pick([3,4,5]);
  const mults=shuffle([2,3,4,5,6,7,8].map(i=>base*i)).slice(0,3);
  let bad=pick(mults)+pick([1,-1,2,-2]);
  while(bad%base===0||bad<2||mults.includes(bad))bad+=1;
  const arr2=shuffle([...mults,bad]);
  return {q:`🧠 Số nào KHÁC quy luật với các số còn lại? ${arr2.join(', ')}`,small:true,ans:bad,choices:shuffle([...arr2]),
    exp:`${mults.sort((x,y)=>x-y).join(', ')} đều chia hết cho ${base} (nằm trong bảng nhân ${base}), riêng ${bad} thì không: ${bad} : ${base} còn dư.`};
}

/* ============ HIỂN THỊ CÂU HỎI + GIỜ + CÂU VÀNG ============ */
