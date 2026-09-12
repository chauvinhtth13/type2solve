/* `desc` là câu giới thiệu TÍNH CÁCH VÀ THẦN THOẠI của 10 Vị Thần Vệ Binh Vũ Trụ, hiện ở màn "BOSS XUẤT HIỆN". */
const BOSSES=[
 {emoji:'🐌',name:'Sora Ốc Sên Thời Gian',hp:130,minQ:6, atk:13,tier:1,time:22,arena:'',     mech:'none', mechTxt:'Không có gì đặc biệt',proj:'🌀',
  desc:'Sora mang chiếc đồng hồ nhỏ bên chiếc vỏ xoắn màu bánh quy. Bạn ấy thích đi chậm, ngắm mây và chờ em suy nghĩ thật kỹ.'},
 {emoji:'👾',name:'Sparky Tinh Linh Sấm Sét',hp:170,minQ:7, atk:15,tier:1,time:21,arena:'',     mech:'none', mechTxt:'Nhanh nhẹn hơn một chút',proj:'⚡',
  desc:'Sparky là tinh linh bé xíu có đôi tai tia chớp và chiếc đuôi luôn tràn năng lượng. Mỗi câu đúng làm ngôi sao trên bụng bạn ấy sáng lên!'},
 {emoji:'🧟',name:'Stitchwork Gấu Bông Tri Thức',hp:215,minQ:8, atk:17,tier:2,time:21,arena:'night',mech:'heal', mechTxt:'💚 Tự hồi 8 máu mỗi khi em trả lời sai',proj:'📜',
  desc:'Stitchwork là chú gấu bông mê đọc sách, với miếng vá xinh xắn trên trán. Cuốn sách phép thuật giúp bạn ấy hồi sức mỗi khi em trả lời sai.'},
 {emoji:'🦖',name:'Ignis Rồng Con Nham Thạch',hp:260,minQ:9, atk:18,tier:2,time:20,arena:'',     mech:'armor',mechTxt:'🛡️ Giáp nham thạch: giảm 4 sát thương mỗi đòn',proj:'☄️',
  desc:'Ignis là rồng con thích cuộn mình bên những viên đá ấm. Đôi sừng màu mật ong và lớp vảy nhỏ bảo vệ bạn ấy, nên em hãy kiên nhẫn từng câu nhé.'},
 {emoji:'👹',name:'Vex Tiểu Quỷ Kẹo Ngọt',hp:310,minQ:10,atk:20,tier:3,time:20,arena:'lava', mech:'rage', mechTxt:'😡 Nổi giận khi máu thấp: đánh mạnh gấp rưỡi',proj:'🔥',
  desc:'Vex có đôi cánh hồng và trái tim kẹo ngọt trên bụng. Khi gần hết máu, bạn ấy phồng má quyết tâm và đánh mạnh hơn một chút!'},
 {emoji:'🧛',name:'Nocturne Dơi Nhỏ Ánh Trăng',hp:360,minQ:11,atk:21,tier:3,time:20,arena:'night',mech:'drain',mechTxt:'🩸 Hút máu: đánh trúng em là hắn hồi máu',proj:'🦇',
  desc:'Nocturne là chú dơi hiền luôn đeo mặt trăng bé xíu trước ngực. Chiếc áo choàng mềm giúp bạn ấy lấy lại sức sau mỗi đòn đánh trúng.'},
 {emoji:'🐉',name:'Glacius Rồng Tuyết Pha Lê',hp:420,minQ:12,atk:23,tier:4,time:19,arena:'ice',  mech:'armor',mechTxt:'🛡️ Vảy băng tuyệt đối: giảm 5 sát thương mỗi đòn',proj:'❄️',
  desc:'Glacius là rồng tuyết nhỏ với đôi cánh trong veo như pha lê. Những bông tuyết trên bụng và lớp vảy băng giúp bạn ấy đỡ một phần sát thương.'},
 {emoji:'👑',name:'Sol-Kahn Sư Tử Thái Dương',hp:500,minQ:13,atk:25,tier:4,time:19,arena:'lava', mech:'rage', mechTxt:'😡 Cuồng nộ khi máu thấp + đòn đánh cực mạnh',proj:'☀️',
  desc:'Sol-Kahn đội vương miện vàng hơi to so với chiếc đầu tròn. Chú sư tử nhỏ có bờm nắng ấm và luôn cố gắng hết mình khi gần hết máu.'},
 {emoji:'🧙',name:'Lumiel Pháp Sư Rừng Nấm',hp:560,minQ:14,atk:26,tier:5,time:19,arena:'night',mech:'heal', mechTxt:'💚 Phép hồi máu: mỗi lần em sai hắn hồi 10 máu',proj:'✨',
  desc:'Lumiel sống trong khu rừng nấm, đội chiếc mũ tím chấm kem và mang cây gậy nảy mầm. Phép thuật của lá non giúp bạn ấy hồi sức khi em trả lời sai.'},
 {emoji:'🐙',name:'Leviator Bạch Tuộc Ngọc Trai',hp:640,minQ:15,atk:28,tier:5,time:19,arena:'ice',  mech:'drain',mechTxt:'🩸 Tám xúc tu hút máu + giai đoạn 2 bộc phát vũ trụ',proj:'🌊',
  desc:'Leviator là bạch tuộc tròn xoe với vương miện ngọc trai. Bạn ấy ôm một ngôi sao biển và dùng những xúc tu mềm để thử thách tư duy của em.'},
];
/* Giới hạn sát thương mỗi đòn = máu boss / số câu tối thiểu. */
function dmgCap(){const b=BOSSES[G.bossIndex];return Math.ceil(b.hp/b.minQ);}
const HERO_PROJ=['⚡','🔵','✨','💫'];

/* ============ CỬA HÀNG VẬT PHẨM BẢO VẬT HOÀNG GIA (mua bằng xu 💰) ============ */
const SHOP=[
 // ---- Nâng cấp dùng suốt hành trình hiện tại (mua nhiều lần, giá tăng dần) ----
 {id:'atk',   icon:'🗡️',name:'Kiếm Sấm Sét Arcane', desc:'+4 sát thương mỗi đòn trong hành trình', base:80, kind:'perk'},
 {id:'hp',    icon:'💖',name:'Trái Tim Titan Vũ Trụ', desc:'+25 máu tối đa và hồi đầy máu',          base:80, kind:'perk'},
 {id:'time',  icon:'⏳',name:'Đồng Hồ Cát Chronos',  desc:'+3 giây suy nghĩ cho mỗi câu',          base:70, kind:'perk'},
 {id:'def',   icon:'🦺',name:'Giáp Thánh Solar',     desc:'Giảm 4 sát thương từ mọi đòn của boss',  base:80, kind:'perk'},
 {id:'luck',  icon:'🍀',name:'Cỏ May Mắn Starlight',  desc:'Gấp đôi cơ hội rơi tim hồi máu',         base:60, kind:'perk'},
 {id:'gold',  icon:'💛',name:'La Bàn Vàng Tinh Tú',  desc:'Câu hỏi vàng xuất hiện gấp đôi',         base:60, kind:'perk'},
 // ---- Vật phẩm mang vào trận, bấm để dùng khi cần ----
 {id:'potion',icon:'🧪',name:'Bình Máu Phượng Hoàng',desc:'Hồi 50 máu ngay giữa trận',              base:50, kind:'inv'},
 {id:'hint',  icon:'💡',name:'Kính Thấu Thị 50/50',  desc:'Xoá bớt 2 đáp án sai của câu đang làm',  base:40, kind:'inv'},
 {id:'freeze',icon:'⏱️',name:'Bùa Ngưng Thời Gian', desc:'Dừng hẳn đếm giờ cho câu đang làm',      base:45, kind:'inv'},
 {id:'shield',icon:'🛡️',name:'Khiên Chắn Aegis',     desc:'Chặn hoàn toàn đòn đánh tới của boss',   base:55, kind:'inv'},
 {id:'bomb',  icon:'💣',name:'Bom Phép Thần Sấm',    desc:'Nổ trừ 18% máu boss (1 quả mỗi trận)',   base:70, kind:'inv'},
 {id:'revive',icon:'🔮',name:'Bùa Hồi Sinh Phượng Hoàng',desc:'Tự sống lại với 50 máu khi gục ngã', base:120,kind:'inv',max:2},
];
function itemPrice(it){
  if(it.kind==='perk')return it.base+(G.perks?.[it.id]||0)*30; // càng mua càng đắt
  return it.base;
}
function itemOwned(it){
  return it.kind==='perk'?(G.perks?.[it.id]||0):it.kind==='inv'?(G.inv?.[it.id]||0):0;
}

