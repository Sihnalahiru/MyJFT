(() => {
'use strict';
const $ = (s,root=document) => root.querySelector(s);
const $$ = (s,root=document) => [...root.querySelectorAll(s)];
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BOOKS = [
 {id:'X',name:'Starter',level:'A1',lessons:18},
 {id:'Y',name:'Elementary 1',level:'A2.1',lessons:18},
 {id:'Z',name:'Elementary 2',level:'A2.2',lessons:18},
 {id:'P',name:'Pre-Intermediate',level:'A2/B1',lessons:18}
];
const KEY='irodori-master-progress-v1';
let master = readProgress();
let practice = {item:null,options:[],answer:null,mode:'ja-si',score:0,attempts:0};
function readProgress(){try{return JSON.parse(localStorage.getItem(KEY))||{completedLessons:[],learnedWords:[],knownKana:[],reviewQueue:[],daily:{}}}catch{return {completedLessons:[],learnedWords:[],knownKana:[],reviewQueue:[],daily:{}}}}
function saveProgress(){localStorage.setItem(KEY,JSON.stringify(master));renderOverview()}
function records(){try{return Array.isArray(vocabularyMaster?.records)?vocabularyMaster.records:[]}catch{return []}}
function currentKana(){try{return alphabetData?.characters||[]}catch{return []}}
function page(id){if(typeof showPage==='function'){showPage(id);return}$$('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+id))}
function addNav(){
 const side=$('#sideNav'),mobile=$('#mobileNav');
 const links=[['audio','🎧','Audio'],['kanji','漢','Kanji'],['review','🃏','Review'],['analytics','📊','Progress'],['settings','⚙️','Settings']];
 links.forEach(([id,icon,label])=>{
  if(side&&!$('[data-page="'+id+'"]',side)){const b=document.createElement('button');b.dataset.page=id;b.innerHTML='<span class="ico">'+icon+'</span>'+label;side.append(b);b.addEventListener('click',()=>page(id))}
 });
 if(mobile&&!$('[data-page="menu"]',mobile)){const b=document.createElement('button');b.dataset.page='menu';b.innerHTML='<span>☰</span>More';mobile.append(b);b.addEventListener('click',()=>page('menu'))}
}
function pageShell(id,title,subtitle,icon,body){
 if($('#page-'+id))return;
 const el=document.createElement('section');el.className='page';el.id='page-'+id;
 el.innerHTML='<div class="welcome"><div><div class="eyebrow">IRODORI JAPANESE MASTER</div><h1>'+icon+' '+title+'</h1><div class="sub">'+subtitle+'</div></div></div>'+body;
 const main=$('.main');if(main)main.append(el);
}
function addPages(){
 pageShell('audio','Audio Studio','Official recordings first · Native Japanese voice fallback · iOS Safari ready','🎧','<div class="card"><div class="im-row"><div><h2>Native Japanese pronunciation</h2><p class="im-muted">Tap to play. iPhone Safari requires a direct user gesture for speech playback.</p></div><span class="im-chip" id="imVoiceStatus">Checking Japanese voice…</span></div><input class="im-field" id="imSpeakText" lang="ja" value="こんにちは。日本語を勉強しましょう。" aria-label="Japanese text to pronounce"><div class="im-row" style="margin-top:12px"><button class="btn" id="imSpeakButton">🔊 Speak Japanese</button><button class="btn ghost" id="imStopSpeech">Stop</button><label class="im-muted">Speed <select id="imSpeechRate" class="im-field" style="width:auto;display:inline-block"><option value=".75">Slow</option><option value=".9" selected>Normal</option><option value="1">Natural</option></select></label></div></div><div class="im-section-title"><h2>Available official audio</h2><span class="im-muted" id="imAudioCount">Checking files…</span></div><div class="card" id="imAudioList"><p class="im-muted">Audio inventory is being checked from the existing media manifest.</p></div><div class="card" style="margin-top:14px"><h3>iOS playback checks</h3><ul><li>Audio starts only after a tap; no autoplay dependency.</li><li>Use native HTML audio controls for recorded files.</li><li>Japanese TTS is checked against installed ja-JP voices.</li><li>Unavailable recordings remain marked pending, never replaced silently.</li></ul></div>');
 pageShell('kanji','Kanji Master','Official syllabus target: 644 Kanji · Only verified source records count as available','漢','<div class="im-kpi-grid"><div class="im-kpi"><b>644</b><span>OFFICIAL TARGET</span></div><div class="im-kpi"><b id="imKanjiAvailable">—</b><span>VERIFIED RECORDS</span></div><div class="im-kpi"><b>0</b><span>MASTERED</span></div><div class="im-kpi"><b id="imKanjiPending">644</b><span>REMAINING / UNVERIFIED</span></div></div><div class="card"><h2>Kanji inventory</h2><p class="im-muted">Kanji are not generated from guesses. Each record must include the source character, readings, meaning, lesson/source mapping and verification state before it becomes practice-ready.</p><span class="im-status pending">SOURCE INVENTORY AUDIT REQUIRED</span></div>');
 pageShell('review','Flashcards & SRS','Review due words from the verified IRODORI vocabulary inventory','🃏','<div class="card" id="imReviewCard"><div class="im-row"><span class="im-chip">Spaced repetition</span><span class="im-muted" id="imReviewCount">0 review cards</span></div><div class="question-card"><div class="q-type">JAPANESE WORD</div><div class="jp" id="imReviewJapanese">No verified vocabulary loaded</div><div class="reading" id="imReviewReading"></div><div id="imReviewMeaning" class="translation im-hidden"></div><button class="btn" id="imReveal">Reveal meaning</button></div><div class="im-row"><button class="btn ghost" data-review="again">Again</button><button class="btn secondary" data-review="hard">Hard</button><button class="btn" data-review="known">Know it</button></div><p class="im-muted" id="imReviewNote">Cards are created only from the source vocabulary file.</p></div>');
 pageShell('analytics','Learning Analytics','Live totals from your saved learning activity and verified source inventory','📊','<div class="im-kpi-grid"><div class="im-kpi"><b id="imLessonsDone">0</b><span>LESSONS COMPLETED</span></div><div class="im-kpi"><b id="imLessonsLeft">72</b><span>LESSONS REMAINING</span></div><div class="im-kpi"><b id="imWordsTotal">—</b><span>VERIFIED WORD RECORDS</span></div><div class="im-kpi"><b id="imWordsLearned">0</b><span>WORDS LEARNED</span></div></div><div class="card"><h2>Lesson completion</h2><div class="im-progress-line"><i id="imLessonBar" style="width:0%"></i></div><p class="im-muted" id="imLessonPercent">0% of 72 lessons completed in this app</p><div class="im-section-title"><h2>Book progress</h2></div><div id="imBookProgress" class="stack"></div></div><div class="card" style="margin-top:14px"><h2>Data integrity</h2><div id="imDataAudit"></div></div>');
 pageShell('settings','Settings','iPhone-friendly display, voice and progress preferences','⚙️','<div class="card"><h2>Appearance</h2><div class="settings-row"><span>Glass theme</span><b class="im-chip">Enabled</b></div><div class="settings-row"><span>Reduce motion</span><label><input id="imReduceMotion" type="checkbox"> On</label></div><h2 style="margin-top:22px">Audio</h2><div class="settings-row"><span>Japanese speech voice</span><b id="imSettingsVoice">Checking…</b></div><div class="settings-row"><span>Default speech speed</span><b>0.9×</b></div><h2 style="margin-top:22px">Learning data</h2><p class="im-muted">Progress is stored on this device. Resetting progress does not delete source vocabulary, audio or official lesson data.</p><button class="btn ghost" id="imResetProgress">Reset learning progress</button></div>');
 pageShell('menu','All sections','Open any learning area from one place','☰','<div class="im-grid" id="imMenuGrid"></div>');
 const practicePage=$('#page-practice');
 if(practicePage&&!$('#imUnlimitedPractice'))practicePage.insertAdjacentHTML('beforeend','<div id="imUnlimitedPractice" class="card" style="margin-top:18px"><div class="im-section-title" style="margin-top:0"><h2>Unlimited practice</h2><span class="im-chip">Source-based</span></div><p class="im-muted">Practice questions are generated from verified vocabulary records. No invented word bank.</p><div class="im-row"><select id="imPracticeMode" class="im-field" style="max-width:280px"><option value="ja-si">Japanese → Sinhala</option><option value="ja-en">Japanese → English</option><option value="si-ja">Sinhala → Japanese</option><option value="en-ja">English → Japanese</option><option value="kana">Kana recognition</option></select><button class="btn" id="imStartPractice">Start practice</button></div><div id="imPracticeArea" style="margin-top:15px"></div><div class="im-row" style="margin-top:12px"><span class="im-muted" id="imPracticeScore">0 correct · 0 attempts</span><button class="btn ghost" id="imNextPractice" disabled>Next question →</button></div></div>');
}
function buildMenu(){
 const grid=$('#imMenuGrid');if(!grid)return;
 const items=[['learn','📚','Books & Lessons','4 books · 72 lessons'],['alphabet','あ','Hiragana & Katakana','Basic kana and combinations'],['vocabulary','🧠','Vocabulary','Japanese · Furigana · English · Sinhala'],['grammar','✍️','Grammar','Official patterns and examples'],['audio','🎧','Audio Studio','Recordings and native Japanese voice'],['practice','🎯','Practice Centre','Unlimited source-based quizzes'],['kanji','漢','Kanji Master','644-character syllabus target'],['review','🃏','Flashcards','Spaced repetition'],['analytics','📊','Progress','Completed and remaining'],['settings','⚙️','Settings','Audio, display and data']];
 grid.innerHTML=items.map(([id,ico,title,sub])=>'<button class="im-tile" data-open-page="'+id+'" style="text-align:left;color:inherit"><span class="im-icon">'+ico+'</span><h3>'+title+'</h3><p>'+sub+'</p></button>').join('');
}
function getVoices(){return 'speechSynthesis'in window?speechSynthesis.getVoices().filter(v=>/^ja([-_]|$)/i.test(v.lang)):[]}
function voiceStatus(){
 const voices=getVoices(),status=$('#imVoiceStatus'),settings=$('#imSettingsVoice');
 const label=voices.length?voices.map(v=>v.name).join(', '):'No Japanese voice detected on this device';
 if(status){status.textContent=voices.length?'Japanese voice ready':'Japanese voice unavailable';status.classList.toggle('pending',!voices.length)}
 if(settings)settings.textContent=voices.length?'Available ('+voices.length+')':'Not installed / unavailable';
}
function speakJapanese(text){
 const value=String(text||'').trim();if(!value)return;
 if(!('speechSynthesis'in window)||!('SpeechSynthesisUtterance'in window)){notify('Speech synthesis is not available in this Safari version.');return}
 const voices=getVoices();const u=new SpeechSynthesisUtterance(value);u.lang='ja-JP';u.rate=Number($('#imSpeechRate')?.value||.9);
 const ja=voices.find(v=>/^ja-JP$/i.test(v.lang))||voices[0];if(ja)u.voice=ja;
 u.onerror=()=>notify('Japanese speech playback failed. Try a recorded lesson audio track.');
 try{speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){notify('Could not start speech playback: '+e.message)}
}
function notify(msg){if(typeof toast==='function')toast(msg);else alert(msg)}
function allAudioFiles(){
 const files=new Map();
 try{(vocabularyMedia?.audio_files||[]).forEach(n=>files.set('vocab:'+n,{name:n,group:'Word-list Audio',src:'./assets/audio/vocabulary/'+encodeURIComponent(n)}))}catch{}
 try{(starterWorksheetAudioFiles||[]).forEach(n=>files.set('grammar:'+n,{name:n,group:'Grammar Worksheet Audio',src:'./assets/audio/grammar/'+encodeURIComponent(n)}))}catch{}
 try{(elementary1WorksheetAudioFiles||[]).forEach(n=>files.set('grammar:'+n,{name:n,group:'Grammar Worksheet Audio',src:'./assets/audio/grammar/'+encodeURIComponent(n)}))}catch{}
 return [...files.values()];
}
function renderAudio(){
 const host=$('#imAudioList');if(!host)return;const files=allAudioFiles();
 $('#imAudioCount').textContent=files.length.toLocaleString()+' verified manifest entries';
 if(!files.length){host.innerHTML='<p class="im-muted">No local audio filenames are currently exposed by the loaded manifest. Official remote lesson audio remains available only where its source mapping is verified.</p>';return}
 host.innerHTML=files.slice(0,120).map(f=>'<div class="im-audio-row"><div><b>'+esc(f.name)+'</b><div class="im-muted">'+f.group+'</div></div><span class="im-status">SOURCE MANIFEST</span><audio controls playsinline preload="none" src="'+esc(f.src)+'" aria-label="'+esc(f.name)+'"></audio></div>').join('')+(files.length>120?'<p class="im-muted">Showing first 120 of '+files.length+' tracks. Search/filter expansion will use the full manifest.</p>':'');
}
function renderOverview(){
 const done=master.completedLessons.length,words=records(),learned=master.learnedWords.length;
 const set=(id,v)=>{const el=$('#'+id);if(el)el.textContent=String(v)};
 set('imLessonsDone',done);set('imLessonsLeft',Math.max(0,72-done));set('imWordsTotal',words.length?words.length:'Not loaded');set('imWordsLearned',learned);
 const bar=$('#imLessonBar');if(bar)bar.style.width=Math.min(100,done/72*100)+'%';
 set('imLessonPercent',Math.round(done/72*100)+'% of 72 lessons completed in this app');
 set('imKanjiAvailable','Not loaded');set('imKanjiPending','644');
 const bookHost=$('#imBookProgress');if(bookHost)bookHost.innerHTML=BOOKS.map(b=>{const n=master.completedLessons.filter(x=>String(x).startsWith(b.id+'-')).length;return '<div><div class="im-row"><b>'+b.name+'</b><span class="im-muted">'+n+' / 18</span></div><div class="im-progress-line"><i style="width:'+(n/18*100)+'%"></i></div></div>'}).join('');
 const audit=$('#imDataAudit');if(audit)audit.innerHTML='<div class="settings-row"><span>Books / lessons</span><b>4 / 72 target</b></div><div class="settings-row"><span>Vocabulary master</span><b class="'+(words.length?'':'im-status pending')+'">'+(words.length?words.length+' records loaded':'Not loaded / verify source file')+'</b></div><div class="settings-row"><span>Alphabet source pairs</span><b>'+currentKana().length+' / 71 baseline</b></div><div class="settings-row"><span>Kanji master</span><b class="im-status pending">644 target · inventory pending</b></div><div class="settings-row"><span>Official audio manifest</span><b>'+allAudioFiles().length+' local tracks listed</b></div>';
}
function selectReview(){
 const words=records().filter(x=>x.japanese&&x.furigana&&(x.english||x.sinhala));
 const count=$('#imReviewCount');if(count)count.textContent=words.length+' source cards';
 if(!words.length){$('#imReviewJapanese').textContent='Vocabulary source not loaded';$('#imReviewNote').textContent='The source master must be restored/verified before flashcards can be populated.';return}
 const due=words.filter(x=>master.reviewQueue.includes(x.id));const pool=due.length?due:words;const item=pool[Math.floor(Math.random()*pool.length)];practice.reviewItem=item;
 $('#imReviewJapanese').textContent=item.japanese;$('#imReviewReading').textContent=item.furigana;
 $('#imReviewMeaning').textContent=[item.english,item.sinhala].filter(Boolean).join(' · ');$('#imReviewMeaning').classList.add('im-hidden');$('#imReviewNote').textContent='Lesson '+(item.lesson??'—')+' · '+(item.id||'source record');
}
function buildQuestion(mode){
 if(mode==='kana'){
  const list=currentKana();if(!list.length)return null;const item=list[Math.floor(Math.random()*list.length)];
  const correct=item.romaji;const opts=[correct,...list.filter(x=>x.romaji!==correct).sort(()=>Math.random()-.5).slice(0,3).map(x=>x.romaji)].sort(()=>Math.random()-.5);
  return {prompt:item.hiragana+' / '+item.katakana,sub:'Choose the correct sound',correct,opts};
 }
 const pool=records().filter(x=>x.japanese&&(x.sinhala||x.english));
 if(pool.length<4)return null;
 const item=pool[Math.floor(Math.random()*pool.length)];let correct,opts, prompt,sub;
 if(mode==='ja-si'||mode==='ja-en'){prompt=item.japanese;sub=item.furigana||'';correct=mode==='ja-si'?item.sinhala:item.english;opts=[correct,...pool.filter(x=>x.id!==item.id).sort(()=>Math.random()-.5).slice(0,3).map(x=>mode==='ja-si'?x.sinhala:x.english)].filter(Boolean)}
 else{prompt=mode==='si-ja'?item.sinhala:item.english;sub='Choose the Japanese word';correct=item.japanese;opts=[correct,...pool.filter(x=>x.id!==item.id).sort(()=>Math.random()-.5).slice(0,3).map(x=>x.japanese)]}
 if(!correct||opts.length<4)return null;return {prompt,sub,correct,opts:[...new Set(opts)].sort(()=>Math.random()-.5),item};
}
function startPractice(){
 practice.mode=$('#imPracticeMode')?.value||'ja-si';practice.score=0;practice.attempts=0;nextPractice();updatePracticeScore();
}
function nextPractice(){
 const q=buildQuestion(practice.mode),host=$('#imPracticeArea');if(!host)return;
 if(!q){host.innerHTML='<div class="notice">Practice data is not ready. At least four verified vocabulary records are required for a vocabulary quiz. Kana practice uses the verified alphabet inventory.</div>';$('#imNextPractice').disabled=true;return}
 practice.item=q;practice.answer=null;host.innerHTML='<div class="q-type">'+esc(q.sub)+'</div><div class="jp">'+esc(q.prompt)+'</div><div class="answers">'+q.opts.map((v,i)=>'<button class="im-choice" data-practice-choice="'+i+'">'+esc(v)+'</button>').join('')+'</div><div id="imPracticeFeedback" class="im-muted">Select an answer.</div>';
 host.querySelectorAll('[data-practice-choice]').forEach((b,i)=>b.addEventListener('click',()=>checkPractice(i)));
 $('#imNextPractice').disabled=true;
}
function checkPractice(index){
 if(practice.answer!==null)return;const q=practice.item;const chosen=q.opts[index];practice.answer=chosen;practice.attempts++;
 const good=chosen===q.correct;if(good)practice.score++;
 $$('#imPracticeArea [data-practice-choice]').forEach((b,i)=>{b.disabled=true;if(q.opts[i]===q.correct)b.classList.add('correct');else if(i===index)b.classList.add('wrong')});
 $('#imPracticeFeedback').textContent=good?'Correct! よくできました。':'Correct answer: '+q.correct;
 $('#imNextPractice').disabled=false;updatePracticeScore();
 if(good&&q.item?.id&&!master.learnedWords.includes(q.item.id)){master.learnedWords.push(q.item.id);saveProgress()}
}
function updatePracticeScore(){const el=$('#imPracticeScore');if(el)el.textContent=practice.score+' correct · '+practice.attempts+' attempts'}
function bind(){
 $('#imSpeakButton')?.addEventListener('click',()=>speakJapanese($('#imSpeakText')?.value));
 $('#imStopSpeech')?.addEventListener('click',()=>{if('speechSynthesis'in window)speechSynthesis.cancel()});
 $('#imStartPractice')?.addEventListener('click',startPractice);$('#imNextPractice')?.addEventListener('click',nextPractice);
 $('#imReveal')?.addEventListener('click',()=>$('#imReviewMeaning')?.classList.remove('im-hidden'));
 $$('[data-review]').forEach(b=>b.addEventListener('click',()=>{const item=practice.reviewItem;if(item?.id){master.reviewQueue=master.reviewQueue.filter(x=>x!==item.id);if(b.dataset.review!=='known')master.reviewQueue.push(item.id);saveProgress()}selectReview()}));
 $('#imReduceMotion')?.addEventListener('change',e=>document.documentElement.style.setProperty('scroll-behavior',e.target.checked?'auto':'smooth'));
 $('#imResetProgress')?.addEventListener('click',()=>{if(confirm('Reset IRODORI Master learning progress on this device? Source data and audio files will not be deleted.')){master={completedLessons:[],learnedWords:[],knownKana:[],reviewQueue:[],daily:{}};saveProgress();selectReview();notify('Learning progress reset. Source data was not changed.')}});
 $$('[data-open-page]').forEach(b=>b.addEventListener('click',()=>page(b.dataset.openPage)));
}
function installAudioSafety(){
 document.addEventListener('error',e=>{const el=e.target;if(el instanceof HTMLAudioElement){el.dataset.playbackError='true';const wrap=el.closest('.im-audio-row,.vocab-word-card,.grammar-card');if(wrap){let msg=$('.im-audio-error',wrap);if(!msg){msg=document.createElement('small');msg.className='im-audio-error im-status pending';msg.textContent='Audio could not load. Check connection or verify the source file.';wrap.append(msg)}}}},true);
 document.addEventListener('play',e=>{const el=e.target;if(el instanceof HTMLAudioElement){$$('audio').forEach(other=>{if(other!==el&&!other.paused)other.pause()})}},true);
 if('speechSynthesis'in window){speechSynthesis.onvoiceschanged=voiceStatus}
}
function init(){
 addNav();addPages();buildMenu();bind();installAudioSafety();voiceStatus();renderAudio();renderOverview();selectReview();
 const oldBrand=$('.brand');if(oldBrand)oldBrand.innerHTML='<span class="brand-mark">日</span> IRODORI';
 const mobile=$('#mobileNav');if(mobile)mobile.setAttribute('aria-label','Main navigation');
 document.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b&&b.dataset.page&&['audio','kanji','review','analytics','settings','menu'].includes(b.dataset.page))page(b.dataset.page)});
 window.addEventListener('storage',e=>{if(e.key===KEY){master=readProgress();renderOverview()}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
