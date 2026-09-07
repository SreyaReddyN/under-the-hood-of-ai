(function () {
  const root = document.documentElement;
  const body = document.body;
  const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const pageMap = {
    'index.html': 'home',
    'chapter-1-neural-networks.html': 'chapter-1',
    'chapter-2-deep-learning.html': 'chapter-2',
    'chapter-3-transformers.html': 'chapter-3',
    'chapter-4-hardware.html': 'chapter-4',
    'sources.html': 'sources'
  };
  body.dataset.page = pageMap[file] || body.dataset.page || 'home';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    a.classList.toggle('current', href === file);
  });

  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) { /* storage can be blocked in previews */ }
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) root.dataset.theme = 'dark';

  const themeBtn = document.querySelector('.theme-btn');
  const setThemeLabel = () => {
    if (!themeBtn) return;
    const dark = root.dataset.theme === 'dark';
    themeBtn.textContent = dark ? '☀ Light' : '☾ Dark';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0b0d10' : '#f7f5f0');
  };
  setThemeLabel();
  themeBtn?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) { /* ignore blocked storage */ }
    setThemeLabel();
  });

  const menuBtn = document.querySelector('.menu-btn');
  const nav = document.querySelector('.nav-links');
  menuBtn?.addEventListener('click', () => nav?.classList.toggle('open'));
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

  const bar = document.querySelector('.progress-bar');
  const updateProgress = () => {
    if (!bar) return;
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
  };
  document.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  const headings = [...document.querySelectorAll('.article h2[id], .article h3[id]')];
  const tocLinks = [...document.querySelectorAll('.toc a')];
  if (headings.length && tocLinks.length && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];
      if (!visible) return;
      tocLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + visible.target.id));
    }, { rootMargin: '-12% 0px -72% 0px', threshold: 0 });
    headings.forEach(h => obs.observe(h));
  }

  // Small entrance motion, disabled automatically for reduced-motion users.
  const revealTargets = document.querySelectorAll('.chapter-card, .promise .panel, .article-head, .article > h2, .diagram, .transition');
  revealTargets.forEach(el => el.classList.add('reveal'));
  if ('IntersectionObserver' in window) {
    const revealObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: '0px 0px -40px' });
    revealTargets.forEach(el => revealObs.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('visible'));
  }

  // Gentle pointer depth on the home chapter cards.
  const canHover = window.matchMedia && window.matchMedia('(hover:hover)').matches;
  if (canHover) {
    document.querySelectorAll('.chapter-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX-r.left)/r.width - .5;
        const y = (e.clientY-r.top)/r.height - .5;
        card.style.transform = `translateY(-5px) perspective(900px) rotateX(${(-y*1.6).toFixed(2)}deg) rotateY(${(x*1.6).toFixed(2)}deg)`;
      });
      card.addEventListener('pointerleave', () => card.style.transform = '');
    });
  }
})();

/* Chapter 1 interactives */
(function(){
  const $ = (id) => document.getElementById(id);
  if (!$('neuron-playground')) return;

  // 1) Live neuron calculator
  const ids = ['x1','w1','x2','w2','x3','w3','bias'];
  function num(id){ return parseFloat($(id).value); }
  function signed(n){ return n >= 0 ? `+ ${n.toFixed(1)}` : `− ${Math.abs(n).toFixed(1)}`; }
  function updateNeuron(){
    ids.forEach(id => { const out=$(id+'-val') || (id==='bias' ? $('b-val') : null); if(out) out.textContent=num(id).toFixed(id.startsWith('x')?2:1).replace(/0$/,'').replace(/\.$/,''); });
    const z = num('x1')*num('w1') + num('x2')*num('w2') + num('x3')*num('w3') + num('bias');
    const a = 1/(1+Math.exp(-z));
    $('neuron-formula').textContent = `(${num('x1').toFixed(2)}×${num('w1').toFixed(1)}) + (${num('x2').toFixed(2)}×${num('w2').toFixed(1)}) + (${num('x3').toFixed(2)}×${num('w3').toFixed(1)}) ${signed(num('bias'))}`;
    $('z-result').textContent=z.toFixed(2); $('a-result').textContent=a.toFixed(3);
    $('neuron-explain').textContent = z > 1 ? 'The weighted evidence strongly pushes this neuron upward.' : z > 0 ? 'The evidence pushes this neuron slightly above its current threshold.' : z > -1 ? 'The weighted evidence leaves this neuron slightly below zero.' : 'The weighted evidence strongly pushes this neuron downward.';
  }
  ids.forEach(id => $(id)?.addEventListener('input', updateNeuron)); updateNeuron();

  // 2) Activation explorer
  const canvas=$('activation-canvas'), ctx=canvas?.getContext('2d'); let act='relu';
  function f(x){ return act==='relu'?Math.max(0,x):act==='sigmoid'?1/(1+Math.exp(-x)):Math.tanh(x); }
  function slope(x){ if(act==='relu') return x>0?1:(x<0?0:0.5); if(act==='sigmoid'){const y=f(x);return y*(1-y);} const y=Math.tanh(x);return 1-y*y; }
  function css(name, fallback){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; }
  function drawActivation(){
    if(!ctx) return; const W=canvas.width,H=canvas.height; ctx.clearRect(0,0,W,H);
    const text=css('--faint','#777'), line=css('--line-strong','#ccc'), accent=css('--violet','#6d4aff'), surf=css('--surface-solid','#fff');
    ctx.fillStyle=surf;ctx.fillRect(0,0,W,H); const sx=x=>W/2+x*(W/12), sy=y=>H/2-y*(H/6);
    ctx.strokeStyle=line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(25,sy(0));ctx.lineTo(W-25,sy(0));ctx.moveTo(sx(0),20);ctx.lineTo(sx(0),H-20);ctx.stroke();
    ctx.fillStyle=text;ctx.font='12px sans-serif';[-4,-2,2,4].forEach(x=>ctx.fillText(String(x),sx(x)-4,sy(0)+17));[-2,2].forEach(y=>ctx.fillText(String(y),sx(0)+8,sy(y)+4));
    ctx.strokeStyle=accent;ctx.lineWidth=3;ctx.beginPath();for(let px=25;px<W-25;px++){const x=(px-W/2)/(W/12), y=f(x);const py=sy(y);if(px===25)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.stroke();
    const z=parseFloat($('act-z').value), y=f(z), px=sx(z), py=sy(y);ctx.fillStyle=accent;ctx.beginPath();ctx.arc(px,py,7,0,Math.PI*2);ctx.fill();
    $('act-z-val').textContent=z.toFixed(1);$('act-output').textContent=y.toFixed(3);$('act-slope').textContent=slope(z).toFixed(3);
    $('act-note').textContent = act==='relu' ? (z>0?'On ReLU’s positive side, the slope is 1, so the local learning signal is not shrunk here.':'On ReLU’s negative side, the slope is 0, so this unit would receive no local gradient through the activation.') : act==='sigmoid' ? (Math.abs(z)>3?'Sigmoid is in a flat tail here. Its slope is small, so gradients can shrink.':'Sigmoid is in its steeper middle region here, where changes in z noticeably affect the output.') : (Math.abs(z)>2?'tanh is approaching a flat tail here, so its slope is getting small.':'tanh is relatively steep around the center, so the output is sensitive to z here.');
  }
  document.querySelectorAll('.act-tab').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.act-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');act=btn.dataset.act;drawActivation();})); $('act-z')?.addEventListener('input',drawActivation); drawActivation();

  // 3) Gradient descent toy
  const gc=$('gd-canvas'), gctx=gc?.getContext('2d'); let w=-2, timer=null;
  const loss=x=>(x-3)*(x-3), grad=x=>2*(x-3);
  function drawGD(){
    if(!gctx) return; const W=gc.width,H=gc.height;gctx.clearRect(0,0,W,H);const surf=css('--surface-solid','#fff'),line=css('--line-strong','#ccc'),accent=css('--violet','#6d4aff'),text=css('--faint','#777'),coral=css('--coral','#f26c55');gctx.fillStyle=surf;gctx.fillRect(0,0,W,H);
    const xmin=-4,xmax=7,ymax=50, sx=x=>42+(x-xmin)/(xmax-xmin)*(W-72), sy=y=>H-34-Math.min(y,ymax)/ymax*(H-60);
    gctx.strokeStyle=line;gctx.lineWidth=1;gctx.beginPath();gctx.moveTo(42,H-34);gctx.lineTo(W-25,H-34);gctx.stroke();
    gctx.fillStyle=text;gctx.font='12px sans-serif';[-3,0,3,6].forEach(x=>gctx.fillText(String(x),sx(x)-4,H-15));
    gctx.strokeStyle=accent;gctx.lineWidth=3;gctx.beginPath();for(let i=0;i<=300;i++){const x=xmin+(xmax-xmin)*i/300,y=loss(x),px=sx(x),py=sy(y);if(i===0)gctx.moveTo(px,py);else gctx.lineTo(px,py);}gctx.stroke();
    const px=sx(w),py=sy(loss(w));gctx.fillStyle=coral;gctx.beginPath();gctx.arc(px,py,8,0,Math.PI*2);gctx.fill();gctx.strokeStyle=coral;gctx.globalAlpha=.25;gctx.beginPath();gctx.moveTo(px,H-34);gctx.lineTo(px,py);gctx.stroke();gctx.globalAlpha=1;
    $('gd-w').textContent=w.toFixed(2);$('gd-loss').textContent=loss(w).toFixed(2);$('gd-grad').textContent=grad(w).toFixed(2);$('lr-val').textContent=parseFloat($('learning-rate').value).toFixed(2);
    const lr=parseFloat($('learning-rate').value);$('gd-note').textContent = lr>0.95?'This learning rate is extremely large for this curve. Watch for bouncing or divergence.' : Math.abs(w-3)<.05?'The weight is now very close to the minimum at w = 3.' : grad(w)<0?'The gradient is negative, so subtracting it moves w to the right, toward 3.':'The gradient is positive, so subtracting it moves w to the left, toward 3.';
  }
  function step(){const lr=parseFloat($('learning-rate').value);w=w-lr*grad(w);if(!Number.isFinite(w)||Math.abs(w)>100){stop();w=Math.max(-12,Math.min(12,w||0));}drawGD();}
  function stop(){if(timer){clearInterval(timer);timer=null;$('gd-run').textContent='Run';}}
  $('gd-step')?.addEventListener('click',()=>{stop();step();}); $('gd-run')?.addEventListener('click',()=>{if(timer){stop();return;}$('gd-run').textContent='Pause';timer=setInterval(()=>{step();if(Math.abs(w-3)<.005)stop();},380);}); $('gd-reset')?.addEventListener('click',()=>{stop();w=-2;drawGD();}); $('learning-rate')?.addEventListener('input',drawGD); drawGD();

  window.addEventListener('resize',()=>{drawActivation();drawGD();});
})();

/* Chapter 2 interactives */
(function(){
  const $ = (id) => document.getElementById(id);
  if (!document.body || document.body.dataset.page !== 'chapter-2') return;

  // 1) Parameter-scale comparison.
  const paramButtons=[...document.querySelectorAll('.param-btn')];
  function updateParam(btn){
    if(!btn) return;
    paramButtons.forEach(b=>b.classList.toggle('active', b===btn));
    const count=Number(btn.dataset.count||0);
    if($('param-label')) $('param-label').textContent=btn.dataset.label||'';
    if($('param-number')) $('param-number').textContent=count.toLocaleString('en-US');
    if($('param-copy')) $('param-copy').textContent=btn.dataset.copy||'';
    if($('param-fill')) {
      // Log scale keeps both examples visible while still showing the enormous jump.
      const min=Math.log10(13002), max=Math.log10(175000000000);
      const pct=18 + Math.max(0,Math.min(1,(Math.log10(Math.max(count,1))-min)/(max-min))) * 82;
      $('param-fill').style.width=pct+'%';
    }
  }
  paramButtons.forEach(btn=>btn.addEventListener('click',()=>updateParam(btn)));
  updateParam(paramButtons.find(b=>b.classList.contains('active')) || paramButtons[0]);

  // 2) Next-piece generation loop. The visible words come from the HTML; this demo only
  // shows the append-and-repeat mechanism rather than inventing a new completion.
  const predictionButtons=[...document.querySelectorAll('#prediction-row button')];
  const initialScript=$('script-text')?.textContent || '';
  let selectedWord=predictionButtons[0]?.dataset.word || '';
  let generationStep=1;
  function selectPrediction(btn){
    predictionButtons.forEach(b=>b.classList.toggle('selected',b===btn));
    selectedWord=btn?.dataset.word || '';
  }
  predictionButtons.forEach(btn=>btn.addEventListener('click',()=>selectPrediction(btn)));
  if(predictionButtons.length) selectPrediction(predictionButtons[0]);
  $('append-word')?.addEventListener('click',()=>{
    if(!selectedWord || !$('script-text')) return;
    $('script-text').textContent = $('script-text').textContent.trimEnd() + ' ' + selectedWord;
    generationStep += 1;
    if($('generation-step')) $('generation-step').textContent='Step '+generationStep;
  });
  $('generation-reset')?.addEventListener('click',()=>{
    if($('script-text')) $('script-text').textContent=initialScript;
    generationStep=1;
    if($('generation-step')) $('generation-step').textContent='Step 1';
    if(predictionButtons.length) selectPrediction(predictionButtons[0]);
  });

  // 3) High-level serial-vs-parallel availability picture.
  const serial=$('serial-lane'), parallel=$('transformer-lane');
  const laneLabels=['1','2','3','4','5','6'];
  let parallelTimers=[];
  function clearParallelTimers(){ parallelTimers.forEach(t=>clearTimeout(t)); parallelTimers=[]; }
  function buildParallel(){
    clearParallelTimers();
    [serial,parallel].forEach(lane=>{
      if(!lane) return; lane.innerHTML='';
      laneLabels.forEach(label=>{const d=document.createElement('div');d.className='transition-token';d.textContent=label;lane.appendChild(d);});
    });
    if($('parallel-note')) $('parallel-note').textContent='In the top lane, positions become available one after another. In the transformer lane, the input positions are made available together for the next operation.';
  }
  function runParallel(){
    buildParallel();
    const s=serial?[...serial.children]:[], p=parallel?[...parallel.children]:[];
    parallelTimers.push(setTimeout(()=>p.forEach(el=>el.classList.add('on')),120));
    s.forEach((el,i)=>parallelTimers.push(setTimeout(()=>el.classList.add('on'),180+i*260)));
    parallelTimers.push(setTimeout(()=>{
      if($('parallel-note')) $('parallel-note').textContent='The lower lane exposes all positions together, while the upper lane still has a chain of waiting from one position to the next.';
    },180+s.length*260+120));
  }
  $('run-parallel')?.addEventListener('click',runParallel);
  $('reset-parallel')?.addEventListener('click',buildParallel);
  buildParallel();
})();

/* Chapter 3 interactives */
(function(){
  const $ = (id) => document.getElementById(id);
  if (!document.body || document.body.dataset.page !== 'chapter-3') return;

  // 1) Same token, different context
  const contextData = {
    animal: ['animal meaning','The surrounding phrase points toward the animal sense.'],
    chemistry: ['chemistry meaning','The surrounding words point toward the chemistry sense: a mole as an amount of substance.'],
    skin: ['skin-mark meaning','The surrounding phrase points toward the skin-mark sense.']
  };
  document.querySelectorAll('.context-card').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.context-card').forEach(b => b.classList.toggle('active', b === btn));
      const [title,note] = contextData[btn.dataset.context] || contextData.animal;
      const box = $('context-refined');
      if (box) box.querySelector('strong').textContent = title;
      if ($('context-note')) $('context-note').textContent = note;
    });
  });

  // 2) One toy attention column for the adjective-noun example.
  // The exact values are intentionally illustrative; the relationship is the point.
  const attentionItems = [
    ['a', -1.4],
    ['fluffy', 2.2],
    ['blue', 1.9],
    ['creature', 0.1],
    ['forest', -0.8]
  ];
  function softmax(xs){
    const m = Math.max(...xs);
    const ex = xs.map(x => Math.exp(x-m));
    const s = ex.reduce((a,b)=>a+b,0);
    return ex.map(x=>x/s);
  }
  const attnContainer = $('attention-words');
  if (attnContainer){
    const probs = softmax(attentionItems.map(x=>x[1]));
    const maxIndex = probs.indexOf(Math.max(...probs));
    attentionItems.forEach(([word],i)=>{
      const row=document.createElement('div'); row.className='attn-row';
      const label=document.createElement('b'); label.textContent=word;
      const bar=document.createElement('div'); bar.className='attn-bar';
      const fill=document.createElement('i'); fill.style.setProperty('--w',`${(probs[i]*100).toFixed(1)}%`); bar.appendChild(fill);
      const value=document.createElement('span'); value.textContent=(probs[i]*100).toFixed(1)+'%';
      row.append(label,bar,value); attnContainer.appendChild(row);
    });
    if ($('attention-top')) $('attention-top').textContent = attentionItems[maxIndex][0];
  }

  // 3) Hypothetical Michael + Jordan detector from the MLP lesson.
  let michael = 1, jordan = 1;
  function updateMLP(){
    const pre = michael + jordan - 1;
    const act = Math.max(0, pre);
    if ($('mlp-formula')) $('mlp-formula').textContent = `${michael} + ${jordan} − 1 = ${pre}`;
    if ($('mlp-pre')) $('mlp-pre').textContent = pre;
    if ($('mlp-act')) $('mlp-act').textContent = act;
    if ($('mlp-note')) $('mlp-note').textContent = act > 0
      ? 'Both features are present, so the neuron is active. The down-projection can now add a basketball-related direction.'
      : 'The detector does not have both features, so ReLU clips the result to zero and this neuron is inactive.';
  }
  document.querySelectorAll('.feature-toggle').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const key=btn.dataset.feature;
      if(key==='michael') michael = michael ? 0 : 1;
      if(key==='jordan') jordan = jordan ? 0 : 1;
      const on = key==='michael' ? michael : jordan;
      btn.classList.toggle('active', !!on);
      btn.textContent = `${key==='michael'?'Michael':'Jordan'} = ${on}`;
      updateMLP();
    });
  });
  updateMLP();
})();

/* Chapter 4 interactives — Hardware & Compute */
(function(){
  const $ = (id) => document.getElementById(id);
  if (!document.body || document.body.dataset.page !== 'chapter-4') return;

  // Decorative GEMM tiles: a large matmul is decomposed into smaller tiles.
  const gemmTiles = document.querySelector('.gemm-tiles');
  if (gemmTiles) {
    for (let i=0;i<16;i++) gemmTiles.appendChild(document.createElement('i'));
  }

  // 1) CPU-style vs GPU-style parallel work.
  const cpuGrid = $('cpu-work-grid'), gpuGrid = $('gpu-work-grid');
  let tileTimers = [];
  function makeTiles(grid){
    if (!grid) return;
    grid.innerHTML='';
    for(let i=0;i<64;i++) grid.appendChild(document.createElement('i'));
  }
  function clearTileTimers(){ tileTimers.forEach(t=>clearTimeout(t)); tileTimers=[]; }
  function resetTiles(){
    clearTileTimers(); makeTiles(cpuGrid); makeTiles(gpuGrid);
    if($('cpu-ticks')) $('cpu-ticks').textContent='0';
    if($('gpu-ticks')) $('gpu-ticks').textContent='0';
    if($('tile-demo-note')) $('tile-demo-note').textContent='Both sides have exactly 64 tiles of work. The animation uses toy worker counts only to show the difference between limited and wide parallelism.';
  }
  function animateLane(grid, chunk, tickOut, delay){
    const tiles=[...grid.children];
    let tick=0;
    for(let start=0;start<tiles.length;start+=chunk){
      const current=[...Array(Math.min(chunk,tiles.length-start)).keys()].map(k=>start+k);
      const at=tick*delay;
      tileTimers.push(setTimeout(()=>{
        current.forEach(i=>tiles[i].classList.add('active'));
        if(tickOut) tickOut.textContent=String(Math.floor(start/chunk)+1);
      },at));
      tileTimers.push(setTimeout(()=>{
        current.forEach(i=>{tiles[i].classList.remove('active');tiles[i].classList.add('done');});
      },at+Math.max(160,delay*.65)));
      tick++;
    }
    return tick;
  }
  $('hardware-run-tiles')?.addEventListener('click',()=>{
    resetTiles();
    const cpuTicks=animateLane(cpuGrid,4,$('cpu-ticks'),220);
    const gpuTicks=animateLane(gpuGrid,32,$('gpu-ticks'),220);
    const end=Math.max(cpuTicks,gpuTicks)*220+250;
    tileTimers.push(setTimeout(()=>{
      if($('tile-demo-note')) $('tile-demo-note').textContent='The GPU-style lane finishes the same independent work in fewer rounds because more tiles are active together. The counts here are illustrative, not specifications for a real CPU or GPU.';
    },end));
  });
  $('hardware-reset-tiles')?.addEventListener('click',resetTiles);
  resetTiles();

  // 2) Warp divergence: 32 threads either stay together or split into two passes.
  const warpLanes=$('warp-lanes');
  if(warpLanes){ for(let i=0;i<32;i++) warpLanes.appendChild(document.createElement('i')); }
  function updateWarp(mode){
    const lanes=[...warpLanes.children];
    lanes.forEach((lane,i)=>{ lane.className=''; if(mode==='uniform') lane.classList.add('on-a'); else lane.classList.add(i<16?'on-a':'on-b'); });
    const passes=$('warp-passes');
    if(passes){
      passes.innerHTML='';
      if(mode==='uniform'){
        const s=document.createElement('span');s.className='active';s.textContent='one pass · all 32 active';passes.appendChild(s);
      } else {
        const a=document.createElement('span');a.className='active';a.textContent='pass 1 · first 16 active';
        const b=document.createElement('span');b.className='active';b.textContent='pass 2 · other 16 active';passes.append(a,b);
      }
    }
    if($('warp-note')) $('warp-note').textContent = mode==='uniform'
      ? 'All 32 threads can execute the same instruction together. This is the efficient SIMT case.'
      : 'The two branches cannot execute together. The warp runs one path and then the other, leaving part of the warp idle during each pass.';
  }
  document.querySelectorAll('.warp-mode').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.warp-mode').forEach(b=>b.classList.toggle('active',b===btn));updateWarp(btn.dataset.mode);
  }));
  if(warpLanes) updateWarp('uniform');

  // 3) Number formats. Values mirror the source's sign/exponent/mantissa discussion.
  const formats={
    fp32:{bits:32,sign:1,exp:8,mantissa:23,bytes:'4',memory:'1×',throughput:'1×',note:'FP32 uses 32 bits. It is the high-precision baseline here, with 8 exponent bits and 23 mantissa bits.'},
    fp16:{bits:16,sign:1,exp:5,mantissa:10,bytes:'2',memory:'1/2',throughput:'≈2×',note:'FP16 halves the storage of FP32, but its 5-bit exponent gives it a narrower numerical range.'},
    bf16:{bits:16,sign:1,exp:8,mantissa:7,bytes:'2',memory:'1/2',throughput:'≈2×',note:'BF16 keeps FP32’s 8 exponent bits, so it keeps the wide range, while shortening the mantissa to 7 bits.'},
    fp8:{bits:8,sign:1,exp:4,mantissa:3,bytes:'1',memory:'1/4',throughput:'≈4×',note:'This FP8 E4M3 view uses 1 sign bit, 4 exponent bits and 3 mantissa bits. Smaller formats reduce memory traffic and can increase throughput.'},
    int8:{bits:8,integer:8,bytes:'1',memory:'1/4',throughput:'≈4×',note:'INT8 is an 8-bit integer format used in quantized work. Quantization maps higher-precision values into this smaller integer range.'}
  };
  function updatePrecision(key){
    const f=formats[key]||formats.fp32, strip=$('bit-strip'); if(!strip)return;strip.innerHTML='';
    if(f.integer){for(let i=0;i<f.integer;i++){const b=document.createElement('i');b.className='integer';strip.appendChild(b);}}
    else {
      for(let i=0;i<f.sign;i++){const b=document.createElement('i');b.className='sign';strip.appendChild(b);}
      for(let i=0;i<f.exp;i++){const b=document.createElement('i');b.className='exp';strip.appendChild(b);}
      for(let i=0;i<f.mantissa;i++){const b=document.createElement('i');b.className='mantissa';strip.appendChild(b);}
    }
    if($('precision-bytes')) $('precision-bytes').textContent=f.bytes;
    if($('precision-memory')) $('precision-memory').textContent=f.memory;
    if($('precision-throughput')) $('precision-throughput').textContent=f.throughput;
    if($('precision-note')) $('precision-note').textContent=f.note;
  }
  document.querySelectorAll('.precision-tab').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.precision-tab').forEach(b=>b.classList.toggle('active',b===btn));updatePrecision(btn.dataset.format);
  }));
  updatePrecision('fp32');

  // 4) Memory hierarchy from fastest/smallest to slowest/larger.
  const memoryData={
    registers:['Registers','The fastest storage. Registers live inside an SM and hold values a thread is actively using.',8],
    shared:['Shared memory / L1','A small, very fast pool on the SM. Threads in a block can share it and reuse data without going back to HBM.',24],
    l2:['L2 cache','A larger on-chip cache shared across the SMs. It is slower than shared memory, but still on the GPU chip.',43],
    hbm:['HBM','High Bandwidth Memory is the GPU’s main memory: the large VRAM pool where the model and data live.',68],
    host:['Host RAM','Ordinary system memory sits beyond the GPU and is reached over PCIe. It is the slowest rung shown here.',93]
  };
  function updateMemory(key){
    const [title,text,pos]=memoryData[key]||memoryData.registers;
    if($('memory-detail-title')) $('memory-detail-title').textContent=title;
    if($('memory-detail-text')) $('memory-detail-text').textContent=text;
    if($('memory-scale-fill')) $('memory-scale-fill').style.setProperty('--memory-pos',pos+'%');
  }
  document.querySelectorAll('.memory-rung').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.memory-rung').forEach(b=>b.classList.toggle('active',b===btn));updateMemory(btn.dataset.level);
  }));
  updateMemory('registers');

  // 5) Distributed-training strategies: what gets replicated or split.
  const parallelNotes={
    data:'Each chip keeps the full model. Different parts of the training batch go to different chips, then the gradients are averaged.',
    tensor:'One large layer is split across chips. The chips must communicate during the layer computation.',
    pipeline:'Different chips hold different groups of layers. Mini-batches move through the chips like an assembly line.',
    fsdp:'The model is sharded across chips. Needed pieces are gathered during the pass, reducing how much model state each chip stores at once.'
  };
  function renderParallel(mode){
    const box=$('parallel-viz');if(!box)return;box.innerHTML='';
    const grid=document.createElement('div');grid.className='parallel-node-grid';
    for(let chip=0;chip<4;chip++){
      const node=document.createElement('div');node.className='parallel-node';
      const b=document.createElement('b');b.textContent=`chip ${chip+1}`;
      const small=document.createElement('small');
      if(mode==='data') small.textContent=`batch slice ${chip+1} · full model`;
      if(mode==='tensor') small.textContent=`layer shard ${chip+1}`;
      if(mode==='pipeline') small.textContent=`layer stage ${chip+1}`;
      if(mode==='fsdp') small.textContent=`model shard ${chip+1}`;
      const stack=document.createElement('div');stack.className='model-stack';
      for(let j=0;j<5;j++){
        const row=document.createElement('i');
        if(mode==='tensor') row.className='split';
        if(mode==='pipeline') row.className='pipe';
        if(mode==='fsdp') row.className='shard';
        if(mode==='pipeline') row.style.opacity=(j===chip || (chip===3 && j>=3))?'1':'.18';
        if(mode==='tensor') row.style.width=`${25*(chip+1)}%`;
        if(mode==='fsdp') row.style.width='45%';
        stack.appendChild(row);
      }
      node.append(b,small,stack);grid.appendChild(node);
    }
    box.appendChild(grid);
    if($('parallel-note')) $('parallel-note').textContent=parallelNotes[mode];
  }
  document.querySelectorAll('.parallel-tab').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.parallel-tab').forEach(b=>b.classList.toggle('active',b===btn));renderParallel(btn.dataset.parallel);
  }));
  renderParallel('data');
})();
