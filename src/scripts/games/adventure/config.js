/* `desc` là câu giới thiệu TÍNH CÁCH, hiện ở màn "BOSS XUẤT HIỆN". Nó phải nhắc
   đúng thứ trẻ NHÌN THẤY trên hình (cái vỏ, vết khâu, xúc tu...) — nếu tả một đằng
   vẽ một nẻo thì lại rơi vào đúng cái lỗi vừa sửa. */
const BOSSES=[
 {emoji:'🐌',name:'Ốc Sên Chậm Chạp',hp:130,minQ:6, atk:13,tier:1,time:22,arena:'',     mech:'none', mechTxt:'Không có gì đặc biệt',proj:'🍃',
  desc:'Cõng cái vỏ nặng trịch, bò tới đâu ngủ gật tới đó. Hai con mắt trên cuống cứ ngó nghiêng tìm chỗ trốn — em cứ bình tĩnh mà tính.'},
 {emoji:'👾',name:'Quái Nhí Tinh Nghịch',hp:170,minQ:7, atk:15,tier:1,time:21,arena:'',     mech:'none', mechTxt:'Nhanh nhẹn hơn một chút',proj:'🟣',
  desc:'Bé tí, chưa mọc sừng, hai cái râu ngoe nguẩy suốt ngày. Nó không mạnh — chỉ nhanh nhẹn và thích chọc phá thôi.'},
 {emoji:'🧟',name:'Zombie Lười Học',hp:215,minQ:8, atk:17,tier:2,time:21,arena:'night',mech:'heal', mechTxt:'💚 Tự hồi 8 máu mỗi khi em trả lời sai',proj:'🦴',
  desc:'Cả người chằng chịt vết khâu vì bị đánh gục hoài mà cứ tự vá lại. Em sai một câu là mấy đường chỉ ấy tự liền — đừng cho nó cơ hội.'},
 {emoji:'🦖',name:'Khủng Long Giáp Sắt',hp:260,minQ:9, atk:18,tier:2,time:20,arena:'',     mech:'armor',mechTxt:'🛡️ Giáp cứng: giảm 4 sát thương mỗi đòn',proj:'🪨',
  desc:'Dãy vảy nhọn chạy dọc sống lưng cứng như sắt, đuôi quật một cái là rung cả sàn đấu. Đòn của em bị vảy nuốt bớt, phải đánh nhiều hơn.'},
 {emoji:'👹',name:'Quỷ Đỏ Nóng Tính',hp:310,minQ:10,atk:20,tier:3,time:20,arena:'lava', mech:'rage', mechTxt:'😡 Nổi giận khi máu thấp: đánh mạnh gấp rưỡi',proj:'🔥',
  desc:'Đôi sừng đỏ rực và cặp nanh lúc nào cũng nhe ra. Càng gần thua nó càng điên tiết, đánh mạnh gấp rưỡi — hạ nhanh khi còn kịp.'},
 {emoji:'🧛',name:'Ma Cà Rồng Toán Học',hp:360,minQ:11,atk:21,tier:3,time:20,arena:'night',mech:'drain',mechTxt:'🩸 Hút máu: đánh trúng em là hắn hồi máu',proj:'🦇',
  desc:'Khoác áo choàng, tai dơi dỏng lên nghe từng nhịp thở, hai cái nanh dài chờ sẵn. Mỗi đòn trúng em là một ngụm máu cho hắn.'},
 {emoji:'🐉',name:'Rồng Băng Vĩnh Cửu',hp:420,minQ:12,atk:23,tier:4,time:19,arena:'ice',  mech:'armor',mechTxt:'🛡️ Vảy băng: giảm 5 sát thương mỗi đòn',proj:'❄️',
  desc:'Cánh băng, đuôi băng, vảy lưng cũng bằng băng — thứ băng ngàn năm không tan. Đòn của em chạm vào là lạnh cóng và yếu đi.'},
 {emoji:'👑',name:'Vua Quái Vật Tối Thượng',hp:500,minQ:13,atk:25,tier:4,time:19,arena:'lava', mech:'rage', mechTxt:'😡 Cuồng nộ khi máu thấp + đòn đánh cực mạnh',proj:'☄️',
  desc:'Vương miện vàng, áo choàng đỏ, sừng cao ngất — kẻ cai trị cả chín con quái trước. Chạm tới vương miện là nó nổi cơn cuồng nộ.'},
 {emoji:'🧙',name:'Pháp Sư Phân Số',hp:560,minQ:14,atk:26,tier:5,time:19,arena:'night',mech:'heal', mechTxt:'💚 Phép hồi máu: mỗi lần em sai hắn hồi 10 máu',proj:'✨',
  desc:'Mũ chóp che nửa mặt, cây gậy đầu gắn viên ngọc sáng. Mỗi lần em tính sai một phân số là viên ngọc loé lên và hắn lành lại.'},
 {emoji:'🐙',name:'Bạch Tuộc Vô Cực',hp:640,minQ:15,atk:28,tier:5,time:19,arena:'ice',  mech:'drain',mechTxt:'🩸 Tám xúc tu hút máu + giai đoạn 2 cực mạnh',proj:'🌊',
  desc:'Tám cái xúc tu quấn kín sàn đấu, mỗi cái là một cái miệng hút. Hạ được một nửa máu là nó lột xác sang dạng hai — trận cuối cùng, khó nhất.'},
];
/* Giới hạn sát thương mỗi đòn = máu boss / số câu tối thiểu.
   Nhờ vậy dù có combo, chí mạng hay câu vàng cũng KHÔNG THỂ
   hạ boss trong vài câu — luôn phải trả lời đúng ít nhất minQ câu. */
function dmgCap(){const b=BOSSES[G.bossIndex];return Math.ceil(b.hp/b.minQ);}
const HERO_PROJ=['⚡','🔵','✨','💫'];

/* ============ CỬA HÀNG VẬT PHẨM (mua bằng xu 💰) ============ */
const SHOP=[
 // ---- Nâng cấp dùng suốt hành trình hiện tại (mua nhiều lần, giá tăng dần) ----
 {id:'atk',   icon:'🗡️',name:'Kiếm Sấm Sét',  desc:'+4 sát thương mỗi đòn trong hành trình', base:80, kind:'perk'},
 {id:'hp',    icon:'💖',name:'Trái Tim Titan', desc:'+25 máu tối đa và hồi đầy máu',          base:80, kind:'perk'},
 {id:'time',  icon:'⏳',name:'Đồng Hồ Cát Thần',desc:'+3 giây suy nghĩ cho mỗi câu',          base:70, kind:'perk'},
 {id:'def',   icon:'🦺',name:'Áo Giáp Vàng',   desc:'Giảm 4 sát thương từ mọi đòn của boss',  base:80, kind:'perk'},
 {id:'luck',  icon:'🍀',name:'Cỏ May Mắn',     desc:'Gấp đôi cơ hội rơi tim hồi máu',         base:60, kind:'perk'},
 {id:'gold',  icon:'💛',name:'La Bàn Vàng',    desc:'Câu hỏi vàng xuất hiện gấp đôi',         base:60, kind:'perk'},
 // ---- Vật phẩm mang vào trận, bấm để dùng khi cần ----
 {id:'potion',icon:'🧪',name:'Bình Máu Thần',  desc:'Hồi 50 máu ngay giữa trận',              base:50, kind:'inv'},
 {id:'hint',  icon:'💡',name:'Kính Lúp 50/50', desc:'Xoá bớt 2 đáp án sai của câu đang làm',  base:40, kind:'inv'},
 {id:'freeze',icon:'⏱️',name:'Đồng Hồ Dừng',   desc:'Dừng hẳn đếm giờ cho câu đang làm',      base:45, kind:'inv'},
 {id:'shield',icon:'🛡️',name:'Khiên Chắn Thần',desc:'Chặn hoàn toàn đòn đánh tới của boss',   base:55, kind:'inv'},
 {id:'bomb',  icon:'💣',name:'Bom Toán Học',   desc:'Nổ trừ 18% máu boss (1 quả mỗi trận)',   base:70, kind:'inv'},
 {id:'revive',icon:'🔮',name:'Bùa Hồi Sinh',   desc:'Tự sống lại với 50 máu khi gục ngã',     base:120,kind:'inv',max:2},
];
function itemPrice(it){
  if(it.kind==='perk')return it.base+(G.perks?.[it.id]||0)*30; // càng mua càng đắt
  return it.base;
}
function itemOwned(it){
  return it.kind==='perk'?(G.perks?.[it.id]||0):it.kind==='inv'?(G.inv?.[it.id]||0):0;
}

