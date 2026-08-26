/* `desc` là câu giới thiệu TÍNH CÁCH VÀ THẦN THOẠI của 10 Vị Thần Vệ Binh Vũ Trụ, hiện ở màn "BOSS XUẤT HIỆN". */
const BOSSES=[
 {emoji:'🐌',name:'Sora Ốc Sên Thời Gian',hp:130,minQ:6, atk:13,tier:1,time:22,arena:'',     mech:'none', mechTxt:'Không có gì đặc biệt',proj:'🌀',
  desc:'Vệ binh thời gian cõng trên lưng đồng hồ cát vũ trụ. Tốc độ bò chậm rãi nhưng ánh mắt chiếu sáng quang phổ — em hãy giữ nhịp suy nghĩ thật bình tĩnh.'},
 {emoji:'👾',name:'Sparky Quái Nhí Sấm Sét',hp:170,minQ:7, atk:15,tier:1,time:21,arena:'',     mech:'none', mechTxt:'Nhanh nhẹn hơn một chút',proj:'⚡',
  desc:'Tinh linh plasma linh hoạt, hai cái râu liên tục phát ra tia điện ma thuật. Nó rất thích chọc phá và xáo trộn các con số!' +
       ' "Bíp bíp! Đố em theo kịp tốc độ ánh sáng của Sparky đấy!"'},
 {emoji:'🧟',name:'Stitchwork Zombie Tri Thức',hp:215,minQ:8, atk:17,tier:2,time:21,arena:'night',mech:'heal', mechTxt:'💚 Tự hồi 8 máu mỗi khi em trả lời sai',proj:'📜',
  desc:'Học giả bất tử khoác áo choàng pháp thuật chằng chịt ký tự rune. Khi em tính sai, trang sách thần kỳ trên tay hắn sẽ tự khâu lành vết thương.' +
       ' "Tri thức là vĩnh cửu! Một câu sai là thêm một phép tự lành!"'},
 {emoji:'🦖',name:'Ignis Khủng Long Nham Thạch',hp:260,minQ:9, atk:18,tier:2,time:20,arena:'',     mech:'armor',mechTxt:'🛡️ Giáp nham thạch: giảm 4 sát thương mỗi đòn',proj:'☄️',
  desc:'Lớp vảy obsidian dính dung nhung cứng như kim cương, mỗi lần đập đuôi là rực cháy cả sàn đấu. Phải dùng tư duy nhạy bén mới đục thủng giáp.' +
       ' "Vảy rồng nham thạch bất xâm! Tung đòn chí mạng ra đây!"'},
 {emoji:'👹',name:'Vex Quỷ Đỏ Cuồng Nộ',hp:310,minQ:10,atk:20,tier:3,time:20,arena:'lava', mech:'rage', mechTxt:'😡 Nổi giận khi máu thấp: đánh mạnh gấp rưỡi',proj:'🔥',
  desc:'Chúa tể ngọn lửa mang đôi sừng rực cháy và hào quang đỏ thẫm. Càng mất máu hắn càng cuồng nộ và tung chưởng rực lửa gấp rưỡi!' +
       ' "Lửa bão bộc phát! Ngọn lửa tư duy của em có đủ thiêu rụi ta không?"'},
 {emoji:'🧛',name:'Nocturne Ma Cà Rồng Học Thuật',hp:360,minQ:11,atk:21,tier:3,time:20,arena:'night',mech:'drain',mechTxt:'🩸 Hút máu: đánh trúng em là hắn hồi máu',proj:'🦇',
  desc:'Quý tộc bóng đêm khoác áo choàng nhung đỏ thẫm, hấp thụ mana tư duy từ mỗi cú đánh trúng em để lấp đầy ly pha lê.' +
       ' "Một sơ suất nhỏ... và sinh khí tư duy của ngươi sẽ thuộc về ta!"'},
 {emoji:'🐉',name:'Glacius Rồng Băng Vĩnh Cửu',hp:420,minQ:12,atk:23,tier:4,time:19,arena:'ice',  mech:'armor',mechTxt:'🛡️ Vảy băng tuyệt đối: giảm 5 sát thương mỗi đòn',proj:'❄️',
  desc:'Băng long cổ đại ngàn năm, cánh và vảy đính ngọc tuyết lấp lánh. Đòn đánh của em chạm vào vảy băng sẽ bị đóng cọc và suy giảm sát thương.' +
       ' "Trái tim đóng băng tuyệt đối! Chỉ có tư duy rực cháy mới làm tan chảy ta!"'},
 {emoji:'👑',name:'Sol-Kahn Vua Quái Vật Thái Dương',hp:500,minQ:13,atk:25,tier:4,time:19,arena:'lava', mech:'rage', mechTxt:'😡 Cuồng nộ khi máu thấp + đòn đánh cực mạnh',proj:'☀️',
  desc:'Đội vương miện mặt trời, áo choàng hoàng gia dát vàng và mang hào quang thái dương rực rỡ. Khi bị dồn vào thế bí, hắn bộc phá toàn bộ năng lượng mặt trời!' +
       ' "Vương miện Thái Dương là trường tồn! Hãy chứng minh em xứng đáng vinh quang!"'},
 {emoji:'🧙',name:'Lumiel Pháp Sư Phân Số',hp:560,minQ:14,atk:26,tier:5,time:19,arena:'night',mech:'heal', mechTxt:'💚 Phép hồi máu: mỗi lần em sai hắn hồi 10 máu',proj:'✨',
  desc:'Đại pháp sư tinh tú vội vẩy gậy phép ngọc bích, thi triển trận pháp phân số để bảo hộ bản thân. Mỗi lần em sai, ngọc mana lại hồi 10 sinh lực cho hắn.' +
       ' "Toán học là quy luật vũ trụ! Một nhịp sai là ma pháp của ta sẽ chữa lành!"'},
 {emoji:'🐙',name:'Leviator Bạch Tuộc Vô Cực',hp:640,minQ:15,atk:28,tier:5,time:19,arena:'ice',  mech:'drain',mechTxt:'🩸 Tám xúc tu hút máu + giai đoạn 2 bộc phát vũ trụ',proj:'🌊',
  desc:'Thần thú vực thẫm 8 xúc tu ngọc bích thống trị đại dương vô cực. Khi HP xuống một nửa, hắn lột xác sang Dạng Vũ Trụ Cuồng Nộ — trận đấu huyền thoại cuối cùng!' +
       ' "Ngươi đã chạm tới rìa ngân hà! Hãy đối mặt với Thử Thách Vô Cực!"'},
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

