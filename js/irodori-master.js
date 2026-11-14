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
let audioCatalog = null;
let audioPageIndex = 0;
const AUDIO_PAGE_SIZE = 30;
const OFFICIAL_AUDIO_BASES = {X:'https://www.irodori.jpf.go.jp/en/starter/audio/lesson',Y:'https://www.irodori.jpf.go.jp/en/elementary01/audio/lesson',Z:'https://www.irodori.jpf.go.jp/en/elementary02/audio/lesson',P:'https://www.irodori.jpf.go.jp/en/pre-intermediate/audio/lesson'};
let kanjiData = null;
let kanjiPageIndex = 0;
const KANJI_PAGE_SIZE = 24;
let kanjiPracticeItem = null;
let kanjiPracticeScore = 0;
let kanjiPracticeAttempts = 0;
function readProgress(){
 const empty={completedLessons:[],learnedWords:[],knownKana:[],learnedKanji:[],reviewQueue:[],daily:{}};
 try{const saved=JSON.parse(localStorage.getItem(KEY));if(!saved)return empty;if(!Array.isArray(saved.learnedKanji))saved.learnedKanji=[];return {...empty,...saved}}
 catch{return empty}
}function saveProgress(){localStorage.setItem(KEY,JSON.stringify(master));renderOverview()}
function records(){try{return Array.isArray(vocabularyMaster?.records)?vocabularyMaster.records:[]}catch{return []}}
function currentKana(){try{return alphabetData?.characters||[]}catch{return []}}
function page(id){if(typeof showPage==='function'){showPage(id);return}$$('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+id))}
function addNav(){
 const side=$('#sideNav'),mobile=$('#mobileNav');
 const links=[['books','📚','Books'],['audio','🎧','Audio'],['kanji','漢','Kanji'],['review','🃏','Review'],['analytics','📊','Progress'],['settings','⚙️','Settings']];
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
 pageShell('books','Books & Lessons','Four official IRODORI books · 72 lesson slots · source-linked availability only','📚','<div class="im-grid" id="imBooksGrid"></div><div class="im-section-title"><h2>All 72 lessons</h2><span class="im-muted">18 per book</span></div><div id="imLessonsGrid" class="im-grid"></div><div class="notice" style="margin-top:14px">Lesson slots are shown for navigation completeness. A lesson becomes available only when its official source content and mappings are verified.</div>');
 pageShell('audio','Audio Studio','Official recordings first · Native Japanese voice fallback · iOS Safari ready','🎧','<div class="card"><div class="im-row"><div><h2>Native Japanese pronunciation</h2><p class="im-muted">Tap to play. iPhone Safari requires a direct user gesture for speech playback.</p></div><span class="im-chip" id="imVoiceStatus">Checking Japanese voice…</span></div><input class="im-field" id="imSpeakText" lang="ja" value="こんにちは。日本語を勉強しましょう。" aria-label="Japanese text to pronounce"><div class="im-row" style="margin-top:12px"><button class="btn" id="imSpeakButton">🔊 Speak Japanese</button><button class="btn ghost" id="imStopSpeech">Stop</button><label class="im-muted">Speed <select id="imSpeechRate" class="im-field" style="width:auto;display:inline-block"><option value=".75">Slow</option><option value=".9" selected>Normal</option><option value="1">Natural</option></select></label></div></div><div class="im-section-title"><h2>Local official audio files</h2><span class="im-muted" id="imAudioCount">Loading complete audio inventory…</span></div><div class="im-row" style="margin-bottom:10px;flex-wrap:wrap"><input class="im-field" id="imAudioSearch" placeholder="Search filename, book or lesson…" aria-label="Search audio files" style="flex:1;min-width:180px"><select class="im-field" id="imAudioGroup" aria-label="Filter audio family" style="width:auto"><option value="all">All audio families</option><option value="WORD_LIST">Word-list Audio</option><option value="GRAMMAR_WORKSHEET">Grammar Worksheet Audio</option></select></div><div class="card" id="imAudioList"><p class="im-muted">Audio inventory is being checked from the complete repository catalogue.</p></div><div class="im-row" style="justify-content:flex-end;margin-top:10px"><button class="btn ghost" id="imAudioPrev" disabled>← Previous</button><span class="im-muted" id="imAudioPage">Page 1 / 1</span><button class="btn ghost" id="imAudioNext" disabled>Next →</button></div><div class="im-section-title"><h2>Official lesson audio · all 72 lessons</h2><span class="im-muted">Japan Foundation players</span></div><div class="card" id="imOfficialLessonAudio"><p class="im-muted">Loading official lesson audio links…</p></div><div class="card" style="margin-top:14px"><h3>iOS playback checks</h3><ul><li>Audio starts only after a tap; no autoplay dependency.</li><li>Recorded MP3 files use native HTML audio controls with playsinline.</li><li>Japanese TTS uses an installed Japanese voice; an English voice is never substituted.</li><li>Official lesson audio opens the Japan Foundation MP3 player, which supports iPhone/iPad playback.</li></ul></div>');
 pageShell('kanji','Kanji Master','644 official target · verified source records · unique-character progress','漢','<div class="im-kpi-grid"><div class="im-kpi"><b>644</b><span>OFFICIAL TARGET</span></div><div class="im-kpi"><b id="imKanjiAvailable">—</b><span>UNIQUE VERIFIED</span></div><div class="im-kpi"><b id="imKanjiMastered">0</b><span>MASTERED</span></div><div class="im-kpi"><b id="imKanjiPending">644</b><span>UNIQUE REMAINING</span></div></div><div class="card"><div class="im-section-title" style="margin-top:0"><h2>Unlimited Kanji Practice</h2><span class="im-chip">Random MCQ</span></div><p class="im-muted">Practice only uses verified Kanji records. Repeated source rows are preserved, but a character counts once toward mastery.</p><button type="button" class="btn" id="imStartKanjiPractice">Start Kanji Practice</button><div id="imKanjiPracticeCard" style="margin-top:14px"><p class="im-muted">Start a random Kanji meaning quiz.</p></div></div><div class="im-section-title"><h2>Verified Kanji inventory</h2><span class="im-muted" id="imKanjiCount">Loading source records…</span></div><div class="im-row" style="margin-bottom:12px;flex-wrap:wrap"><input class="im-field" id="imKanjiSearch" placeholder="Search Kanji, reading, English or Sinhala…" style="flex:1;min-width:190px" aria-label="Search Kanji"><select class="im-field" id="imKanjiLevel" style="width:auto" aria-label="Filter Kanji by level"><option value="all">All levels</option></select></div><div id="imKanjiList" class="im-grid"><p class="im-muted">Loading verified Kanji records…</p></div><div class="im-row" style="justify-content:flex-end;margin-top:10px"><button type="button" class="btn ghost" id="imKanjiPrev" disabled>← Previous</button><span class="im-muted" id="imKanjiPage">Page 1 / 1</span><button type="button" class="btn ghost" id="imKanjiNext" disabled>Next →</button></div><div class="card" style="margin-top:14px"><h3>Official source references</h3><p class="im-muted">The current repository contains 400 source entries, 389 unique characters. The remaining official target is not fabricated. Kanji audio and stroke-order image files are not present locally; Japanese reading playback uses the native Japanese voice installed on the device.</p><div class="im-row" style="flex-wrap:wrap"><a class="btn ghost" href="https://www.irodori.jpf.go.jp/assets/data/kanji_list.xlsx" target="_blank" rel="noopener noreferrer">Official 644 Kanji List (Excel) ↗</a><a class="btn ghost" href="https://www.irodori.jpf.go.jp/assets/data/Kanji_all.pdf" target="_blank" rel="noopener noreferrer">Official Kanji Words PDF ↗</a></div></div>');
 pageShell('review','Flashcards & SRS','Review due words from the verified IRODORI vocabulary inventory','🃏','<div class="card" id="imReviewCard"><div class="im-row"><span class="im-chip">Spaced repetition</span><span class="im-muted" id="imReviewCount">0 review cards</span></div><div class="question-card"><div class="q-type">JAPANESE WORD</div><div class="jp" id="imReviewJapanese">No verified vocabulary loaded</div><div class="reading" id="imReviewReading"></div><div id="imReviewMeaning" class="translation im-hidden"></div><button class="btn" id="imReveal">Reveal meaning</button></div><div class="im-row"><button class="btn ghost" data-review="again">Again</button><button class="btn secondary" data-review="hard">Hard</button><button class="btn" data-review="known">Know it</button></div><p class="im-muted" id="imReviewNote">Cards are created only from the source vocabulary file.</p></div>');
 pageShell('analytics','Learning Analytics','Live totals from your saved learning activity and verified source inventory','📊','<div class="im-kpi-grid"><div class="im-kpi"><b id="imLessonsDone">0</b><span>LESSONS COMPLETED</span></div><div class="im-kpi"><b id="imLessonsLeft">72</b><span>LESSONS REMAINING</span></div><div class="im-kpi"><b id="imWordsTotal">—</b><span>VERIFIED WORD RECORDS</span></div><div class="im-kpi"><b id="imWordsLearned">0</b><span>WORDS LEARNED</span></div><div class="im-kpi"><b id="imWordsRemaining">—</b><span>WORDS REMAINING</span></div></div><div class="card"><h2>Lesson completion</h2><div class="im-progress-line"><i id="imLessonBar" style="width:0%"></i></div><p class="im-muted" id="imLessonPercent">0% of 72 lessons completed in this app</p><div class="im-section-title"><h2>Book progress</h2></div><div id="imBookProgress" class="stack"></div></div><div class="card" style="margin-top:14px"><h2>Data integrity</h2><div id="imDataAudit"></div></div>');
 pageShell('settings','Settings','iPhone-friendly display, voice and progress preferences','⚙️','<div class="card"><h2>Appearance</h2><div class="settings-row"><span>Glass theme</span><b class="im-chip">Enabled</b></div><div class="settings-row"><span>Reduce motion</span><label><input id="imReduceMotion" type="checkbox"> On</label></div><h2 style="margin-top:22px">Audio</h2><div class="settings-row"><span>Japanese speech voice</span><b id="imSettingsVoice">Checking…</b></div><div class="settings-row"><span>Default speech speed</span><b>0.9×</b></div><h2 style="margin-top:22px">Learning data</h2><p class="im-muted">Progress is stored on this device. Resetting progress does not delete source vocabulary, audio or official lesson data.</p><button class="btn ghost" id="imResetProgress">Reset learning progress</button></div>');
 pageShell('menu','All sections','Open any learning area from one place','☰','<div class="im-grid" id="imMenuGrid"></div>');
 const practicePage=$('#page-practice');
 if(practicePage&&!$('#imUnlimitedPractice'))practicePage.insertAdjacentHTML('beforeend','<div id="imUnlimitedPractice" class="card" style="margin-top:18px"><div class="im-section-title" style="margin-top:0"><h2>Unlimited practice</h2><span class="im-chip">Source-based</span></div><p class="im-muted">Practice questions are generated from verified vocabulary records. No invented word bank.</p><div class="im-row"><select id="imPracticeMode" class="im-field" style="max-width:280px"><option value="ja-si">Japanese → Sinhala</option><option value="ja-en">Japanese → English</option><option value="si-ja">Sinhala → Japanese</option><option value="en-ja">English → Japanese</option><option value="kana">Kana recognition</option></select><button class="btn" id="imStartPractice">Start practice</button></div><div id="imPracticeArea" style="margin-top:15px"></div><div class="im-row" style="margin-top:12px"><span class="im-muted" id="imPracticeScore">0 correct · 0 attempts</span><button class="btn ghost" id="imNextPractice" disabled>Next question →</button></div></div>');
}
function buildMenu(){
 const grid=$('#imMenuGrid');if(!grid)return;
 const items=[['books','📚','Books & Lessons','4 books · 72 lessons'],['alphabet','あ','Hiragana & Katakana','Basic kana and combinations'],['vocabulary','🧠','Vocabulary','Japanese · Furigana · English · Sinhala'],['grammar','✍️','Grammar','Official patterns and examples'],['audio','🎧','Audio Studio','Recordings and native Japanese voice'],['practice','🎯','Practice Centre','Unlimited source-based quizzes'],['kanji','漢','Kanji Master','644-character syllabus target'],['review','🃏','Flashcards','Spaced repetition'],['analytics','📊','Progress','Completed and remaining'],['settings','⚙️','Settings','Audio, display and data']];
 grid.innerHTML=items.map(([id,ico,title,sub])=>'<button class="im-tile" data-open-page="'+id+'" style="text-align:left;color:inherit"><span class="im-icon">'+ico+'</span><h3>'+title+'</h3><p>'+sub+'</p></button>').join('');
}
const YOON=[['kya','きゃ','キャ'],['kyu','きゅ','キュ'],['kyo','きょ','キョ'],['sha','しゃ','シャ'],['shu','しゅ','シュ'],['sho','しょ','ショ'],['cha','ちゃ','チャ'],['chu','ちゅ','チュ'],['cho','ちょ','チョ'],['nya','にゃ','ニャ'],['nyu','にゅ','ニュ'],['nyo','にょ','ニョ'],['hya','ひゃ','ヒャ'],['hyu','ひゅ','ヒュ'],['hyo','ひょ','ヒョ'],['mya','みゃ','ミャ'],['myu','みゅ','ミュ'],['myo','みょ','ミョ'],['rya','りゃ','リャ'],['ryu','りゅ','リュ'],['ryo','りょ','リョ'],['gya','ぎゃ','ギャ'],['gyu','ぎゅ','ギュ'],['gyo','ぎょ','ギョ'],['ja','じゃ','ジャ'],['ju','じゅ','ジュ'],['jo','じょ','ジョ'],['bya','びゃ','ビャ'],['byu','びゅ','ビュ'],['byo','びょ','ビョ'],['pya','ぴゃ','ピャ'],['pyu','ぴゅ','ピュ'],['pyo','ぴょ','ピョ']];
const SMALL_KANA=[['ぁ','ァ','small a'],['ぃ','ィ','small i'],['ぅ','ゥ','small u'],['ぇ','ェ','small e'],['ぉ','ォ','small o'],['ゃ','ャ','small ya'],['ゅ','ュ','small yu'],['ょ','ョ','small yo'],['っ','ッ','small tsu'],['ゎ','ヮ','small wa']];
function openBookLesson(book,lesson){
 if(book==='X'||book==='Y'){
  currentGrammarBook=book;
  page('grammar');
  renderGrammar();
  return;
 }
 if(book==='P'){
  page('vocabulary');
  if(typeof vocabularyBook!=='undefined')vocabularyBook='P';
  $$('[data-vocab-book]').forEach(tab=>tab.classList.toggle('active',tab.dataset.vocabBook==='P'));
  if(typeof renderSourceVocabulary==='function')renderSourceVocabulary();
  const url=officialAudioPage(book,lesson);
  if(url)window.open(url,'_blank','noopener,noreferrer');
  return;
 }
 page('vocabulary');
 if(typeof vocabularyBook!=='undefined')vocabularyBook=book;
 $$('[data-vocab-book]').forEach(tab=>tab.classList.toggle('active',tab.dataset.vocabBook===book));
 if(typeof renderSourceVocabulary==='function')renderSourceVocabulary();
 const lessonFilter=$('#vocabLessonFilter');
 if(lessonFilter){lessonFilter.value=String(lesson).padStart(2,'0');if(typeof renderSourceVocabulary==='function')renderSourceVocabulary();}
}function renderBooks(){
 const host=$('#imBooksGrid'),lessons=$('#imLessonsGrid');if(!host||!lessons)return;
 const rows=records();
 host.innerHTML=BOOKS.map(book=>{
  const count=rows.filter(x=>x.book===book.id).length;
  const status=book.id==='P'?'Official source found · import pending':count?'Source records loaded':'Source audit required';
  const wordLabel=book.id==='P'?'Structured word import pending':count.toLocaleString()+' words';
  return '<article class="im-tile"><span class="im-icon">'+(book.id==='X'?'🌱':book.id==='Y'?'🌿':book.id==='Z'?'🌳':'🌸')+'</span><h3>'+esc(book.name)+'</h3><p>'+esc(book.level)+' · 18 lessons</p><div class="im-row" style="margin-top:12px"><span class="im-status '+(book.id==='P'?'pending':'')+'">'+esc(status)+'</span><b>'+esc(wordLabel)+'</b></div></article>';
 }).join('');
 lessons.innerHTML=BOOKS.map(book=>Array.from({length:18},(_,i)=>{
  const lesson=i+1;
  const count=rows.filter(x=>x.book===book.id&&Number(x.lesson)===lesson).length;
  const description=book.id==='P'?'Official lesson audio player · vocabulary import pending':book.id==='X'?'Grammar lesson; Starter vocabulary is grouped by verified source topics':book.id==='Y'?count.toLocaleString()+' vocabulary records · grammar lesson available':count.toLocaleString()+' linked vocabulary records';
  const status=book.id==='P'?'Official audio':book.id==='X'?'Topic-based':count?'Open vocabulary':'Source mapping pending';
  return '<button class="im-tile" data-lesson-book="'+book.id+'" data-lesson-no="'+lesson+'" style="text-align:left;color:inherit"><div class="im-row"><b>'+esc(book.name)+' · Lesson '+String(lesson).padStart(2,'0')+'</b><span class="im-status '+(book.id==='P'?'pending':'')+'">'+esc(status)+'</span></div><p>'+esc(description)+'</p></button>';
 }).join('')).join('');
 lessons.querySelectorAll('[data-lesson-book]').forEach(button=>button.addEventListener('click',()=>openBookLesson(button.dataset.lessonBook,Number(button.dataset.lessonNo))));
}async function loadKanjiData(){
 try{
  const response=await fetch('./Kanji/irodori_kanji_all_400.json',{cache:'no-cache'});
  if(!response.ok)throw new Error('Kanji source request failed: '+response.status);
  kanjiData=await response.json();
  if(!Array.isArray(kanjiData.kanji_list))throw new Error('Kanji source schema is invalid');
  master.learnedKanji=Array.isArray(master.learnedKanji)?master.learnedKanji:[];
  renderKanji();renderOverview();
 }catch(error){
  kanjiData=null;renderOverview();
  const count=$('#imKanjiCount');if(count)count.textContent='Verified Kanji source could not be loaded.';
  console.warn('IRODORI Kanji data could not be loaded.',error);
 }
}
function uniqueKanjiRecords(){
 const map=new Map();
 (kanjiData?.kanji_list||[]).forEach(item=>{if(item.kanji&&!map.has(item.kanji))map.set(item.kanji,item)});
 return [...map.values()];
}
function renderKanji(){
 const host=$('#imKanjiList');if(!host)return;
 const rows=kanjiData?.kanji_list||[];
 if(!kanjiData){host.innerHTML='<p class="im-muted">Loading verified Kanji source records…</p>';return}
 master.learnedKanji=Array.isArray(master.learnedKanji)?master.learnedKanji:[];
 const uniqueCount=new Set(rows.map(x=>x.kanji).filter(Boolean)).size;
 const learnedCount=master.learnedKanji.filter(ch=>rows.some(x=>x.kanji===ch)).length;
 const set=(id,value)=>{const el=$('#'+id);if(el)el.textContent=String(value)};
 set('imKanjiAvailable',uniqueCount);set('imKanjiMastered',learnedCount);set('imKanjiPending',Math.max(0,644-uniqueCount));
 const count=$('#imKanjiCount');if(count)count.textContent=rows.length+' source entries · '+uniqueCount+' unique characters · '+(rows.length-uniqueCount)+' repeated source rows preserved';
 const levelSelect=$('#imKanjiLevel');
 if(levelSelect&&levelSelect.dataset.ready!=='1'){
  const levels=[...new Set(rows.map(x=>x.grade_level).filter(Boolean))].sort();
  levelSelect.innerHTML='<option value="all">All levels</option>'+levels.map(level=>'<option value="'+esc(level)+'">'+esc(level)+'</option>').join('');
  levelSelect.dataset.ready='1';
 }
 const query=($('#imKanjiSearch')?.value||'').trim().toLowerCase();
 const level=levelSelect?.value||'all';
 const filtered=rows.filter(item=>(level==='all'||item.grade_level===level)&&(!query||[item.kanji,item.grade_level,item.radical,item.meanings?.english,item.meanings?.sinhala,item.readings?.onyomi?.kana,item.readings?.kunyomi?.kana,item.id].join(' ').toLowerCase().includes(query)));
 const pages=Math.max(1,Math.ceil(filtered.length/KANJI_PAGE_SIZE));
 kanjiPageIndex=Math.max(0,Math.min(kanjiPageIndex,pages-1));
 const visible=filtered.slice(kanjiPageIndex*KANJI_PAGE_SIZE,(kanjiPageIndex+1)*KANJI_PAGE_SIZE);
 set('imKanjiPage','Page '+(kanjiPageIndex+1)+' / '+pages);
 const prev=$('#imKanjiPrev'),next=$('#imKanjiNext');if(prev)prev.disabled=kanjiPageIndex===0;if(next)next.disabled=kanjiPageIndex>=pages-1;
 const frequencies=new Map();rows.forEach(item=>frequencies.set(item.kanji,(frequencies.get(item.kanji)||0)+1));
 host.innerHTML=visible.length?visible.map(item=>{
  const on=item.readings?.onyomi?.kana||'—',kun=item.readings?.kunyomi?.kana||'—';
  const onSpeech=on==='—'?'':on.split(/[、,，]/).map(x=>x.trim().replace(/^-/, '')).filter(Boolean).join('、');
  const kunSpeech=kun==='—'?'':kun.split(/[、,，]/).map(x=>x.trim().replace(/^-/, '')).filter(Boolean).join('、');
  const learned=master.learnedKanji.includes(item.kanji);
  const duplicateCount=frequencies.get(item.kanji)||1;
  return '<article class="im-tile im-kanji-card"><div class="im-row"><span class="im-chip">'+esc(item.grade_level||'IRODORI')+'</span><span class="im-muted">'+esc(item.id||'')+'</span></div><div class="im-kanji-character">'+esc(item.kanji)+'</div><h3>'+esc(item.meanings?.english||'Meaning pending')+'</h3><p class="im-kanji-sinhala">'+esc(item.meanings?.sinhala||'සිංහල අර්ථය pending')+'</p><div class="im-kanji-meta">Lesson '+esc(item.lesson??'—')+' · '+esc(item.stroke_count??'—')+' strokes · Radical '+esc(item.radical||'—')+(duplicateCount>1?' · '+duplicateCount+' source entries':'')+'</div><div class="im-kanji-reading"><div><b>On reading</b><span>'+esc(on)+'</span>'+(onSpeech?'<button type="button" class="btn ghost" data-kanji-speak="'+esc(onSpeech)+'">🔊 Listen</button>':'')+'</div><div><b>Kun reading</b><span>'+esc(kun)+'</span>'+(kunSpeech?'<button type="button" class="btn ghost" data-kanji-speak="'+esc(kunSpeech)+'">🔊 Listen</button>':'')+'</div></div>'+(item.mnemonic_story_sinhala?'<details><summary>සිංහල මතක සටහන</summary><p>'+esc(item.mnemonic_story_sinhala)+'</p></details>':'')+'<button type="button" class="btn '+(learned?'secondary':'ghost')+'" data-kanji-learned="'+esc(item.kanji)+'">'+(learned?'✓ Learned':'Mark learned')+'</button></article>';
 }).join(''):'<p class="im-muted">No Kanji records match this search.</p>';
}
function toggleKanjiLearned(character){
 if(!character)return;
 master.learnedKanji=Array.isArray(master.learnedKanji)?master.learnedKanji:[];
 master.learnedKanji=master.learnedKanji.includes(character)?master.learnedKanji.filter(x=>x!==character):[...master.learnedKanji,character];
 saveProgress();renderKanji();
}
function startKanjiPractice(){kanjiPracticeScore=0;kanjiPracticeAttempts=0;nextKanjiPractice()}
function nextKanjiPractice(){
 const host=$('#imKanjiPracticeCard'),pool=uniqueKanjiRecords();
 if(!host)return;
 if(pool.length<4){host.innerHTML='<p class="im-muted">At least four verified Kanji records are required.</p>';return}
 const item=pool[Math.floor(Math.random()*pool.length)];
 const correct=String(item.meanings?.english||'').split(/[;,]/)[0].trim();
 const alternatives=[...new Set(pool.filter(x=>x.kanji!==item.kanji).map(x=>String(x.meanings?.english||'').split(/[;,]/)[0].trim()).filter(x=>x&&x!==correct))].sort(()=>Math.random()-.5).slice(0,3);
 const options=[correct,...alternatives].sort(()=>Math.random()-.5);
 kanjiPracticeItem={item,options,correctIndex:options.indexOf(correct)};
 host.innerHTML='<div class="im-kanji-practice-question"><div class="im-kanji-character">'+esc(item.kanji)+'</div><p>Choose the correct English meaning</p><div class="answers">'+options.map((option,index)=>'<button type="button" class="im-choice" data-kanji-choice="'+index+'">'+esc(option)+'</button>').join('')+'</div><div id="imKanjiPracticeFeedback" class="im-muted">Select an answer.</div><div class="im-row"><span id="imKanjiPracticeScore">Score '+kanjiPracticeScore+' / '+kanjiPracticeAttempts+'</span><button type="button" class="btn" id="imNextKanjiPractice" disabled>Next Kanji →</button></div><p class="im-muted">'+esc(item.readings?.onyomi?.kana||'')+' · '+esc(item.readings?.kunyomi?.kana||'')+'</p></div>';
}
function checkKanjiPractice(index){
 if(!kanjiPracticeItem)return;
 const correct=index===kanjiPracticeItem.correctIndex;
 kanjiPracticeAttempts++;if(correct)kanjiPracticeScore++;
 const feedback=$('#imKanjiPracticeFeedback');
 if(feedback)feedback.textContent=correct?'Correct! '+kanjiPracticeItem.item.meanings.english:'Not quite. Correct meaning: '+kanjiPracticeItem.item.meanings.english;
 $$('[data-kanji-choice]').forEach(button=>{button.disabled=true;button.classList.toggle('correct',Number(button.dataset.kanjiChoice)===kanjiPracticeItem.correctIndex)});
 const score=$('#imKanjiPracticeScore');if(score)score.textContent='Score '+kanjiPracticeScore+' / '+kanjiPracticeAttempts;
 const next=$('#imNextKanjiPractice');if(next)next.disabled=false;
}
function renderKanaExtras(){
 const alphabet=$('#page-alphabet');if(!alphabet||$('#imKanaExtras'))return;
 const panel=document.createElement('div');panel.id='imKanaExtras';panel.className='card';panel.style.marginTop='16px';
 panel.innerHTML='<div class="im-section-title" style="margin-top:0"><h2>Yōon · Combined Kana</h2><span class="im-chip">33 combinations</span></div><p class="im-muted">Small ゃ・ゅ・ょ combine with the i-row kana. Tap any pair to hear its Japanese sound.</p><div class="im-grid">'+YOON.map(x=>'<button class="im-tile" data-kana-speak="'+x[1]+' '+x[2]+'"><b style="font-size:25px">'+x[1]+'　'+x[2]+'</b><p>'+x[0]+'</p></button>').join('')+'</div><div class="im-section-title"><h2>Small Kana</h2><span class="im-chip">10 forms</span></div><div class="im-grid">'+SMALL_KANA.map(x=>'<button class="im-tile" data-kana-speak="'+x[0]+' '+x[1]+'"><b style="font-size:25px">'+x[0]+'　'+x[1]+'</b><p>'+x[2]+'</p></button>').join('')+'</div>';
 alphabet.append(panel);panel.querySelectorAll('[data-kana-speak]').forEach(b=>b.addEventListener('click',()=>speakJapanese(b.dataset.kanaSpeak)));
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
 const voices=getVoices();
 const ja=voices.find(v=>/^ja-JP$/i.test(v.lang))||voices.find(v=>/^ja([-_]|$)/i.test(v.lang));
 if(voices.length&&!ja){notify('No Japanese system voice is available. Install a Japanese voice in iPhone Settings or use the recorded audio.');return}
 const u=new SpeechSynthesisUtterance(value);u.lang=ja?.lang||'ja-JP';u.rate=Number($('#imSpeechRate')?.value||.9);
 if(ja)u.voice=ja;
 u.onerror=()=>notify('Japanese speech playback failed. Try a recorded lesson audio track.');
 try{speechSynthesis.cancel();speechSynthesis.resume();speechSynthesis.speak(u)}catch(e){notify('Could not start speech playback: '+e.message)}
}function notify(msg){if(typeof toast==='function')toast(msg);else alert(msg)}
function allAudioFiles(){
 if(Array.isArray(audioCatalog?.local_files)&&audioCatalog.local_files.length){
  return audioCatalog.local_files.map(x=>({name:x.file_name,group:x.group,family:x.family,book_code:x.book_code,lesson_number:x.lesson_number,src:x.src}));
 }
 const files=new Map();
 try{(vocabularyMedia?.audio_files||[]).forEach(n=>files.set('vocab:'+n,{name:n,group:'Word-list Audio',family:'WORD_LIST',src:'./assets/audio/vocabulary/'+encodeURIComponent(n)}))}catch{}
 try{(starterWorksheetAudioFiles||[]).forEach(n=>files.set('grammar:'+n,{name:n,group:'Grammar Worksheet Audio',family:'GRAMMAR_WORKSHEET',src:'./assets/audio/grammar/'+encodeURIComponent(n)}))}catch{}
 try{(elementary1WorksheetAudioFiles||[]).forEach(n=>files.set('grammar:'+n,{name:n,group:'Grammar Worksheet Audio',family:'GRAMMAR_WORKSHEET',src:'./assets/audio/grammar/'+encodeURIComponent(n)}))}catch{}
 return [...files.values()];
}
function officialAudioPage(book,lesson){
 const base=OFFICIAL_AUDIO_BASES[book];return base?base+String(lesson).padStart(2,'0')+'.html':'';
}
async function loadAudioCatalog(){
 try{
  const response=await fetch('./assets/data/Audio/audio_catalog.json',{cache:'no-cache'});
  if(!response.ok)throw new Error('Audio catalogue request failed: '+response.status);
  audioCatalog=await response.json();
  renderAudio();renderOfficialLessonAudio();
 }catch(error){
  audioCatalog=null;renderAudio();renderOfficialLessonAudio();
  console.warn('IRODORI audio catalogue could not be loaded; legacy manifest fallback is active.',error);
 }
}
function renderOfficialLessonAudio(){
 const host=$('#imOfficialLessonAudio');if(!host)return;
 const entries=audioCatalog?.official_lesson_audio||Object.entries(OFFICIAL_AUDIO_BASES).flatMap(([book,base])=>Array.from({length:18},(_,i)=>({book_code:book,book_name:BOOKS.find(x=>x.id===book)?.name||book,lesson_number:i+1,url:base+String(i+1).padStart(2,'0')+'.html'})));
 host.innerHTML=BOOKS.map(book=>{
  const list=entries.filter(x=>x.book_code===book.id);
  return '<details class="im-official-audio-book" '+(book.id==='P'?'open':'')+'><summary><b>'+esc(book.name)+'</b><span class="im-muted">'+list.length+' official lesson players</span></summary><div class="im-official-audio-grid">'+list.map(item=>'<a class="im-official-audio-link" href="'+esc(item.url)+'" target="_blank" rel="noopener noreferrer"><span>Lesson '+String(item.lesson_number).padStart(2,'0')+'</span><small>Open official MP3 player ↗</small></a>').join('')+'</div></details>';
 }).join('');
}
function renderAudio(){
 const host=$('#imAudioList');if(!host)return;
 const files=allAudioFiles();
 const query=($('#imAudioSearch')?.value||'').trim().toLowerCase();
 const group=$('#imAudioGroup')?.value||'all';
 const filtered=files.filter(file=>(group==='all'||file.family===group)&&(!query||[file.name,file.group,file.book_code,file.lesson_number].join(' ').toLowerCase().includes(query)));
 const pageCount=Math.max(1,Math.ceil(filtered.length/AUDIO_PAGE_SIZE));
 audioPageIndex=Math.max(0,Math.min(audioPageIndex,pageCount-1));
 const start=audioPageIndex*AUDIO_PAGE_SIZE;
 const visible=filtered.slice(start,start+AUDIO_PAGE_SIZE);
 const count=$('#imAudioCount');if(count)count.textContent=filtered.length.toLocaleString()+' of '+files.length.toLocaleString()+' local audio files';
 const pageLabel=$('#imAudioPage');if(pageLabel)pageLabel.textContent='Page '+(audioPageIndex+1)+' / '+pageCount;
 const prev=$('#imAudioPrev'),next=$('#imAudioNext');
 if(prev)prev.disabled=audioPageIndex===0;
 if(next)next.disabled=audioPageIndex>=pageCount-1;
 host.innerHTML=visible.length?visible.map(file=>'<div class="im-audio-row"><div><b>'+esc(file.name)+'</b><div class="im-muted">'+esc(file.group||'Audio')+(file.book_code?' · '+esc(file.book_code):'')+(file.lesson_number?' · Lesson '+String(file.lesson_number).padStart(2,'0'):'')+'</div></div><span class="im-status">LOCAL FILE</span><audio controls playsinline preload="none" src="'+esc(file.src)+'" aria-label="'+esc(file.name)+'"></audio><button type="button" class="btn ghost" data-audio-offline="'+esc(file.src)+'">Save offline</button></div>').join(''):'<p class="im-muted">No audio files match this search. Try another word or choose All audio.</p>';
}
async function saveAudioOffline(src){
 try{
  if(!('caches'in window))throw new Error('Offline storage is unavailable in this browser.');
  const response=await fetch(src,{cache:'reload'});
  if(!response.ok||response.status!==200)throw new Error('The full audio file could not be downloaded.');
  const cache=await caches.open('irodori-master-v3-media');
  await cache.put(new Request(new URL(src,document.baseURI).href),response.clone());
  notify('Audio saved for offline playback.');
 }catch(error){notify('Offline save failed: '+error.message)}
}
function renderOverview(){
 const done=master.completedLessons.length,words=records(),learned=master.learnedWords.length;
 const set=(id,v)=>{const el=$('#'+id);if(el)el.textContent=String(v)};
 const kanjiRows=kanjiData?.kanji_list||[];
 const uniqueKanji=new Set(kanjiRows.map(x=>x.kanji).filter(Boolean)).size;
 const kanjiLearned=Array.isArray(master.learnedKanji)?master.learnedKanji.length:0;
 const basicKana=currentKana().length*2;
 const yoonForms=typeof YOON!=='undefined'?YOON.length*2:0;
 const smallForms=typeof SMALL_KANA!=='undefined'?SMALL_KANA.length*2:0;
 set('imLessonsDone',done);set('imLessonsLeft',Math.max(0,72-done));
 set('imWordsTotal',words.length?words.length:'Not loaded');set('imWordsLearned',learned);
 set('imWordsRemaining',Math.max(0,words.length-learned));
 set('imKanjiAvailable',kanjiData?uniqueKanji:'Loading…');
 set('imKanjiMastered',kanjiLearned);
 set('imKanjiPending',kanjiData?Math.max(0,644-uniqueKanji):644);
 const bar=$('#imLessonBar');if(bar)bar.style.width=Math.min(100,done/72*100)+'%';
 set('imLessonPercent',Math.round(done/72*100)+'% of 72 lessons completed in this app');
 const bookHost=$('#imBookProgress');if(bookHost)bookHost.innerHTML=BOOKS.map(b=>{const n=master.completedLessons.filter(x=>String(x).startsWith(b.id+'-')).length;return '<div><div class="im-row"><b>'+b.name+'</b><span class="im-muted">'+n+' / 18</span></div><div class="im-progress-line"><i style="width:'+(n/18*100)+'%"></i></div></div>'}).join('');
 const auditHost=$('#imDataAudit');
 if(auditHost)auditHost.innerHTML='<div class="settings-row"><span>Books / lessons</span><b>4 / 72 target</b></div><div class="settings-row"><span>Vocabulary master</span><b class="'+(words.length?'':'im-status pending')+'">'+(words.length?words.length.toLocaleString()+' source records · Pre-Intermediate import pending':'Not loaded / verify source file')+'</b></div><div class="settings-row"><span>Kana inventory</span><b>'+basicKana+' basic forms · '+yoonForms+' yōon combinations · '+smallForms+' small forms</b></div><div class="settings-row"><span>Kanji master</span><b class="im-status pending">'+(kanjiData?kanjiRows.length+' source entries · '+uniqueKanji+' unique / 644 · '+Math.max(0,644-uniqueKanji)+' pending':'Loading verified Kanji source…')+'</b></div><div class="settings-row"><span>Kanji progress</span><b>'+kanjiLearned+' mastered unique characters</b></div><div class="settings-row"><span>Local / official lesson audio</span><b>'+allAudioFiles().length+' local files · 72 official lesson players</b></div>';
}function selectReview(){
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
 $('#imAudioSearch')?.addEventListener('input',()=>{audioPageIndex=0;renderAudio()});
 $('#imAudioGroup')?.addEventListener('change',()=>{audioPageIndex=0;renderAudio()});
 $('#imAudioPrev')?.addEventListener('click',()=>{audioPageIndex=Math.max(0,audioPageIndex-1);renderAudio()});
 $('#imAudioNext')?.addEventListener('click',()=>{audioPageIndex++;renderAudio()});
 $('#imKanjiSearch')?.addEventListener('input',()=>{kanjiPageIndex=0;renderKanji()});
 $('#imKanjiLevel')?.addEventListener('change',()=>{kanjiPageIndex=0;renderKanji()});
 $('#imKanjiPrev')?.addEventListener('click',()=>{kanjiPageIndex=Math.max(0,kanjiPageIndex-1);renderKanji()});
 $('#imKanjiNext')?.addEventListener('click',()=>{kanjiPageIndex++;renderKanji()});
 $('#imStartKanjiPractice')?.addEventListener('click',startKanjiPractice);
 document.addEventListener('click',e=>{
  const audioButton=e.target.closest('[data-audio-offline]');
  if(audioButton){audioButton.disabled=true;saveAudioOffline(audioButton.dataset.audioOffline).finally(()=>{audioButton.disabled=false})}
  const kanjiSpeak=e.target.closest('[data-kanji-speak]');if(kanjiSpeak)speakJapanese(kanjiSpeak.dataset.kanjiSpeak);
  const kanjiLearned=e.target.closest('[data-kanji-learned]');if(kanjiLearned)toggleKanjiLearned(kanjiLearned.dataset.kanjiLearned);
  const kanjiChoice=e.target.closest('[data-kanji-choice]');if(kanjiChoice)checkKanjiPractice(Number(kanjiChoice.dataset.kanjiChoice));
  if(e.target.closest('#imNextKanjiPractice'))nextKanjiPractice();
 });
 $('#imStartPractice')?.addEventListener('click',startPractice);$('#imNextPractice')?.addEventListener('click',nextPractice);
 $('#imReveal')?.addEventListener('click',()=>$('#imReviewMeaning')?.classList.remove('im-hidden'));
 $$('[data-review]').forEach(b=>b.addEventListener('click',()=>{const item=practice.reviewItem;if(item?.id){master.reviewQueue=master.reviewQueue.filter(x=>x!==item.id);if(b.dataset.review!=='known')master.reviewQueue.push(item.id);saveProgress()}selectReview()}));
 $('#imReduceMotion')?.addEventListener('change',e=>document.documentElement.style.setProperty('scroll-behavior',e.target.checked?'auto':'smooth'));
 $('#imResetProgress')?.addEventListener('click',()=>{if(confirm('Reset IRODORI Master learning progress on this device? Source data and audio files will not be deleted.')){master={completedLessons:[],learnedWords:[],knownKana:[],learnedKanji:[],reviewQueue:[],daily:{}};saveProgress();selectReview();renderKanji();notify('Learning progress reset. Source data was not changed.')}});
 $$('[data-open-page]').forEach(b=>b.addEventListener('click',()=>page(b.dataset.openPage)));
}function init(){
 addNav();addPages();buildMenu();bind();installAudioSafety();voiceStatus();renderAudio();renderOfficialLessonAudio();loadAudioCatalog();loadKanjiData();renderOverview();selectReview();renderBooks();renderKanaExtras();renderKanji();
 const vocabCount=$('#vocabTotal');if(vocabCount&&'MutationObserver'in window){new MutationObserver(()=>{renderOverview();renderAudio();selectReview();renderBooks()}).observe(vocabCount,{childList:true,subtree:true,characterData:true})}
 const oldBrand=$('.brand');if(oldBrand)oldBrand.innerHTML='<span class="brand-mark">日</span> IRODORI';
 const mobile=$('#mobileNav');if(mobile)mobile.setAttribute('aria-label','Main navigation');
 document.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b&&b.dataset.page&&['books','audio','kanji','review','analytics','settings','menu'].includes(b.dataset.page))page(b.dataset.page)});
 window.addEventListener('storage',e=>{if(e.key===KEY){master=readProgress();renderOverview()}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
