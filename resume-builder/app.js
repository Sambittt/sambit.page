// ── STATE ──────────────────────────────────────────────────────────
const S={name:'',title:'',email:'',phone:'',location:'',website:'',linkedin:'',github:'',summary:'',exp:[],edu:[],skills:[],proj:[],certs:[],tpl:'classic',accent:'#2563eb'};

// ── ACCORDION — uses classList on both header + body ───────────────
function tog(h){h.classList.toggle('open');h.nextElementSibling.classList.toggle('open');}
window.tog=tog;

// ── TEMPLATE SWITCHER ──────────────────────────────────────────────
function setTpl(t){S.tpl=t;document.querySelectorAll('.tpl-btn').forEach(b=>b.classList.toggle('active',b.textContent.toLowerCase()===t));render();}
window.setTpl=setTpl;

// ── DYNAMIC LISTS ──────────────────────────────────────────────────
const DEFS={
  exp:{role:'',company:'',location:'',start:'',end:'',current:false,bullets:''},
  edu:{degree:'',school:'',location:'',start:'',end:'',gpa:''},
  skills:{category:'',items:''},
  proj:{name:'',tech:'',link:'',desc:''},
  certs:{name:'',issuer:'',date:''}
};

function addE(k){S[k].push({...DEFS[k]});renderList(k);}
window.addE=addE;

function rmE(k,i){S[k].splice(i,1);renderList(k);}
window.rmE=rmE;

function setE(k,i,f,v){S[k][i][f]=(f==='current')?v.checked:v;render();}
window.setE=setE;

function renderList(k){
  const el=document.getElementById(k+'-list');
  if(!el)return;
  el.innerHTML=S[k].map((e,i)=>entryHTML(k,e,i)).join('');
  render();
}

function entryHTML(k,e,i){
  const lbl={exp:'Experience',edu:'Education',skills:'Skills',proj:'Project',certs:'Certification'}[k];
  const title=k==='exp'?(e.role||e.company||lbl+' '+(i+1)):k==='edu'?(e.degree||e.school||lbl+' '+(i+1)):k==='skills'?(e.category||'Skill Group '+(i+1)):k==='proj'?(e.name||lbl+' '+(i+1)):(e.name||lbl+' '+(i+1));
  let fields='';
  if(k==='exp') fields=`
    <div class="r2"><label>Job Title<input value="${e.role}" oninput="setE('exp',${i},'role',this.value)" placeholder="Software Engineer"/></label><label>Company<input value="${e.company}" oninput="setE('exp',${i},'company',this.value)" placeholder="Company Name"/></label></div>
    <div class="r2"><label>Location<input value="${e.location}" oninput="setE('exp',${i},'location',this.value)" placeholder="City, State"/></label><label>Start<input value="${e.start}" oninput="setE('exp',${i},'start',this.value)" placeholder="Jan 2022"/></label></div>
    <div class="r2"><label>End<input value="${e.end}" oninput="setE('exp',${i},'end',this.value)" placeholder="Dec 2023" ${e.current?'disabled':''}/></label><label style="flex-direction:row;align-items:center;gap:.4rem;text-transform:none"><input type="checkbox" style="width:auto;padding:0" ${e.current?'checked':''} onchange="setE('exp',${i},'current',this)"/> Current</label></div>
    <label>Bullet Points (one per line)<textarea rows="3" oninput="setE('exp',${i},'bullets',this.value)" placeholder="• Led team of 5 engineers&#10;• Increased performance by 40%">${e.bullets}</textarea></label>`;
  if(k==='edu') fields=`
    <div class="r2"><label>Degree<input value="${e.degree}" oninput="setE('edu',${i},'degree',this.value)" placeholder="BSc Computer Science"/></label><label>School<input value="${e.school}" oninput="setE('edu',${i},'school',this.value)" placeholder="University Name"/></label></div>
    <div class="r2"><label>Location<input value="${e.location}" oninput="setE('edu',${i},'location',this.value)" placeholder="City, State"/></label><label>GPA<input value="${e.gpa}" oninput="setE('edu',${i},'gpa',this.value)" placeholder="3.8"/></label></div>
    <div class="r2"><label>Start<input value="${e.start}" oninput="setE('edu',${i},'start',this.value)" placeholder="2018"/></label><label>End<input value="${e.end}" oninput="setE('edu',${i},'end',this.value)" placeholder="2022"/></label></div>`;
  if(k==='skills') fields=`
    <div class="r2"><label>Category<input value="${e.category}" oninput="setE('skills',${i},'category',this.value)" placeholder="Programming"/></label><label>Skills<input value="${e.items}" oninput="setE('skills',${i},'items',this.value)" placeholder="Python, JavaScript, Java"/></label></div>`;
  if(k==='proj') fields=`
    <div class="r2"><label>Project Name<input value="${e.name}" oninput="setE('proj',${i},'name',this.value)" placeholder="My Project"/></label><label>Link<input value="${e.link}" oninput="setE('proj',${i},'link',this.value)" placeholder="https://github.com/..."/></label></div>
    <label>Technologies<input value="${e.tech}" oninput="setE('proj',${i},'tech',this.value)" placeholder="React, Node.js, MongoDB"/></label>
    <label>Description<textarea rows="2" oninput="setE('proj',${i},'desc',this.value)" placeholder="What this project does and its impact">${e.desc}</textarea></label>`;
  if(k==='certs') fields=`
    <div class="r2"><label>Name<input value="${e.name}" oninput="setE('certs',${i},'name',this.value)" placeholder="AWS Developer Associate"/></label><label>Issuer<input value="${e.issuer}" oninput="setE('certs',${i},'issuer',this.value)" placeholder="Amazon Web Services"/></label></div>
    <label>Date<input value="${e.date}" oninput="setE('certs',${i},'date',this.value)" placeholder="2024"/></label>`;
  return`<div class="entry"><div class="entry-h"><span>${title}</span><button class="rm-btn" onclick="rmE('${k}',${i})">✕</button></div><div class="entry-b">${fields}</div></div>`;
}

// ── RENDER TEMPLATES ───────────────────────────────────────────────
function expRows(arr){return arr.filter(e=>e.company||e.role).map(e=>`
  <div style="margin-bottom:11px">
    <div class="reh"><span class="rrl">${e.role||''}</span><span class="rdt">${e.start||''}${(e.start||e.end)?'–':''}${e.current?'Present':e.end||''}</span></div>
    <div class="rco">${e.company||''}${e.location?', '+e.location:''}</div>
    ${e.bullets?'<ul>'+e.bullets.split('\n').filter(b=>b.trim()).map(b=>`<li>${b.replace(/^[•\-]\s*/,'')}</li>`).join('')+'</ul>':''}
  </div>`).join('');}

function classic(){
  const p=S,ct=[p.email,p.phone,p.location].filter(Boolean).join(' &nbsp;|&nbsp; ');
  const lk=[p.website&&`<a href="${p.website}" target="_blank">${p.website.replace(/https?:\/\//,'')}</a>`,p.linkedin&&`<a href="https://linkedin.com/in/${p.linkedin}" target="_blank">LinkedIn</a>`,p.github&&`<a href="https://github.com/${p.github}" target="_blank">GitHub</a>`].filter(Boolean).join(' &nbsp;|&nbsp; ');
  return`<div class="r-classic">
  <div class="rh"><div class="rn">${p.name||'Your Name'}</div>${p.title?`<div class="rjt">${p.title}</div>`:''} ${ct?`<div class="rct">${ct}</div>`:''} ${lk?`<div class="rln">${lk}</div>`:''}</div>
  ${p.summary?`<div class="rst">Summary</div><p class="rsm">${p.summary}</p>`:''}
  ${p.exp.filter(e=>e.company||e.role).length?`<div class="rst">Experience</div>${expRows(p.exp).replace(/reh|rrl|rdt|rco/g,m=>m)}`:''}
  ${p.edu.filter(e=>e.school||e.degree).length?`<div class="rst">Education</div>${p.edu.filter(e=>e.school||e.degree).map(e=>`<div style="margin-bottom:9px"><div class="reh"><span class="rrl">${e.degree||''}</span><span class="rdt">${e.start||''}${(e.start||e.end)?'–':''}${e.end||''}</span></div><div class="rco">${e.school||''}${e.location?', '+e.location:''}${e.gpa?' · GPA: '+e.gpa:''}</div></div>`).join('')}`:''}
  ${p.skills.filter(s=>s.items).length?`<div class="rst">Skills</div>${p.skills.filter(s=>s.items).map(s=>`<div class="rsk">${s.category?`<span class="rskc">${s.category}: </span>`:''} ${s.items}</div>`).join('')}`:''}
  ${p.proj.filter(q=>q.name).length?`<div class="rst">Projects</div>${p.proj.filter(q=>q.name).map(q=>`<div style="margin-bottom:9px"><div class="reh"><span class="rrl">${q.link?`<a href="${q.link}" target="_blank">${q.name}</a>`:q.name}</span>${q.tech?`<span class="rdt">${q.tech}</span>`:''}</div>${q.desc?`<div style="font-size:12px;color:#444;margin-top:2px">${q.desc}</div>`:''}</div>`).join('')}`:''}
  ${p.certs.filter(c=>c.name).length?`<div class="rst">Certifications</div>${p.certs.filter(c=>c.name).map(c=>`<div class="reh" style="margin-bottom:6px"><span class="rrl">${c.name}</span><span class="rdt">${c.issuer?c.issuer+(c.date?' · ':''):''}${c.date||''}</span></div>`).join('')}`:''}
  </div>`;
}

function modern(){
  const p=S,acc=p.accent||'#2563eb';
  const side=`<div class="rms" style="--acc:${acc}">
    <div class="rmn">${p.name||'Your Name'}</div>${p.title?`<div class="rmt">${p.title}</div>`:''}
    ${[p.email,p.phone,p.location,p.website&&`<a href="${p.website}" style="color:rgba(255,255,255,.85)">${p.website.replace(/https?:\/\//,'')}</a>`,p.linkedin&&`linkedin.com/in/${p.linkedin}`,p.github&&`github.com/${p.github}`].filter(Boolean).map(v=>`<div class="rmci">${v}</div>`).join('')}
    ${p.skills.filter(s=>s.items).length?`<div class="rmsl">Skills</div>${p.skills.filter(s=>s.items).map(s=>`<div class="rmsk">${s.category?`<b>${s.category}:</b> `:''} ${s.items}</div>`).join('')}`:''}
    ${p.certs.filter(c=>c.name).length?`<div class="rmsl">Certifications</div>${p.certs.filter(c=>c.name).map(c=>`<div class="rmsk">${c.name}${c.date?' ('+c.date+')':''}</div>`).join('')}`:''}
  </div>`;
  const expH=p.exp.filter(e=>e.company||e.role).map(e=>`<div style="margin-bottom:10px"><div class="mmeh"><span class="mmrl">${e.role||''}</span><span class="mmdt">${e.start||''}${(e.start||e.end)?'–':''}${e.current?'Present':e.end||''}</span></div><div class="mmco">${e.company||''}${e.location?', '+e.location:''}</div>${e.bullets?'<ul>'+e.bullets.split('\n').filter(b=>b.trim()).map(b=>`<li>${b.replace(/^[•\-]\s*/,'')}</li>`).join('')+'</ul>':''}</div>`).join('');
  const main=`<div class="rmm" style="--acc:${acc}">
    ${p.summary?`<div class="mmst">Summary</div><p class="mmsm">${p.summary}</p>`:''}
    ${p.exp.filter(e=>e.company||e.role).length?`<div class="mmst">Experience</div>${expH}`:''}
    ${p.edu.filter(e=>e.school||e.degree).length?`<div class="mmst">Education</div>${p.edu.filter(e=>e.school||e.degree).map(e=>`<div style="margin-bottom:9px"><div class="mmeh"><span class="mmrl">${e.degree||''}</span><span class="mmdt">${e.start||''}${(e.start||e.end)?'–':''}${e.end||''}</span></div><div class="mmco">${e.school||''}${e.location?', '+e.location:''}${e.gpa?' · GPA: '+e.gpa:''}</div></div>`).join('')}`:''}
    ${p.proj.filter(q=>q.name).length?`<div class="mmst">Projects</div>${p.proj.filter(q=>q.name).map(q=>`<div style="margin-bottom:9px"><div class="mmeh"><span class="mmrl">${q.link?`<a href="${q.link}" style="color:${acc}" target="_blank">${q.name}</a>`:q.name}</span>${q.tech?`<span class="mmdt">${q.tech}</span>`:''}</div>${q.desc?`<div style="font-size:11px;color:#444;margin-top:2px">${q.desc}</div>`:''}</div>`).join('')}`:''}
  </div>`;
  return`<div class="r-modern">${side}${main}</div>`;
}

function minimal(){
  const p=S;
  const ct=[p.email,p.phone,p.location,p.website&&`<a href="${p.website}" target="_blank">${p.website.replace(/https?:\/\//,'')}</a>`,p.linkedin&&`<a href="https://linkedin.com/in/${p.linkedin}" target="_blank">LinkedIn</a>`,p.github&&`<a href="https://github.com/${p.github}" target="_blank">GitHub</a>`].filter(Boolean);
  return`<div class="r-minimal">
  <div class="mnn">${p.name||'Your Name'}</div>${p.title?`<div class="mnt">${p.title}</div>`:''}
  <div class="mnl"></div>
  ${ct.length?`<div class="mnc">${ct.map(v=>`<span>${v}</span>`).join('')}</div>`:''}
  ${p.summary?`<div class="mnst">Summary</div><p class="mnsm">${p.summary}</p>`:''}
  ${p.exp.filter(e=>e.company||e.role).length?`<div class="mnst">Experience</div>${p.exp.filter(e=>e.company||e.role).map(e=>`<div class="mnrow"><div class="mndt">${e.start||''}${(e.start||e.end)?' – ':''}${e.current?'Present':e.end||''}</div><div><div class="mnrl">${e.role||''}</div><div class="mnco">${e.company||''}${e.location?', '+e.location:''}</div>${e.bullets?'<ul>'+e.bullets.split('\n').filter(b=>b.trim()).map(b=>`<li>${b.replace(/^[•\-]\s*/,'')}</li>`).join('')+'</ul>':''}</div></div>`).join('')}`:''}
  ${p.edu.filter(e=>e.school||e.degree).length?`<div class="mnst">Education</div>${p.edu.filter(e=>e.school||e.degree).map(e=>`<div class="mnrow"><div class="mndt">${e.start||''}${(e.start||e.end)?' – ':''}${e.end||''}</div><div><div class="mnrl">${e.degree||''}</div><div class="mnco">${e.school||''}${e.location?', '+e.location:''}${e.gpa?' · GPA: '+e.gpa:''}</div></div></div>`).join('')}`:''}
  ${p.skills.filter(s=>s.items).length?`<div class="mnst">Skills</div>${p.skills.filter(s=>s.items).map(s=>`<div class="mnsk">${s.category?`<span class="mnskc">${s.category}: </span>`:''} ${s.items}</div>`).join('')}`:''}
  ${p.proj.filter(q=>q.name).length?`<div class="mnst">Projects</div>${p.proj.filter(q=>q.name).map(q=>`<div class="mnrow"><div class="mndt">${q.tech||''}</div><div><div class="mnrl">${q.link?`<a href="${q.link}" style="color:#222" target="_blank">${q.name}</a>`:q.name}</div>${q.desc?`<div style="font-size:11px;color:#555;margin-top:2px">${q.desc}</div>`:''}</div></div>`).join('')}`:''}
  ${p.certs.filter(c=>c.name).length?`<div class="mnst">Certifications</div>${p.certs.filter(c=>c.name).map(c=>`<div class="mnrow"><div class="mndt">${c.date||''}</div><div><div class="mnrl">${c.name}</div>${c.issuer?`<div style="font-size:11px;color:#666">${c.issuer}</div>`:''}</div></div>`).join('')}`:''}
  </div>`;
}

// ── RENDER ─────────────────────────────────────────────────────────
function render(){
  const sheet=document.getElementById('resume-sheet');
  if(!sheet)return;
  const tpls={classic,modern,minimal};
  sheet.innerHTML=(tpls[S.tpl]||classic)();
}

// ── DOWNLOAD ───────────────────────────────────────────────────────
async function dlPDF(){
  const btn=document.getElementById('btn-pdf');
  btn.textContent='Generating…';btn.disabled=true;
  try{
    const el=document.getElementById('resume-sheet');
    const fname=(S.name||'resume').toLowerCase().replace(/\s+/g,'_')+'_resume.pdf';
    await html2pdf().set({margin:0,filename:fname,image:{type:'jpeg',quality:.98},html2canvas:{scale:2,useCORS:true,logging:false},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}}).from(el).save();
  }finally{btn.textContent='⬇ PDF';btn.disabled=false;}
}
window.dlPDF=dlPDF;

async function dlPNG(){
  const btn=document.getElementById('btn-png');
  btn.textContent='Generating…';btn.disabled=true;
  try{
    const el=document.getElementById('resume-sheet');
    const canvas=await html2canvas(el,{scale:2,useCORS:true,logging:false,backgroundColor:'#ffffff'});
    const a=document.createElement('a');
    a.download=(S.name||'resume').toLowerCase().replace(/\s+/g,'_')+'_resume.png';
    a.href=canvas.toDataURL('image/png');a.click();
  }finally{btn.textContent='⬇ PNG';btn.disabled=false;}
}
window.dlPNG=dlPNG;

// ── MOBILE TABS ────────────────────────────────────────────────────
function mobTab(t){
  const ed=document.getElementById('editor-panel'),pr=document.getElementById('preview-panel');
  const te=document.getElementById('tab-edit'),tp=document.getElementById('tab-prev');
  if(t==='edit'){ed.style.display='flex';pr.style.display='none';te.classList.add('active');tp.classList.remove('active');}
  else{ed.style.display='none';pr.style.display='flex';tp.classList.add('active');te.classList.remove('active');}
}
window.mobTab=mobTab;

// ── INIT ───────────────────────────────────────────────────────────
function initApp(){
  // Load from localStorage
  try{const saved=localStorage.getItem('rb_state');if(saved){Object.assign(S,JSON.parse(saved));}}catch(e){}

  // Restore form inputs
  ['name','title','email','phone','location','website','linkedin','github'].forEach(k=>{
    const el=document.querySelector(`input[oninput*="S.${k}"]`);
    if(el)el.value=S[k]||'';
  });
  const ta=document.querySelector('textarea[oninput*="S.summary"]');
  if(ta)ta.value=S.summary||'';
  if(S.accent){document.getElementById('accent').value=S.accent;}

  // Restore dynamic lists
  ['exp','edu','skills','proj','certs'].forEach(renderList);

  // Set active template
  document.querySelectorAll('.tpl-btn').forEach(b=>b.classList.toggle('active',b.textContent.toLowerCase()===S.tpl));

  // Show builder (grid)
  document.getElementById('builder').style.display='grid';
  document.getElementById('mob-tabs').style.display='flex';

  // Auto-save every 3s
  setInterval(()=>{try{localStorage.setItem('rb_state',JSON.stringify(S));}catch(e){}},3000);

  // Initial render
  render();

  // Scale sheet to fit preview on small screens
  scaleSheet();
  window.addEventListener('resize',scaleSheet);
}

function scaleSheet(){
  const sheet=document.getElementById('resume-sheet');
  const wrap=document.querySelector('.sheet-wrap');
  if(!sheet||!wrap)return;
  const w=wrap.offsetWidth;
  if(w>0&&w<800){const sc=Math.min(1,(w-16)/794);sheet.style.transform=`scale(${sc})`;sheet.style.marginBottom=`-${(1-sc)*1122}px`;}
  else{sheet.style.transform='';sheet.style.marginBottom='';}
}
window.initApp=initApp;
