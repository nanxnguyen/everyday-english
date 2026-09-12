'use strict';
function createLearningEngine(words,scenes,rng=Math.random){
 const byId=new Map(words.map(w=>[w.id,w]));
 const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/[.!?,;:]/g,'').replace(/\s+/g,' ').trim();
 const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 function blank(w){const escaped=w.word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const re=new RegExp('(^|[^a-zA-Z])('+escaped+')(?=[^a-zA-Z]|$)','i');return re.test(w.example)?w.example.replace(re,'$1______'):null;}
 function distractors(w){return shuffle([...words.filter(x=>x.group===w.group&&x.id!==w.id),...words.filter(x=>x.group!==w.group)]);}
 function choices(w,field='meaning'){const used=new Set([norm(w[field])]),chosen=[{value:String(w.id),label:w[field]}];for(const x of distractors(w)){if(used.has(norm(x[field])))continue;used.add(norm(x[field]));chosen.push({value:String(x.id),label:x[field]});if(chosen.length===4)break;}return shuffle(chosen);}
 function wordQuestion(w,type){
  if(type==='cloze')return {type,wordId:w.id,group:w.group,prompt:blank(w),hint:w.meaning+' · '+w.word.split(/\s+/).length+' từ · bắt đầu bằng '+w.word[0].toUpperCase(),options:null,correct:w.word};
  if(type==='listen')return {type,wordId:w.id,group:w.group,prompt:'Nghe từ/cụm, rồi chọn nghĩa phù hợp.',options:choices(w),correct:String(w.id)};
  if(type==='reverse')return {type,wordId:w.id,group:w.group,prompt:'Chọn cách nói tiếng Anh phù hợp với “'+w.meaning+'”.',options:choices(w,'word'),correct:String(w.id)};
  if(type==='image-word')return {type,wordId:w.id,group:w.group,prompt:'Hình ảnh này phù hợp nhất với từ/cụm nào?',options:choices(w,'word'),correct:String(w.id)};
  if(type==='truefalse'){const isTrue=rng()>=.5,wrong=distractors(w).find(x=>norm(x.meaning)!==norm(w.meaning));return {type,wordId:w.id,group:w.group,prompt:'“'+w.word+'” có nghĩa là “'+(isTrue?w.meaning:wrong.meaning)+'”.',options:[{value:'true',label:'Đúng'},{value:'false',label:'Sai'}],correct:isTrue?'true':'false'};}
  return {type:'meaning',wordId:w.id,group:w.group,prompt:'Trong câu ví dụ, “'+w.word+'” có nghĩa là gì?',options:choices(w),correct:String(w.id)};
 }
 function visualQuestion(group){return {type:'image',group,prompt:'Chọn câu tiếng Anh mô tả đúng bức tranh.',options:shuffle([group,...shuffle(scenes.map((_,i)=>i).filter(i=>i!==group)).slice(0,3)]).map(i=>({value:String(i),label:scenes[i].caption})),correct:String(group)};}
 function situationQuestion(group){const s=scenes[group];return {type:'situation',group,prompt:s.prompt,options:shuffle(s.choices).map(x=>({value:x,label:x})),correct:s.answer};}
 function makeSet(group,mode,ids,focus='mix'){
  if(mode==='review'){const types=focus==='listen'?['listen']:focus==='recall'?['reverse','cloze']:['meaning','listen','reverse','cloze','image-word'];return ids.map((id,i)=>{const w=byId.get(id);let type=types[i%types.length];if(type==='cloze'&&!blank(w))type='reverse';return wordQuestion(w,type);});}
  const scene=scenes[group];const excluded=new Set([...scene.keys,scene.answer]);const pool=shuffle(words.filter(w=>w.group===group&&!excluded.has(w.word)));const used=new Set();const result=[];
  const quizCounts=focus==='listen'?{meaning:1,reverse:1,cloze:1,listen:5,truefalse:1,'image-word':1}:focus==='recall'?{meaning:1,reverse:3,cloze:3,listen:1,truefalse:1,'image-word':1}:{meaning:2,reverse:2,cloze:2,listen:2,truefalse:1,'image-word':1};
  const counts=mode==='test'?{meaning:3,reverse:3,cloze:4,listen:5,truefalse:2,'image-word':1}:quizCounts;
  for(const [type,count] of Object.entries(counts)){const candidates=pool.filter(w=>!used.has(w.id)&&(type!=='cloze'||blank(w)));if(candidates.length<count)throw Error('Insufficient questions for group '+group);for(const w of candidates.slice(0,count)){used.add(w.id);result.push(wordQuestion(w,type));}}
  return shuffle([...result,visualQuestion(group),situationQuestion(group)]);
 }
 function grade(q,value,skipped=false){return !skipped&&(q.type==='cloze'?norm(value)===norm(q.correct):String(value)===String(q.correct));}
 function summary(questions,answers){const categories={};let total=0;questions.forEach((q,i)=>{const ok=!!answers[i]?.correct;total+=Number(ok);const key=q.type==='listen'?'listening':q.type==='situation'?'context':['image','image-word'].includes(q.type)?'visual':'vocabulary';const c=categories[key]??={correct:0,total:0};c.total++;c.correct+=Number(ok);});const ratio=questions.length?total/questions.length:0;return {correct:total,total:questions.length,percent:Math.round(ratio*100),categories,passed:ratio>=.8&&!!categories.listening&&categories.listening.correct/categories.listening.total>=.8&&categories.vocabulary.correct/categories.vocabulary.total>=.8};}
 function updateRecord(old,correct,now=Date.now()){
  const r={seen:0,streak:0,lapses:0,last:0,due:0,lastCorrect:null,...old};r.seen++;r.last=now;r.lastCorrect=correct;
  if(!correct){r.streak=0;r.lapses++;r.due=now;}else{const sameDay=old?.lastCorrect&&new Date(old.last).toDateString()===new Date(now).toDateString();r.streak=Math.min(5,(old?.streak||0)+(sameDay?0:1));const days=[1,3,7,14,28][Math.max(0,r.streak-1)];r.due=sameDay?Math.max(old.due,now):now+days*86400000;}
  return r;
 }
 function reviewQueue(records,group,now=Date.now()){return words.filter(w=>w.group===group&&records[w.id]&&records[w.id].due<=now).sort((a,b)=>Number(records[b.id].lastCorrect===false)-Number(records[a.id].lastCorrect===false)||records[a.id].due-records[b.id].due).map(w=>w.id);}
 function validateState(raw){const state={records:{},history:[],visual:{},skills:{},completions:{},meta:{schemaVersion:1,updatedAt:0}};if(!raw||typeof raw!=='object')return state;for(const [group,r] of Object.entries(raw.visual||{})){if(Number.isInteger(Number(group))&&Number(group)>=0&&Number(group)<20&&r&&typeof r==='object')state.visual[group]={image:r.image===true,situation:r.situation===true};}for(const [group,r] of Object.entries(raw.skills||{})){if(Number.isInteger(Number(group))&&Number(group)>=0&&Number(group)<20&&r&&typeof r==='object')state.skills[group]={imagePassed:r.imagePassed===true,situationPassed:r.situationPassed===true};}for(const [group,at] of Object.entries(raw.completions||{})){if(Number.isInteger(Number(group))&&Number(group)>=0&&Number(group)<20&&Number.isFinite(at)&&at>0)state.completions[group]=at;}for(const [id,r] of Object.entries(raw.records||{})){if(!byId.has(Number(id))||!r||typeof r!=='object')continue;if(['seen','streak','lapses','last','due'].every(k=>Number.isFinite(r[k])&&r[k]>=0)&&(r.lastCorrect===true||r.lastCorrect===false||r.lastCorrect===null)){state.records[id]={seen:Math.floor(r.seen),streak:Math.min(5,Math.floor(r.streak)),lapses:Math.floor(r.lapses),last:r.last,due:r.due,lastCorrect:r.lastCorrect};}}
 state.history=(Array.isArray(raw.history)?raw.history:[]).filter(h=>h&&Number.isInteger(h.group)&&h.group>=0&&h.group<20&&['quiz','test','review'].includes(h.mode)&&Number.isFinite(h.at)&&Number.isFinite(h.percent)&&h.percent>=0&&h.percent<=100&&typeof h.passed==='boolean').slice(-500);if(Number.isFinite(raw.meta?.schemaVersion)&&raw.meta.schemaVersion>0)state.meta.schemaVersion=Math.floor(raw.meta.schemaVersion);if(Number.isFinite(raw.meta?.updatedAt)&&raw.meta.updatedAt>0)state.meta.updatedAt=raw.meta.updatedAt;return state;}
 return {byId,norm,shuffle,blank,makeSet,grade,summary,updateRecord,reviewQueue,validateState,visualQuestion,situationQuestion};
}
if(typeof module!=='undefined')module.exports={createLearningEngine};
