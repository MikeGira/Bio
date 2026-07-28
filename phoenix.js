// phoenix.js — Shared Phoenix AI assistant widget (FAB + chat panel).
// Single source of truth: styles, markup, and logic are injected by this file.
// Usage: <script src="/phoenix.js" defer></script>
// Requires the site's CSS custom properties (--bg0/1/2, --line/2, --hi, --mid,
// --lo, --red/2, --font, --mono) which every page defines in its theme block.
// Optional per-page positioning (set BEFORE the script tag):
//   window.PHOENIX_CONFIG = { fabBottom, fabRight, panelBottom,
//                             fabBottomMobile, fabRightMobile, panelBottomMobile }
// Programmatic API for other page scripts: window.phoenixAsk('question')
(function () {
  'use strict';

  const SYSTEM = `You are Phoenix, the personal AI assistant for Michael Twagirayezu's professional website. You are his strongest advocate confident, warm, direct, and conversational. You speak like a knowledgeable friend who knows Michael extremely well.

CORE RULES: Be direct and confident. Lead with "Yes", "Absolutely", "Definitely" when the answer is positive. Never hedge unnecessarily. Keep answers short 2-4 sentences max unless the visitor asks for detail. Get to the point fast. Never say "I don't have information about that" for things clearly in scope. Use what you know. If someone asks a yes/no question, answer it with yes or no FIRST, then add one supporting sentence. Sound like a confident human, not a disclaimer-heavy bot. Never use phrases like "based on the information provided", "it's worth noting", "I should mention", or "as an AI". If someone seems interested in hiring Michael, be enthusiastic and push them toward the contact form. FORMATTING: Never use markdown. No asterisks, no bold, no italics, no bullet points starting with -, no backticks, no headers. Never use em dashes or en dashes; use commas, periods, or parentheses instead. Write in plain conversational sentences only.

WHO MICHAEL IS:
Michael Twagirayezu is a highly skilled IT Systems Engineer with 10+ years of real-world enterprise experience, based in Toronto, Canada. He is bilingual (English & French), originally from Rwanda, and deeply mission-driven.

CAN HE BUILD APPS? YES absolutely. Michael has: Built and deployed web applications using HTML, PHP, MySQL, and Python throughout his career Built this very PWA (progressive web app) portfolio site a fully functional installable app with AI assistant, security scanning, service workers, and real-time features Built automation scripts, dashboards, and data pipelines across multiple employers At Axis Investments in Rwanda, he was a professional Software Developer building production web apps At EDC, he built M&E databases, automated reporting systems, and data management platforms serving 40,000+ users He actively practices DevSecOps, CI/CD, Kubernetes, Docker, Terraform, and Python in his homelab He is currently building AI-integrated solutions and studying MLOps and AI Solutions Architecture

WHAT HE'S BUILT (examples to pull from): TaskPilot (taskpilot-umber.vercel.app) is a live AI SaaS he founded solo. It generates production-ready automation: PowerShell, Bash, and Python scripts AND full n8n workflow JSON via Claude AI. Three generators: AI Script Generator (/generate), n8n Workflow Generator (/workflow), plus a $19 Starter Kit of 9 pre-built scripts. Has live Stripe payment infrastructure (checkout and webhooks). Stack: Next.js 14, TypeScript, Supabase/PostgreSQL, Stripe, Vercel, Anthropic API, GitHub Actions CI/CD with CodeQL and Gitleaks. This portfolio PWA with AI assistant (Phoenix), self-healing security scanner, animated workflow canvas, blog with AI-generated content (bio-two-eta.vercel.app, 2026). A two-node Proxmox homelab cluster (2× HP ProBook 650 G5) running Ubuntu Server, Docker, Kubernetes k3s, Ansible, and Terraform, his hands-on DevSecOps lab (2024-present). Multi-cloud migration of a hotel web app from on-prem to GCP/K8s GKE + AWS S3 + Terraform IaC (2023). QuickBase M&E database systems for 40,000+ beneficiaries across 5 provinces in Rwanda. 30+ PowerShell and SQL automation scripts saving 200+ staff hours/year at EDC. E-learning platforms serving 40,000+ users across 5 provinces. Disaster recovery plans and automation reducing downtime 30%. Salesforce CRM automation cutting manual workload 50%. Infrastructure monitoring systems achieving 99.9% VPN uptime for 1,000+ users. Ansible, Python, Bash automation reducing manual IT work 35-40% at multiple employers.

HOW HE BUILDS: Michael published a page at /how-i-build (How I Build, linked in the site nav) explaining exactly how he builds production software solo with AI: research-first, docs before code as guardrails for the AI, security on every line, choosing the stack the problem deserves (zero-dependency vanilla JS for this site, Next.js and TypeScript for TaskPilot), treating AI output as a draft to iterate on, and automating the review loop with scheduled audits and alerts. His hard rules: the AI never commits, pushes, deletes, or makes irreversible changes without his permission, and never touches personal data without his consent. The page includes a real case study of replacing his AI-generated blog with a curated feed, with links to the actual pull requests. If a visitor asks how Michael works with AI, what his workflow is, or whether his AI use is disciplined, point them to the How I Build page.

KEY FACTS: Name: Michael Twagirayezu | Location: Toronto, ON, Canada Email: chrismikeparker1@gmail.com | Phone: +1 (647) 763-0148 GitHub: github.com/MikeGira | LinkedIn: linkedin.com/in/michael-twagirayezu | Twitter: @mikegira_ 10+ years enterprise IT experience across Canada, USA, and Rwanda Multi-cloud experience: AWS, Azure, GCP, OCI Key achievements: 30% downtime reduction, 50% fewer security incidents, 40% faster deployments, 99.8% uptime, 1,500+ tickets/year resolved

CAREER HISTORY (most recent first):
1. Systems Administrator MR. X, Toronto (Nov 2025-Jan 2026, Contract)
2. Broadcast & IT Specialist Accessible Media Inc., Toronto (Jul 2023-May 2025)
3. Asst. IT System Administrator Centre Francophone du Grand Toronto (Jul 2022-Mar 2023)
4. Technology & Database Specialist EDC, Boston (Dec 2020-Jul 2021)
5. M&E Database & IT Specialist EDC, Boston (Jul 2018-Jul 2021)
6. IT & Database Coordinator EDC, Boston (Apr 2017-Jul 2018)
7. M&E & Database Assistant EDC, Rwanda (Mar 2016-Mar 2017)
8. M&E Assistant & Database Admin Intern EDC, Rwanda (Jul 2015-Feb 2016)
9. Software Developer Axis Investments Ltd, Kigali, Rwanda (Jan 2013-Oct 2014)

SKILLS: AWS, Azure, GCP, OCI, Linux, Windows Server, Active Directory, M365, Intune, Windows Autopilot, Terraform, Kubernetes, Docker, Load Balancing, NAS / SAN, CI/CD Pipelines, GitHub Actions, PowerShell, Bash, Python, Ansible, n8n Automation, Zero Trust, Cybersecurity, Endpoint Security, SIEM, Gitleaks, ITIL, Cloud Migration, Vercel, AI Integration, MLOps, Generative AI, AI Solutions Architecture, Power BI, REST APIs, Supabase RLS, RBAC/MFA, MySQL, PostgreSQL, Salesforce, QuickBase, HTML, PHP, WordPress, FortiGate, Palo Alto firewalls

ANSWERING PRECISELY (do not overstate these):
Microsoft Configuration Manager (SCCM/MECM): course preparation and lab practice only, never hands-on in a production environment. Say exactly that if asked; never list it as a working skill.
User training: Michael built and delivered Microsoft 365 training modules and hands-on sessions at EDC. At AMI he contributed to the IT documentation and knowledge base; at CFGT he ran onboarding sessions that cut repeat tickets 30%. Never attribute training modules to AMI or CFGT.
Seniority: at CFGT, AMI, and MR. X he administered systems with elevated access granted by their owners (IT Manager, Senior Network Administrator, Senior Security Analyst). EDC is the only employer where he owned the platform outright. Never say he led or owned IT at AMI.
Education: an Advanced Diploma in Computer Software Engineering from NIAT Bangalore, plus undergraduate studies in Computer Applications. No degree was ever conferred. Never call it a degree.

CURRENT TRAJECTORY:
Transitioning into Cybersecurity, DevSecOps, Multi-Cloud Architecture, AI Integration, and AI Solutions Architecture. Actively training through AWS, Google Cloud, Red Hat, Cisco, ISACA, and Coursera. Practices in a personal homelab.

CERTIFICATIONS (earned): Cisco AI Technical Practitioner - Cisco via Credly (2026)
In progress: Google Cybersecurity Professional Certificate (Coursera, 2026)
TRAINING - COURSE COMPLETIONS: Microsoft 365 Endpoint Administrator MD-102 Cert Prep - LinkedIn Learning (2024)
TRAINING COMPLETED: Multi-Cloud and DevOps Intensive - The Cloud Bootcamp (2023) | CultureLink Cybersecurity Training Program - ISACA Foundation (2025) | CMU-Africa AI Bootcamp (2018)
EDUCATION: Bachelor of Computer Applications - Sambhram Academy of Management Studies / Bangalore University, India (2008-2011) | Rwanda Advanced Level Certificate A2 - G.S. Saint Andre, Kigali (2008)

VISION:
Michael is building toward founding a technology company that delivers AI and automation solutions to underserved communities in Rwanda, Canada, and across Africa in agriculture, healthcare, education, governance, and beyond.

AVAILABILITY:
Michael is open to full-time roles, contracts, consulting, partnerships, and advisory opportunities. Direct interested parties to reach out via the contact form or email chrismikeparker1@gmail.com.`;

  const CSS = `
.ai-fab{position:fixed;bottom:var(--phx-fab-bottom,24px);right:var(--phx-fab-right,24px);z-index:80;width:64px;height:64px;border-radius:50%;background:radial-gradient(circle at 32% 26%,rgba(255,255,255,.97),rgba(255,240,220,.90));border:1.5px solid rgba(255,255,255,.38);box-shadow:0 4px 24px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.7);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .22s,box-shadow .22s,background .3s,border-color .3s;animation:phoenix-pulse 2.8s ease-in-out infinite;padding:6px;overflow:visible}
.ai-fab::before{content:'';position:absolute;top:7px;left:11px;right:11px;height:38%;background:linear-gradient(to bottom,rgba(255,255,255,.55),transparent);border-radius:50% 50% 0 0;pointer-events:none;z-index:2;transition:background .3s}
.ai-fab:hover,.ai-fab.phx-active{background:radial-gradient(circle at 35% 28%,rgba(58,18,3,.95),rgba(12,3,0,.98));border-color:rgba(255,100,0,.55);box-shadow:0 0 0 2px rgba(255,80,0,.55),0 0 22px rgba(255,65,0,.65),0 0 52px rgba(255,35,0,.35),inset 0 0 16px rgba(0,0,0,.5),0 5px 22px rgba(0,0,0,.5);transform:scale(1.07)}
.ai-fab.phx-active{animation:none}
.ai-fab:hover::before,.ai-fab.phx-active::before{background:linear-gradient(to bottom,rgba(255,90,20,.2),transparent)}
.phoenix-img{width:50px;height:50px;object-fit:contain;filter:drop-shadow(0 0 6px rgba(255,120,0,.7));position:relative;z-index:1}
@keyframes phoenix-pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,100,0,.3),0 4px 20px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.7)}50%{box-shadow:0 0 0 8px rgba(255,100,0,0),0 4px 20px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.7)}}
.phx-fire-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;image-rendering:pixelated;mix-blend-mode:screen;opacity:0;transition:opacity .48s ease;z-index:0;clip-path:circle(50% at 50% 50%)}
.ai-fab:hover .phx-fire-canvas,.ai-fab.phx-active .phx-fire-canvas{opacity:1}
@keyframes panel-spring-in{0%{transform:translateY(22px) scaleX(.90) scaleY(.82);opacity:0}36%{transform:translateY(-7px) scaleX(1.03) scaleY(1.055);opacity:1}56%{transform:translateY(4px) scaleX(.994) scaleY(.987);opacity:1}73%{transform:translateY(-2px) scaleX(1.004) scaleY(1.007);opacity:1}88%{transform:translateY(1px) scaleX(.999) scaleY(.999);opacity:1}100%{transform:translateY(0) scale(1);opacity:1}}
.ai-panel.panel-spring{animation:panel-spring-in .62s cubic-bezier(.34,1.22,.64,1)}
@keyframes phx-spring{0%{transform:scale(1)}7%{transform:scale(1.26,.79)}17%{transform:scale(.91,1.11)}29%{transform:scale(1.13,.92)}41%{transform:scale(.96,1.06)}56%{transform:scale(1.05,.97)}70%{transform:scale(.99,1.02)}85%{transform:scale(1.01,.99)}100%{transform:scale(1)}}
.ai-fab.phx-spring{animation:phx-spring .68s cubic-bezier(.36,.07,.19,.97) forwards!important}
.ai-panel{position:fixed;bottom:var(--phx-panel-bottom,104px);right:24px;z-index:79;width:360px;max-width:calc(100vw - 48px);background:var(--bg1);border:1px solid var(--line2);border-radius:32px;display:flex;flex-direction:column;transform:translateY(12px) scale(.97);opacity:0;pointer-events:none;transition:transform .25s ease,opacity .25s ease;box-shadow:0 24px 80px rgba(0,0,0,.45);max-height:calc(100vh - 140px);overflow:hidden}
.ai-panel.open{transform:none;opacity:1;pointer-events:all}
.ai-head{padding:14px 16px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.ai-head-l{display:flex;align-items:center;gap:10px}
.ai-live{width:7px;height:7px;border-radius:50%;background:var(--green,#22c55e);animation:phx-pulse-g 2s infinite;flex-shrink:0}
@keyframes phx-pulse-g{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(34,197,94,.4)}50%{opacity:.5;box-shadow:0 0 0 5px rgba(34,197,94,0)}}
.ai-head h4{font-size:.9375rem;font-weight:700;color:var(--hi)}
.ai-head p{font-family:var(--mono);font-size:.65rem;color:var(--mid)}
.ai-x{background:none;border:none;color:var(--lo);cursor:pointer;font-size:1rem;padding:3px;line-height:1;transition:color .15s}
.ai-x:hover{color:var(--hi)}
.ai-msgs{max-height:310px;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
.amsg{max-width:88%;font-size:.8rem;line-height:1.6;padding:9px 13px;border-radius:12px}
.amsg.bot{background:var(--bg2);color:var(--hi);align-self:flex-start;border-bottom-left-radius:4px;font-size:.8rem}
.amsg.user{background:var(--red);color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
.amsg.typing{display:flex;gap:4px;align-items:center;padding:13px}
.amsg.typing span{width:5px;height:5px;border-radius:50%;background:var(--lo);animation:phx-tdot 1.2s infinite}
.amsg.typing span:nth-child(2){animation-delay:.2s}
.amsg.typing span:nth-child(3){animation-delay:.4s}
@keyframes phx-tdot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
.ai-chips{padding:8px 14px;display:flex;flex-wrap:wrap;gap:6px;border-top:1px solid var(--line)}
.ai-chip{font-family:var(--mono);font-size:.68rem;padding:5px 11px;background:var(--bg2);border:1px solid var(--line2);border-radius:50px;color:var(--mid);cursor:pointer;transition:all .15s}
.ai-chip:hover{border-color:var(--red);color:var(--hi)}
.ai-inp-row{padding:10px 12px;border-top:1px solid var(--line);display:flex;gap:8px;flex-shrink:0;align-items:center}
.ai-inp{flex:1;min-width:0;background:var(--bg0);border:1px solid var(--line2);border-radius:12px;padding:9px 12px;font-family:var(--font);font-size:16px;color:var(--hi);outline:none;transition:border-color .15s}
.ai-inp:focus{border-color:var(--red)}
.ai-send{background:var(--red);border:none;border-radius:12px;color:#fff;padding:9px 14px;cursor:pointer;font-size:.875rem;font-weight:600;transition:background .15s;flex-shrink:0;white-space:nowrap}
.ai-send:hover{background:var(--red2)}
@media(max-width:700px){.ai-fab{bottom:var(--phx-fab-bottom-m,16px);right:var(--phx-fab-right-m,16px);width:52px;height:52px}.ai-panel{right:8px;left:8px;width:auto;max-width:none;bottom:var(--phx-panel-bottom-m,84px);max-height:55vh;border-radius:16px}.ai-msgs{max-height:160px}.ai-chips{flex-wrap:wrap}.ai-inp{font-size:16px!important}}
`;

  const HTML = `
<button class="ai-fab" id="aiFab" aria-label="Ask Phoenix, Michael's AI Assistant"><canvas id="phxFire" class="phx-fire-canvas" width="64" height="64" aria-hidden="true"></canvas>
  <img src="/phoenix.png" alt="" class="phoenix-img" aria-hidden="true"/>
</button>
<div class="ai-panel" id="aiPanel" role="dialog">
  <div class="ai-head">
    <div class="ai-head-l"><span class="ai-live"></span><div><h4>Phoenix</h4><p>Michael's AI Assistant &middot; Always On</p></div></div>
    <button class="ai-x" id="aiX">&#10005;</button>
  </div>
  <div class="ai-msgs" id="aiMsgs">
    <div class="amsg bot" style="font-size:.8rem">Hey! I'm <strong>Phoenix</strong>, Michael's AI assistant. Ask me anything about his skills, experience, what he's built, or how to work with him.</div>
  </div>
  <div class="ai-chips">
    <button class="ai-chip" data-q="What are Michael's core technical skills?">Skills</button>
    <button class="ai-chip" data-q="Can Michael build apps?">Build Apps?</button>
    <button class="ai-chip" data-q="Is Michael available for hire?">Availability</button>
    <button class="ai-chip" data-q="What is Michael's long-term vision?">Vision</button>
  </div>
  <div class="ai-inp-row">
    <input class="ai-inp" id="aiInp" type="text" placeholder="Ask a question&#8230;"/>
    <button class="ai-send" id="aiSend">&#8594;</button>
  </div>
</div>
`;

  // Analytics is optional per page (blog has no track()); never let it throw.
  const track = (ev, meta) => { try { window.track && window.track(ev, meta); } catch (_) {} };

  function init() {
    const cfg = window.PHOENIX_CONFIG || {};
    const cssVars = {
      fabBottom: '--phx-fab-bottom', fabRight: '--phx-fab-right',
      panelBottom: '--phx-panel-bottom', fabBottomMobile: '--phx-fab-bottom-m',
      fabRightMobile: '--phx-fab-right-m', panelBottomMobile: '--phx-panel-bottom-m',
    };
    for (const key in cssVars) {
      if (cfg[key]) document.documentElement.style.setProperty(cssVars[key], cfg[key]);
    }

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const mount = document.createElement('div');
    mount.innerHTML = HTML; // static markup constant — no user input flows here
    while (mount.firstChild) document.body.appendChild(mount.firstChild);

    const panel = document.getElementById('aiPanel'),
          msgs = document.getElementById('aiMsgs'),
          inp = document.getElementById('aiInp'),
          fab = document.getElementById('aiFab');
    let hist = [];

    fab.addEventListener('click', () => {
      const wasOpen = panel.classList.contains('open');
      fab.classList.remove('phx-spring');
      void fab.offsetWidth;
      fab.classList.add('phx-spring');
      fab.addEventListener('animationend', () => fab.classList.remove('phx-spring'), { once: true });
      panel.classList.toggle('open');
      fab.classList.toggle('phx-active', panel.classList.contains('open'));
      if (panel.classList.contains('open')) {
        panel.classList.remove('panel-spring');
        void panel.offsetWidth;
        panel.classList.add('panel-spring');
        panel.addEventListener('animationend', () => panel.classList.remove('panel-spring'), { once: true });
        window._phxFireStart?.();
      } else {
        window._phxFireStop?.();
      }
      if (!wasOpen) track('chat_start');
    });
    document.getElementById('aiX').addEventListener('click', () => {
      panel.classList.remove('open');
      fab.classList.remove('phx-active');
      window._phxFireStop?.();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        panel.classList.remove('open');
        fab.classList.remove('phx-active');
        window._phxFireStop?.();
      }
    });
    document.querySelectorAll('.ai-chip').forEach(b => b.addEventListener('click', () => send(b.dataset.q)));
    document.getElementById('aiSend').addEventListener('click', () => { const v = inp.value.trim(); if (v) { send(v); inp.value = ''; } });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { const v = inp.value.trim(); if (v) { send(v); inp.value = ''; } } });

    // ── Phoenix demoscene canvas fire (burning-bush algorithm) ──────────────
    (function () {
      const C = document.getElementById('phxFire');
      if (!C) return;
      const W = 64, H = 64, ctx = C.getContext('2d');
      const buf = new Uint8Array(W * H);
      const img = ctx.createImageData(W, H);
      const px = new Uint32Array(img.data.buffer);
      // Palette: black→deep crimson→orange→yellow→white-hot (screens onto dark button bg)
      const pal = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        const r = Math.min(255, i < 55 ? i * 4 : 255) | 0;
        const g = Math.min(255, Math.max(0, i < 75 ? 0 : i < 185 ? (i - 75) * 1.9 : (i - 185) * 2.8 + 209)) | 0;
        const b = Math.min(255, Math.max(0, i < 210 ? 0 : (i - 210) * 8)) | 0;
        const a = Math.min(255, i < 10 ? i * 22 : 215 + ((i - 10) / 245 * 40 | 0)) | 0;
        pal[i] = (a << 24) | (b << 16) | (g << 8) | r;
      }
      let raf = null;
      function tick() {
        // Seed entire bottom 2 rows — full-width intense heat, clipped to circle by CSS
        for (let x = 0; x < W; x++) {
          buf[(H - 1) * W + x] = Math.random() > .04 ? 242 + ((Math.random() * 13) | 0) : 185 + ((Math.random() * 70) | 0);
          buf[(H - 2) * W + x] = (buf[(H - 1) * W + x] * .9) | 0;
        }
        for (let y = 0; y < H - 2; y++) {
          for (let x = 0; x < W; x++) {
            const rnd = (Math.random() * 3) | 0;
            const xd = (x - rnd + 1 + W) % W;
            buf[y * W + xd] = Math.max(0, buf[(y + 1) * W + x] - (rnd === 0 ? 0 : 1));
          }
        }
        for (let i = 0; i < W * H; i++) px[i] = pal[buf[i]];
        ctx.putImageData(img, 0, 0);
        raf = requestAnimationFrame(tick);
      }
      function startFire() { if (!raf) tick(); }
      function stopFire() { if (raf) { cancelAnimationFrame(raf); raf = null; ctx.clearRect(0, 0, W, H); for (let i = 0; i < buf.length; i++) buf[i] = 0; } }
      fab.addEventListener('mouseenter', startFire);
      fab.addEventListener('mouseleave', () => { if (!fab.classList.contains('phx-active')) stopFire(); });
      window._phxFireStart = startFire;
      window._phxFireStop = stopFire;
    })();

    function addMsg(t, r) {
      const d = document.createElement('div');
      d.className = 'amsg ' + r;
      if (r === 'bot typing') {
        // safe DOM no user input involved
        [1, 2, 3].forEach(() => d.appendChild(document.createElement('span')));
      } else {
        // user input and bot replies always use textContent, never innerHTML
        d.textContent = t;
      }
      msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d;
    }

    let _lastSend = 0, _sending = false;
    async function send(text) {
      if (_sending) { return; }
      const now = Date.now();
      if (now - _lastSend < 1500) { addMsg('Please wait a moment before sending another message.', 'bot'); return; }
      _lastSend = now; _sending = true;
      addMsg(text, 'user'); hist.push({ role: 'user', content: text }); track('chat_message');
      if (hist.length > 40) { hist = hist.slice(-40); }
      const ty = addMsg('', 'bot typing');
      try {
        // Model is enforced server-side by api/chat.js — never sent from the client.
        const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ max_tokens: 1000, system: SYSTEM, messages: hist }) });
        const d = await r.json();
        if (!r.ok) {
          ty.remove();
          // Show a friendly message for overload errors
          const isOverload = r.status === 529 || (d.error || '').toLowerCase().includes('overload');
          const errMsg = isOverload
            ? 'Anthropic\'s servers are busy right now. Please try again in a minute.'
            : (d.error || d.message || ('API error ' + r.status));
          addMsg(errMsg, 'bot');
          _sending = false; return;
        }
        let rep = d.content?.[0]?.text;
        // Strip markdown and em-dashes from AI output
        if (rep) { rep = rep.replace(/ — /g, ' ').replace(/—/g, ' ').replace(/ - /g, ' ').replace(/\n- /g, '\n').replace(/^- /gm, '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/`([^`]+)`/g, '$1'); }
        if (!rep) {
          ty.remove();
          addMsg('No response received. Please try again.', 'bot');
          _sending = false; return;
        }
        ty.remove(); addMsg(rep, 'bot'); hist.push({ role: 'assistant', content: rep });
      } catch (e) { ty.remove(); addMsg('Connection error. ' + e.message, 'bot'); }
      finally { _sending = false; }
    }

    // Programmatic entry point for page scripts (e.g. blog trending topics).
    window.phoenixAsk = q => {
      if (typeof q !== 'string' || !q.trim()) return;
      if (!panel.classList.contains('open')) fab.click();
      send(q.trim());
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
