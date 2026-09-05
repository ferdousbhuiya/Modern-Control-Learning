(() => {
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const KEY='modernControlLearningProgressV1';
  let state={completed:{},last:{stage:0,lesson:0}};
  try{state={...state,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(_){}
  const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
  const stageView=$('#stageView'),lessonView=$('#lessonView'),diagView=$('#diagnosticView'),platformView=$('#platformView'),toast=$('#toast');

  const totalLessons=()=>MC.stages.reduce((n,s)=>n+s.lessons.length,0);
  const doneCount=()=>Object.values(state.completed||{}).filter(Boolean).length;
  const lessonKey=(s,l)=>s+'-'+l;
  const isDone=(s,l)=>!!state.completed?.[lessonKey(s,l)];
  const stageDone=s=>s.lessons.filter((_,i)=>isDone(s.id,i)).length;
  const pct=(a,b)=>b?Math.round(a/b*100):0;
  const showToast=msg=>{toast.textContent=msg;toast.hidden=false;clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.hidden=true,2200)};

  function updateHome(){
    const lessonCountEl=$('#lessonCount'); if(lessonCountEl) lessonCountEl.textContent=totalLessons()+' lessons';
    const p=pct(doneCount(),totalLessons());
    const overallProgressEl=$('#overallProgress'), overallBarEl=$('#overallBar'); if(overallProgressEl) overallProgressEl.textContent=p+'%'; if(overallBarEl) overallBarEl.style.width=p+'%';
    const stageGridEl=$('#stageGrid'); if(stageGridEl) stageGridEl.innerHTML=MC.stages.map(s=>{
      const d=stageDone(s),sp=pct(d,s.lessons.length);
      return `<button class="stage-card" data-stage="${s.id}">
        <span class="stage-no">STAGE ${String(s.id).padStart(2,'0')} · ${s.level.toUpperCase()}</span>
        <span class="stage-icon">${s.icon}</span>
        <h3>${s.title}</h3><p>${s.description}</p>
        <div class="mini-progress"><i style="width:${sp}%"></i></div>
        <footer><span><b>${s.lessons.length}</b> lessons</span><span>${d ? d+' completed' : 'Start here'} →</span></footer>
      </button>`}).join('');
    $('.stage-card').forEach(b=>b.onclick=()=>openStage(Number(b.dataset.stage)));
    const videoGridEl=$('#videoGrid'); if(videoGridEl) videoGridEl.innerHTML=MC.courseVideos.map((v,i)=>`<article class="video-card" tabindex="0" role="link" data-video-index="${i}" aria-label="Open ${v.title}"><div class="video-thumb"></div><h3>${v.title}</h3><p>${v.desc}</p><a class="video-open" href="${v.url}" target="_blank" rel="noopener noreferrer">Watch on MathWorks ↗</a></article>`).join('');
    $('.video-card').forEach(card=>{
      const open=()=>{const v=MC.courseVideos[Number(card.dataset.videoIndex)];if(v?.url)window.open(v.url,'_blank','noopener,noreferrer')};
      card.addEventListener('click',e=>{if(e.target.closest('a'))return;open()});
      card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
    });
  }

  function closeOverlay(el){el.hidden=true;document.body.style.overflow=''}
  function closeAll(){[stageView,lessonView,diagView,platformView].forEach(x=>x.hidden=true);document.body.style.overflow=''}
  function openOverlay(el){closeAll();el.hidden=false;document.body.style.overflow='hidden';el.scrollTop=0}

  function header(title,sub){
    return `<header class="course-head"><button data-back>← Back</button><div><strong>${title}</strong><small>${sub}</small></div><button class="head-home" data-home>Home</button></header>`;
  }
  function bindHead(root,back){
    $('[data-back]',root).onclick=back;
    $('[data-home]',root).onclick=()=>{closeAll();location.hash='home';$('#home')?.scrollIntoView({behavior:'smooth'})};
  }

  function openStage(id){
    const s=MC.stages.find(x=>x.id===id);if(!s)return;
    state.last.stage=id;save();
    const d=stageDone(s),sp=pct(d,s.lessons.length);
    stageView.innerHTML=header(s.title,`Stage ${s.id} · ${s.level}`)+`
      <div class="stage-shell">
        <aside class="stage-sidebar">
          <div class="stage-meta"><span>STAGE ${String(s.id).padStart(2,'0')}</span><h2>${s.title}</h2><p>${s.description}</p></div>
          <div class="lesson-list">
            ${s.lessons.map((l,i)=>`<button data-open-lesson="${i}"><span>${i+1}</span><b>${l.title}</b><em>${isDone(id,i)?'✓':''}</em></button>`).join('')}
          </div>
        </aside>
        <section class="stage-main">
          <div class="intro-card">
            <span class="eyebrow">${s.level.toUpperCase()} · ${s.lessons.length} LESSONS</span>
            <h1>${s.title}</h1><p>${s.description}</p>
            <div class="progress-summary" style="margin-top:20px"><small>Stage progress</small><strong>${sp}%</strong><div><i style="width:${sp}%"></i></div></div>
            <div class="stage-cta"><button class="primary" data-first>${d?'Continue Stage →':'Start Stage →'}</button><button data-stage-home>Back to Roadmap</button></div>
          </div>
          <div class="lesson-pattern" style="margin-top:28px"><span>Intuition</span><b>→</b><span>Theory</span><b>→</b><span>Math</span><b>→</b><span>Example</span><b>→</b><span>Practice</span><b>→</b><span>Debug</span><b>→</b><span>Real World</span><b>→</b><span>MATLAB</span><b>→</b><span>Quiz</span></div>
        </section>
      </div>`;
    bindHead(stageView,()=>{closeOverlay(stageView);location.hash='roadmap';$('#roadmap')?.scrollIntoView({behavior:'smooth'})});
    $$('[data-open-lesson]',stageView).forEach(b=>b.onclick=()=>openLesson(id,Number(b.dataset.openLesson)));
    $('[data-first]',stageView).onclick=()=>{
      let i=s.lessons.findIndex((_,i)=>!isDone(id,i));if(i<0)i=0;openLesson(id,i);
    };
    $('[data-stage-home]',stageView).onclick=()=>{closeOverlay(stageView);$('#roadmap')?.scrollIntoView({behavior:'smooth'})};
    openOverlay(stageView);
  }

  const visual=(kind)=>{
    const wrap=(body,caption)=>`<div class="visual-box">${body}</div><div class="visual-caption">${caption}</div>`;
    const axes=`<line x1="60" y1="150" x2="420" y2="150" stroke="#5b7180"/><line x1="240" y1="30" x2="240" y2="280" stroke="#5b7180"/>`;
    if(kind==='splane'||kind==='roots'||kind==='eigen'||kind==='stability')return wrap(`<svg viewBox="0 0 480 310"><rect width="480" height="310" fill="#071622"/>${axes}<text x="430" y="144" fill="#9fb4c2" font-size="12">σ</text><text x="248" y="40" fill="#9fb4c2" font-size="12">jω</text><path d="M130 95l14 14m0-14l-14 14M130 205l14 14m0-14l-14 14" stroke="#47e094" stroke-width="4"/><circle cx="310" cy="150" r="8" fill="none" stroke="#ff7b7b" stroke-width="3"/><text x="70" y="290" fill="#69d8a1" font-size="12">Left half-plane: decaying modes</text><text x="290" y="290" fill="#ff9b91" font-size="12">Right: growing modes</text></svg>`,'Pole/eigenvalue location connects directly to decay, oscillation, and stability.');
    if(kind==='massspring'||kind==='derivative')return wrap(`<svg viewBox="0 0 700 300"><rect width="700" height="300" fill="#071622"/><path d="M50 75v160M50 115h50l15-25 25 50 25-50 25 50 25-50 20 25h70" fill="none" stroke="#79d8ff" stroke-width="4"/><rect x="305" y="82" width="130" height="110" rx="6" fill="#123147" stroke="#5fbfe9" stroke-width="3"/><text x="357" y="145" fill="white" font-size="24">m</text><path d="M435 137h130" stroke="#47e094" stroke-width="4"/><path d="M565 137l-18-10v20z" fill="#47e094"/><text x="500" y="120" fill="#9fc5d7" font-size="16">f(t)</text><path d="M100 205h75v-45h55v45h75" fill="none" stroke="#f5bc58" stroke-width="4"/><text x="175" y="230" fill="#f5bc58" font-size="15">damper b</text><text x="132" y="70" fill="#79d8ff" font-size="15">spring k</text></svg>`,'Mass stores kinetic energy, spring stores potential energy, damper dissipates energy.');
    if(kind==='rlc'||kind==='energy')return wrap(`<svg viewBox="0 0 700 300"><rect width="700" height="300" fill="#071622"/><path d="M90 180v-100h100" stroke="#79d8ff" stroke-width="4" fill="none"/><path d="M190 80l15-15 20 30 20-30 20 30 20-30 20 15" stroke="#f5bc58" stroke-width="4" fill="none"/><path d="M305 80q15-30 30 0t30 0t30 0" stroke="#b89cff" stroke-width="4" fill="none"/><path d="M395 80h100v75M465 155h60M465 175h60M495 175v65H90v-60" stroke="#79d8ff" stroke-width="4" fill="none"/><text x="235" y="55" fill="#f5bc58">R</text><text x="350" y="55" fill="#b89cff">L</text><text x="535" y="170" fill="#79d8ff">C</text></svg>`,'R dissipates energy, L stores magnetic energy, and C stores electric-field energy.');
    if(kind==='motor')return wrap(`<svg viewBox="0 0 700 300"><rect width="700" height="300" fill="#071622"/><circle cx="350" cy="150" r="72" fill="#102f43" stroke="#6ccff3" stroke-width="4"/><text x="315" y="158" fill="white" font-size="24">MOTOR</text><path d="M80 150h190" stroke="#47e094" stroke-width="4"/><path d="M270 150l-18-10v20z" fill="#47e094"/><text x="105" y="130" fill="#9fc5d7">Va(t), ia(t)</text><path d="M422 150h185" stroke="#f5bc58" stroke-width="4"/><path d="M607 150l-18-10v20z" fill="#f5bc58"/><text x="480" y="130" fill="#f5bc58">ω(t), θ(t)</text><path d="M350 78c35 0 60 15 75 38" stroke="#b89cff" stroke-width="3" fill="none"/><text x="430" y="90" fill="#b89cff">back EMF</text></svg>`,'Electrical current creates torque; rotation produces back EMF and mechanical motion.');
    if(kind==='feedback'||kind==='block'||kind==='feedbackK'||kind==='observer'||kind==='separation')return wrap(`<svg viewBox="0 0 760 310"><rect width="760" height="310" fill="#071622"/><rect x="210" y="70" width="130" height="70" rx="8" fill="#123348" stroke="#5cc8ed" stroke-width="3"/><rect x="440" y="70" width="130" height="70" rx="8" fill="#123348" stroke="#5cc8ed" stroke-width="3"/><circle cx="130" cy="105" r="24" fill="#0d2638" stroke="#47e094" stroke-width="3"/><text x="123" y="112" fill="white" font-size="20">Σ</text><text x="245" y="111" fill="white">Controller</text><text x="487" y="111" fill="white">Plant</text><path d="M40 105h65M154 105h56M340 105h100M570 105h140" stroke="#47e094" stroke-width="3" fill="none"/><path d="M680 105v125H130v-101" stroke="#5cc8ed" stroke-width="3" fill="none"/><text x="50" y="88" fill="#9fb4c2">r</text><text x="690" y="88" fill="#9fb4c2">y</text><text x="350" y="250" fill="#9fb4c2">measured output returns to the summing point</text></svg>`,'Closed-loop feedback continuously compares desired and measured behavior.');
    if(kind==='statespace'||kind==='abcd'||kind==='matrix'||kind==='canonical'||kind==='transfer'||kind==='similarity')return wrap(`<svg viewBox="0 0 760 330"><rect width="760" height="330" fill="#071622"/><rect x="180" y="55" width="400" height="220" rx="14" fill="#0c2334" stroke="#365b75" stroke-width="3"/><text x="235" y="115" fill="#7ee8aa" font-size="26">ẋ = A x + B u</text><text x="258" y="175" fill="#7fcff2" font-size="26">y = C x + D u</text><text x="235" y="225" fill="#aabfcb" font-size="13">A: internal dynamics   B: input influence</text><text x="235" y="250" fill="#aabfcb" font-size="13">C: measured output    D: direct feedthrough</text><path d="M60 165h110M590 165h110" stroke="#f5bc58" stroke-width="4"/><text x="85" y="145" fill="#f5bc58">input u</text><text x="620" y="145" fill="#f5bc58">output y</text></svg>`,'State space exposes internal dynamics as well as input-output behavior.');
    if(kind==='controllability'||kind==='observability'||kind==='pbh'||kind==='placement')return wrap(`<svg viewBox="0 0 760 320"><rect width="760" height="320" fill="#071622"/><circle cx="380" cy="160" r="90" fill="#102c3c" stroke="#5cc8ed" stroke-width="3"/><circle cx="380" cy="160" r="10" fill="#47e094"/><path d="M80 160h190" stroke="#47e094" stroke-width="5"/><path d="M270 160l-20-12v24z" fill="#47e094"/><path d="M490 160h190" stroke="#b89cff" stroke-width="5"/><path d="M680 160l-20-12v24z" fill="#b89cff"/><text x="85" y="135" fill="#47e094">Actuator: can we move every state?</text><text x="500" y="135" fill="#b89cff">Sensor: can we infer every state?</text><text x="335" y="165" fill="white" font-size="16">SYSTEM</text></svg>`,'Controllability is about input authority; observability is about state information.');
    if(kind==='secondorder'||kind==='performance'||kind==='dominant')return wrap(`<svg viewBox="0 0 760 310"><rect width="760" height="310" fill="#071622"/><line x1="60" y1="250" x2="710" y2="250" stroke="#587180"/><line x1="60" y1="45" x2="60" y2="250" stroke="#587180"/><path d="M60 250 C95 60,150 45,205 135 S330 185,400 130 S550 145,710 130" fill="none" stroke="#47e094" stroke-width="4"/><line x1="60" y1="130" x2="710" y2="130" stroke="#6c91a5" stroke-dasharray="8 7"/><text x="620" y="118" fill="#9fb4c2">final value</text><text x="135" y="70" fill="#f5bc58">overshoot</text><text x="460" y="190" fill="#b89cff">settling</text></svg>`,'Transient response connects pole location to rise time, overshoot, and settling.');
    if(kind==='bode')return wrap(`<svg viewBox="0 0 760 310"><rect width="760" height="310" fill="#071622"/><line x1="70" y1="245" x2="700" y2="245" stroke="#587180"/><line x1="70" y1="45" x2="70" y2="245" stroke="#587180"/><path d="M80 90h170l100 35 100 50 220 55" stroke="#5cc8ed" stroke-width="4" fill="none"/><text x="90" y="75" fill="#9fb4c2">magnitude</text><text x="580" y="270" fill="#9fb4c2">log frequency</text></svg>`,'Bode plots reveal how gain and phase change across frequency.');
    if(kind==='rootlocus')return wrap(`<svg viewBox="0 0 760 310"><rect width="760" height="310" fill="#071622"/>${axes.replaceAll('240','380').replace('420','700')}<path d="M150 150C250 150 290 90 380 60M150 150C250 150 290 210 380 240" fill="none" stroke="#47e094" stroke-width="4"/><path d="M140 140l20 20m0-20l-20 20" stroke="#ff7b7b" stroke-width="4"/><circle cx="520" cy="150" r="8" fill="none" stroke="#5cc8ed" stroke-width="3"/></svg>`,'Root locus follows closed-loop pole movement as gain varies.');
    if(kind==='pid')return wrap(`<svg viewBox="0 0 760 310"><rect width="760" height="310" fill="#071622"/><rect x="90" y="90" width="160" height="110" rx="10" fill="#102c3e" stroke="#5cc8ed" stroke-width="3"/><rect x="300" y="90" width="160" height="110" rx="10" fill="#102c3e" stroke="#47e094" stroke-width="3"/><rect x="510" y="90" width="160" height="110" rx="10" fill="#102c3e" stroke="#f5bc58" stroke-width="3"/><text x="158" y="145" fill="white" font-size="28">P</text><text x="367" y="145" fill="white" font-size="28">I</text><text x="578" y="145" fill="white" font-size="28">D</text><text x="125" y="175" fill="#9fb4c2">present</text><text x="337" y="175" fill="#9fb4c2">accumulated</text><text x="548" y="175" fill="#9fb4c2">rate</text></svg>`,'PID combines present error, accumulated error, and error-rate information.');
    if(kind==='lqr'||kind==='weights'||kind==='riccati'||kind==='lqrcompare'||kind==='lqi')return wrap(`<svg viewBox="0 0 760 310"><rect width="760" height="310" fill="#071622"/><path d="M90 235Q240 80 370 150T670 90" fill="none" stroke="#47e094" stroke-width="4"/><path d="M90 245Q250 190 400 210T670 185" fill="none" stroke="#5cc8ed" stroke-width="4"/><text x="95" y="70" fill="#f5bc58" font-size="20">J = ∫ (xᵀQx + uᵀRu) dt</text><text x="500" y="125" fill="#47e094">state error cost</text><text x="500" y="220" fill="#5cc8ed">control effort cost</text></svg>`,'LQR balances state regulation against actuator effort through a quadratic cost.');
    if(kind==='kalman')return wrap(`<svg viewBox="0 0 760 310"><rect width="760" height="310" fill="#071622"/><path d="M70 170L250 110L410 175L680 105" fill="none" stroke="#ffb36b" stroke-width="3" stroke-dasharray="7 6"/><path d="M70 190Q220 135 380 165T680 120" fill="none" stroke="#47e094" stroke-width="5"/><circle cx="250" cy="110" r="7" fill="#ffb36b"/><circle cx="410" cy="175" r="7" fill="#ffb36b"/><text x="90" y="80" fill="#9fb4c2">noisy measurements</text><text x="470" y="145" fill="#47e094">state estimate</text></svg>`,'Kalman filtering blends model prediction with noisy measurements.');
    return wrap(`<svg viewBox="0 0 760 300"><rect width="760" height="300" fill="#071622"/><circle cx="380" cy="150" r="90" fill="#102c3e" stroke="#5cc8ed" stroke-width="3"/><path d="M80 150h205M475 150h205" stroke="#47e094" stroke-width="4"/><text x="328" y="145" fill="white" font-size="20">CONTROL</text><text x="335" y="170" fill="#9fb4c2" font-size="12">model → analyze → design</text></svg>`,'A control-system concept visual.');
  };

  function openLesson(stageId,lessonIndex){
    const s=MC.stages.find(x=>x.id===stageId),l=s?.lessons[lessonIndex];if(!l)return;
    state.last={stage:stageId,lesson:lessonIndex};save();
    const ids=['intuition','theory','math','visual','example','practice','debug','realworld','qa','matlab','quiz'];
    lessonView.innerHTML=header(l.title,`Stage ${stageId} · Lesson ${lessonIndex+1} of ${s.lessons.length}`)+`
      <div class="lesson-shell">
        <aside class="lesson-nav">
          <div class="toc-title">${s.title}</div>
          ${s.lessons.map((x,i)=>`<button class="${i===lessonIndex?'active':''}" data-jump="${i}">${isDone(stageId,i)?'✓ ':''}${i+1}. ${x.title}</button>`).join('')}
        </aside>
        <article class="lesson-doc">
          <section class="lesson-title-card"><div class="crumb">STAGE ${String(stageId).padStart(2,'0')} → LESSON ${lessonIndex+1}</div><h1>${l.title}</h1><p>Move slowly. Understand the idea first, then the equation, then the engineering meaning.</p></section>
          <section id="intuition" class="lesson-section"><span class="section-label">Intuition</span><h2>Start with the idea</h2><p>${l.intuition}</p></section>
          <section id="theory" class="lesson-section"><span class="section-label">Theory</span><h2>What the concept means</h2><p>${l.theory}</p></section>
          <section id="math" class="lesson-section math"><span class="section-label">Mathematics</span><h2>Equation to remember</h2><p class="equation">${l.math}</p></section>
          <section id="visual" class="lesson-section"><span class="section-label">Visual explanation</span><h2>See the structure</h2>${visual(l.visual)}</section>
          <section id="example" class="lesson-section example"><span class="section-label">Worked example</span><h2>Follow one example</h2><p>${l.example}</p></section>
          <section id="practice" class="lesson-section practice"><span class="section-label">Practice</span><h2>Now do it yourself</h2><p>${l.practice}</p></section>
          <section id="debug" class="lesson-section debug"><span class="section-label">Debugging / common mistake</span><h2>Find what goes wrong</h2><p>${l.debug}</p></section>
          <section id="realworld" class="lesson-section realworld"><span class="section-label">Real-world engineering problem</span><h2>Why an engineer cares</h2><p>${l.realWorld}</p></section>
          <section id="qa" class="lesson-section qa"><span class="section-label">Q & A</span><h2>Check your understanding</h2>${l.qa.map(x=>`<details><summary>${x.question}</summary><p>${x.answer}</p></details>`).join('')}</section>
          <section id="matlab" class="lesson-section matlab"><span class="section-label">MATLAB / Simulink</span><h2>Verify it with software</h2><pre>${l.matlab}</pre>${l.video?`<div class="video-lesson-card"><div class="video-play">▶</div><div><strong>Optional visual explanation</strong><p>External MathWorks resource related to this lesson.</p><a href="${l.video}" target="_blank" rel="noopener">Open video ↗</a></div></div>`:''}</section>
          <section id="quiz" class="lesson-section quiz-box"><span class="section-label">Quiz</span><h2>One-question checkpoint</h2><p>${l.check.question}</p><div class="choices">${l.check.choices.map((x,i)=>`<button data-choice="${i}">${String.fromCharCode(65+i)}. ${x}</button>`).join('')}</div><div class="quiz-feedback" data-feedback>Choose an answer. You can retry if needed.</div></section>
          <div class="lesson-footer"><button data-prev ${lessonIndex===0?'disabled':''}>← Previous Lesson</button><button class="primary" data-complete>${isDone(stageId,lessonIndex)?'Completed ✓ · Next Lesson →':'Mark Complete & Continue →'}</button></div>
        </article>
        <aside class="lesson-toc"><div class="toc-title">IN THIS LESSON</div>${ids.map(id=>`<a href="#${id}" data-scroll="${id}">${id==='qa'?'Q & A':id[0].toUpperCase()+id.slice(1)}</a>`).join('')}<div class="toc-progress"><small>Stage progress</small><strong>${stageDone(s)}/${s.lessons.length}</strong><div><i style="width:${pct(stageDone(s),s.lessons.length)}%"></i></div></div></aside>
      </div>`;
    bindHead(lessonView,()=>openStage(stageId));
    $$('[data-jump]',lessonView).forEach(b=>b.onclick=()=>openLesson(stageId,Number(b.dataset.jump)));
    $$('[data-scroll]',lessonView).forEach(a=>a.onclick=e=>{e.preventDefault();$('#'+a.dataset.scroll,lessonView)?.scrollIntoView({behavior:'smooth',block:'start'})});
    $$('[data-choice]',lessonView).forEach(b=>b.onclick=()=>{
      const chosen=Number(b.dataset.choice),correct=l.check.answer;
      $$('[data-choice]',lessonView).forEach(x=>x.classList.remove('correct','wrong'));
      b.classList.add(chosen===correct?'correct':'wrong');
      if(chosen!==correct) $$('[data-choice]',lessonView)[correct].classList.add('correct');
      $('[data-feedback]',lessonView).textContent=chosen===correct?'Correct. Explain why it is correct before moving on.':'Not yet. Review the related section and try to explain the correction.';
    });
    $('[data-prev]',lessonView).onclick=()=>lessonIndex>0&&openLesson(stageId,lessonIndex-1);
    $('[data-complete]',lessonView).onclick=()=>{
      state.completed[lessonKey(stageId,lessonIndex)]=true;save();updateHome();showToast('Lesson completed');
      if(lessonIndex<s.lessons.length-1)openLesson(stageId,lessonIndex+1);else openStage(stageId);
    };
    openOverlay(lessonView);
  }

  function openPlatform(kind='curriculum'){
    const views={
      curriculum:{
        title:'Curriculum Learning Hub',sub:'13-stage structured course',
        desc:'Browse the complete learning path from mathematics refresher through advanced projects. The curriculum remains sequential so prerequisites are not skipped.'
      },
      simulations:{
        title:'Interactive Simulation Lab',sub:'Visualize dynamics before memorizing formulas',
        desc:'Use conceptual visualizations to connect poles, damping, feedback, state trajectories, and control design to system behavior.'
      },
      labs:{
        title:'Computational Labs',sub:'MATLAB and Simulink workbench',
        desc:'Practice modeling, simulation, controllability, observers, pole placement, LQR, and verification using MATLAB-oriented lab workflows.'
      },
      theory:{
        title:'Theory & Mathematics Documentation',sub:'Compact engineering reference',
        desc:'Review the equations, definitions, and mathematical tools used throughout the course without leaving the learning platform.'
      },
      problems:{
        title:'Benchmarks & Problem Sets',sub:'Practice, debugging, and exam preparation',
        desc:'Work through course-style problems, common mistakes, and applied engineering tasks matched to the 13-stage curriculum.'
      }
    };
    const v=views[kind]||views.curriculum;
    const sidebar=Object.entries(views).map(([k,x])=>`<button class="${k===kind?'active':''}" data-workspace="${k}">${x.title.replace(' Learning Hub','').replace('Interactive ','').replace(' Documentation','')}</button>`).join('');
    let body='';
    if(kind==='curriculum'){
      body=`<div class="workspace-grid">${MC.stages.map(s=>`<article class="workspace-card"><div class="meta">STAGE ${String(s.id).padStart(2,'0')} · ${s.level.toUpperCase()}</div><h3>${s.title}</h3><p>${s.description}</p><button data-open-stage="${s.id}">${stageDone(s)?'Continue Stage':'Open Stage'} →</button></article>`).join('')}</div>`;
    } else if(kind==='simulations'){
      const sims=[
        ['s-Plane Pole Explorer','Move conceptual poles and connect location to stability, damping, and oscillation.','Stage 0 & 3'],
        ['Second-Order Response','Compare damping ratio, natural frequency, overshoot, and settling behavior.','Stage 3'],
        ['Feedback Loop Behavior','See how negative feedback changes command tracking and disturbance rejection.','Stage 1 & 3'],
        ['State Trajectory View','Connect A-matrix eigenvalues to natural state motion and modal response.','Stage 4 & 5'],
        ['Controllability / Observability','Visualize actuator authority and sensor visibility across state directions.','Stage 6'],
        ['LQR Tradeoff Explorer','Compare state error penalties with control-effort penalties.','Stage 10']
      ];
      body=`<div class="workspace-grid">${sims.map((x,i)=>`<article class="workspace-card sim"><div class="sim-canvas"><svg viewBox="0 0 500 170"><path d="M25 120 C100 ${i%2?55:95},180 40,245 85 S380 125,475 55" fill="none" stroke="${i%2?'#5ec8ff':'#54e5a7'}" stroke-width="3"/><line x1="20" y1="135" x2="480" y2="135" stroke="#385569"/><line x1="250" y1="18" x2="250" y2="150" stroke="#385569"/></svg></div><div class="meta">${x[2]}</div><h3>${x[0]}</h3><p>${x[1]}</p><button data-sim-stage="${[0,3,1,5,6,10][i]}">Open related lesson →</button></article>`).join('')}</div>`;
    } else if(kind==='labs'){
      const labs=[
        ['Modeling Lab','Build mass-spring-damper, RLC, and DC motor models and verify transfer functions.','2'],
        ['State-Space Conversion Lab','Convert between transfer functions and A/B/C/D models and verify equivalent response.','4'],
        ['Controllability & Observability Lab','Use ctrb, obsv, rank, and PBH reasoning on several actuator/sensor choices.','6'],
        ['State Feedback & Observer Lab','Design K and L, inspect closed-loop and estimation-error poles, and simulate responses.','7'],
        ['LQR Lab','Tune Q and R, compare performance with pole placement, and inspect control effort.','10'],
        ['Digital Control Lab','Discretize continuous models, inspect z-plane poles, and study sample-time effects.','12']
      ];
      body=`<div class="workspace-grid">${labs.map(x=>`<article class="workspace-card lab"><div class="meta">MATLAB LAB · STAGE ${x[2]}</div><h3>${x[0]}</h3><p>${x[1]}</p><button data-open-stage="${x[2]}">Launch Lab Path →</button></article>`).join('')}</div>`;
    } else if(kind==='theory'){
      const docs=[
        ['Linear Algebra for Control','Matrices, determinants, rank, eigenvalues, eigenvectors, similarity, and Jordan structure.',0],
        ['Laplace & Transfer Functions','Transforms, poles, zeros, partial fractions, block diagrams, and input-output models.',0],
        ['State-Space Reference','States, realizations, state transition matrix, matrix exponential, and model conversion.',4],
        ['Controllability & Observability','Rank tests, PBH tests, decomposition, sensor and actuator interpretation.',6],
        ['Lyapunov Stability','Positive definiteness, quadratic functions, continuous/discrete Lyapunov equations.',9],
        ['Optimal Control','Quadratic cost, Riccati equation, LQR, LQI, and control-effort tradeoffs.',10]
      ];
      body=`<div class="workspace-grid">${docs.map(x=>`<article class="workspace-card theory"><div class="meta">THEORY REFERENCE · STAGE ${x[2]}</div><h3>${x[0]}</h3><p>${x[1]}</p><button data-open-stage="${x[2]}">Open reference lessons →</button></article>`).join('')}</div>`;
    } else {
      const rows=[
        ['P01','Polynomial roots & pole interpretation','Foundation','0'],
        ['P02','Mass-spring-damper derivation','Modeling','2'],
        ['P03','Steady-state error constants','Classical Control','3'],
        ['P04','State-space conversion and eigenvalues','State Space','4'],
        ['P05','Controllability / observability rank tests','Modern Control','6'],
        ['P06','Pole placement & observer design','Synthesis','7'],
        ['P07','Lyapunov equation proof/check','Stability','9'],
        ['P08','LQR tuning and Riccati interpretation','Optimal Control','10'],
        ['P09','Digital pole mapping','Advanced','12']
      ];
      body=`<div class="problem-list">${rows.map(x=>`<div class="problem-row"><span>${x[0]}</span><div><strong>${x[1]}</strong><small>${x[2]}</small></div><b>Stage ${x[3]}</b></div>`).join('')}</div><div class="workspace-card problem" style="margin-top:10px"><h3>How to use the problem sets</h3><p>Attempt the problem first, then return to the related stage for the worked example, debugging section, MATLAB verification, and quiz. This keeps practice tied to understanding rather than memorization.</p></div>`;
    }
    platformView.innerHTML=header(v.title,v.sub)+`<div class="platform-shell"><aside class="platform-sidebar"><span class="eyebrow">ENGINEERING WORKBENCH</span><h3>Learning Spaces</h3>${sidebar}</aside><main class="platform-main"><section class="platform-hero"><span class="eyebrow">${v.sub.toUpperCase()}</span><h1>${v.title}</h1><p>${v.desc}</p></section>${body}</main></div>`;
    bindHead(platformView,()=>closeOverlay(platformView));
    $('[data-workspace]',platformView).forEach(b=>b.onclick=()=>openPlatform(b.dataset.workspace));
    $('[data-open-stage]',platformView).forEach(b=>b.onclick=()=>openStage(Number(b.dataset.openStage)));
    $('[data-sim-stage]',platformView).forEach(b=>b.onclick=()=>openStage(Number(b.dataset.simStage)));
    openOverlay(platformView);
  }

  function diagnostic(){
    const qs=[
      ['Can you factor s²+5s+6?',0],['Do you remember how to multiply two matrices?',0],['Can you explain what an eigenvalue means?',0],
      ['Can you derive a transfer function from a differential equation using Laplace transforms?',1],['Can you identify poles and zeros from G(s)?',1],
      ['Do you remember steady-state error constants Kp, Kv, Ka?',3],['Can you interpret damping ratio and settling time?',3],['Can you write ẋ=Ax+Bu from two first-order equations?',4]
    ];
    diagView.innerHTML=header('Prerequisite Check','No grade · just choose the best starting point')+`
      <section class="diagnostic-card"><span class="eyebrow">QUICK DIAGNOSTIC</span><h1>Where should you start?</h1><p>Answer honestly. “No” is useful information. This check exists to prevent you from being thrown into advanced material too early.</p>
      <form id="diagForm">${qs.map((x,i)=>`<div class="diag-q"><strong>${i+1}. ${x[0]}</strong><label><input type="radio" name="q${i}" value="1"> Yes, comfortably</label><label><input type="radio" name="q${i}" value="0"> Not really / I forgot</label></div>`).join('')}<div class="modal-actions"><button class="primary" type="submit">Show Recommended Start</button></div><div id="diagResult"></div></form></section>`;
    bindHead(diagView,()=>closeOverlay(diagView));
    $('#diagForm').onsubmit=e=>{
      e.preventDefault();let score=0,answered=0;
      qs.forEach((_,i)=>{const v=$(`input[name=q${i}]:checked`,diagView);if(v){score+=Number(v.value);answered++}});
      if(answered<qs.length){showToast('Please answer all questions');return}
      let stage=0,msg='Start with Stage 0: Mathematics Refresher. This is the safest route and will rebuild the language used everywhere else.';
      if(score>=6){stage=3;msg='You remember much of the foundation. Start at Stage 3: Classical Control Refresher, then move into State Space.'}
      else if(score>=4){stage=1;msg='Start at Stage 1: Control Systems Foundations, and use Stage 0 selectively whenever the mathematics feels rusty.'}
      $('#diagResult').innerHTML=`<div class="diag-result"><strong>Recommended start: Stage ${stage}</strong><p>${msg}</p><button class="primary" type="button" data-go-stage style="border:0;border-radius:8px;padding:10px 12px;background:#39df8e;color:#04150c;font-weight:800">Open Stage ${stage} →</button></div>`;
      $('[data-go-stage]',diagView).onclick=()=>openStage(stage);
    };
    openOverlay(diagView);
  }

  function resume(){openLesson(state.last?.stage??0,state.last?.lesson??0)}
  $$('[data-home]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();closeAll();$('#home')?.scrollIntoView({behavior:'smooth',block:'start'})}));
  $('[data-start]')?.addEventListener('click',()=>openStage(0));
  $('[data-diagnostic]')?.addEventListener('click',diagnostic);
  $$('[data-resume]').forEach(b=>b.addEventListener('click',resume));
  $$('[data-platform]').forEach(b=>b.addEventListener('click',()=>openPlatform(b.dataset.platform)));
  $$('[data-stage-direct]').forEach(b=>b.addEventListener('click',()=>openStage(Number(b.dataset.stageDirect))));
  $$('[data-scroll-roadmap]').forEach(b=>b.addEventListener('click',()=>$('#roadmap')?.scrollIntoView({behavior:'smooth',block:'start'})));
  $('[data-menu]')?.addEventListener('click',()=>($('.stitch-nav')||$('.top-nav'))?.classList.toggle('open'));

  document.addEventListener('click',e=>{
    const platform=e.target.closest?.('[data-platform]');
    if(platform){e.preventDefault();openPlatform(platform.dataset.platform);return}
    const resumeBtn=e.target.closest?.('[data-resume]');
    if(resumeBtn){e.preventDefault();resume();return}
    const startBtn=e.target.closest?.('[data-start]');
    if(startBtn){e.preventDefault();openStage(0);return}
    const diag=e.target.closest?.('[data-diagnostic]');
    if(diag){e.preventDefault();diagnostic();return}
    const roadmap=e.target.closest?.('[data-scroll-roadmap]');
    if(roadmap){e.preventDefault();$('#roadmap')?.scrollIntoView({behavior:'smooth',block:'start'});return}
    const direct=e.target.closest?.('[data-stage-direct]');
    if(direct){e.preventDefault();openStage(Number(direct.dataset.stageDirect));return}
  });

  updateHome();
})();