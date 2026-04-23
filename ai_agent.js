// ============================================================
//  ICF-SL  ai_agent.js (FIXED - Clickable Districts)
//  • Analysis dashboard — fetches from ICF-SL Server via GAS
//  • AI Agent modal (GAS-backed Claude chat)
//  • ITN TARGETS tab with clickable district expansion
// ============================================================
(function () {
    'use strict';

    const GAS_URL = 'https://script.google.com/macros/s/AKfycbymRy-M5v0fVLWUjw4IXYhd1oIR2ZvnP_Dzr_iGR-Th0cMIpmE2ntGeujWYH7-C6NHIzA/exec';
    const SHEET_ID = '1cXlYiTMzcRP1BCj9mt1JXoK_pjgWbRtDEEQUPMg2HPs';

    // ════════════════════════════════════════════════════════
    //  AUTO-START  — no login required
    // ════════════════════════════════════════════════════════
    (function patchAutoStart() {
        window.showLoginScreen = function () {
            if (window.state) {
                window.state.currentUser = 'admin';
                window.state.isAdmin     = true;
                window.LOCATION_DATA     = window.ALL_LOCATION_DATA || {};
            }
            window.startApp && window.startApp('ICF-SL', true);
        };

        window.hideLoginScreen = function () {
            const ls = document.getElementById('loginScreen');
            if (ls) ls.style.display = 'none';
            const am = document.getElementById('appMain');
            if (am) { am.style.display = 'flex'; am.style.flexDirection = 'column'; }
            if (typeof cacheImagesForOffline === 'function') cacheImagesForOffline();
        };

        window.handleLogout = function () { /* no login screen */ };
    })();

    // ════════════════════════════════════════════════════════
    //  STYLES
    // ════════════════════════════════════════════════════════
    const style = document.createElement('style');
    style.textContent = `
    /* ── AI Agent modal ── */
    #icfAiOverlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9100;display:none;justify-content:center;align-items:flex-end;padding:12px;}
    #icfAiOverlay.show{display:flex;}
    #icfAiModal{background:#fff;border-radius:16px 16px 12px 12px;border:3px solid #004080;width:100%;max-width:680px;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 12px 48px rgba(0,0,0,.35);overflow:hidden;}
    .icf-ai-head{background:linear-gradient(135deg,#002d5a,#004080);color:#fff;padding:13px 18px;display:flex;align-items:center;gap:12px;flex-shrink:0;}
    .icf-ai-head-icon{width:34px;height:34px;background:rgba(255,255,255,.15);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .icf-ai-head-icon svg{width:18px;height:18px;stroke:#fff;}
    .icf-ai-head-info{flex:1;}
    .icf-ai-head-title{font-family:'Oswald',sans-serif;font-size:15px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;line-height:1.2;}
    .icf-ai-head-sub{font-size:10px;color:rgba(255,255,255,.7);}
    .icf-ai-head-actions{display:flex;gap:6px;}
    .icf-ai-hbtn{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);border-radius:7px;padding:5px 10px;cursor:pointer;color:#fff;font-family:'Oswald',sans-serif;font-size:11px;letter-spacing:.5px;display:flex;align-items:center;gap:4px;transition:background .15s;}
    .icf-ai-hbtn:hover{background:rgba(255,255,255,.22);}
    .icf-ai-hbtn svg{width:12px;height:12px;stroke:#fff;}
    .icf-ai-hbtn.gold{background:rgba(240,165,0,.25);border-color:rgba(240,165,0,.5);}
    .icf-ai-stats{background:#e8f1fa;border-bottom:2px solid #c5d9f0;padding:7px 14px;display:flex;gap:14px;flex-shrink:0;overflow-x:auto;}
    .icf-ai-stats::-webkit-scrollbar{display:none;}
    .icf-ai-stat{text-align:center;white-space:nowrap;}
    .icf-ai-stat-val{font-family:'Oswald',sans-serif;font-size:16px;font-weight:700;color:#004080;line-height:1;}
    .icf-ai-stat-lbl{font-size:9px;color:#555;text-transform:uppercase;letter-spacing:.5px;margin-top:1px;}
    .icf-ai-stat-div{width:1px;background:#bcd3eb;align-self:stretch;margin:2px 0;}
    #icfAiMessages{flex:1;overflow-y:auto;padding:13px 15px;display:flex;flex-direction:column;gap:11px;background:#f8fafd;}
    .icf-msg{display:flex;gap:8px;align-items:flex-start;}.icf-msg.user{flex-direction:row-reverse;}
    .icf-msg-av{width:27px;height:27px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;}
    .icf-msg.ai .icf-msg-av{background:#004080;}.icf-msg.user .icf-msg-av{background:#f0a500;}
    .icf-msg-av svg{width:13px;height:13px;stroke:#fff;}
    .icf-bub{max-width:calc(100% - 42px);padding:9px 13px;border-radius:13px;font-size:13px;line-height:1.55;word-break:break-word;}
    .icf-msg.ai .icf-bub{background:#fff;border:1.5px solid #c5d9f0;border-top-left-radius:4px;color:#222;}
    .icf-msg.user .icf-bub{background:#004080;color:#fff;border-top-right-radius:4px;}
    .icf-bub strong{font-weight:700;}.icf-bub code{background:rgba(0,64,128,.08);border-radius:3px;padding:1px 4px;font-family:monospace;font-size:12px;}
    .icf-msg.user .icf-bub code{background:rgba(255,255,255,.18);}
    .icf-typing{display:flex;align-items:center;gap:4px;padding:5px 0;}
    .icf-typing span{width:7px;height:7px;background:#004080;border-radius:50%;animation:icf-bnc .9s ease-in-out infinite;}
    .icf-typing span:nth-child(2){animation-delay:.15s;}.icf-typing span:nth-child(3){animation-delay:.30s;}
    @keyframes icf-bnc{0%,100%{transform:translateY(0);opacity:.4;}50%{transform:translateY(-5px);opacity:1;}}
    .icf-samples{padding:7px 14px 5px;flex-shrink:0;border-top:1px solid #e0eaf5;}
    .icf-sq-lbl{font-size:9px;font-family:'Oswald',sans-serif;color:#888;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px;}
    .icf-sq-row{display:flex;gap:5px;flex-wrap:wrap;}
    .icf-sq{background:#e8f1fa;border:1.5px solid #b3cde8;border-radius:20px;padding:4px 11px;font-size:11px;color:#004080;font-weight:600;cursor:pointer;white-space:nowrap;transition:background .15s;font-family:'Oswald',sans-serif;}
    .icf-sq:hover{background:#004080;color:#fff;border-color:#004080;}
    .icf-inp-row{display:flex;gap:8px;padding:9px 13px 11px;border-top:2px solid #dce8f5;background:#fff;flex-shrink:0;align-items:flex-end;}
    #icfAiInput{flex:1;border:2px solid #c5d9f0;border-radius:22px;padding:8px 14px;font-size:13px;font-family:'Oswald','Segoe UI',Arial,sans-serif;outline:none;resize:none;transition:border-color .2s;line-height:1.4;}
    #icfAiInput:focus{border-color:#004080;}
    #icfAiSend{background:#004080;border:none;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:background .2s,transform .1s;}
    #icfAiSend:hover{background:#00306a;transform:scale(1.06);}
    #icfAiSend:disabled{background:#aaa;cursor:not-allowed;transform:none;}
    #icfAiSend svg{width:16px;height:16px;stroke:#fff;}
    .icf-clr{background:none;border:none;font-size:10px;color:#aaa;cursor:pointer;letter-spacing:.4px;text-transform:uppercase;font-family:'Oswald',sans-serif;padding:0 3px;transition:color .15s;}
    .icf-clr:hover{color:#dc3545;}
    .icf-pill{display:inline-flex;align-items:center;gap:5px;font-size:10px;padding:3px 9px;border-radius:12px;font-family:'Oswald',sans-serif;margin-bottom:7px;}
    .icf-pill.ok{background:#d4edda;color:#155724;}.icf-pill.err{background:#f8d7da;color:#721c24;}.icf-pill.chk{background:#e2e3e5;color:#383d41;}
    .icf-dot{width:6px;height:6px;border-radius:50%;}
    .ok .icf-dot{background:#28a745;}.err .icf-dot{background:#dc3545;}.chk .icf-dot{background:#888;animation:icf-bnc .9s ease-in-out infinite;}
    .icf-welcome{background:#fff;border:2px solid #c5d9f0;border-radius:11px;padding:16px;text-align:center;}
    .icf-welcome-icon{font-size:30px;margin-bottom:7px;}
    .icf-welcome-title{font-family:'Oswald',sans-serif;font-size:14px;color:#004080;font-weight:600;letter-spacing:.5px;margin-bottom:5px;}
    .icf-welcome-body{font-size:12px;color:#555;line-height:1.6;}
    .icf-foot{font-size:9px;color:#aaa;text-align:center;padding:3px;font-style:italic;font-family:'Oswald',sans-serif;}
    @media(max-width:520px){#icfAiModal{max-height:93vh;border-radius:14px 14px 0 0;}}

    /* ── Analysis dashboard ── */
    .an-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:14px;}
    .an-spinner{width:44px;height:44px;border:4px solid #e4eaf2;border-top-color:#004080;border-radius:50%;animation:an-spin 0.8s linear infinite;}
    @keyframes an-spin{to{transform:rotate(360deg);}}
    .an-load-txt{font-family:'Oswald',sans-serif;font-size:13px;color:#607080;letter-spacing:.5px;}
    .an-kpi-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px;}
    .an-kpi{background:#fff;border:2px solid #d0dce8;border-radius:10px;padding:15px 12px;text-align:center;box-shadow:0 2px 8px rgba(0,64,128,.06);}
    .an-kpi.g{border-color:#28a745;background:linear-gradient(135deg,#f0fff4,#fff);}
    .an-kpi.r{border-color:#dc3545;background:linear-gradient(135deg,#fff5f5,#fff);}
    .an-kpi.o{border-color:#f0a500;background:linear-gradient(135deg,#fffbf0,#fff);}
    .an-kpi.p{border-color:#e91e8c;background:linear-gradient(135deg,#fff0f8,#fff);}
    .an-kpi.b{border-color:#004080;background:linear-gradient(135deg,#f0f6ff,#fff);}
    .an-kpi-val{font-family:'Oswald',sans-serif;font-size:26px;font-weight:700;color:#004080;line-height:1;}
    .an-kpi.g .an-kpi-val{color:#28a745;}.an-kpi.r .an-kpi-val{color:#dc3545;}
    .an-kpi.o .an-kpi-val{color:#b8860b;}.an-kpi.p .an-kpi-val{color:#e91e8c;}
    .an-kpi-lbl{font-size:10px;color:#607080;text-transform:uppercase;letter-spacing:.5px;margin-top:4px;font-family:'Oswald',sans-serif;}
    .an-section{background:#fff;border:2px solid #d0dce8;border-radius:10px;overflow:hidden;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,64,128,.06);}
    .an-section-hdr{background:linear-gradient(135deg,#004080,#1a6abf);color:#fff;padding:10px 16px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;display:flex;align-items:center;gap:8px;}
    .an-section-hdr svg{width:14px;height:14px;stroke:#fff;fill:none;}
    .an-section-body{padding:14px;}
    .an-charts-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
    .an-charts-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
    .an-chart-card{background:#f8fafd;border:1px solid #e0eaf5;border-radius:8px;padding:12px;}
    .an-chart-label{font-family:'Oswald',sans-serif;font-size:11px;color:#004080;letter-spacing:.4px;text-transform:uppercase;text-align:center;margin-bottom:8px;font-weight:600;}
    .an-chart-card canvas{max-height:200px;}
    .an-tbl-wrap{overflow-x:auto;}
    .an-tbl{width:100%;border-collapse:collapse;font-size:12px;}
    .an-tbl thead tr{background:linear-gradient(135deg,#004080,#1a6abf);}
    .an-tbl th{padding:9px 12px;font-family:'Oswald',sans-serif;font-size:10px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:#fff;text-align:left;white-space:nowrap;}
    .an-tbl td{padding:8px 12px;border-bottom:1px solid #f0f4f8;}
    .an-tbl tr:last-child td{border-bottom:none;}
    .an-tbl tr:nth-child(even) td{background:#fafcff;}
    .an-tbl tr:hover td{background:#eef5ff;}
    .an-cov-cell{display:flex;align-items:center;gap:6px;}
    .an-cov-bar{background:#e4eaf2;border-radius:3px;height:6px;flex:1;overflow:hidden;min-width:40px;}
    .an-cov-fill{height:100%;border-radius:3px;}
    .an-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.3px;}
    .an-badge-g{background:#e8f5e9;color:#28a745;}.an-badge-o{background:#fff8e1;color:#b8860b;}.an-badge-r{background:#fdecea;color:#dc3545;}
    .an-no-data{text-align:center;padding:50px 20px;color:#8090a0;font-family:'Oswald',sans-serif;font-size:13px;letter-spacing:.5px;}
    .an-no-data svg{width:40px;height:40px;stroke:#c0ccd8;margin-bottom:10px;}

    /* Target tab styles */
    .tg-dist{background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(0,64,128,.08);overflow:hidden;margin-bottom:14px;border:2px solid #d0dce8;}
    .tg-dist-hdr{background:linear-gradient(135deg,#004080,#1a6abf);color:#fff;padding:12px 16px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:background .2s;}
    .tg-dist-hdr:hover{background:linear-gradient(135deg,#1a6abf,#004080);}
    .tg-dist-name{font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;flex:1;}
    .tg-dist-badge{background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);border-radius:6px;padding:3px 10px;font-family:'Oswald',sans-serif;font-size:11px;white-space:nowrap;}
    .tg-dist-progress{height:4px;background:rgba(255,255,255,.25);}
    .tg-dist-progress-fill{height:100%;background:#c8991a;transition:width .4s;}
    .tg-dist-stats{display:grid;grid-template-columns:repeat(4,1fr);background:#f0f6ff;border-bottom:1px solid #d0dce8;}
    .tg-dist-stat{padding:10px 8px;text-align:center;border-right:1px solid #d0dce8;}
    .tg-dist-stat:last-child{border-right:none;}
    .tg-dst-v{font-family:'Oswald',sans-serif;font-size:18px;font-weight:700;color:#004080;}
    .tg-dst-l{font-size:9px;color:#607080;text-transform:uppercase;letter-spacing:.4px;margin-top:2px;}
    .tg-chief-wrap{overflow-x:auto;padding:12px;}
    .tg-chief-tbl{width:100%;border-collapse:collapse;font-size:12px;}
    .tg-chief-tbl thead tr{background:#e8f1fa;}
    .tg-chief-tbl th{padding:9px 14px;font-family:'Oswald',sans-serif;font-size:10px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:#004080;text-align:left;white-space:nowrap;border-bottom:2px solid #c5d9f0;}
    .tg-chief-tbl td{padding:9px 14px;border-bottom:1px solid #f0f4f8;vertical-align:middle;}
    .tg-chief-tbl tr:last-child td{border-bottom:none;}
    .tg-chief-tbl tr:nth-child(even) td{background:#fafcff;}
    .tg-chief-tbl tr:hover td{background:#eef5ff;}
    .tg-chip{display:inline-block;padding:2px 7px;border-radius:12px;font-size:10px;font-weight:600;margin:2px;}
    .tg-chip.done{background:#e8f5e9;color:#28a745;border:1px solid #b2dfcc;}
    .tg-chip.pend{background:#fff8e1;color:#b8860b;border:1px solid #ffe082;}
    .tg-expand-icon{font-size:14px;transition:transform .2s;display:inline-block;}
    
    /* Responsive */
    @media(max-width:900px){.an-charts-3{grid-template-columns:1fr 1fr;}}
    @media(max-width:600px){.an-charts-2,.an-charts-3{grid-template-columns:1fr;}.an-kpi-row{grid-template-columns:repeat(2,1fr);}}
    `;
    document.head.appendChild(style);

    // ════════════════════════════════════════════════════════
    //  AI AGENT MODAL HTML
    // ════════════════════════════════════════════════════════
    document.body.insertAdjacentHTML('beforeend', `
    <div id="icfAiOverlay" onclick="icfAiOverlayClick(event)">
      <div id="icfAiModal">
        <div class="icf-ai-head">
          <div class="icf-ai-head-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg></div>
          <div class="icf-ai-head-info"><div class="icf-ai-head-title">ICF Data Agent</div><div class="icf-ai-head-sub">AI · Google Apps Script + Claude</div></div>
          <div class="icf-ai-head-actions">
            <button class="icf-ai-hbtn gold" onclick="icfAiRefreshStats()"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M21 2v6h-6M3 12a9 9 0 0115.36-6.36L21 8M3 22v-6h6M21 12a9 9 0 01-15.36 6.36L3 16"/></svg>SYNC</button>
            <button class="icf-ai-hbtn" onclick="icfAiClose()"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>CLOSE</button>
          </div>
        </div>
        <div class="icf-ai-stats" id="icfAiStats"><div style="margin:auto;font-size:11px;color:#888;">Loading…</div></div>
        <div id="icfAiMessages"><div class="icf-welcome"><div class="icf-welcome-icon">🤖</div><div class="icf-welcome-title">Hello! I'm your ICF Data Agent.</div><div class="icf-welcome-body">I analyse all submitted ITN data — coverage, enrollment, gender breakdown, class-level stats and more.<br><br>Powered by <strong>Google Apps Script + Claude AI</strong>. API key stays securely on the server.</div></div><div id="icfGasStatus"></div></div>
        <div class="icf-samples"><div class="icf-sq-lbl">✦ Try asking</div><div class="icf-sq-row" id="icfSqRow"></div></div>
        <div class="icf-inp-row"><button class="icf-clr" onclick="icfAiClearChat()">↺ Clear</button><textarea id="icfAiInput" rows="1" placeholder="Ask about the ITN distribution data…" onkeydown="icfAiKeydown(event)" oninput="icfAiAutoResize(this)"></textarea><button id="icfAiSend" onclick="icfAiSend()"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></div>
        <div class="icf-foot">Session state + ICF-SL Server · API key never leaves the server</div>
      </div>
    </div>`);

    // ════════════════════════════════════════════════════════
    //  SHARED HELPERS
    // ════════════════════════════════════════════════════════
    const SAMPLES = ['How many schools have been submitted?','What is the overall ITN coverage rate?','Which district has the most submissions?','Show coverage breakdown by gender','How many ITNs were distributed in total?','List schools with coverage below 80%','What is average enrollment per school?','How many schools are still pending?','Compare boys vs girls ITN coverage','Which schools received IG2 nets?','How many ITNs remain after distribution?','Give me a summary by chiefdom','Which class has the highest coverage?','Who submitted the most records?'];
    
    function pickN(n){const p=[...SAMPLES],o=[];while(o.length<n&&p.length){const i=Math.floor(Math.random()*p.length);o.push(p.splice(i,1)[0]);}return o;}
    
    function md(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/`(.+?)`/g,'<code>$1</code>').replace(/^#{1,3} (.+)$/gm,'<strong style="font-size:13px;text-transform:uppercase;letter-spacing:.5px;color:#004080;display:block;margin-top:6px">$1</strong>').replace(/^- (.+)$/gm,'<span style="display:block;padding-left:14px;margin:2px 0">• $1</span>').replace(/\n\n/g,'<br><br>').replace(/\n/g,'<br>');}
    
    function covColor(p){return p>=80?'#28a745':p>=50?'#f0a500':'#dc3545';}
    function covBadge(p){const c=p>=80?'g':p>=50?'o':'r';return`<span class="an-badge an-badge-${c}">${p}%</span>`;}

    // ════════════════════════════════════════════════════════
    //  GAS CALLS
    // ════════════════════════════════════════════════════════
    async function callGAS(msg, history, context){
        const res=await fetch(GAS_URL,{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'ai_query',message:msg,history:(history||[]).slice(-10),context:context||''})});
        if(!res.ok)throw new Error('GAS HTTP '+res.status);
        const d=await res.json();if(!d.success)throw new Error(d.error||'GAS error');return d.reply;
    }

    async function fetchSheetData(){
        try{
            const res = await Promise.race([fetch(GAS_URL+'?action=getData'), new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),25000))]);
            if(res.ok){const d = await res.json();const rows = d.rows||d.data||(Array.isArray(d)?d:null);if(rows&&rows.length>0) return rows;}
        }catch(e){console.warn('[Analysis] GAS fetch failed:',e.message);}
        return [];
    }

    function n(r,key,fallback){let v=r[key];if((v===undefined||v===''||v===null)&&fallback) v=r[fallback];if(v===undefined||v===null||v==='') return 0;const clean=String(v).replace(/,/g,'').trim();return parseFloat(clean)||0;}
    function s(r,key,fallback){let v=r[key];if((v===undefined||v===null||v==='')&&fallback) v=r[fallback];return String(v||'').trim();}

    async function fetchCount(){
        try{const r=await fetch(GAS_URL+'?action=count');const d=await r.json();return d.count!==undefined?d.count:'?';}catch{return'?';}
    }

    function buildTargetsFromCSV() {
        const data = window.ALL_LOCATION_DATA || {};
        const targets = {};
        for (const district in data) {
            const dk = district.trim().toLowerCase();
            const dSet = new Set();
            for (const chiefdom in data[district]) {
                const ck = chiefdom.trim().toLowerCase();
                const cSet = new Set();
                for (const phu in data[district][chiefdom]) {
                    const pk = phu.trim().toLowerCase();
                    const pSet = new Set();
                    for (const community in data[district][chiefdom][phu]) {
                        const comk = community.trim().toLowerCase();
                        const schools = data[district][chiefdom][phu][community];
                        if (!Array.isArray(schools)) continue;
                        schools.forEach(sc => {if(sc){const fullKey=dk+'|'+ck+'|'+pk+'|'+comk+'|'+sc.trim().toLowerCase();pSet.add(fullKey);cSet.add(fullKey);dSet.add(fullKey);}});
                    }
                    if(pSet.size>0) targets[dk+'|'+ck+'|'+pk]=pSet.size;
                }
                if(cSet.size>0) targets[dk+'|'+ck]=cSet.size;
            }
            if(dSet.size>0) targets[dk]=dSet.size;
        }
        return targets;
    }

    let _sheetRows = [];
    let _refreshInterval = null;
    let _refreshCountdown = 60;

    function getLocalRows(){const s=window.state||{};return[...(s.submittedSchools||[]).map(r=>r.data||r),...(s.pendingSubmissions||[])];}
    function mergeData(sheetRows){if(sheetRows && sheetRows.length > 0) return sheetRows;return getLocalRows();}

    // ════════════════════════════════════════════════════════
    //  ANALYSIS CASCADING FILTERS
    // ════════════════════════════════════════════════════════
    function getLoc(){return(window.ALL_LOCATION_DATA&&Object.keys(window.ALL_LOCATION_DATA).length)?window.ALL_LOCATION_DATA:window.LOCATION_DATA||{};}
    function afOpt(sel,opts,disabled){const el=document.getElementById(sel);if(!el)return;const cur=el.value;el.innerHTML='<option value="">All</option>';opts.sort().forEach(o=>{const op=document.createElement('option');op.value=op.textContent=o;el.appendChild(op);});if(cur&&[...el.options].some(o=>o.value===cur))el.value=cur;el.disabled=!!disabled;}
    
    window.afCascade=function(level){
        const loc=getLoc();const d=()=>document.getElementById('af_district')?.value||'';const c=()=>document.getElementById('af_chiefdom')?.value||'';const f=()=>document.getElementById('af_facility')?.value||'';
        const resetBelow=(...ids)=>ids.forEach(id=>{const el=document.getElementById(id);if(el){el.innerHTML='<option value="">All</option>';el.disabled=true;}});
        if(level==='district'){resetBelow('af_chiefdom','af_facility');if(d()&&loc[d()]) afOpt('af_chiefdom',Object.keys(loc[d()]),false);}
        else if(level==='chiefdom'){resetBelow('af_facility');if(d()&&c()&&loc[d()]?.[c()]) afOpt('af_facility',Object.keys(loc[d()][c()]),false);}
        else if(level==='facility'){resetBelow('af_community','af_school');if(d()&&c()&&f()&&loc[d()]?.[c()]?.[f()]) afOpt('af_community',Object.keys(loc[d()][c()][f()]),false);}
        else if(level==='community'){resetBelow('af_school');const schools=loc[d()]?.[c()]?.[f()]?.[co()];if(schools) afOpt('af_school',schools,false);}
        runAnalysis();
    };

    window.clearAnalysisFilters=function(){['af_chiefdom','af_facility'].forEach(id=>{const el=document.getElementById(id);if(el){el.innerHTML='<option value="">All</option>';el.disabled=true;}});const dd=document.getElementById('af_district');if(dd)dd.value='';runAnalysis();};
    
    function initDistrictFilter(){const dd=document.getElementById('af_district');if(!dd)return;const loc=getLoc();const districts=Object.keys(loc).sort();dd.innerHTML='<option value="">All Districts</option>';districts.forEach(d=>{const o=document.createElement('option');o.value=o.textContent=d;dd.appendChild(o);});}
    
    function getFilteredData(allRows){let rows=[...allRows];const fD=document.getElementById('af_district')?.value||'';const fC=document.getElementById('af_chiefdom')?.value||'';const fF=document.getElementById('af_facility')?.value||'';const lc=s=>(s||'').toLowerCase();if(fD)rows=rows.filter(r=>lc(r.district||'')===lc(fD));if(fC)rows=rows.filter(r=>lc(r.chiefdom||'')===lc(fC));if(fF)rows=rows.filter(r=>lc(r.facility||'')===lc(fF));return rows;}

    let anCharts={};
    function destroyCharts(){Object.values(anCharts).forEach(c=>{try{c.destroy();}catch(e){}});anCharts={};}
    const CF={font:{family:"'Oswald',sans-serif"}};
    const chartOpts=(extra={})=>({responsive:true,maintainAspectRatio:true,plugins:{legend:{labels:{font:{family:"'Oswald',sans-serif",size:11},boxWidth:12}},tooltip:{titleFont:{family:"'Oswald',sans-serif"},bodyFont:{family:"'Oswald',sans-serif"}},...extra},...extra});
    function mkChart(id,cfg){const el=document.getElementById(id);if(!el)return null;const c=new Chart(el,cfg);anCharts[id]=c;return c;}

    // ════════════════════════════════════════════════════════
    //  TARGETS TAB - BUILD TREE AND RENDER
    // ════════════════════════════════════════════════════════
    function buildTargetsTree() {
        const data = window.ALL_LOCATION_DATA || {};
        const tree = {};
        for (const district in data) {
            if (!tree[district]) tree[district] = { chiefdoms: {} };
            for (const chiefdom in data[district]) {
                if (!tree[district].chiefdoms[chiefdom]) tree[district].chiefdoms[chiefdom] = { schools: [] };
                for (const phu in data[district][chiefdom]) {
                    for (const community in data[district][chiefdom][phu]) {
                        const schoolList = data[district][chiefdom][phu][community];
                        if (!Array.isArray(schoolList)) continue;
                        schoolList.forEach(s => {
                            if(s) tree[district].chiefdoms[chiefdom].schools.push({district, chiefdom, phu, community, name: s, key: district.toLowerCase()+'|'+chiefdom.toLowerCase()+'|'+phu.toLowerCase()+'|'+community.toLowerCase()+'|'+s.toLowerCase()});
                        });
                    }
                }
                tree[district].chiefdoms[chiefdom].schools.sort((a,b) => a.name.localeCompare(b.name));
            }
        }
        return tree;
    }

    function getSubmittedSet() {
        return new Set((_sheetRows || []).filter(r => r.school_name).map(r => {
            const _d = (r.district || r['District'] || '').trim().toLowerCase();
            const _c = (r.chiefdom || r['Chiefdom'] || '').trim().toLowerCase();
            const _f = (r.facility || r['Health Facility (PHU)'] || '').trim().toLowerCase();
            const _co = (r.community || r['Community / Village'] || '').trim().toLowerCase();
            const _scRaw = (r.school_name || r['School Name'] || '').trim().toLowerCase();
            const _sc = _scRaw.endsWith('_2026') ? _scRaw.slice(0,-5) : _scRaw;
            return _d+'|'+_c+'|'+_f+'|'+_co+'|'+_sc;
        }));
    }

    // GLOBAL TOGGLE FUNCTION - Makes districts clickable!
    window.toggleDistrictPanel = function(panelId, headerElement) {
        const panel = document.getElementById(panelId);
        const icon = headerElement ? headerElement.querySelector('.tg-expand-icon') : null;
        if (panel) {
            if (panel.style.display === 'none') {
                panel.style.display = 'block';
                if (icon) icon.style.transform = 'rotate(0deg)';
            } else {
                panel.style.display = 'none';
                if (icon) icon.style.transform = 'rotate(-90deg)';
            }
        }
    };

    function renderTargetsByType(tree, submitted, category, title) {
        const districts = Object.keys(tree).sort();
        if (!districts.length) return '<div style="padding:40px 20px;text-align:center;color:#94a3b8;">No data available</div>';
        
        let totalSchools = 0, totalSubmitted = 0;
        districts.forEach(d => {Object.values(tree[d].chiefdoms).forEach(c => {totalSchools += c.schools.length;totalSubmitted += c.schools.filter(s => category.has(s.key)).length;});});
        const rate = totalSchools > 0 ? Math.round((totalSubmitted / totalSchools) * 100) : 0;
        
        let html = `<div style="background:#fff;border-radius:12px;padding:16px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,.06);"><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;">
            <div style="text-align:center;padding:12px;background:#f0fdf4;border-radius:8px;border-left:3px solid #10b981;"><div style="font-size:22px;font-weight:700;color:#10b981;">${totalSchools}</div><div style="font-size:10px;color:#6b7280;">TARGETED</div></div>
            <div style="text-align:center;padding:12px;background:#ecfdf5;border-radius:8px;border-left:3px solid #06b6d4;"><div style="font-size:22px;font-weight:700;color:#06b6d4;">${totalSubmitted}</div><div style="font-size:10px;color:#6b7280;">ACHIEVED</div></div>
            <div style="text-align:center;padding:12px;background:#fffbf0;border-radius:8px;border-left:3px solid #f59e0b;"><div style="font-size:22px;font-weight:700;color:#f59e0b;">${rate}%</div><div style="font-size:10px;color:#6b7280;">COVERAGE</div></div>
        </div></div>`;
        
        districts.forEach((district, di) => {
            const panelId = `tg-panel-${di}`;
            const chiefdoms = Object.keys(tree[district].chiefdoms).sort();
            let dTotal = 0, dDone = 0;
            chiefdoms.forEach(c => {const schs = tree[district].chiefdoms[c].schools;dTotal += schs.length;dDone += schs.filter(s => category.has(s.key)).length;});
            const dPct = dTotal > 0 ? Math.round((dDone / dTotal) * 100) : 0;
            const dCol = dPct >= 80 ? '#28a745' : dPct >= 50 ? '#f0a500' : '#dc3545';
            
            html += `<div class="tg-dist">
                <div class="tg-dist-hdr" onclick="window.toggleDistrictPanel('${panelId}', this)">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span class="tg-dist-name">${district}</span>
                    <span class="tg-dist-badge">${chiefdoms.length} chiefdom${chiefdoms.length!==1?'s':''}</span>
                    <span class="tg-dist-badge">${dTotal} schools</span>
                    <span class="tg-dist-badge" style="background:rgba(40,167,69,.35);border-color:${dCol};">${dPct}%</span>
                    <span class="tg-expand-icon">▼</span>
                </div>
                <div class="tg-dist-progress"><div class="tg-dist-progress-fill" style="width:${dPct}%;"></div></div>
                <div id="${panelId}" style="display:block;">
                    <div class="tg-dist-stats">
                        <div class="tg-dist-stat"><div class="tg-dst-v">${chiefdoms.length}</div><div class="tg-dst-l">Chiefdoms</div></div>
                        <div class="tg-dist-stat"><div class="tg-dst-v">${dTotal}</div><div class="tg-dst-l">Target Schools</div></div>
                        <div class="tg-dist-stat"><div class="tg-dst-v" style="color:#28a745;">${dDone}</div><div class="tg-dst-l">Submitted</div></div>
                        <div class="tg-dist-stat"><div class="tg-dst-v" style="color:#dc3545;">${dTotal-dDone}</div><div class="tg-dst-l">Remaining</div></div>
                    </div>
                    <div class="tg-chief-wrap">
                        <table class="tg-chief-tbl">
                            <thead><tr><th>Chiefdom</th><th style="text-align:center;">Target</th><th style="text-align:center;">Submitted</th><th style="text-align:center;">Remaining</th><th>Progress</th><th>Schools</th></tr></thead>
                            <tbody>`;
            
            chiefdoms.forEach(chiefdom => {
                const schs = tree[district].chiefdoms[chiefdom].schools;
                const cTotal = schs.length;
                const cDone = schs.filter(s => category.has(s.key)).length;
                const cPct = cTotal > 0 ? Math.round((cDone / cTotal) * 100) : 0;
                const cCol = cPct >= 80 ? '#28a745' : cPct >= 50 ? '#f0a500' : '#dc3545';
                const chips = schs.map(s => {const done = category.has(s.key);const label = s.name.length > 22 ? s.name.substring(0,20)+'…' : s.name;return `<span class="tg-chip ${done?'done':'pend'}">${done?'✓ ':''}${label}</span>`;}).join('');
                html += `<tr><td style="font-weight:700;color:#004080;">📍 ${chiefdom}</td><td style="text-align:center;">${cTotal}</td><td style="text-align:center;color:#28a745;">${cDone}</td><td style="text-align:center;color:${cTotal-cDone>0?'#dc3545':'#28a745'};">${cTotal-cDone}</td>
                    <td><div style="display:flex;align-items:center;gap:8px;"><div style="background:#e4eaf2;border-radius:4px;height:8px;flex:1;"><div style="height:100%;width:${cPct}%;background:${cCol};border-radius:4px;"></div></div><span style="font-weight:700;color:${cCol};">${cPct}%</span></div></td>
                    <td><div style="display:flex;flex-wrap:wrap;gap:3px;">${chips}</div></td></tr>`;
            });
            html += `</tbody></table></div></div></div>`;
        });
        return html;
    }

    function renderTargetsTab() {
        const body = document.getElementById('targetsBody');
        if (!body) return;
        const tree = buildTargetsTree();
        const submitted = getSubmittedSet();
        const sheetBanner = _sheetRows.length === 0 ? `<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:9px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:8px;font-size:12px;color:#8a6500;"><svg viewBox="0 0 24 24" fill="none" stroke="#c8991a" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Showing data from ICF-SL Server. Hit <strong>REFRESH</strong> to pull latest.</div>` : `<div style="background:#e8f5e9;border:1px solid #b2dfcc;border-radius:9px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:8px;font-size:12px;color:#2e7d32;"><svg viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2" width="16" height="16"><path d="M9 11l3 3L22 4"/></svg>Showing <strong>${_sheetRows.length} submissions</strong> from ICF-SL Server.</div>`;
        body.innerHTML = sheetBanner + renderTargetsByType(tree, submitted, submitted, 'Targeted Schools');
    }

    // ════════════════════════════════════════════════════════
    //  MAIN ANALYSIS RENDER
    // ════════════════════════════════════════════════════════
    window.runAnalysis = function(allRows){
        if(allRows!==undefined) _sheetRows = allRows||[];
        destroyCharts();
        const body=document.getElementById('analysisBody');if(!body)return;
        const all=getFilteredData(mergeData(_sheetRows));
        const total=all.length;
        const sub=document.getElementById('anSubtitle');
        if(sub)sub.textContent=`${total} school${total!==1?'s':''} submitted · Last refreshed ${new Date().toLocaleTimeString('en-SL',{hour:'2-digit',minute:'2-digit'})}`;
        if(!total){body.innerHTML=`<div class="an-no-data"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M3 3h18v18H3zM3 9h18M9 21V9"/></svg><div>No submissions found.</div></div>`;return;}
        
        let tp=0,ti=0,tb=0,tg=0,tbi=0,tgi=0,tr=0,trem=0;const byDist={};const cls={b:[0,0,0,0,0],g:[0,0,0,0,0],bi:[0,0,0,0,0],gi:[0,0,0,0,0]};
        all.forEach(r=>{const vp=n(r,'total_pupils'),vi=n(r,'total_itn'),vb=n(r,'total_boys'),vg=n(r,'total_girls'),vbi=n(r,'total_boys_itn'),vgi=n(r,'total_girls_itn'),vr=n(r,'itns_received'),vrem=n(r,'itns_remaining')||n(r,'itns_remaining_val');tp+=vp;ti+=vi;tb+=vb;tg+=vg;tbi+=vbi;tgi+=vgi;tr+=vr;trem+=vrem;const d=(r['district']||r['District']||'Unknown');if(!byDist[d])byDist[d]={n:0,p:0,i:0,b:0,g:0,bi:0,gi:0};byDist[d].n++;byDist[d].p+=vp;byDist[d].i+=vi;byDist[d].b+=vb;byDist[d].g+=vg;byDist[d].bi+=vbi;byDist[d].gi+=vgi;
            for(let c=1;c<=5;c++){cls.b[c-1]+=n(r,'c'+c+'_boys');cls.g[c-1]+=n(r,'c'+c+'_girls');cls.bi[c-1]+=n(r,'c'+c+'_boys_itn');cls.gi[c-1]+=n(r,'c'+c+'_girls_itn');}});
        
        const ov=tp>0?Math.round((ti/tp)*100):0;const bc=tb>0?Math.round((tbi/tb)*100):0;const gc=tg>0?Math.round((tgi/tg)*100):0;
        const classLabels=['Class 1','Class 2','Class 3','Class 4','Class 5'];const classTot=cls.b.map((b,i)=>b+cls.g[i]);const classITN=cls.bi.map((b,i)=>b+cls.gi[i]);const classCov=classTot.map((t,i)=>t>0?Math.round((classITN[i]/t)*100):0);
        const distL=Object.keys(byDist).sort();const distCov=distL.map(d=>byDist[d].p>0?Math.round((byDist[d].i/byDist[d].p)*100):0);
        
        body.innerHTML = `<div class="an-kpi-row"><div class="an-kpi b"><div class="an-kpi-val">${total}</div><div class="an-kpi-lbl">Submitted</div></div><div class="an-kpi"><div class="an-kpi-val">${tp.toLocaleString()}</div><div class="an-kpi-lbl">Pupils</div></div><div class="an-kpi g"><div class="an-kpi-val">${ti.toLocaleString()}</div><div class="an-kpi-lbl">Distributed</div></div><div class="an-kpi ${ov>=80?'g':ov>=50?'o':'r'}"><div class="an-kpi-val">${ov}%</div><div class="an-kpi-lbl">Coverage</div></div></div>
        <div class="an-section"><div class="an-section-hdr"><svg viewBox="0 0 24 24" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>CLASS BREAKDOWN</div><div class="an-section-body"><div class="an-charts-2"><div class="an-chart-card"><div class="an-chart-label">Coverage by Class</div><canvas id="anClassCov"></canvas></div><div class="an-chart-card"><div class="an-chart-label">Enrollment vs ITNs</div><canvas id="anEnrollVsItn"></canvas></div></div></div></div>
        <div class="an-section"><div class="an-section-hdr"><svg viewBox="0 0 24 24" stroke-width="2"><path d="M3 3h18v18H3zM3 9h18M9 21V9"/></svg>ALL SCHOOLS (${total})</div><div class="an-section-body" style="padding:0;"><div class="an-tbl-wrap"><table class="an-tbl"><thead><tr><th>#</th><th>School</th><th>District</th><th>Pupils</th><th>ITNs</th><th>Coverage</th><th>Date</th></tr></thead><tbody>${all.sort((a,b)=>(a.district||'').localeCompare(b.district||'')).map((r,i)=>{const vp=n(r,'total_pupils'),vi=n(r,'total_itn'),cov=vp>0?Math.round((vi/vp)*100):0;return `<tr><td>${i+1}</td><td style="font-weight:600;">${s(r,'school_name','School Name')||'—'}</td><td>${s(r,'district','District')||'—'}</td><td style="text-align:center;">${vp}</td><td style="text-align:center;">${vi}</td><td><div class="an-cov-cell"><div class="an-cov-bar"><div class="an-cov-fill" style="width:${cov}%;background:${covColor(cov)};"></div></div>${covBadge(cov)}</div></td><td style="font-size:11px;">${s(r,'distribution_date','Distribution Date')||'—'}</td></tr>`;}).join('')}</tbody></table></div></div></div>`;
        
        mkChart('anClassCov',{type:'bar',data:{labels:classLabels,datasets:[{label:'Coverage %',data:classCov,backgroundColor:classCov.map(v=>covColor(v)+'cc'),borderColor:classCov.map(covColor),borderWidth:2,borderRadius:6}]},options:{...chartOpts({scales:{y:{beginAtZero:true,max:100,ticks:{callback:v=>v+'%'}}}}),plugins:{legend:{display:false}}}});
        mkChart('anEnrollVsItn',{type:'bar',data:{labels:classLabels,datasets:[{label:'Enrolled',data:classTot,backgroundColor:'rgba(0,64,128,.2)',borderColor:'#004080',borderWidth:2},{label:'Received ITN',data:classITN,backgroundColor:'rgba(40,167,69,.7)',borderColor:'#28a745',borderWidth:2}]},options:{...chartOpts({scales:{y:{beginAtZero:true}}})}});
    };

    // ════════════════════════════════════════════════════════
    //  TAB SWITCHER
    // ════════════════════════════════════════════════════════
    window.switchAnTab = function(tab) {
        const panels = { analysis:'analysisBody', targets:'targetsBody', dmsphu:'dmsphuBody' };
        ['analysis','targets','dmsphu'].forEach(t => {
            const btn = document.getElementById('anTab-'+t);
            const panel = document.getElementById(panels[t]);
            const isActive = t === tab;
            if(btn){btn.style.color=isActive?'#004080':'#607080';btn.style.borderBottomColor=isActive?'#c8991a':'transparent';btn.style.background=isActive?'#f4f8ff':'none';}
            if(panel) panel.style.display = isActive?'block':'none';
        });
        if(tab === 'targets') renderTargetsTab();
        if(tab === 'dmsphu') renderDmsPhuTab();
    };

    // ════════════════════════════════════════════════════════
    //  DMS/PHU TAB
    // ════════════════════════════════════════════════════════
    async function renderDmsPhuTab() {
        const body = document.getElementById('dmsphuBody');
        if(!body)return;
        body.innerHTML = `<div style="text-align:center;padding:40px;"><div style="border:4px solid #e0e7ef;border-top:4px solid #004080;border-radius:50%;width:36px;height:36px;animation:spin 1s linear infinite;margin:0 auto 12px;"></div><div>Loading PHU delivery data...</div></div>`;
        try{
            const lc=v=>String(v||'').trim().toLowerCase();
            const key=(d,c,f)=>lc(d)+'|'+lc(c)+'|'+lc(f);
            const csvTree={};
            await new Promise(resolve=>{Papa.parse('./dms_cascading.csv',{download:true,header:true,skipEmptyLines:true,complete(res){(res.data||[]).forEach(row=>{let d=(row['District']||'').trim().replace(/\s*District\s*$/i,'').trim();let c=(row['Chiefdom']||'').trim().replace(/\s*Chiefdom\s*$/i,'').trim();const f=(row['Facility']||row['Name of PHU']||'').trim();if(d&&c&&f){if(!csvTree[d])csvTree[d]={};if(!csvTree[d][c])csvTree[d][c]=[];if(!csvTree[d][c].includes(f))csvTree[d][c].push(f);}});resolve();},error(){resolve();}});});
            if(!Object.keys(csvTree).length){body.innerHTML='<div style="padding:24px;text-align:center;">No location data available</div>';return;}
            const gasUrl='https://script.google.com/macros/s/AKfycbymRy-M5v0fVLWUjw4IXYhd1oIR2ZvnP_Dzr_iGR-Th0cMIpmE2ntGeujWYH7-C6NHIzA/exec';
            const [dispRaw,recRaw]=await Promise.allSettled([fetch(gasUrl+'?action=getAllDispatches').then(r=>r.json()).catch(()=>[]),fetch(gasUrl+'?action=getAllReceipts').then(r=>r.json()).catch(()=>[])]);
            const dispatched=Array.isArray(dispRaw.value?.rows)?dispRaw.value.rows:(Array.isArray(dispRaw.value)?dispRaw.value:[]);
            const received=Array.isArray(recRaw.value?.rows)?recRaw.value.rows:(Array.isArray(recRaw.value)?recRaw.value:[]);
            const dispSet=new Set(dispatched.map(d=>key(d.district,d.chiefdom,d.phu)));const recSet=new Set(received.map(r=>key(r.district,r.chiefdom,r.phu)));
            let totTotal=0,totReceived=0,totPending=0,totNot=0;
            Object.keys(csvTree).forEach(d=>{Object.keys(csvTree[d]).forEach(c=>{csvTree[d][c].forEach(p=>{totTotal++;if(dispSet.has(key(d,c,p))&&recSet.has(key(d,c,p)))totReceived++;else if(dispSet.has(key(d,c,p)))totPending++;else totNot++;});});});
            const pct=totTotal?Math.round(totReceived/totTotal*100):0;
            body.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;"><div style="background:#fff;border-radius:12px;padding:14px;border-top:4px solid #004080;"><div style="font-size:28px;font-weight:700;color:#004080;">${totTotal}</div><div style="font-size:10px;">Total PHUs</div></div><div style="background:#fff;border-radius:12px;padding:14px;border-top:4px solid #28a745;"><div style="font-size:28px;font-weight:700;color:#28a745;">${totReceived}</div><div style="font-size:10px;">Received</div></div></div><div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:16px;"><div style="display:flex;justify-content:space-between;"><span>Overall Progress</span><span>${pct}%</span></div><div style="height:10px;background:#e8f0f8;border-radius:6px;"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#004080,#28a745);border-radius:6px;"></div></div></div>`;
            Object.keys(csvTree).sort().forEach(district=>{const duid='dist_'+district.replace(/\s/g,'_');let dRec=0,dPend=0,dNot=0,dTotal=0;Object.keys(csvTree[district]).forEach(chiefdom=>{csvTree[district][chiefdom].forEach(phu=>{dTotal++;if(dispSet.has(key(district,chiefdom,phu))&&recSet.has(key(district,chiefdom,phu)))dRec++;else if(dispSet.has(key(district,chiefdom,phu)))dPend++;else dNot++;});});const dPct=dTotal?Math.round(dRec/dTotal*100):0;
                body.innerHTML+=`<div style="background:#fff;border-radius:12px;margin-bottom:12px;overflow:hidden;"><div style="background:#004080;color:#fff;padding:12px;cursor:pointer;" onclick="var el=document.getElementById('${duid}');el.style.display=el.style.display==='none'?'block':'none';">📍 ${district} <span style="float:right;">${dPct}%</span></div><div id="${duid}" style="display:none;padding:12px;">${Object.keys(csvTree[district]).map(chiefdom=>{let cRec=0,cPend=0,cNot=0;csvTree[district][chiefdom].forEach(phu=>{if(dispSet.has(key(district,chiefdom,phu))&&recSet.has(key(district,chiefdom,phu)))cRec++;else if(dispSet.has(key(district,chiefdom,phu)))cPend++;else cNot++;});const cPct=csvTree[district][chiefdom].length?Math.round(cRec/csvTree[district][chiefdom].length*100):0;return `<div style="margin-bottom:8px;"><div style="font-weight:700;">${chiefdom} (${cPct}%)</div>${csvTree[district][chiefdom].map(phu=>{const isDisp=dispSet.has(key(district,chiefdom,phu)),isRec=recSet.has(key(district,chiefdom,phu));let status='⚪ Not Started';if(isDisp&&isRec)status='✅ Received';else if(isDisp)status='⏳ Pending';return `<div style="margin-left:12px;font-size:12px;">${status} ${phu}</div>`;}).join('')}</div>`;}).join('')}</div></div>`;});
        }catch(err){body.innerHTML=`<div style="padding:24px;color:#dc3545;">Error: ${err.message}</div>`;}
    }

    // ════════════════════════════════════════════════════════
    //  OPEN/CLOSE ANALYSIS
    // ════════════════════════════════════════════════════════
    window.openAnalysisModal = async function(){
        const modal=document.getElementById('analysisModal');
        if(!modal)return;
        modal.classList.add('show');
        switchAnTab('analysis');
        initDistrictFilter();
        const body=document.getElementById('analysisBody');
        const sub=document.getElementById('anSubtitle');
        if(body)body.innerHTML=`<div class="an-loading"><div class="an-spinner"></div><div class="an-load-txt">Fetching data from ICF-SL Server…</div></div>`;
        if(sub)sub.textContent='Loading…';
        const sheetRows = await fetchSheetData();
        _sheetRows = sheetRows;
        window._TARGETS = buildTargetsFromCSV();
        runAnalysis(sheetRows);
        startAutoRefresh();
    };

    window.closeAnalysisModal=function(){stopAutoRefresh();destroyCharts();document.getElementById('analysisModal')?.classList.remove('show');};

    function startAutoRefresh(){stopAutoRefresh();_refreshCountdown=60;updateRefreshBtn();_refreshInterval=setInterval(async()=>{_refreshCountdown--;updateRefreshBtn();if(_refreshCountdown<=0){_refreshCountdown=60;const rows=await fetchSheetData();_sheetRows=rows;runAnalysis(rows);const tBody=document.getElementById('targetsBody');if(tBody&&tBody.style.display!=='none')renderTargetsTab();}},1000);}
    function stopAutoRefresh(){if(_refreshInterval){clearInterval(_refreshInterval);_refreshInterval=null;}}
    function updateRefreshBtn(){const btn=document.getElementById('anRefreshBtn');if(btn)btn.textContent=`↻ REFRESH (${_refreshCountdown}s)`;}
    
    window.anRefresh = async function(){const body=document.getElementById('analysisBody');if(body)body.innerHTML=`<div class="an-loading"><div class="an-spinner"></div><div class="an-load-txt">Refreshing…</div></div>`;_refreshCountdown=60;const rows=await fetchSheetData();_sheetRows=rows;runAnalysis(rows);const tBody=document.getElementById('targetsBody');if(tBody&&tBody.style.display!=='none')renderTargetsTab();updateRefreshBtn();};

    // ════════════════════════════════════════════════════════
    //  AI STATS AND CHAT
    // ════════════════════════════════════════════════════════
    function statsHTML(sheetCount){const s=window.state||{};const sess=(s.submittedSchools||[]).length,pend=(s.pendingSubmissions||[]).length,drft=(s.drafts||[]).length;let tp=0,ti=0;[...(s.submittedSchools||[]).map(r=>r.data||r),...(s.pendingSubmissions||[])].forEach(r=>{tp+=+r.total_pupils||0;ti+=+r.total_itn||0;});const pct=tp>0?Math.round((ti/tp)*100):0;const sep='<div class="icf-ai-stat-div"></div>';return[`<div class="icf-ai-stat"><div class="icf-ai-stat-val">${sess}</div><div class="icf-ai-stat-lbl">Session</div></div>`,sep,`<div class="icf-ai-stat"><div class="icf-ai-stat-val" style="color:#28a745">${sheetCount!==null?sheetCount:'…'}</div><div class="icf-ai-stat-lbl">In Sheet</div></div>`,sep,`<div class="icf-ai-stat"><div class="icf-ai-stat-val" style="color:#e6a800">${pend}</div><div class="icf-ai-stat-lbl">Pending</div></div>`,sep,`<div class="icf-ai-stat"><div class="icf-ai-stat-val">${drft}</div><div class="icf-ai-stat-lbl">Drafts</div></div>`,sep,`<div class="icf-ai-stat"><div class="icf-ai-stat-val">${tp.toLocaleString()}</div><div class="icf-ai-stat-lbl">Pupils</div></div>`,sep,`<div class="icf-ai-stat"><div class="icf-ai-stat-val">${ti.toLocaleString()}</div><div class="icf-ai-stat-lbl">ITNs</div></div>`,sep,`<div class="icf-ai-stat"><div class="icf-ai-stat-val" style="color:${pct>=80?'#28a745':pct>=50?'#e6a800':'#dc3545'}">${pct}%</div><div class="icf-ai-stat-lbl">Coverage</div></div>`].join('');}
    
    window.icfAiRefreshStats=async function(){const el=document.getElementById('icfAiStats');if(el)el.innerHTML=statsHTML(null);setStatus('chk','Checking GAS…');const c=await fetchCount();if(el)el.innerHTML=statsHTML(c);setStatus(c==='?'?'err':'ok',c==='?'?'GAS unreachable':'GAS connected · '+c+' records');};
    
    function setStatus(t,m){const el=document.getElementById('icfGasStatus');if(el)el.innerHTML=`<div class="icf-pill ${t}"><div class="icf-dot"></div>${m}</div>`;}
    
    let chatHist=[];
    function buildCtx(){try{const all=mergeData(_sheetRows);if(!all.length)return null;let tp=0,ti=0;all.forEach(r=>{tp+=n(r,'total_pupils');ti+=n(r,'total_itn');});return`Schools:${all.length}|Pupils:${tp}|Distributed:${ti}|Coverage:${tp?Math.round(ti/tp*100):0}%`;}catch{return null;}}
    
    function addMsg(role,text){const w=document.getElementById('icfAiMessages');if(!w)return;const d=document.createElement('div');d.className='icf-msg '+role;const isAI=role==='ai';d.innerHTML=`<div class="icf-msg-av">${isAI?'<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'}</div><div class="icf-bub"></div>`;w.appendChild(d);d.querySelector('.icf-bub').innerHTML=md(text);w.scrollTop=w.scrollHeight;}
    
    function showTyp(on){if(on){const w=document.getElementById('icfAiMessages');if(!w)return;const d=document.createElement('div');d.className='icf-msg ai';d.id='icfTyp';d.innerHTML='<div class="icf-msg-av"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg></div><div class="icf-bub"><div class="icf-typing"><span></span><span></span><span></span></div></div>';w.appendChild(d);w.scrollTop=w.scrollHeight;}else{const e=document.getElementById('icfTyp');if(e)e.remove();}}
    
    function renderSamples(){const r=document.getElementById('icfSqRow');if(!r)return;r.innerHTML='';pickN(4).forEach(q=>{const b=document.createElement('button');b.className='icf-sq';b.textContent=q;b.onclick=()=>icfAiAskQ(q);r.appendChild(b);});}
    
    function icfAiAskQ(q){const i=document.getElementById('icfAiInput');if(i){i.value=q;icfAiAutoResize(i);}icfAiSend();}
    window.icfAiAskQuestion=icfAiAskQ;
    
    window.icfAiSend=async function(){const inp=document.getElementById('icfAiInput'),btn=document.getElementById('icfAiSend');if(!inp)return;const q=inp.value.trim();if(!q)return;inp.value='';icfAiAutoResize(inp);addMsg('user',q);chatHist.push({role:'user',content:q});showTyp(true);if(btn)btn.disabled=true;try{const r=await callGAS(q,chatHist,buildCtx());showTyp(false);addMsg('ai',r);chatHist.push({role:'assistant',content:r});renderSamples();}catch(e){showTyp(false);addMsg('ai',`⚠️ Error: ${e.message}`);}finally{if(btn)btn.disabled=false;if(inp)inp.focus();}};
    
    window.icfAiKeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();icfAiSend();}};
    window.icfAiAutoResize=el=>{el.style.height='auto';el.style.height=Math.min(el.scrollHeight,110)+'px';};
    window.icfAiClearChat=function(){chatHist=[];const w=document.getElementById('icfAiMessages');if(w)w.innerHTML='<div class="icf-welcome"><div class="icf-welcome-icon">🔄</div><div class="icf-welcome-title">Chat cleared</div><div class="icf-welcome-body">Ask me anything about your ITN data.</div></div><div id="icfGasStatus"></div>';renderSamples();};
    
    window.icfAiOpen=function(){document.getElementById('icfAiOverlay').classList.add('show');const el=document.getElementById('icfAiStats');if(el)el.innerHTML=statsHTML(null);renderSamples();icfAiRefreshStats();setTimeout(()=>{const i=document.getElementById('icfAiInput');if(i)i.focus();},200);};
    window.icfAiClose=()=>document.getElementById('icfAiOverlay').classList.remove('show');
    window.icfAiOverlayClick=e=>{if(e.target.id==='icfAiOverlay')icfAiClose();};
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){icfAiClose();closeAnalysisModal();}});
    
    console.log('[ICF AI Agent] Loaded ✓ - Districts are now clickable!');
})();
