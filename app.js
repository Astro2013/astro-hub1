(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const playerContent = $("#playerContent");
  const playerTitle = $("#playerTitle");
  const searchInput = $("#searchInput");
  const emptyState = $("#emptyState");
  let activeFilter = "all";
  let gameCleanup = null;

  $("#year").textContent = new Date().getFullYear();

  function clearPlayer() {
    if (typeof gameCleanup === "function") gameCleanup();
    gameCleanup = null;
    playerContent.replaceChildren();
  }

  function setPlayerTitle(text) {
    playerTitle.textContent = text.toUpperCase();
  }

  function showWelcome() {
    clearPlayer();
    setPlayerTitle("Welcome aboard, space traveler");
    const wrapper = document.createElement("div");
    wrapper.className = "player-welcome";
    wrapper.innerHTML = `<div class="welcome-icon">✦</div><h3>Your next adventure awaits.</h3><p>Choose a game from the arcade, or configure an approved embed URL below.</p><button class="primary-button" id="startStarCatcher" type="button">Play Star Catcher <span>→</span></button>`;
    playerContent.append(wrapper);
    $("#startStarCatcher").addEventListener("click", () => launchStarCatcher());
  }

  function launchStarCatcher() {
    clearPlayer();
    setPlayerTitle("Star Catcher · Astro original");
    const wrap = document.createElement("div");
    wrap.className = "mini-game";
    wrap.innerHTML = `<h3>✦ Star Catcher</h3><p>Tap or click the stars before they drift away. Catch as many as you can!</p><div class="score-line">Stardust: <span id="starScore">0</span> · Time: <span id="starTime">30</span>s</div><canvas class="game-canvas" id="starCanvas" width="560" height="220" aria-label="Star Catcher game area"></canvas><div class="game-controls"><button class="accent" id="startCatch" type="button">Start game</button><button id="stopCatch" type="button">End game</button></div>`;
    playerContent.append(wrap);
    const canvas = $("#starCanvas");
    const ctx = canvas.getContext("2d");
    const scoreEl = $("#starScore");
    const timeEl = $("#starTime");
    let score = 0, time = 30, running = false, raf = 0, timer = 0, stars = [];
    const resizeStars = () => {
      stars = Array.from({length: 12}, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: 4 + Math.random() * 5, vx: (Math.random() - .5) * 1.5,
        vy: .35 + Math.random() * 1.3, phase: Math.random() * 6
      }));
    };
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#191431"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i=0;i<35;i++){ctx.fillStyle = i%3 ? "#8b7cad" : "#f6c9ed";ctx.globalAlpha=.3+(i%4)*.12;ctx.fillRect((i*79+17)%canvas.width,(i*47+9)%canvas.height,2,2);}
      ctx.globalAlpha=1;
      stars.forEach(s=>{
        if(running){s.x+=s.vx;s.y+=s.vy;if(s.y>canvas.height+8){s.y=-8;s.x=Math.random()*canvas.width;}if(s.x<0)s.x=canvas.width;if(s.x>canvas.width)s.x=0;s.phase+=.07;}
        ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.phase*.1);ctx.fillStyle="#ffe7a8";ctx.shadowColor="#ffd98b";ctx.shadowBlur=12;
        ctx.beginPath();for(let k=0;k<10;k++){const r=k%2?s.r*.45:s.r;const a=-Math.PI/2+k*Math.PI/5;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.restore();
      });
      if(running)raf=requestAnimationFrame(draw);
    }
    function stop(){running=false;cancelAnimationFrame(raf);clearInterval(timer);draw();}
    function start(){stop();score=0;time=30;scoreEl.textContent=score;timeEl.textContent=time;resizeStars();running=true;draw();timer=setInterval(()=>{time--;timeEl.textContent=time;if(time<=0){stop();setPlayerTitle("Star Catcher · mission complete");}},1000);}
    function clickCanvas(e){if(!running)return;const rect=canvas.getBoundingClientRect();const x=(e.clientX-rect.left)*canvas.width/rect.width;const y=(e.clientY-rect.top)*canvas.height/rect.height;let hit=-1,best=30;stars.forEach((s,i)=>{const d=Math.hypot(s.x-x,s.y-y);if(d<s.r+10&&d<best){best=d;hit=i;}});if(hit>=0){score++;scoreEl.textContent=score;stars[hit].x=Math.random()*canvas.width;stars[hit].y=-5;}}
    $("#startCatch").addEventListener("click",start);
    $("#stopCatch").addEventListener("click",stop);
    canvas.addEventListener("pointerdown",clickCanvas);
    resizeStars();draw();
    gameCleanup=()=>{stop();canvas.removeEventListener("pointerdown",clickCanvas);};
  }

  function launchCosmicPairs() {
    clearPlayer(); setPlayerTitle("Cosmic Pairs · memory puzzle");
    const wrap=document.createElement("div");wrap.className="mini-game";
    wrap.innerHTML=`<h3>☾ Cosmic Pairs</h3><p>Flip two cards at a time and find all four matching pairs.</p><div class="score-line">Moves: <span id="pairMoves">0</span> · Matched: <span id="pairMatches">0</span>/4</div><div id="pairBoard" style="display:grid;grid-template-columns:repeat(4,minmax(48px,76px));gap:9px;justify-content:center;width:100%;margin:8px 0"></div><div class="game-controls"><button class="accent" id="pairReset" type="button">Shuffle again</button></div>`;
    playerContent.append(wrap);
    const board=$("#pairBoard"), movesEl=$("#pairMoves"), matchesEl=$("#pairMatches");
    let moves=0,matches=0,opened=[],locked=false,timeout=null;
    const symbols=["☾","✦","☄","♡"];
    function setup(){clearTimeout(timeout);moves=0;matches=0;opened=[];locked=false;movesEl.textContent="0";matchesEl.textContent="0";board.replaceChildren();[...symbols,...symbols].sort(()=>Math.random()-.5).forEach((symbol,index)=>{const b=document.createElement("button");b.type="button";b.textContent="✧";b.dataset.symbol=symbol;b.dataset.index=index;b.setAttribute("aria-label","Hidden cosmic card");b.style.cssText="aspect-ratio:1;border:1px solid #625080;border-radius:12px;background:#302449;color:#ffcaed;font-size:25px";b.addEventListener("click",()=>flip(b));board.append(b);});}
    function flip(b){if(locked||b.dataset.matched==="1"||opened.includes(b))return;b.textContent=b.dataset.symbol;b.setAttribute("aria-label",b.dataset.symbol);b.style.background="#594078";opened.push(b);if(opened.length===2){moves++;movesEl.textContent=moves;if(opened[0].dataset.symbol===opened[1].dataset.symbol){opened.forEach(x=>{x.dataset.matched="1";x.style.background="#24534f";x.style.borderColor="#71d9c3";});matches++;matchesEl.textContent=matches;opened=[];}else{locked=true;timeout=setTimeout(()=>{opened.forEach(x=>{x.textContent="✧";x.setAttribute("aria-label","Hidden cosmic card");x.style.background="#302449";});opened=[];locked=false;},700);}}}
    $("#pairReset").addEventListener("click",setup);setup();gameCleanup=()=>clearTimeout(timeout);
  }

  function launchCloudPlayer() {
    clearPlayer();
    setPlayerTitle("now.gg · cloud gaming portal");
    const wrap = document.createElement("div");
    wrap.className = "player-welcome nowgg-welcome";
    wrap.innerHTML = `<div class="welcome-icon">☄</div><h3>Launching into now.gg.</h3><p>Astro will try to show now.gg here first. If now.gg blocks being displayed inside another site, use the button below to open it in a new tab.</p><div class="nowgg-actions"><button class="primary-button" id="tryNowGgEmbed" type="button">Try inside Astro <span>→</span></button><a class="secondary-button" href="https://now.gg/" target="_blank" rel="noopener noreferrer">Open now.gg in new tab ↗</a></div><p class="settings-note">Astro Galaxy does not host or stream the games. Availability, sign-in, and play limits are controlled by now.gg and each game.</p>`;
    playerContent.append(wrap);
    $("#tryNowGgEmbed").addEventListener("click", loadNowGgInPlayer);
  }

  function loadNowGgInPlayer() {
    clearPlayer();
    setPlayerTitle("now.gg · external site");
    const note = document.createElement("div");
    note.className = "embed-fallback-note";
    note.innerHTML = `<p>If the area below stays blank or shows an error, now.gg may block iframe display. Open it in a separate tab instead.</p><a class="primary-button" href="https://now.gg/" target="_blank" rel="noopener noreferrer">Open now.gg in new tab ↗</a>`;
    const frame = document.createElement("iframe");
    frame.className = "game-frame";
    frame.title = "now.gg website (may block embedding)";
    frame.src = "https://now.gg/";
    frame.loading = "eager";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.setAttribute("allow", "fullscreen; autoplay; gamepad");
    frame.setAttribute("allowfullscreen", "");
    // This is a normal external-site iframe attempt, not a proxy or bypass.
    frame.setAttribute("sandbox", "allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox");
    playerContent.append(note, frame);
  }

  function loadEmbed() {
    const input=$("#embedUrl"), message=$("#embedMessage");
    let url;
    try { url = new URL(input.value.trim()); } catch { message.textContent="Enter a complete valid HTTPS embed URL."; return; }
    if(url.protocol!=="https:"){message.textContent="For safety, embedded game URLs must use HTTPS.";return;}
    if(url.origin===location.origin){message.textContent="Enter the provider's official embed URL, not Astro's own page.";return;}
    clearPlayer();setPlayerTitle("External game · embedded view");
    const frame=document.createElement("iframe");
    frame.className="game-frame";frame.title="Embedded game";frame.src=url.href;
    frame.loading="lazy";frame.referrerPolicy="strict-origin-when-cross-origin";
    frame.setAttribute("allow","fullscreen; autoplay; gamepad; clipboard-read; clipboard-write");
    frame.setAttribute("allowfullscreen","");
    // Intentionally do not grant top navigation, popups, or same-origin privileges.
    frame.setAttribute("sandbox","allow-scripts allow-forms allow-pointer-lock allow-presentation");
    playerContent.append(frame);
    message.textContent="Embed loaded. If the provider blocks framing, follow its official embed instructions or use its supported launch link.";
  }

  function applyFilters(){
    const term=searchInput.value.trim().toLowerCase();let visible=0;
    $$(".game-card").forEach(card=>{
      const matchesFilter=activeFilter==="all"||card.dataset.category===activeFilter;
      const matchesTerm=(card.dataset.search+" "+card.innerText).toLowerCase().includes(term);
      const show=matchesFilter&&matchesTerm;card.hidden=!show;if(show)visible++;
    });
    emptyState.hidden=visible>0;
  }
  $$(".filter-chip").forEach(button=>button.addEventListener("click",()=>{
    activeFilter=button.dataset.filter;$$(".filter-chip").forEach(b=>b.classList.toggle("active",b===button));applyFilters();
  }));
  searchInput.addEventListener("input",applyFilters);
  $$("[data-play]").forEach(button=>button.addEventListener("click",()=>{
    const kind=button.dataset.play;
    if(kind==="star-catcher")launchStarCatcher();
    else if(kind==="cosmic-pairs")launchCosmicPairs();
    else launchCloudPlayer();
    $("#player").scrollIntoView({behavior:"smooth",block:"start"});
  }));
  $("#startStarCatcher").addEventListener("click",launchStarCatcher);
  const openNowGgHome = $("#openNowGgHome");
  if (openNowGgHome) openNowGgHome.addEventListener("click", () => window.open("https://now.gg/", "_blank", "noopener,noreferrer"));
  $("#loadEmbed").addEventListener("click",loadEmbed);
  $("#embedUrl").addEventListener("keydown",e=>{if(e.key==="Enter")loadEmbed();});
  $("#resetPlayer").addEventListener("click",showWelcome);
  $("#starButton").addEventListener("click",()=>document.body.classList.toggle("star-mode"));
  showWelcome();
})();