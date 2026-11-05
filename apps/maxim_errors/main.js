'use strict';
// Personal parody fork of aurelmarius/bmw-games Lucky Sevens.
const path=require('path');
const mgu=require('./kit/mgu');
const G=require('./kit/gauges');
const {TILT}=require('./kit/display');
const M=require('./model');
const S=require('./stories');
mgu.run({async start(ctx){
 const {ui,log}=ctx, parked=require('./kit/parked').watch(ctx,log);
 const file=path.join(ctx.dataDir,'maxim_errors.json');
 let saved=M.loadState(file,log), game=new M.Game({credits:1000000});
 let collection=Array.isArray(saved.collection)?saved.collection.filter(n=>Number.isInteger(n)&&S.events[n]):[];
 let total=Number.isFinite(saved.total)?saved.total:0, count=Number.isFinite(saved.count)?saved.count:0;
 let current=S.daily(S.dayKey()), receiptAt=Date.now(), spinning=false, cheap=false, music=false, album=false, erasedUntil=0;
 let message='Максим, добро пожаловать. Сегодня всё по максимуму.', messageUntil=Date.now()+6000;
 let last=Date.now(), visible=false, menu=false, ccu=null, touch=null;
 function save(){try{M.saveState(file,{collection,total,count,daily:saved.daily});}catch(e){log.warn('Save: '+e.message);}}
 function toast(t){message=t;messageUntil=Date.now()+4500;}
 function grab(){if(ctx.controller)ctx.controller.grab(visible&&!menu);}
 function daily(){current=S.daily(S.dayKey());receiptAt=Date.now();cheap=false;album=false;saved.daily=S.dayKey();save();toast('Чек дня: '+S.events[current][0]);}
 function spin(){menu=false;grab();if(parked.moving()){toast('Максим, сначала припаркуемся.');return;}if(spinning){game.slam();return;}album=false;cheap=false;music=false;erasedUntil=0;game.credits=1000000;game.free.left=0;game.spin();spinning=true;toast('Максим, выбираем повод встретиться с мастером…');}
 function erase(){if(spinning)return;erasedUntil=Date.now()+2200;toast('Ошибка стёрта. Надолго ли?');}
 function bargain(){if(spinning)return;cheap=true;toast('Назвали деталь ласково. Цена осталась прежней.');}
 function toggleMusic(){music=!music;toast(music?'Ремонт завершён. До следующей тихой песни.':'Музыка стихла. Ошибки вернулись.');}
 const actions=[spin,daily,erase,bargain,toggleMusic,()=>{album=!album;}];
 ['BTN_SPIN','BTN_DAY','BTN_ERASE','BTN_CHEAP','BTN_MUSIC','BTN_ALBUM'].forEach((id,i)=>ui.onClick(id,actions[i]));
 ui.onVisible((name,v)=>{if(name==='MAIN'){visible=v;grab();}});
 visible=!!(ui.isVisible&&ui.isVisible('MAIN'));grab();
 if(ctx.controller)ctx.controller.onInput(v=>{const k=Number(v.frontRotaryEncoderOperation),p=Number(v.frontRotaryEncoderPushButton),d=Number(v.frontRotaryEncoderDeflection),old=ccu;ccu={k,p,d};if(p===15&&d===15)return;const down=x=>x===1||x===2;if(down(p)&&!(old&&down(old.p)))spin();const tilt=TILT[d]&&!(old&&TILT[old.d]===TILT[d])?TILT[d]:null;if(tilt==='N')daily();if(tilt==='E')bargain();if(tilt==='S')erase();if(tilt==='W')Promise.resolve(ui.close('MAIN')).catch(e=>log.warn(String(e)));if(old&&k!==old.k){menu=true;if(ctx.controller)ctx.controller.grab(false);}});
 if(ctx.onTouch)ctx.onTouch((phase,x,y)=>{if(phase===1)touch={x,y,t:Date.now()};if(phase!==3||!touch)return;const tap=Math.abs(touch.x-x)<30&&Math.abs(touch.y-y)<30&&Date.now()-touch.t<600;touch=null;if(tap&&y>=422&&y<486&&x>=35&&x<1067)actions[Math.floor((x-35)/172)]();});
 const labels={cherry:'МАСЛО',lemon:'АКБ',bell:'КПП',bar:'ТУРБО',seven:'CHECK',diamond:'OK',wild:'MAX'};
 const colors={cherry:'#ffb547',lemon:'#f5d65c',bell:'#85b5ff',bar:'#58cce5',seven:'#ff805c',diamond:'#75e7ac',wild:'#d8a2ff'};
 function txt(cv,t,x,y,size=22,color='#edf2fa',align='left'){if(x>=1110 && y>104 && y>104+(spinning?40:Math.min(384,Math.max(40,(Date.now()-receiptAt)*0.5))))return;cv.text(t,x,y,size,color,{font:'bold',literal:true,align});}
 function icon(cv,name,x,y,c){
  const line=(a,b,d,e,w=2)=>cv.line(x+a,y+b,x+d,y+e,w,c);
  if(name==='cherry'){
   line(-19,-6,7,-6);line(7,-6,15,-13);line(15,-13,20,-11);line(20,-11,10,5);line(10,5,-14,5);line(-14,5,-19,-6);line(-12,-12,-3,-12);line(-8,-12,-8,-6);cv.circle(x+18,y+12,3,c);
  }else if(name==='lemon'){
   cv.roundRect(x-19,y-12,38,26,3,c);cv.roundRect(x-16,y-9,32,20,2,'#101b28');line(-13,-15,-6,-15,3);line(7,-15,14,-15,3);line(-11,1,-3,1);line(7,1,15,1);line(11,-3,11,5);
  }else if(name==='seven'){
   line(-18,-8,-8,-8);line(-8,-8,-4,-14);line(-4,-14,10,-14);line(10,-14,15,-7);line(15,-7,20,-7);line(20,-7,20,12);line(20,12,-13,12);line(-13,12,-18,5);line(-18,5,-18,-8);line(-23,-4,-23,6,3);line(-8,-18,5,-18,3);
  }else if(name==='bar'){
   cv.circle(x,y,17,c);cv.circle(x,y,13,'#101b28');cv.circle(x,y,6,c);line(12,-12,23,-12,4);line(23,-12,23,-3,4);for(let i=0;i<3;i++){const a=i*2.094;line(Math.cos(a)*7,Math.sin(a)*7,Math.cos(a+.5)*12,Math.sin(a+.5)*12,3);}
  }else if(name==='bell'){
   cv.circle(x,y,15,c);cv.circle(x,y,10,'#101b28');for(let i=0;i<8;i++){const a=i*Math.PI/4;line(Math.cos(a)*14,Math.sin(a)*14,Math.cos(a)*20,Math.sin(a)*20,4);}cv.circle(x,y,3,c);
  }else if(name==='diamond'){
   cv.circle(x,y,19,'#183b34');line(-10,0,-3,7,3);line(-3,7,12,-9,3);
  }else{
   for(let i=0;i<3;i++)cv.line(x-12+i*12,y-14,x-23+i*12,y+14,7,['#54c4ff','#435cdb','#f04b63'][i]);
  }
 }
 function render(){
  const now=Date.now();game.step(Math.min(100,now-last));last=now;
  for(const e of game.events.splice(0))if(e.type==='done'){spinning=false;current=S.choose(game.result);receiptAt=now;count++;total+=S.events[current][4];if(!collection.includes(current))collection.push(current);save();toast(S.events[current][1]);}
  if(erasedUntil&&now>=erasedUntil){erasedUntil=0;toast('Максим, я тоже по тебе скучала.');}
  const cv=ctx.canvas(1600,520).clear('#080b10');
  // Layered graphite housing, cold metal edges and restrained M accents.
  cv.roundRect(25,53,1054,353,20,'#202a37');
  cv.roundRect(26,54,1052,351,19,'#111821');
  cv.roundRect(40,64,1024,63,13,'#151f2c');
  for(let i=0;i<3;i++)cv.line(59+i*15,82,49+i*15,108,6,['#54c4ff','#435cdb','#f04b63'][i]);
  txt(cv,'МАКСИМУМ ОШИБОК',108,104,29);
  txt(cv,'MAXIM / GARAGE CLUB',1038,101,16,'#8295ac','right');
  for(let i=0;i<5;i++){
   const x=49+i*202;
   cv.roundRect(x,141,194,192,12,'#263547');
   cv.roundRect(x+1,142,192,190,11,'#090f18');
   cv.roundRect(x+5,204,184,62,7,'#1a2b3d');
   cv.line(x+10,205,x+184,205,1,'#3a536c');
   const r=game.reels[i],frac=r.pos-Math.floor(r.pos);
   for(let k=0;k<4;k++){
    const sym=game.symbolAt(i,k),y=143+(k-frac)*62;
    if(y<143||y+60>333)continue;
    icon(cv,sym,x+39,y+29,colors[sym]);
    txt(cv,labels[sym],x+119,y+36,22,colors[sym],'center');
   }
   cv.line(x+15,145,x+179,145,1,'#3b4859');
  }
  cv.line(37,234,44,234,4,'#ffb547');cv.line(1064,234,1071,234,4,'#ffb547');
  txt(cv,spinning?'Сервис уже ждёт…':S.events[current][0],51,371,25,'#ffbf68');
  txt(cv,'ЧЕКИ  '+String(count).padStart(2,'0')+'    /    КОЛЛЕКЦИЯ  '+collection.length+'/20',1047,369,15,'#8fa4bd','right');
  const buttons=['КРУТИТЬ','Чек дня','Стереть','Подешевле?','Музыку!','Коллекция'];
  buttons.forEach((b,i)=>{
   const x=35+i*172,active=i===0||(i===4&&music)||(i===5&&album);
   cv.roundRect(x,424,160,65,12,'#020509');
   cv.roundRect(x,422,160,62,12,active?(i===0?'#e9a748':'#294760'):'#253142');
   cv.roundRect(x+1,423,158,59,11,active?(i===0?'#ffbf62':'#203d54'):'#16212e');
   cv.line(x+16,425,x+144,425,1,active?'#ffe0aa':'#3a4b5e');
   txt(cv,b,x+80,460,20,i===0?'#24190b':'#d7e2ef','center');
  });
  txt(cv,'ЛИЧНЫЙ ГАРАЖ МАКСИМА',37,510,12,'#5f728a');
  txt(cv,'ИСТОРИЯ ОБСЛУЖИВАНИЯ   '+total+' €',1065,510,12,'#5f728a','right');
  // Receipt emerges from a recessed printer slot.
  cv.roundRect(1095,54,477,450,19,'#202b38');
  cv.roundRect(1096,55,475,448,18,'#121a24');
  txt(cv,'ВАШ ЧЕК',1120,86,16,'#aebfd1');
  cv.circle(1538,80,4,spinning?'#ffbf62':'#70d7b1');
  cv.roundRect(1110,100,447,14,5,'#030609');
  cv.line(1117,101,1550,101,1,'#36414c');
  const height=spinning?40:Math.min(384,Math.max(40,(now-receiptAt)*0.5));
  cv.roundRect(1117,110,434,height,2,'#030609');
  cv.roundRect(1110,104,434,height,2,'#f1eddf');
  // Rules and perforation are gated explicitly for the software renderer.
  if(height>106)for(let x=1130;x<1520;x+=12)cv.line(x,210,x+6,210,1,'#b5ae9e');
  if(height>218)for(let x=1130;x<1520;x+=12)cv.line(x,322,x+6,322,1,'#b5ae9e');
  for(let x=1116;x<1540;x+=14)cv.circle(x,104+height,4,'#121a24');
  const ink='#242b30';
  txt(cv,'MAXIMUM',1130,139,28,ink);
  txt(cv,'GARAGE CLUB / ЗАКАЗ № '+String(count).padStart(4,'0'),1130,164,13,'#77786e');
  txt(cv,'Максим',1130,194,19,ink);txt(cv,'Тариф: Максимум',1523,194,16,'#77786e','right');
  const ev=S.events[current],cost=ev[4];
  txt(cv,cheap?'Ласковый ремонт детальки':ev[3],1130,244,19,ink);
  txt(cv,'Послушали / позвали Серёгу',1130,275,17,'#5e655f');
  txt(cv,cost?'Кофе за счёт заведения':'Сегодня только хорошие новости',1130,301,16,'#77786e');
  txt(cv,'ИТОГО',1130,360,20,ink);txt(cv,cost+' €',1523,363,40,ink,'right');
  txt(cv,'Спасибо за вклад в отпуск мастера.',1130,393,15,'#77786e');
  txt(cv,'Машина вас любит, Максим.',1130,427,19,ink);
  txt(cv,'Её язык любви — подарки.',1130,453,18,ink);
  if(height>370){for(let i=0;i<74;i++){const w=(i*7%3)+1;cv.roundRect(1132+i*5,466,w,9,0,'#585e58');}}
  if(album){cv.roundRect(45,149,1012,252,12,'#142237');txt(cv,'БУКЕТ ВЛАДЕЛЬЦА / '+collection.length+' ИЗ 20',65,183,25);collection.slice(-8).forEach((id,i)=>txt(cv,S.events[id][0],65+(i%2)*490,222+Math.floor(i/2)*44,21,'#ffb547'));if(!collection.length)txt(cv,'Первое вращение откроет коллекцию.',65,245);}
  if(music||erasedUntil){cv.roundRect(45,151,1012,245,12,'#142237');txt(cv,music?'МУЗЫКУ ПОГРОМЧЕ':'ОШИБКА СТЁРТА',550,253,44,'#75e7ac','center');txt(cv,music?'Ремонт завершён. До тихой песни.':'Сейчас вернётся. Она вас любит.',550,309,24,'#edf2fa','center');}
  if(parked.moving()){cv.roundRect(45,151,1012,245,12,'#142237');txt(cv,'Максим, сначала припаркуемся.',550,272,36,'#ffb547','center');}
  const followup=!spinning&&now-receiptAt>=4500&&now-receiptAt<9000; G.frame(cv,ctx.theme(),['Максимум ошибок'],0,[(followup||message&&now<messageUntil)&&{text:followup?S.events[current][2]:message,color:'accent'}]);
  return ui.image('MAIN_GFX',cv);
 }
 if(saved.daily!==S.dayKey())daily();
 ctx.loop('MAIN',8,render);await render();
}});

