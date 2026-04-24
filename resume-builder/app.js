const S={name:'',title:'',email:'',phone:'',location:'',website:'',linkedin:'',github:'',summary:'',photo:'',exp:[],edu:[],skills:[],proj:[],certs:[],tpl:'classic',accent:'#2563eb'};

function tog(h){h.classList.toggle('open');h.nextElementSibling.classList.toggle('open');}
window.tog=tog;

function setTpl(t){S.tpl=t;document.querySelectorAll('.tpl-btn').forEach(b=>b.classList.toggle('active',b.textContent.toLowerCase()===t));render();}
window.setTpl=setTpl;

const DEFS={exp:{role:'',company:'',location:'',start:'',end:'',current:false,bullets:''},edu:{degree:'',school:'',location:'',start:'',end:'',gpa:''},skills:{category:'',items:''},proj:{name:'',tech:'',link:'',desc:''},certs:{name:'',issuer:'',date:''}};
function addE(k){S[k].push({...DEFS[k]});renderList(k);}window.addE=addE;
function rmE(k,i){S[k].splice(i,1);renderList(k);}window.rmE=rmE;
function setE(k,i,f,v){S[k][i][f]=(f==='current')?v.checked:v;render();}window.setE=setE;

function renderList(k){
  const el=document.getElementById(k+'-list');if(!el)return;
  const labels={exp:'Experience',edu:'Education',skills:'Skill Group',proj:'Project',certs:'Certification'};
  el.innerHTML=S[k].map((e,i)=>{
    const title=k==='exp'?(e.role||e.company||labels[k]+' '+(i+1)):k==='edu'?(e.degree||e.school||labels[k]+' '+(i+1)):(e.name||e.category||labels[k]+' '+(i+1));
    let f='';
    if(k==='exp')f=`<div class="r2"><label>Job Title<input value="${e.role}" oninput="setE('exp',${i},'role',this.value)" placeholder="Software Engineer"/></label><label>Company<input value="${e.company}" oninput="setE('exp',${i},'company',this.value)" placeholder="Company Name"/></label></div><div class="r3"><label>Location<input value="${e.location}" oninput="setE('exp',${i},'location',this.value)" placeholder="City"/></label><label>Start<input value="${e.start}" oninput="setE('exp',${i},'start',this.value)" placeholder="Jan 2022"/></label><label>End<input value="${e.end}" oninput="setE('exp',${i},'end',this.value)" placeholder="Dec 2023" ${e.current?'disabled':''}/></label></div><label class="check-row"><input type="checkbox" ${e.current?'checked':''} onchange="setE('exp',${i},'current',this)"/> Currently working here</label><label>Bullet Points (one per line)<textarea rows="3" oninput="setE('exp',${i},'bullets',this.value)" placeholder="• Led team of 5&#10;• Increased performance by 40%">${e.bullets}</textarea></label>`;
    if(k==='edu')f=`<div class="r2"><label>Degree<input value="${e.degree}" oninput="setE('edu',${i},'degree',this.value)" placeholder="BSc Computer Science"/></label><label>School<input value="${e.school}" oninput="setE('edu',${i},'school',this.value)" placeholder="University Name"/></label></div><div class="r3"><label>Location<input value="${e.location}" oninput="setE('edu',${i},'location',this.value)" placeholder="City"/></label><label>Start<input value="${e.start}" oninput="setE('edu',${i},'start',this.value)" placeholder="2018"/></label><label>End<input value="${e.end}" oninput="setE('edu',${i},'end',this.value)" placeholder="2022"/></label></div><label>GPA (optional)<input value="${e.gpa}" oninput="setE('edu',${i},'gpa',this.value)" placeholder="3.8"/></label>`;
    if(k==='skills')f=`<div class="r2"><label>Category<input value="${e.category}" oninput="setE('skills',${i},'category',this.value)" placeholder="Programming"/></label><label>Skills<input value="${e.items}" oninput="setE('skills',${i},'items',this.value)" placeholder="Python, JavaScript"/></label></div>`;
    if(k==='proj')f=`<div class="r2"><label>Project Name<input value="${e.name}" oninput="setE('proj',${i},'name',this.value)" placeholder="My Project"/></label><label>Link<input value="${e.link}" oninput="setE('proj',${i},'link',this.value)" placeholder="github.com/..."/></label></div><label>Technologies<input value="${e.tech}" oninput="setE('proj',${i},'tech',this.value)" placeholder="React, Node.js"/></label><label>Description<textarea rows="2" oninput="setE('proj',${i},'desc',this.value)" placeholder="What this project does">${e.desc}</textarea></label>`;
    if(k==='certs')f=`<div class="r3"><label>Name<input value="${e.name}" oninput="setE('certs',${i},'name',this.value)" placeholder="AWS Developer"/></label><label>Issuer<input value="${e.issuer}" oninput="setE('certs',${i},'issuer',this.value)" placeholder="Amazon"/></label><label>Date<input value="${e.date}" oninput="setE('certs',${i},'date',this.value)" placeholder="2024"/></label></div>`;
    return`<div class="entry"><div class="entry-h"><span>${title}</span><button class="rm-btn" onclick="rmE('${k}',${i})">✕</button></div><div class="entry-b">${f}</div></div>`;
  }).join('');
  render();
}

// ── Shared data helpers ────────────────────────────────────────────
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const ct=()=>[S.email,S.phone,S.location].filter(Boolean).join(' · ');
const lk=()=>[S.website&&`<a href="https://${S.website.replace(/https?:\/\//,'')}">${S.website.replace(/https?:\/\//,'')}</a>`,S.linkedin&&`<a href="https://linkedin.com/in/${S.linkedin}">linkedin/${S.linkedin}</a>`,S.github&&`<a href="https://github.com/${S.github}">github/${S.github}</a>`].filter(Boolean).join(' · ');
const photo=(cls,size)=>S.photo?`<img src="${S.photo}" class="${cls}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;display:block" alt="photo"/>`:'';
const bullets=b=>b?'<ul>'+b.split('\n').filter(x=>x.trim()).map(x=>`<li>${esc(x.replace(/^[•\-]\s*/,''))}</li>`).join('')+'</ul>':'';
const dates=(s,e,cur)=>`${s||''}${(s||e||cur)?'–':''}${cur?'Present':e||''}`;

function expBlock(pref,roleC,dateC,coC){
  return S.exp.filter(e=>e.company||e.role).map(e=>`<div style="margin-bottom:10px"><div class="${pref}-eh"><span class="${roleC}">${esc(e.role)}</span><span class="${dateC}">${dates(e.start,e.end,e.current)}</span></div><div class="${coC}">${esc(e.company)}${e.location?', '+esc(e.location):''}</div>${bullets(e.bullets)}</div>`).join('');
}
function eduBlock(pref,roleC,dateC,coC){
  return S.edu.filter(e=>e.school||e.degree).map(e=>`<div style="margin-bottom:9px"><div class="${pref}-eh"><span class="${roleC}">${esc(e.degree)}</span><span class="${dateC}">${dates(e.start,e.end,false)}</span></div><div class="${coC}">${esc(e.school)}${e.location?', '+esc(e.location):''}${e.gpa?' · GPA: '+e.gpa:''}</div></div>`).join('');
}
function skillBlock(cls,catCls){return S.skills.filter(s=>s.items).map(s=>`<div class="${cls}">${s.category?`<span class="${catCls}">${esc(s.category)}: </span>`:''} ${esc(s.items)}</div>`).join('');}
function projBlock(pref,nameC,dateC){return S.proj.filter(p=>p.name).map(p=>`<div style="margin-bottom:9px"><div class="${pref}-eh"><span class="${nameC}">${p.link?`<a href="${esc(p.link)}">${esc(p.name)}</a>`:esc(p.name)}</span>${p.tech?`<span class="${dateC}">${esc(p.tech)}</span>`:''}</div>${p.desc?`<p style="font-size:11px;color:#555;margin-top:2px">${esc(p.desc)}</p>`:''}</div>`).join('');}
function certBlock(pref,nameC,dateC){return S.certs.filter(c=>c.name).map(c=>`<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span class="${nameC}">${esc(c.name)}</span><span class="${dateC}">${c.issuer?esc(c.issuer)+' · ':''}${c.date||''}</span></div>`).join('');}

function sec(title,content,st){return content?`<div class="${st}">${title}</div>${content}`:''}

// ── CLASSIC ───────────────────────────────────────────────────────
function classic(){
  const s='rc-st';
  return`<div class="rc">
  <div class="rc-hdr">
    ${photo('rc-photo',80)}
    <div class="rc-name">${esc(S.name)||'Your Name'}</div>
    ${S.title?`<div class="rc-title">${esc(S.title)}</div>`:''}
    ${ct()?`<div class="rc-contact">${ct()}</div>`:''}
    ${lk()?`<div class="rc-links">${lk()}</div>`:''}
  </div>
  ${sec('Summary',S.summary?`<p class="rc-sum">${esc(S.summary)}</p>`:null,s)}
  ${sec('Experience',expBlock('rc','rc-role','rc-dates','rc-co'),s)}
  ${sec('Education',eduBlock('rc','rc-role','rc-dates','rc-co'),s)}
  ${sec('Skills',skillBlock('rc-sk','rc-skc'),s)}
  ${sec('Projects',projBlock('rc','rc-role','rc-dates'),s)}
  ${sec('Certifications',certBlock('rc','rc-role','rc-dates'),s)}
  </div>`;
}

// ── MODERN ────────────────────────────────────────────────────────
function modern(){
  const acc=S.accent||'#2563eb';
  const side=`<div class="rm-side" style="background:${acc}">
    ${photo('rm-photo',80)}
    <div class="rm-name">${esc(S.name)||'Your Name'}</div>
    ${S.title?`<div class="rm-title">${esc(S.title)}</div>`:''}
    ${[S.email,S.phone,S.location,S.website,S.linkedin&&`linkedin: ${S.linkedin}`,S.github&&`github: ${S.github}`].filter(Boolean).map(v=>`<div class="rm-ci">${esc(String(v))}</div>`).join('')}
    ${S.skills.filter(s=>s.items).length?`<div class="rm-slbl" style="color:rgba(255,255,255,.6)">Skills</div>${skillBlock('rm-sk','')}`:''}
    ${S.certs.filter(c=>c.name).length?`<div class="rm-slbl" style="color:rgba(255,255,255,.6)">Certifications</div>${S.certs.filter(c=>c.name).map(c=>`<div class="rm-sk">${esc(c.name)}</div>`).join('')}`:''}
  </div>`;
  const styl=`style="color:${acc};border-color:${acc}"`;
  const main=`<div class="rm-main">
    ${S.summary?`<div class="mm-st" ${styl}>Summary</div><p class="mm-sum">${esc(S.summary)}</p>`:''}
    ${S.exp.filter(e=>e.company||e.role).length?`<div class="mm-st" ${styl}>Experience</div>${expBlock('mm','mm-role','mm-dates','mm-co')}`:''}
    ${S.edu.filter(e=>e.school||e.degree).length?`<div class="mm-st" ${styl}>Education</div>${eduBlock('mm','mm-role','mm-dates','mm-co')}`:''}
    ${S.proj.filter(p=>p.name).length?`<div class="mm-st" ${styl}>Projects</div>${projBlock('mm','mm-role','mm-dates')}`:''}
  </div>`;
  return`<div class="rm">${side}${main}</div>`;
}

// ── MINIMAL ───────────────────────────────────────────────────────
function minimal(){
  const s='mn-st';
  return`<div class="mn">
  <div class="mn-hdr">
    ${photo('mn-photo',72)}
    <div><div class="mn-name">${esc(S.name)||'Your Name'}</div>${S.title?`<div class="mn-title">${esc(S.title)}</div>`:''}</div>
  </div>
  <div class="mn-line"></div>
  ${ct()||lk()?`<div class="mn-contact"><span>${ct()}</span>${lk()?`<span>${lk()}</span>`:''}</div>`:''}
  ${sec('Summary',S.summary?`<p class="mn-sum">${esc(S.summary)}</p>`:null,s)}
  ${S.exp.filter(e=>e.company||e.role).length?`<div class="${s}">Experience</div>${S.exp.filter(e=>e.company||e.role).map(e=>`<div class="mn-row"><div class="mn-dt">${dates(e.start,e.end,e.current)}</div><div><div class="mn-role">${esc(e.role)}</div><div class="mn-co">${esc(e.company)}${e.location?', '+esc(e.location):''}</div>${bullets(e.bullets)}</div></div>`).join('')}`:''}
  ${S.edu.filter(e=>e.school||e.degree).length?`<div class="${s}">Education</div>${S.edu.filter(e=>e.school||e.degree).map(e=>`<div class="mn-row"><div class="mn-dt">${dates(e.start,e.end,false)}</div><div><div class="mn-role">${esc(e.degree)}</div><div class="mn-co">${esc(e.school)}${e.gpa?' · '+e.gpa:''}</div></div></div>`).join('')}`:''}
  ${sec('Skills',skillBlock('mn-sk','mn-skc'),s)}
  ${S.proj.filter(p=>p.name).length?`<div class="${s}">Projects</div>${S.proj.filter(p=>p.name).map(p=>`<div class="mn-row"><div class="mn-dt" style="font-size:10px;color:#999">${esc(p.tech||'')}</div><div><div class="mn-role">${p.link?`<a href="${esc(p.link)}">${esc(p.name)}</a>`:esc(p.name)}</div>${p.desc?`<p style="font-size:11px;color:#555">${esc(p.desc)}</p>`:''}</div></div>`).join('')}`:''}
  ${sec('Certifications',certBlock('mn','mn-role','mn-dt'),s)}
  </div>`;
}

// ── CREATIVE ──────────────────────────────────────────────────────
function creative(){
  const acc=S.accent||'#e11d48';const s='cr-st';
  return`<div class="cr">
  <div class="cr-hdr" style="--cr-acc:${acc}">
    <div class="cr-top">
      ${photo('cr-photo',78)}
      <div><div class="cr-name">${esc(S.name)||'Your Name'}</div>${S.title?`<div class="cr-title" style="color:${acc}">${esc(S.title)}</div>`:''}</div>
    </div>
    <div class="cr-contact">${[S.email,S.phone,S.location,S.website,S.linkedin&&`in/${S.linkedin}`,S.github&&`gh/${S.github}`].filter(Boolean).map(v=>esc(String(v))).join(' · ')}</div>
  </div>
  <div class="cr-body">
    ${S.summary?`<div class="${s}" style="color:${acc}">Summary</div><p class="cr-sum">${esc(S.summary)}</p>`:''}
    ${S.exp.filter(e=>e.company||e.role).length?`<div class="${s}" style="color:${acc}">Experience</div>${expBlock('cr','cr-role','cr-dates','cr-co')}`:''}
    ${S.edu.filter(e=>e.school||e.degree).length?`<div class="${s}" style="color:${acc}">Education</div>${eduBlock('cr','cr-role','cr-dates','cr-co')}`:''}
    ${sec('Skills',skillBlock('cr-sk','cr-skc'),`${s}" style="color:${acc}`)}
    ${S.proj.filter(p=>p.name).length?`<div class="${s}" style="color:${acc}">Projects</div>${projBlock('cr','cr-role','cr-dates')}`:''}
    ${sec('Certifications',certBlock('cr','cr-role','cr-dates'),`${s}" style="color:${acc}`)}
  </div></div>`;
}

// ── EXECUTIVE ─────────────────────────────────────────────────────
function executive(){
  const acc=S.accent||'#c8a96e';const s='ex-st';
  return`<div class="ex">
  <div class="ex-hdr">
    ${photo('ex-photo',84)}
    <div class="ex-info">
      <div class="ex-name">${esc(S.name)||'Your Name'}</div>
      ${S.title?`<div class="ex-title" style="color:${acc}">${esc(S.title)}</div>`:''}
      <div class="ex-contact">${[S.email,S.phone,S.location,S.website].filter(Boolean).map(v=>esc(String(v))).join(' · ')}</div>
    </div>
  </div>
  <div class="ex-body">
    ${S.summary?`<div class="${s}" style="color:${acc};border-color:${acc}">Executive Summary</div><p class="ex-sum">${esc(S.summary)}</p>`:''}
    ${S.exp.filter(e=>e.company||e.role).length?`<div class="${s}" style="color:${acc};border-color:${acc}">Experience</div>${expBlock('ex','ex-role','ex-dates','ex-co')}`:''}
    ${S.edu.filter(e=>e.school||e.degree).length?`<div class="${s}" style="color:${acc};border-color:${acc}">Education</div>${eduBlock('ex','ex-role','ex-dates','ex-co')}`:''}
    ${sec('Skills',skillBlock('ex-sk','ex-skc'),`${s}" style="color:${acc};border-color:${acc}`)}
    ${sec('Certifications',certBlock('ex','ex-role','ex-dates'),`${s}" style="color:${acc};border-color:${acc}`)}
  </div></div>`;
}

// ── RENDER ────────────────────────────────────────────────────────
function render(){
  const el=document.getElementById('resume-sheet');if(!el)return;
  const map={classic,modern,minimal,creative,executive};
  el.innerHTML=(map[S.tpl]||classic)();
  scaleSheet();
}

// ── PHOTO ─────────────────────────────────────────────────────────
function loadPhoto(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{S.photo=e.target.result;document.getElementById('photo-rm').style.display='';render();};
  reader.readAsDataURL(file);
}
function removePhoto(){S.photo='';document.getElementById('photo-rm').style.display='none';document.getElementById('photo-input').value='';render();}
window.loadPhoto=loadPhoto;window.removePhoto=removePhoto;

// ── DOWNLOAD ──────────────────────────────────────────────────────
async function dlPDF(){
  const b=document.getElementById('btn-pdf');if(b){b.textContent='Generating…';b.disabled=true;}
  try{
    const el=document.getElementById('resume-sheet');
    el.style.transform='';el.style.width='794px';
    await html2pdf().set({margin:0,filename:(S.name||'resume').toLowerCase().replace(/\s+/g,'_')+'_resume.pdf',image:{type:'jpeg',quality:.98},html2canvas:{scale:2,useCORS:true,logging:false,backgroundColor:'#ffffff'},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}}).from(el).save();
  }finally{if(b){b.textContent='⬇ Download PDF';b.disabled=false;}scaleSheet();}
}
async function dlPNG(){
  const b=document.getElementById('btn-png');if(b){b.textContent='Generating…';b.disabled=true;}
  try{
    const el=document.getElementById('resume-sheet');
    el.style.transform='';el.style.width='794px';
    const canvas=await html2canvas(el,{scale:2,useCORS:true,logging:false,backgroundColor:'#ffffff'});
    const a=document.createElement('a');a.download=(S.name||'resume').toLowerCase().replace(/\s+/g,'_')+'_resume.png';a.href=canvas.toDataURL('image/png');a.click();
  }finally{if(b){b.textContent='⬇ Download PNG';b.disabled=false;}scaleSheet();}
}
window.dlPDF=dlPDF;window.dlPNG=dlPNG;

// ── SCALE SHEET ───────────────────────────────────────────────────
function scaleSheet(){
  const el=document.getElementById('resume-sheet');
  const wrap=document.getElementById('sheet-wrap');
  if(!el||!wrap)return;
  const w=wrap.clientWidth-24;
  if(w>0&&w<810){const sc=w/794;el.style.transform=`scale(${sc})`;el.style.transformOrigin='top center';el.style.marginBottom=`${(sc-1)*el.offsetHeight}px`;}
  else{el.style.transform='';el.style.marginBottom='';}
}

// ── MOBILE TABS ───────────────────────────────────────────────────
function mobTab(t){
  const ed=document.getElementById('editor-panel'),pr=document.getElementById('preview-panel');
  const te=document.getElementById('tab-edit'),tp=document.getElementById('tab-prev');
  if(t==='edit'){ed.style.display='flex';pr.style.display='none';te.classList.add('active');tp.classList.remove('active');}
  else{ed.style.display='none';pr.style.display='flex';tp.classList.add('active');te.classList.remove('active');setTimeout(scaleSheet,50);}
}
window.mobTab=mobTab;

// ── INIT ──────────────────────────────────────────────────────────
function initApp(){
  try{const sv=localStorage.getItem('rb_v2');if(sv)Object.assign(S,JSON.parse(sv));}catch(e){}
  ['name','title','email','phone','location','website','linkedin','github'].forEach(k=>{const el=document.querySelector(`input[oninput*="S.${k}"]`);if(el)el.value=S[k]||'';});
  const ta=document.querySelector('textarea[oninput*="S.summary"]');if(ta)ta.value=S.summary||'';
  const ac=document.getElementById('accent');if(ac&&S.accent)ac.value=S.accent;
  if(S.photo)document.getElementById('photo-rm').style.display='';
  document.querySelectorAll('.tpl-btn').forEach(b=>b.classList.toggle('active',b.textContent.toLowerCase()===S.tpl));
  ['exp','edu','skills','proj','certs'].forEach(renderList);
  setInterval(()=>{try{localStorage.setItem('rb_v2',JSON.stringify(S));}catch(e){}},3000);
  render();
  window.addEventListener('resize',scaleSheet);
}
window.initApp=initApp;
