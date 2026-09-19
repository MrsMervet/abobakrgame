(() => {
  'use strict';

  const QUESTIONS = [
    { q: 'ما الاسم الحقيقي لأبي بكر الصديق رضي الله عنه؟', a: 'عبد الله بن عثمان', choices: ['عبد الله بن عثمان','عثمان بن عفان','عبد الرحمن بن عوف'] },
    { q: 'ما كنية عبد الله بن عثمان رضي الله عنه؟', a: 'أبو بكر', choices: ['أبو بكر','أبو حفص','أبو هريرة'] },
    { q: 'لماذا لُقِّب أبو بكر بـ «الصِّدِّيق»؟', a: 'لتصديقه النبي ﷺ في خبر الإسراء والمعراج', choices: ['لتصديقه النبي ﷺ في خبر الإسراء والمعراج','لأنه كان قائدًا مشهورًا','لأنه كان شاعرًا'] },
    { q: 'إلى أي قبيلة ينتمي أبو بكر رضي الله عنه؟', a: 'قريش من بني تيم', choices: ['قريش من بني تيم','الأوس','ثقيف'] },
    { q: 'ما المهنة التي عُرف بها أبو بكر رضي الله عنه في الجاهلية؟', a: 'التجارة في الثياب', choices: ['التجارة في الثياب','الحدادة','الزراعة'] },
    { q: 'من رافق النبي ﷺ في الهجرة إلى المدينة؟', a: 'أبو بكر الصديق', choices: ['أبو بكر الصديق','خالد بن الوليد','أبو سفيان'] },
    { q: 'أين مكث النبي ﷺ وأبو بكر أثناء الهجرة ثلاثة أيام؟', a: 'غار ثور', choices: ['غار ثور','غار حراء','جبل أُحد'] },
    { q: 'من الصحابي الذي اشتراه أبو بكر رضي الله عنه وأعتقه من العذاب؟', a: 'بلال بن رباح', choices: ['بلال بن رباح','زيد بن ثابت','سلمان الفارسي'] },
    { q: 'ماذا تولى أبو بكر رضي الله عنه بعد وفاة النبي ﷺ؟', a: 'خلافة المسلمين', choices: ['خلافة المسلمين','إمارة مكة فقط','قيادة التجارة'] },
    { q: 'كيف تعامل أبو بكر رضي الله عنه مع المرتدين ومانعي الزكاة؟', a: 'حاربهم حتى استقرت الدولة', choices: ['حاربهم حتى استقرت الدولة','تركهم دون موقف','غادر المدينة'] }
  ];

  const $ = (s) => document.querySelector(s);
  const els = {
    start: $('#sceneStart'), game: $('#sceneGame'), end: $('#sceneEnd'),
    playerName: $('#playerName'), startBtn: $('#startBtn'), replayBtn: $('#replayBtn'), homeBtn: $('#homeBtn'),
    soundBtn: $('#soundBtn'), fullscreenBtn: $('#fullscreenBtn'),
    hudName: $('#hudName'), hudScore: $('#hudScore'), hudCombo: $('#hudCombo'), hudProgressText: $('#hudProgressText'), hudProgressBar: $('#hudProgressBar'),
    questionNo: $('#questionNo'), questionText: $('#questionText'), arena: $('#arena'), targets: $('#targets'), crosshair: $('#crosshair'), blaster: $('#blaster'),
    shotLayer: $('#shotLayer'), particleLayer: $('#particleLayer'), toast: $('#toast'),
    resultName: $('#resultName'), resultMessage: $('#resultMessage'), resultPercent: $('#resultPercent'), resultScore: $('#resultScore'), resultAccuracy: $('#resultAccuracy'), resultBestCombo: $('#resultBestCombo'), resultBadge: $('#resultBadge'), confetti: $('#confetti')
  };

  let state = { player:'', index:0, score:0, shots:0, correctShots:0, combo:1, bestCombo:1, locked:false, targets:[], raf:0, sound:true };
  let audioCtx = null;

  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const shuffle = arr => {
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  };

  function showScene(target){
    [els.start,els.game,els.end].forEach(s=>s.classList.remove('scene--active'));
    target.classList.add('scene--active');
  }

  function ensureAudio(){
    if(!state.sound) return;
    if(!audioCtx){ const AC=window.AudioContext||window.webkitAudioContext; if(AC) audioCtx=new AC(); }
    if(audioCtx?.state==='suspended') audioCtx.resume();
  }
  function tone(freq=440,d=.1,type='sine',gain=.035,delay=0){
    if(!state.sound) return;
    ensureAudio(); if(!audioCtx) return;
    const t=audioCtx.currentTime+delay, o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+d+.02);
  }
  const sfx = {
    shoot(){tone(210,.055,'square',.028);tone(118,.08,'square',.018,.025)},
    good(){tone(590,.11,'triangle',.04);tone(790,.13,'triangle',.04,.085);tone(990,.18,'sine',.035,.17)},
    bad(){tone(230,.12,'sawtooth',.022);tone(160,.16,'sawtooth',.018,.07)},
    start(){tone(420,.09,'triangle',.025);tone(620,.11,'triangle',.03,.08);tone(830,.14,'triangle',.03,.16)},
    end(){tone(523,.1,'triangle',.035);tone(659,.1,'triangle',.035,.1);tone(784,.12,'triangle',.04,.2);tone(1047,.25,'sine',.04,.32)}
  };

  function startGame(){
    ensureAudio(); sfx.start();
    state.player = els.playerName.value.trim() || 'بطلنا الصغير';
    state.index=0;state.score=0;state.shots=0;state.correctShots=0;state.combo=1;state.bestCombo=1;state.locked=false;
    els.hudName.textContent=state.player;
    showScene(els.game);
    setTimeout(loadQuestion,80);
  }

  function stopMotion(){ if(state.raf){cancelAnimationFrame(state.raf);state.raf=0;} }

  function loadQuestion(){
    stopMotion(); state.locked=false; state.targets=[]; els.targets.innerHTML=''; hideToast();
    const item=QUESTIONS[state.index];
    els.questionNo.textContent=String(state.index+1);
    els.questionText.textContent=item.q;
    updateHud();

    requestAnimationFrame(()=>{
      const rect=els.arena.getBoundingClientRect();
      const targetW = innerWidth<620 ? 145 : clamp(rect.width*.17,160,240);
      const targetH = innerWidth<620 ? 82 : 100;
      const maxY=Math.max(260,rect.height-215);
      const zones=[.06,.36,.67];
      shuffle(item.choices).forEach((text,i)=>{
        const el=document.createElement('button');
        el.className='target';el.type='button';el.dataset.answer=text;el.dataset.tone=['pink','gold','mint'][i%3];el.textContent=text;
        const x=clamp(rect.width*zones[i]+(Math.random()*30-15),12,rect.width-targetW-12);
        const y=38+Math.random()*Math.max(40,maxY-70);
        const obj={el,x,y,vx:(.48+Math.random()*.45)*(Math.random()>.5?1:-1),vy:(.28+Math.random()*.35)*(Math.random()>.5?1:-1),w:targetW,h:targetH,phase:Math.random()*Math.PI*2};
        el.style.left=x+'px';el.style.top=y+'px';
        el.addEventListener('click',e=>{e.stopPropagation();shootAt(e.clientX,e.clientY,obj);});
        el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();const r=el.getBoundingClientRect();shootAt(r.left+r.width/2,r.top+r.height/2,obj);}});
        els.targets.appendChild(el);state.targets.push(obj);
      });
      animateTargets();
    });
  }

  function animateTargets(){
    const frame=()=>{
      const rect=els.arena.getBoundingClientRect();
      const ceiling=24, floor=Math.max(210,rect.height-208);
      state.targets.forEach(o=>{
        o.phase+=.015;o.x+=o.vx;o.y+=o.vy+Math.sin(o.phase)*.1;
        if(o.x<10||o.x>rect.width-o.w-10)o.vx*=-1;
        if(o.y<ceiling||o.y>floor-o.h)o.vy*=-1;
        o.x=clamp(o.x,10,Math.max(10,rect.width-o.w-10));o.y=clamp(o.y,ceiling,Math.max(ceiling,floor-o.h));
        o.el.style.left=o.x+'px';o.el.style.top=o.y+'px';
      });
      state.raf=requestAnimationFrame(frame);
    };
    frame();
  }

  function updateHud(){
    els.hudScore.textContent=String(state.score).padStart(4,'0');
    els.hudCombo.textContent='×'+state.combo;
    els.hudProgressText.textContent=`${state.index+1} من ${QUESTIONS.length}`;
    els.hudProgressBar.style.width=`${((state.index+1)/QUESTIONS.length)*100}%`;
  }

  function aimAt(clientX,clientY){
    const r=els.arena.getBoundingClientRect();
    const x=clamp(clientX-r.left,0,r.width), y=clamp(clientY-r.top,0,r.height);
    els.crosshair.style.left=x+'px';els.crosshair.style.top=y+'px';
    const baseX=r.width/2, baseY=r.height-64;
    const ang=Math.atan2(y-baseY,x-baseX)*180/Math.PI;
    els.blaster.style.transform=`translateX(-50%) rotate(${clamp(ang,-82,-8)}deg)`;
  }

  function drawShot(clientX,clientY){
    const r=els.arena.getBoundingClientRect();
    const x=clamp(clientX-r.left,0,r.width), y=clamp(clientY-r.top,0,r.height);
    const sx=r.width/2+90, sy=r.height-61;
    const dx=x-sx,dy=y-sy,len=Math.hypot(dx,dy),ang=Math.atan2(dy,dx)*180/Math.PI;
    const beam=document.createElement('i');beam.className='shot';beam.style.left=sx+'px';beam.style.top=sy+'px';beam.style.width=len+'px';beam.style.transform=`rotate(${ang}deg)`;els.shotLayer.appendChild(beam);setTimeout(()=>beam.remove(),220);
    els.blaster.classList.remove('fire');void els.blaster.offsetWidth;els.blaster.classList.add('fire');
  }

  function shootAt(clientX,clientY,obj){
    if(state.locked) return;
    ensureAudio();state.shots++;sfx.shoot();aimAt(clientX,clientY);drawShot(clientX,clientY);
    if(!obj) return;
    const correct = obj.el.dataset.answer===QUESTIONS[state.index].a;
    const ar=els.arena.getBoundingClientRect(), tr=obj.el.getBoundingClientRect();
    const px=tr.left-ar.left+tr.width/2, py=tr.top-ar.top+tr.height/2;
    burst(px,py,correct);
    if(correct){
      state.locked=true;state.correctShots++;state.score+=100+(state.combo-1)*20;state.combo++;state.bestCombo=Math.max(state.bestCombo,state.combo-1);updateHud();
      state.targets.forEach(o=>o.el.classList.add('locked'));obj.el.classList.add('is-hit');showToast(`إصابة رائعة! +${100+(state.combo-2)*20} نقطة ⭐`,'good');sfx.good();
      setTimeout(()=>{state.index++; if(state.index>=QUESTIONS.length) finish(); else loadQuestion();},1050);
    }else{
      state.combo=1;updateHud();obj.el.classList.remove('is-wrong');void obj.el.offsetWidth;obj.el.classList.add('is-wrong');showToast('قريب جدًا… جرّب هدفًا آخر 😊','bad');sfx.bad();setTimeout(()=>obj.el.classList.remove('is-wrong'),450);
    }
  }

  function burst(x,y,good){
    const colors=good?['#ffd84d','#ff68b0','#6f55ec','#2fd5a5','#ffffff']:['#ff9b53','#ff6e6e','#ffd08a'];
    for(let i=0;i<(good?18:9);i++){
      const p=document.createElement('i');p.className=good&&i%3===0?'star-particle':'spark';p.textContent=p.className==='star-particle'?'★':'';p.style.left=(x-5)+'px';p.style.top=(y-5)+'px';p.style.background=p.className==='spark'?colors[i%colors.length]:'transparent';
      const a=(Math.PI*2*i)/(good?18:9)+Math.random()*.25,d=35+Math.random()*(good?65:35);p.style.setProperty('--dx',Math.cos(a)*d+'px');p.style.setProperty('--dy',Math.sin(a)*d+'px');p.style.setProperty('--rot',(Math.random()*320-160)+'deg');els.particleLayer.appendChild(p);setTimeout(()=>p.remove(),800);
    }
  }

  function showToast(text,type){
    els.toast.textContent=text;els.toast.className=`toast ${type}`;requestAnimationFrame(()=>els.toast.classList.add('show'));
  }
  function hideToast(){els.toast.className='toast';els.toast.textContent='';}

  function finish(){
    stopMotion();showScene(els.end);sfx.end();
    const accuracy=state.shots?Math.round((state.correctShots/state.shots)*100):100;
    els.resultName.textContent=state.player;els.resultScore.textContent=state.score;els.resultAccuracy.textContent=accuracy+'%';els.resultBestCombo.textContent='×'+state.bestCombo;els.resultPercent.textContent=accuracy+'%';
    if(accuracy>=90){els.resultBadge.textContent='قنّاص المعرفة 👑';els.resultMessage.textContent='أداء مذهل! دقتك وتركيزك ممتازان.';}
    else if(accuracy>=70){els.resultBadge.textContent='بطل المعرفة 🌟';els.resultMessage.textContent='أحسنت! لديك معرفة قوية وتركيز جميل.';}
    else{els.resultBadge.textContent='مستكشف شجاع ✨';els.resultMessage.textContent='أنهيت المغامرة بنجاح. أعد اللعب وحاول رفع دقتك!';}
    confetti();
  }

  function confetti(){
    els.confetti.innerHTML='';const colors=['#ff5fb0','#ffd14f','#2fd5a5','#2fa7ef','#7556ef','#ff9e4e'];
    for(let i=0;i<90;i++){
      const c=document.createElement('i');c.className='confetti-piece';c.style.left=Math.random()*100+'%';c.style.background=colors[i%colors.length];c.style.animationDuration=(2.8+Math.random()*3.4)+'s';c.style.animationDelay=(Math.random()*.65)+'s';c.style.setProperty('--drift',(Math.random()*160-80)+'px');els.confetti.appendChild(c);
    }
    setTimeout(()=>els.confetti.innerHTML='',7000);
  }

  function goHome(){stopMotion();hideToast();els.targets.innerHTML='';els.confetti.innerHTML='';showScene(els.start);setTimeout(()=>els.playerName.focus(),150);}

  els.startBtn.addEventListener('click',startGame);
  els.replayBtn.addEventListener('click',startGame);
  els.homeBtn.addEventListener('click',goHome);
  els.playerName.addEventListener('keydown',e=>{if(e.key==='Enter')startGame();});

  els.arena.addEventListener('pointermove',e=>aimAt(e.clientX,e.clientY));
  els.arena.addEventListener('pointerdown',e=>{ if(e.target.closest('.target')) return; shootAt(e.clientX,e.clientY,null); });

  els.soundBtn.addEventListener('click',()=>{state.sound=!state.sound;els.soundBtn.textContent=state.sound?'🔊':'🔇';els.soundBtn.setAttribute('aria-label',state.sound?'إيقاف الصوت':'تشغيل الصوت');if(state.sound){ensureAudio();tone(660,.1,'triangle',.03);}});
  els.fullscreenBtn.addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch(_){}});

  addEventListener('resize',()=>{if(els.game.classList.contains('scene--active')){state.targets.forEach(o=>{const r=els.arena.getBoundingClientRect();o.x=clamp(o.x,10,Math.max(10,r.width-o.w-10));o.y=clamp(o.y,24,Math.max(24,r.height-215-o.h));});}});
})();
