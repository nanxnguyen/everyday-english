'use strict';
window.V2LABS=(function(){
 const modes=new Set(['engine','b2','pronunciation','conversation','listening','game','test','review']);
 const band=['A1','A1','A2','A2','A2','B1'];
 const contexts=['đời sống','trường học','công việc','du lịch','online','phỏng vấn'];
 const weakLabel={listening:'Nghe hiểu',vocabulary:'Từ vựng',visual:'Hình ảnh',context:'Tình huống'};
 function panel(){return document.getElementById('learning-panel');}
 function words(){return topicWords();}
 function sample(n=8){return engine.shuffle(words()).slice(0,n);}
 function quality(w){
  const parts=w.word.split(/\s+/),main=parts[0],tail=parts.slice(1).join(' ');
  const pattern=parts.length>1?w.word.replace(/\b(my|your|me|you|I|I'm)\b/gi,'___'):(w.example.includes(w.word)?w.example.replace(w.word,'___'):'Use '+w.word+' in a short sentence.');
  const collocations=parts.length>1?[w.word,'use “'+w.word+'” in context','build a clear sentence with “'+w.word+'”']:[w.word,'really '+w.word,'use '+w.word+' naturally'];
  return {
   cefr:band[Math.min(5,Math.floor((w.group+w.word.length)%6))],
   register:/please|could|would|may|appreciate|sorry/i.test(w.word+' '+w.example)?'polite':/hi|yeah|cool|no worries|how's/i.test(w.word)?'informal':'neutral',
   type:parts.length>1?'chunk / cụm dùng nguyên khối':'core word',
   collocations,
   pattern,
   mistake:parts.length>1?'Đừng tách cụm ra dịch từng chữ; hãy dùng nguyên cụm trong một câu tự nhiên.':'Đừng chỉ nhớ nghĩa đơn lẻ; hãy đặt từ vào một câu ngắn của bạn.',
   use:'Dùng khi muốn nói “'+w.meaning+'” trong '+contexts[w.group%contexts.length]+'.'
  };
 }
 function v2Hero(kicker,title,lead,iconName='target'){
  const hero=node('section','v2-hero');
  const mark=node('span','v2-hero-icon');mark.append(icon(iconName));
  const copy=node('div');copy.append(node('p','eyebrow',kicker),node('h2','',title),node('p','',lead));
  hero.append(mark,copy);return hero;
 }
 function metricGrid(items){
  const grid=node('div','v2-metrics');
  items.forEach(([value,label,tone])=>{const item=node('div','v2-metric '+(tone||''));item.append(node('b','',String(value)),node('span','',label));grid.append(item);});
  return grid;
 }
 function vocabRows(list){
  const wrap=node('div','v2-word-table');
  list.forEach(w=>{const q=quality(w),row=node('article','v2-word-row');row.append(visualTile(w),node('div','',undefined));row.children[1].append(node('b','',w.word),node('span','',w.meaning),node('small','',q.cefr+' · '+q.type+' · '+q.register));row.append(button('Nghe',()=>speak(w),'listen','volume'));wrap.append(row);});
  return wrap;
 }
 const b2Pack={
  vocab:[
   ['take into account','xem xét / tính đến','We should take cost and time into account.'],
   ['raise awareness','nâng cao nhận thức','The campaign raises awareness about online safety.'],
   ['a significant impact','tác động đáng kể','Small habits can have a significant impact over time.'],
   ['from my perspective','theo góc nhìn của tôi','From my perspective, schools should teach practical skills.'],
   ['on the other hand','mặt khác','Online learning is flexible. On the other hand, it requires discipline.'],
   ['a balanced approach','cách tiếp cận cân bằng','A balanced approach is usually more realistic.'],
   ['deal with pressure','xử lý áp lực','Students need strategies to deal with pressure.'],
   ['make a contribution','đóng góp','Young people can make a contribution to their community.'],
   ['long-term benefits','lợi ích dài hạn','Reading brings long-term benefits for vocabulary.'],
   ['be likely to','có khả năng','People are likely to remember examples better than rules.']
  ],
  reading:{
   title:'Digital learning and independent study',
   text:'Many learners now combine classroom lessons with digital tools. This change gives students more control over their time, but it also requires stronger study habits. A useful learning platform should not simply show information. It should guide learners to notice important language, practise it in different contexts, and return to difficult items before they are forgotten. For B2 learners, the main challenge is not knowing isolated words, but using language to explain ideas clearly, compare options, and support opinions with reasons. Therefore, a good study routine should include reading, listening, speaking and writing tasks that connect to the same topic.',
   questions:[
    ['What is the main idea of the text?',['Digital tools can replace teachers','Good platforms should support active, repeated practice','B2 learners only need more grammar','Classroom lessons are no longer useful'],1],
    ['What does the writer say B2 learners need most?',['More isolated words','Faster typing','Clear explanation and supported opinions','Shorter lessons only'],2],
    ['The word “requires” is closest in meaning to:',['needs','avoids','shows','forgets'],0]
   ]
  },
  listening:'In a B2 exam, listening is not only about hearing every word. You need to understand purpose, attitude and key details. Before the audio starts, read the questions carefully and predict what kind of information you need.',
  writingPrompt:'Some people believe students should spend more time learning practical life skills at school. Others think academic subjects should remain the priority. Discuss both views and give your opinion.',
  speaking:['Describe a useful skill you learned recently.','Compare online learning and classroom learning.','Do you think exams are a good way to measure ability? Why or why not?']
 };
 function saveB2(area,score){
  state.meta??={schemaVersion:1,updatedAt:0};state.meta.b2??={attempts:[]};
  state.meta.b2.attempts.push({area,score,at:Date.now(),topic:selected});
  state.meta.b2.attempts=state.meta.b2.attempts.slice(-80);
  save();
 }
 function b2Attempts(){return state.meta?.b2?.attempts||[];}
 function renderB2Prep(){
  const p=panel(),attempts=b2Attempts(),avg=attempts.length?Math.round(attempts.reduce((n,a)=>n+a.score,0)/attempts.length):0;
  p.append(v2Hero('B2 EXAM PREP','Luyện thi B2 theo 4 kỹ năng','Mục tiêu là dùng tiếng Anh để giải thích, so sánh, nêu quan điểm và xử lý bài thi có thời gian. Phần này không làm mất tiến độ V1/V2.','target'));
  p.append(metricGrid([[attempts.length,'lượt mock-test B2 riêng','violet'],[avg?avg+'%':'Chưa có','điểm mock-test trung bình',''],['75–80%','mốc nên đạt ổn định','good']]));
  const roadmap=node('section','b2-roadmap');[
   ['Vocabulary','Collocation, linking words, phrasal verbs và cụm diễn đạt quan điểm.'],
   ['Reading','Đọc 300–700 từ, tìm main idea, detail, inference và vocabulary in context.'],
   ['Listening','Nghe ý chính, thái độ người nói, chi tiết cần ghi chú.'],
   ['Writing','Viết essay/email/report có bố cục, luận điểm và ví dụ.'],
   ['Speaking','Nói 2–3 phút, trả lời follow-up, so sánh và phản biện nhẹ.']
  ].forEach(x=>{const card=node('article','b2-skill-card');card.append(node('b','',x[0]),node('p','',x[1]));roadmap.append(card);});p.append(roadmap);
  p.append(node('h3','v2-section-title','B2 Vocabulary Booster'));const vocab=node('div','b2-vocab-grid');b2Pack.vocab.forEach(([phrase,meaning,example])=>{const card=node('article','b2-phrase');card.append(node('b','',phrase),node('span','',meaning),node('p','example',example));const actions=node('div','actions');actions.append(button('Nghe cụm',()=>say(phrase),'listen','volume'),button('Nghe câu',()=>say(example),'','volume'),button('Đã nắm',()=>{saveB2('vocabulary',100);toast('Đã lưu lượt luyện B2 vocabulary');},'','check'));card.append(actions);vocab.append(card);});p.append(vocab);
  const reading=node('section','b2-panel');reading.append(node('p','eyebrow','READING B2'),node('h3','',b2Pack.reading.title),node('p','b2-reading',b2Pack.reading.text));const feedback=node('p','coach-feedback','Chọn đáp án rồi bấm chấm bài.');b2Pack.reading.questions.forEach((q,idx)=>{const field=node('fieldset','options b2-options');field.append(node('legend','',idx+1+'. '+q[0]));q[1].forEach((option,i)=>{const label=node('label','option-label');const input=document.createElement('input');input.type='radio';input.name='b2-reading-'+idx;input.value=String(i);label.append(input,node('span','',option));field.append(label);});reading.append(field);});reading.append(button('Chấm Reading',()=>{let correct=0;b2Pack.reading.questions.forEach((q,idx)=>{const picked=reading.querySelector('input[name="b2-reading-'+idx+'"]:checked');if(picked&&Number(picked.value)===q[2])correct++;});const score=Math.round(correct/b2Pack.reading.questions.length*100);feedback.textContent='Reading: '+score+'%. '+(score>=75?'Ổn cho B2, tiếp tục tăng tốc độ đọc.':'Cần luyện lại main idea và từ trong ngữ cảnh.');saveB2('reading',score);},'primary','check'),feedback);p.append(reading);
  const listening=node('section','b2-panel');listening.append(node('p','eyebrow','LISTENING B2'),node('h3','','Nghe ý chính và ghi chú'),node('p','',b2Pack.listening));const note=document.createElement('textarea');note.rows=5;note.placeholder='Ghi 3 ý chính bạn nghe được...';listening.append(button('Nghe bài nói',()=>say(b2Pack.listening),'listen','volume'),note,button('Lưu Listening note',()=>{const score=Math.min(100,Math.max(30,note.value.trim().split(/\s+/).filter(Boolean).length*5));saveB2('listening',score);toast('Đã lưu ghi chú nghe B2');},'','check'));p.append(listening);
  const writing=node('section','b2-panel');writing.append(node('p','eyebrow','WRITING B2'),node('h3','','Essay practice'),node('p','notice',b2Pack.writingPrompt));const essay=document.createElement('textarea');essay.rows=8;essay.placeholder='Viết 180–250 từ. Dùng: firstly, however, for example, in conclusion...';const wc=node('p','dictation-feedback','0 từ');essay.addEventListener('input',()=>{const count=essay.value.trim().split(/\s+/).filter(Boolean).length;wc.textContent=count+' từ · '+(count>=180&&count<=260?'độ dài ổn':'mục tiêu 180–250 từ');});writing.append(essay,wc,button('Lưu bài viết',()=>{const count=essay.value.trim().split(/\s+/).filter(Boolean).length;const score=count>=180&&count<=260?85:Math.min(70,Math.max(20,Math.round(count/2.5)));saveB2('writing',score);toast('Đã lưu lượt luyện Writing B2');},'primary','check'));p.append(writing);
  const speaking=node('section','b2-panel');speaking.append(node('p','eyebrow','SPEAKING B2'),node('h3','','Topic cards'),node('p','', 'Chọn một câu, nói 2–3 phút, sau đó tự kiểm: có nêu ý kiến, lý do, ví dụ và kết luận chưa.'));const prompts=node('div','coach-prompts');b2Pack.speaking.forEach(q=>prompts.append(button(q,()=>say(q),'','volume')));speaking.append(prompts,button('Mở speaking checklist',()=>openInfoModal('B2 Speaking checklist',['Nói 2–3 phút, không chỉ trả lời một câu ngắn.',[{title:'Opinion',text:'Nêu rõ quan điểm chính.'},{title:'Reason',text:'Giải thích ít nhất 2 lý do.'},{title:'Example',text:'Có ví dụ cụ thể từ học tập, công việc hoặc đời sống.'},{title:'Linking',text:'Dùng nối ý: however, for example, as a result, in my opinion.'}]],{kicker:'B2 SPEAKING',icon:'info',tone:'success'}),'primary','info'));p.append(speaking);
 }
 function renderEngine(){
  const p=panel(),list=words(),learned=list.filter(w=>state.records[w.id]?.seen>0).length,focus=sample(6);
  p.append(v2Hero('B2 SYSTEM ROADMAP','Nâng toàn dự án lên chuẩn B2','Kho hiện tại đã nâng lên 3.000 mục theo 20 chủ đề. Mỗi chủ đề có 150 từ/cụm, kết hợp nghe, nói, đọc, viết và test theo chuẩn B2.','target'));
  p.append(metricGrid([[learned+'/'+topicTotal(selected),'đã luyện trong chủ đề','good'],[WORDS.length.toLocaleString('vi-VN')+'/'+TOTAL_TARGET.toLocaleString('vi-VN'),'kho từ hiện có','violet'],['4 kỹ năng','nghe · nói · đọc · viết','']]));
  const system=node('section','b2-system-map');
  [
   ['Foundation','1.000 mục nền','Giữ wordId cũ, không mất tiến độ. Đây là lớp giao tiếp A1–B1.'],
   ['Bridge to B1/B2','+1.000 cụm mở rộng','Thêm collocation, role-play, công việc, xã hội và bài nghe ngắn.'],
   ['B2 Exam Core','+1.000 cụm trọng tâm B2','Thêm academic phrases, essay, inference reading, listening note-taking và speaking follow-up.']
  ].forEach(x=>{const card=node('article','system-stage');card.append(node('span','',x[0]),node('b','',x[1]),node('p','',x[2]));system.append(card);});
  p.append(system);
  const standards=node('section','b2-standards');standards.append(node('h3','','Chuẩn hoàn thành B2 cho từng chủ đề'));const ul=node('ul');['Từ vựng: hiểu và dùng được cụm trong câu mới, không chỉ chọn nghĩa.','Reading: trả lời được main idea, detail, inference và paraphrase.','Listening: nghe được ý chính, thái độ và ghi chú thông tin quan trọng.','Writing: viết đoạn/essay có luận điểm, ví dụ, linking words và kết luận.','Speaking: nói 2–3 phút, trả lời follow-up và sửa câu khi bí ý.'].forEach(t=>ul.append(node('li','',t)));standards.append(ul);p.append(standards);
  const flow=node('section','v2-flow');[
   ['1','Nhận diện','Nhìn nghĩa, ảnh và nghe câu mẫu.'],
   ['2','Tự nhớ lại','Che đáp án, nói hoặc viết lại cụm.'],
   ['3','Dùng trong câu','Đổi thông tin để thành câu của bạn.'],
   ['4','Ôn theo lỗi','Sai ở đâu, hệ thống đẩy vào Adaptive Review.']
  ].forEach(x=>{const card=node('article','v2-step');card.append(node('span','',x[0]),node('b','',x[1]),node('p','',x[2]));flow.append(card);});p.append(flow);
  p.append(node('h3','v2-section-title','6 mục gợi ý học ngay trong chủ đề hiện tại'));p.append(vocabRows(focus));
  const detail=node('div','quality-grid');focus.slice(0,3).forEach(w=>{const q=quality(w),card=node('article','quality-card');card.append(node('p','eyebrow',q.cefr+' · '+q.register.toUpperCase()),node('h3','',w.word),node('p','',q.use));const ul=node('ul');q.collocations.forEach(c=>ul.append(node('li','',c)));card.append(node('b','','Cách dùng tự nhiên'),ul,node('b','','Pattern'),node('p','example',q.pattern),node('b','','Lỗi thường gặp'),node('p','',q.mistake));card.append(button('Luyện từ này',()=>{state.records[w.id]=engine.updateRecord(state.records[w.id],true);save();toast('Đã đưa vào lịch học V2');render();},'primary','check'));detail.append(card);});p.append(detail);
 }
 function renderPronunciation(){
  const p=panel(),focus=sample(5);
  p.append(v2Hero('PRONUNCIATION LAB','Luyện âm, trọng âm và nối âm rõ hơn','Tập nghe chậm → nghe tự nhiên → nhắc lại → tự đánh giá. Bản này dùng loa trình duyệt, không cần API ngoài.','volume'));
  p.append(metricGrid([['IPA','trọng âm & âm khó','violet'],['2 tốc độ','chậm và tự nhiên',''],['Checklist','tự kiểm phát âm','good']]));
  const grid=node('div','pron-grid');
  focus.forEach(w=>{const card=node('article','pron-card'),q=quality(w);card.append(node('span','pron-index',String(w.id).padStart(4,'0')),node('h3','',w.word),node('p','ipa',ipaText(w)),node('p','meaning',w.meaning));const actions=node('div','actions');actions.append(button('Nghe chậm',()=>{const old=document.getElementById('rate').value;document.getElementById('rate').value='0.75';speak(w);document.getElementById('rate').value=old;},'listen','volume'),button('Nghe câu',()=>speak(w,true),'','volume'));card.append(actions);const checklist=node('ul','micro-checklist');['Bắt đúng âm nhấn chính','Nói liền cụm, không đọc từng chữ','Dùng được trong câu mới'].forEach(t=>{const li=node('li');const cb=document.createElement('input');cb.type='checkbox';li.append(cb,node('span','',t));checklist.append(li);});card.append(node('p','pron-tip',pronunciationTip(w)),node('p','muted',q.mistake),checklist);grid.append(card);});p.append(grid);
 }
 function renderConversation(){
  const p=panel(),s=SCENES[selected],list=sample(5);
  p.append(v2Hero('AI CONVERSATION STUDIO','Luyện hội thoại theo tình huống thật','Khung luyện này mô phỏng buổi nói chuyện: có vai, câu hỏi gợi mở, checklist và phản hồi theo từ khóa. Khi kết nối API, phần này sẽ thành AI realtime.','message'));
  const studio=node('section','conversation-studio');const left=node('div','chat-brief');left.append(node('p','eyebrow','TÌNH HUỐNG'),node('h3','',GROUPS[selected]),node('p','',s.speak));const chips=node('div','phrase-chips');const seen=new Set();list.filter(w=>{const key=engine.norm(w.word).replace(/\bclearly\b/g,'').trim();if(seen.has(key))return false;seen.add(key);return true;}).forEach(w=>chips.append(button(w.word,()=>say(w.word),'chip','volume')));left.append(node('b','','Cụm nên dùng'),chips);const right=node('div','coach-box');right.append(node('p','eyebrow','AI COACH · PREVIEW'),node('h3','','Trả lời bằng tiếng Anh'));const ta=document.createElement('textarea');ta.placeholder='Ví dụ: Hello, my name is Linh. I live in Da Nang...';ta.rows=7;ta.setAttribute('aria-label','Nhập câu trả lời hội thoại');const fb=node('div','coach-feedback','Viết hoặc nói nháp câu trả lời, rồi bấm chấm nhanh.');right.append(ta);right.append(button('Chấm nhanh',()=>{const text=ta.value.toLowerCase(),used=list.filter(w=>text.includes(w.word.toLowerCase())).length,wordsCount=text.split(/\s+/).filter(Boolean).length;fb.textContent='Bạn dùng '+used+'/'+list.length+' cụm gợi ý và khoảng '+wordsCount+' từ. '+(used>=2&&wordsCount>=20?'Tốt. Tiếp theo hãy hỏi lại người đối thoại 1 câu.':'Hãy thêm ít nhất 2 cụm gợi ý và nói dài hơn một chút.');},'primary','target'));right.append(fb);studio.append(left,right);p.append(studio);
  const qs=node('div','coach-prompts');['Can you introduce yourself?','Can you ask me one follow-up question?','Can you say it again more naturally?'].forEach(q=>qs.append(button(q,()=>say(q),'','volume')));p.append(node('h3','v2-section-title','Câu hỏi luyện phản xạ'),qs);
 }
 function renderListening(){
  const p=panel(),focus=sample(6),target=focus[0];
  p.append(v2Hero('LISTENING & WRITING LAB','Nghe chính xác, viết lại và sửa lỗi','Bài luyện gồm nghe chép chính tả, viết câu mới và đọc hiểu câu ví dụ để tăng cả nghe–đọc–viết.','keyboard'));
  const lab=node('section','dictation-lab');lab.append(node('p','eyebrow','DICTATION'),node('h3','','Nghe và gõ lại từ/cụm'));lab.append(button('Phát âm thanh',()=>say(target.word),'listen','volume'));const input=document.createElement('input');input.placeholder='Gõ từ/cụm bạn nghe được...';input.autocomplete='off';input.spellcheck=false;const feedback=node('p','dictation-feedback','Chưa chấm.');lab.append(input,button('Kiểm tra',()=>{const ok=engine.norm(input.value)===engine.norm(target.word);feedback.textContent=ok?'Chính xác. Hãy viết thêm một câu mới với cụm này.':'Chưa đúng. Đáp án là “'+target.word+'” — nghe lại và thử nói theo.';state.records[target.id]=engine.updateRecord(state.records[target.id],ok);save();},'primary','check'),feedback);const writing=document.createElement('textarea');writing.rows=5;writing.placeholder='Viết 1–2 câu mới dùng: '+target.word;lab.append(node('h3','','Viết câu mới'),writing,button('Lưu luyện viết',()=>{state.records[target.id]=engine.updateRecord(state.records[target.id],true);save();toast('Đã lưu lượt luyện viết');},'','check'));p.append(lab);p.append(node('h3','v2-section-title','Câu đọc hiểu nhanh'),vocabRows(focus.slice(1)));
 }
 function renderGame(){
  const p=panel(),focus=sample(10);let idx=0,score=0;
  p.append(v2Hero('REFLEX GAME','Game luyện phản xạ 60 giây','Nhìn nghĩa tiếng Việt, chọn nhanh cụm tiếng Anh đúng. Sai sẽ được đưa vào lịch ôn cá nhân.','zap'));
  const game=node('section','reflex-game');const prompt=node('h3',''),scoreEl=node('p','game-score','0 đúng'),timer=node('div','game-timer');const bar=node('i'),timeText=node('b','','60s');timer.append(bar,timeText);const opts=node('div','options');let left=60,ended=false;const tick=setInterval(()=>{if(!document.body.contains(game)){clearInterval(tick);return;}left=Math.max(0,left-1);bar.style.width=left/60*100+'%';timeText.textContent=left+'s';if(left===0){ended=true;clearInterval(tick);opts.querySelectorAll('button').forEach(b=>b.disabled=true);scoreEl.textContent='Hết giờ · '+score+' câu đúng';}},1000);function draw(){if(ended)return;const w=focus[idx%focus.length];prompt.textContent='“'+w.meaning+'” nói thế nào?';opts.replaceChildren();engine.shuffle([w,...engine.shuffle(words().filter(x=>x.id!==w.id)).slice(0,3)]).forEach(o=>opts.append(button(o.word,()=>{if(ended)return;const ok=o.id===w.id;score+=Number(ok);state.records[w.id]=engine.updateRecord(state.records[w.id],ok);save();scoreEl.textContent=score+' đúng · '+(ok?'chính xác':'đã đưa vào ôn tập');idx++;draw();},o.id===w.id?'':'','target')));}
  game.append(timer,scoreEl,prompt,opts);p.append(game);draw();
 }
 function renderFinal(){
  const p=panel(),learned=words().filter(w=>state.records[w.id]?.seen>0).length;
  p.append(v2Hero('FINAL TEST 4 KỸ NĂNG','Kiểm tra nghe, nói, đọc, viết trong một flow','Phần trắc nghiệm được chấm tự động. Phần nói/viết dùng checklist rõ ràng để bạn biết cần luyện gì tiếp.','check'));
  p.append(metricGrid([[learned+'/'+topicTotal(selected),'từ đã luyện','good'],['≥80%','mốc đạt nghe + từ vựng',''],['Nói + Viết','checklist bắt buộc','violet']]));
  const grid=node('div','practice-mode-grid');
  grid.append(practiceCard('volume','1 · Listening','Nghe từ/cụm và chọn nghĩa. Tập nhận ra âm khi không nhìn chữ.','5 câu nghe','Làm phần nghe',()=>startSession('test',null,'listen')),practiceCard('keyboard','2 · Reading & Writing','Đọc câu, điền từ và chọn cụm phù hợp với nghĩa tiếng Việt.','10+ câu','Làm test tự động',()=>startSession('test')),practiceCard('message','3 · Speaking task','Nói 60–90 giây theo chủ đề, dùng ít nhất 3 cụm đã học.','tự kiểm rõ ràng','Mở checklist',()=>openInfoModal('Speaking checklist',[SCENES[selected].speak,[{title:'Fluency',text:'Nói liên tục, ít dừng quá lâu.'},{title:'Vocabulary',text:'Dùng ít nhất 3 cụm trong chủ đề.'},{title:'Repair',text:'Biết hỏi lại hoặc tự sửa câu.'}]],{kicker:'4-SKILL TEST',icon:'info',tone:'success'})));
  p.append(grid);renderHistory(p);
 }
 function renderAdaptive(){
  const p=panel(),list=words(),due=engine.reviewQueue(state.records,selected),mistakes=list.filter(w=>state.records[w.id]?.lastCorrect===false),weak=state.history.filter(h=>h.group===selected).slice(-8);
  p.append(v2Hero('ADAPTIVE REVIEW','Ôn theo lỗi cá nhân thay vì ôn dàn trải','Từ sai, từ đến hạn và kỹ năng yếu được ưu tiên trước. Đây là phần bảo vệ tiến độ lâu dài của V2.','rotate'));
  p.append(metricGrid([[mistakes.length,'từ đang yếu','bad'],[due.length,'đến hạn ôn',''],[weak.length,'bài gần đây','violet']]));
  const grid=node('div','practice-mode-grid');const fallback=engine.shuffle(list.filter(w=>state.records[w.id]).map(w=>w.id)).slice(0,10);
  grid.append(practiceCard('target','Sửa lỗi nhớ từ','Ưu tiên những từ/cụm bạn vừa sai.',Math.min(10,mistakes.length)+' câu','Sửa ngay',()=>startSession('review',mistakes.map(w=>w.id).slice(0,10),'recall'),!mistakes.length),practiceCard('volume','Sửa lỗi nghe','Nghe lại từ đến hạn và từ yếu.',Math.min(10,(due.length?due:fallback).length)+' câu','Luyện nghe',()=>startSession('review',(due.length?due:fallback).slice(0,10),'listen'),!(due.length||fallback.length)),practiceCard('keyboard','Ôn hỗn hợp','Trộn nghe, nghĩa, viết, hình ảnh để kiểm tra nhớ thật.',Math.min(10,(due.length?due:fallback).length)+' câu','Ôn tổng hợp',()=>startSession('review',(due.length?due:fallback).slice(0,10),'mix'),!(due.length||fallback.length)));p.append(grid);
  const history=node('div','weak-history');weak.forEach(h=>{const item=node('article');item.append(node('b','',h.percent+'%'),node('span','',({quiz:'Quiz',test:'Test',review:'Ôn tập'}[h.mode])+' · '+new Date(h.at).toLocaleDateString('vi-VN')));history.append(item);});if(weak.length)p.append(node('h3','v2-section-title','Dữ liệu dùng để gợi ý ôn'),history);
 }
 function meta(mode){
  return {
   engine:{title:'B2 Learning System',kicker:'V3 · ROADMAP TO B2',lead:'Toàn bộ kho học đã nâng lên 3.000 từ/cụm, chia theo 20 chủ đề và gắn với luyện B2 đủ 4 kỹ năng.'},
   b2:{title:'B2 Exam Prep',kicker:'V3.1 · LUYỆN THI B2',lead:'Tập trung 4 kỹ năng, từ vựng học thuật vừa đủ, writing/speaking theo tiêu chí thi.'},
   pronunciation:{title:'Pronunciation Lab',kicker:'V2.1 · LUYỆN PHÁT ÂM',lead:'Nghe chậm, nghe tự nhiên, bắt trọng âm và tự kiểm khả năng nói rõ.'},
   conversation:{title:'AI Conversation Studio',kicker:'V2.1 · HỘI THOẠI THEO TÌNH HUỐNG',lead:'Luyện trả lời, hỏi lại và dùng cụm đã học trong cuộc trò chuyện thực tế.'},
   listening:{title:'Listening & Writing Lab',kicker:'V2.1 · NGHE VÀ VIẾT',lead:'Nghe chép chính tả, viết câu mới và củng cố đọc hiểu song ngữ.'},
   game:{title:'Game luyện phản xạ',kicker:'V2.1 · PHẢN XẠ NHANH',lead:'Chọn nhanh cụm đúng theo nghĩa tiếng Việt, sai sẽ chuyển vào lịch ôn.'},
   test:{title:'Final Test bốn kỹ năng',kicker:'V2.1 · KIỂM TRA TỔNG HỢP',lead:'Kết hợp nghe, đọc, viết và checklist nói để đo mức dùng được thật.'},
   review:{title:'Adaptive Review theo lỗi cá nhân',kicker:'V2.1 · ÔN ĐÚNG ĐIỂM YẾU',lead:'Ưu tiên từ sai, từ đến hạn và kỹ năng yếu từ lịch sử học của bạn.'}
  }[mode]||null;
 }
 function render(mode){
  if(!modes.has(mode))return false;
  if(mode==='b2')return renderB2Prep(),true;
  if(mode==='review')return renderAdaptive(),true;
  if(mode==='test')return renderFinal(),true;
  if(mode==='engine')return renderEngine(),true;
  if(mode==='pronunciation')return renderPronunciation(),true;
  if(mode==='conversation')return renderConversation(),true;
  if(mode==='listening')return renderListening(),true;
  if(mode==='game')return renderGame(),true;
  return false;
 }
 return {render,quality,meta};
})();
