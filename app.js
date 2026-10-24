(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const playerContent = $("#playerContent");
  const playerTitle = $("#playerTitle");
  const searchInput = $("#searchInput");
  const emptyState = $("#emptyState");
  let activeFilter = "all";
  $("#year").textContent = new Date().getFullYear();

  function clearPlayer() { playerContent.replaceChildren(); }
  function setPlayerTitle(text) { playerTitle.textContent = text.toUpperCase(); }

  function showWelcome() {
    clearPlayer();
    setPlayerTitle("Welcome aboard, space traveler");
    const wrapper = document.createElement("div");
    wrapper.className = "player-welcome";
    wrapper.innerHTML = `<div class="welcome-icon">✦</div><h3>Your next adventure awaits.</h3><p>Enter a direct URL to an individual game HTML file below to fetch and load it here.</p><button class="primary-button" id="openPokemonCollection" type="button">Enter Game File URL <span>→</span></button>`;
    playerContent.append(wrapper);
    $("#openPokemonCollection").addEventListener("click", focusGameUrl);
  }

  function focusGameUrl() {
    const settings = $(".embed-settings");
    settings.open = true;
    $("#embedUrl").focus();
    settings.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function loadGameHtmlFile() {
    const input = $("#embedUrl"), message = $("#embedMessage");
    let url;
    try { url = new URL(input.value.trim()); }
    catch { message.textContent = "Enter the complete HTTPS URL of an individual game HTML file."; return; }
    if (url.protocol !== "https:") { message.textContent = "For safety, game file URLs must use HTTPS."; return; }
    if (url.origin === location.origin) { message.textContent = "Enter the direct URL of the hosted game file, not this Astro Galaxy page."; return; }
    if (/\/game-series\//i.test(url.pathname)) { message.textContent = "That looks like a collection page, not an individual HTML game file. Open a specific game and use its direct HTML file URL."; return; }

    message.textContent = "Fetching the game HTML file…";
    try {
      const response = await fetch(url.href, { method: "GET", mode: "cors", credentials: "omit", redirect: "follow" });
      if (!response.ok) throw new Error(`The host returned HTTP ${response.status}.`);
      const contentType = response.headers.get("content-type") || "";
      const html = await response.text();
      if (!/html|text\/plain/i.test(contentType) && !/<\s*(?:!doctype\s+html|html|head|body)\b/i.test(html.slice(0, 2000))) {
        throw new Error("The URL did not return an HTML document. Use the direct URL to the game's .html file.");
      }
      const baseTag = `<base href="${url.href.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}">`;
      let playableHtml = html;
      if (/<head\b[^>]*>/i.test(playableHtml)) {
        playableHtml = playableHtml.replace(/<head\b[^>]*>/i, match => `${match}\n${baseTag}`);
      } else {
        playableHtml = `<!doctype html><html><head>${baseTag}</head><body>${playableHtml}</body></html>`;
      }

      clearPlayer();
      setPlayerTitle("Game file · " + (url.pathname.split("/").filter(Boolean).pop() || "HTML game"));
      const frame = document.createElement("iframe");
      frame.className = "game-frame";
      frame.title = "Fetched HTML game";
      frame.setAttribute("sandbox", "allow-scripts allow-forms allow-pointer-lock allow-presentation");
      frame.setAttribute("allow", "fullscreen; autoplay; gamepad");
      frame.setAttribute("allowfullscreen", "");
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      frame.srcdoc = playableHtml;
      playerContent.append(frame);
      message.textContent = "Game HTML fetched and loaded. If it does not start, the host may block access or the game may need additional files or browser features.";
    } catch (error) {
      message.textContent = `Could not fetch this game file: ${error.message || "request blocked"} Check that it is a direct HTML file URL and the host permits CORS requests from Astro Galaxy.`;
    }
  }

  function applyFilters() {
    const term = searchInput.value.trim().toLowerCase(); let visible = 0;
    $$(".game-card").forEach(card => {
      const matchesFilter = activeFilter === "all" || card.dataset.category === activeFilter;
      const matchesTerm = (card.dataset.search + " " + card.innerText).toLowerCase().includes(term);
      const show = matchesFilter && matchesTerm; card.hidden = !show; if (show) visible++;
    });
    emptyState.hidden = visible > 0;
  }
  $$(".filter-chip").forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    $$(".filter-chip").forEach(b => b.classList.toggle("active", b === button));
    applyFilters();
  }));
  searchInput.addEventListener("input", applyFilters);
  $$("[data-play]").forEach(button => button.addEventListener("click", () => {
    focusGameUrl(); $("#player").scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  $("#loadEmbed").addEventListener("click", loadGameHtmlFile);
  $("#embedUrl").addEventListener("keydown", e => { if (e.key === "Enter") loadGameHtmlFile(); });
  $("#resetPlayer").addEventListener("click", showWelcome);
  $("#starButton").addEventListener("click", () => document.body.classList.toggle("star-mode"));
  showWelcome();
})();
