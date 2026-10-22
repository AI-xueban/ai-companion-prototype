/* Mobile tutoring surface; shared state machine lives in services/homeworkTutor.ts. */
window.homeworkTutorUI = (() => {
  let session=null, plan=[], context=null, timer=null, generation=0, spoken=null, recognition=null, editor=false, status='', previousScroll=0;
  let render=()=>{}, valid=()=>false, leave=()=>{}, typing=false, idleEpoch=-1, sheetKind='';
  const api=()=>window.homeworkTutor;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const active=()=>session&&context&&valid()&&api().tutorFingerprint(context.source)===session.fingerprint;
  function cancel(){generation++;clearTimeout(timer);timer=null;if(spoken&&window.speechSynthesis){window.speechSynthesis.cancel();spoken=null;}if(recognition){const old=recognition;recognition=null;old.onresult=null;old.onend=null;old.onerror=null;try{old.abort();}catch{}}}
  function persist(){if(!session)return;try{let all=JSON.parse(localStorage.getItem(api().TUTOR_STORAGE_KEY)||'{}');if(!all||Array.isArray(all)||typeof all!=='object')all={};all[session.key]=session;const keys=Object.keys(all).sort((a,b)=>(all[b].updatedAt||0)-(all[a].updatedAt||0));keys.slice(30).forEach(k=>delete all[k]);localStorage.setItem(api().TUTOR_STORAGE_KEY,JSON.stringify(all));status='';}catch{status='进度保存失败，本次位置可能无法保留。请稍后重试。';}}
  function change(event,refresh=true){if(!session)return;cancel();if(!active()){session=null;editor=false;typing=false;leave();return;}session=api().tutorReduce(session,plan,event);if(['waiting','choice','transfer'].includes(session.phase))sheetKind='answer';else if(session.phase==='done'||session.phase==='playing')sheetKind='';persist();if(refresh)render();schedule();}
  function schedule(){if(!active()||editor||typing)return;if(sheetKind&&['feedback','remedial','aside'].includes(session.phase))return;if(session.phase==='waiting'&&!session.draft&&idleEpoch!==session.epoch){const token=generation;timer=setTimeout(()=>{if(token!==generation||!active())return;idleEpoch=session.epoch;status='可以写下想法、给点提示，或先继续讲。';render();},30000);return;}if(!['playing','feedback','remedial'].includes(session.phase))return;
    const token=generation,epoch=session.epoch,text=api().tutorText(session,plan);
    const complete=()=>{if(token!==generation||!active())return;change({type:'tick',epoch});};
    if(!session.silent&&window.speechSynthesis&&window.SpeechSynthesisUtterance){
      spoken=new window.SpeechSynthesisUtterance(text);spoken.lang='zh-CN';spoken.rate=.9;
      spoken.onend=complete;spoken.onerror=()=>{if(token!==generation)return;cancel();session=api().tutorReduce(session,plan,{type:'pause'});session.silent=true;status='语音播放未成功，已暂停。可继续无声阅读。';persist();render();};
      window.speechSynthesis.speak(spoken);
    }else timer=setTimeout(complete,api().tutorDelay(text));
  }
  const btn=(label,method,cls='')=>`<button class="ht-button ${cls}" onclick="homeworkTutorUI.${method}">${label}</button>`;
  function html(){if(!session)return '';const a=api().tutorCurrent(session,plan),s=session;
    const transfer=s.phase==='transfer'||s.phase==='paused'&&s.returnPhase==='transfer',quiz=transfer?api().tutorTransfer(plan):null,question=quiz?.prompt||a?.prompt,options=quiz?.options||a?.options;
    const waiting=transfer||s.phase==='waiting'||s.phase==='paused'&&s.returnPhase==='waiting',canAnswer=waiting||s.phase==='choice',live=['playing','feedback','remedial'].includes(s.phase);
    const showSheet=!!sheetKind&&s.phase!=='done'&&s.phase!=='unsupported';
    const composer=editor?'<textarea id="ht-draft" aria-label="'+(canAnswer&&sheetKind!=='ask'?'我的回答':'问一下当前步骤')+'" maxlength="500" rows="1" placeholder="'+(canAnswer&&sheetKind!=='ask'?'输入你的回答':'说说你的想法')+'" onfocus="homeworkTutorUI.focusInput()" onblur="homeworkTutorUI.blurInput()" oninput="homeworkTutorUI.draft(this.value)">'+esc(s.draft)+'</textarea>'+btn('发送',canAnswer&&sheetKind!=='ask'?'submit()':'ask()','ht-send')+'<button class="ht-button ht-mode" aria-label="切换语音输入" onclick="homeworkTutorUI.cancelInput()">🎙</button>':'<button class="ht-voice" type="button" onpointerdown="homeworkTutorUI.voiceStart(event)" onpointerup="homeworkTutorUI.voiceEnd(event)" onpointercancel="homeworkTutorUI.voiceEnd(event)" oncontextmenu="event.preventDefault()" aria-label="按住说话"><span>♩</span> '+(canAnswer&&sheetKind!=='ask'?'说说你的答案':'有疑问，随时问我')+'</button><button class="ht-button ht-mode" aria-label="切换文字输入" onclick="homeworkTutorUI.edit()">⌨</button>';
    let content='';
    if(s.phase==='unsupported')content='<div class="ht-empty"><b>本题讲解暂未配置</b><p>'+esc(api().tutorText(s,plan))+'</p>'+btn('返回原题','close()','primary')+'</div>';
    else if(s.phase==='done')content='<section class="ht-summary"><span class="ht-pill">本次结束</span><h2>这道题，我们讲到这里</h2><p>讲解完成与理解验证分别记录；原作业判分保持不变。</p>'+api().tutorSummary(s,plan).map(e=>'<div class="ht-evidence"><span>'+esc(e.title)+'</span><b>'+esc(e.status)+'</b></div>').join('')+'<small>家长陪同操作 · 不自动作为孩子长期掌握证据</small>'+(s.transferStatus?'<p>'+esc(s.transferStatus)+'</p>':'')+btn('返回原题','close()','primary')+btn('试一个同类小判断','transfer()')+btn('从头再讲','restart()')+'</section>';
    else content=`<div class="ht-lesson"><div class="ht-progress" aria-label="讲题进度">${['理解题意','分步推导','方法归纳'].map((label,i)=>'<span class="'+(i===(s.cursor===0?0:s.cursor===plan.length-1?2:1)?'active':'')+'"><i></i>'+label+'</span>').join('')}</div>
      <section class="ht-board" aria-label="讲题板书"><div class="ht-board-meta"><span>${esc(a.tag)}</span><small>第 ${s.cursor+1} / ${plan.length} 步</small></div><h2><span class="ht-step-number">${s.cursor+1}</span>${esc(a.title)}</h2>${a.board.lines.map(t=>'<p>'+esc(t)+'</p>').join('')}${a.board.columns?'<div class="ht-grid" role="img" aria-label="'+esc(a.board.caption)+'">'+api().tutorCells(a.board).map(cell=>'<i class="'+cell.color+'" style="width:'+100/a.board.columns+'%;height:'+140/a.board.rows+'px"></i>').join('')+'</div><small>'+esc(a.board.caption)+'</small>':''}</section>
      <div class="ht-dock"><section class="ht-caption" aria-live="polite"><div class="ht-caption-label"><i></i>${s.phase==='paused'?'已暂停':s.phase==='resume'?'继续上次讲解':waiting?'轮到你了':'小晤讲解'}</div><p>${esc(api().tutorText(s,plan))}</p></section>
      <div class="ht-main-actions">${s.phase==='resume'?btn('继续上次','resume()','primary')+btn('从头讲','restart()'):waiting||s.phase==='choice'||['feedback','remedial','aside'].includes(s.phase)?btn('继续互动','reopenSheet()','primary'):live?btn('暂停','pause()','ht-play')+btn('下一段','next()','ht-text-button'):btn('继续播放','resume()','ht-play')}${s.phase!=='resume'?btn('这一步没懂','openHelp()','ht-help'):''}</div>
      <button class="ht-ask-entry" onclick="homeworkTutorUI.openAsk()"><span aria-hidden="true">♩</span><span>有疑问，随时问我</span><span aria-hidden="true">⌨</span></button></div></div>`;
    const sheet=showSheet?`<div class="ht-sheet-scrim" onclick="homeworkTutorUI.closeSheet()"></div><section class="ht-sheet" role="dialog" aria-modal="true" aria-label="讲题互动"><div class="ht-sheet-handle"></div><header><div><small>${sheetKind==='help'?'卡点补讲':sheetKind==='ask'?'向小晤提问':'边讲边练'}</small><h3>${waiting?'轮到你了':s.phase==='choice'?'换个方式继续':s.phase==='feedback'?'回答反馈':s.phase==='remedial'?'再拆开讲一步':s.phase==='aside'?'这个问题这样看':'说说你的想法'}</h3></div><button class="ht-sheet-close" aria-label="收起互动" onclick="homeworkTutorUI.closeSheet()">×</button></header><div class="ht-sheet-content">${question&&canAnswer?'<p class="ht-sheet-question">'+esc(question)+'</p>':'<p class="ht-sheet-explain">'+esc(api().tutorText(s,plan))+'</p>'}${s.feedback&&s.feedback!==api().tutorText(s,plan)?'<p class="ht-sheet-feedback" role="status">'+esc(s.feedback)+'</p>':''}${canAnswer&&options?'<div class="ht-options">'+options.map(option=>'<button onclick="homeworkTutorUI.answer('+esc(JSON.stringify(option))+')">'+esc(option)+'</button>').join('')+'</div>':''}${s.phase==='choice'?'<div class="ht-sheet-actions">'+btn('换个方式看','explain()')+btn('先继续讲','skip()','primary')+'</div>':''}${s.phase==='aside'?'<div class="ht-sheet-actions">'+btn(s.asideReturn==='paused'?'返回暂停位置':'回到讲题','back()','primary')+'</div>':''}${s.phase==='feedback'||s.phase==='remedial'?'<div class="ht-sheet-actions">'+btn(s.phase==='remedial'?'再试一次':'继续讲解','continueSheet()','primary')+'</div>':''}${waiting?'<div class="ht-sheet-actions">'+btn('给点提示','hint()')+btn('先继续讲','skip()')+'</div>':''}${sheetKind==='ask'||canAnswer?'<div class="ht-composer">'+composer+'</div>':''}${status?'<p class="ht-feedback" role="status">'+esc(status)+'</p>':''}</div></section>`:'';
    return '<div class="ht-root"><div class="ht-source"><b>'+esc(context.label)+'</b><button onclick="homeworkTutorUI.original()">查看原题</button><p>'+esc(context.source.question.stem)+'</p></div>'+content+(s.phase!=='done'&&s.phase!=='unsupported'?'<div class="ht-settings">'+btn(s.silent?'开启语音':'关闭语音','sound()')+btn(s.direct?'边讲边练':'直接讲解','direct()')+'</div>':'')+sheet+(s.originalOpen?'<div class="ht-modal" role="dialog" aria-modal="true" aria-label="查看原题"><div><header><b>作业原题</b>'+btn('返回讲题','closeOriginal()')+'</header><p>'+esc(context.source.question.stem)+'</p>'+context.images.map(src=>'<img src="'+esc(src)+'" alt="当前题目关联作业原图">').join('')+'</div></div>':'')+'</div>';
  }
  const ui={
    open(c,callbacks){cancel();context=c;render=callbacks.render;valid=callbacks.valid;leave=callbacks.leave;previousScroll=document.querySelector('.parent-main')?.scrollTop||0;let old;try{old=JSON.parse(localStorage.getItem(api().TUTOR_STORAGE_KEY)||'{}')[api().tutorKey(c.source)];}catch{}session=api().createTutor(c.source,old);plan=api().tutorPlan(c.source.question);editor=false;typing=false;sheetKind=['waiting','choice','transfer'].includes(session.phase)?'answer':'';idleEpoch=-1;persist();render();schedule();},
    html,active:()=>!!session,
    pause(){change({type:'pause'});},next(){change({type:'tick'});},transfer(){editor=false;typing=false;change({type:'transfer'});},resume(){editor=false;sheetKind='';change({type:'resume'});},restart(){editor=false;sheetKind='';change({type:'restart'});},skip(){editor=false;if(session?.phase==='choice')session.phase='waiting';change({type:'skip'});},hint(){editor=false;sheetKind='help';change({type:'hint'});},back(){editor=false;sheetKind='';change({type:'back'});},
    openAsk(){if(!session)return;if(session.phase==='playing')change({type:'pause',input:true},false);sheetKind='ask';editor=false;render();},
    openHelp(){if(!session)return;sheetKind='help';ui.hint();},
    reopenSheet(){if(!session)return;sheetKind=['waiting','choice','transfer'].includes(session.phase)?'answer':session.phase==='aside'?'help':'answer';render();},
    closeSheet(){sheetKind='';editor=false;typing=false;render();schedule();},
    continueSheet(){if(!session)return;change({type:'tick'});},
    explain(){if(!session)return;session.phase='waiting';change({type:'ask',text:'这一步怎么理解'});},
    direct(){editor=false;change({type:'direct'});},parent(){editor=false;change({type:'parent'});},
    draft(text){if(!session)return;cancel();session=api().tutorReduce(session,plan,{type:'draft',text});persist();},
    focusInput(){typing=true;cancel();if(!session||session.phase!=='playing')return;change({type:'pause',input:true},false);},blurInput(){typing=false;schedule();},
    edit(){if(!session)return;if(session.phase==='playing')change({type:'pause',input:true},false);if(!sheetKind)sheetKind='ask';editor=true;render();document.getElementById('ht-draft')?.focus();},
    cancelInput(){editor=false;typing=false;render();schedule();},
    answer(text){if(session?.phase==='choice')session.phase='waiting';editor=false;typing=false;change({type:'answer',text});},
    submit(){ui.answer(session?.draft||'');},ask(){editor=false;change({type:'ask',text:session?.draft||''});},
    sound(){if(!session)return;cancel();session.silent=!session.silent;if(!session.silent&&(!window.speechSynthesis||!window.SpeechSynthesisUtterance)){session.silent=true;status='当前环境无可用语音，继续无声阅读。';}persist();render();schedule();},
    voice(){ui.voiceStart();},
    voiceStart(event){
      if(!session||recognition)return;
      event?.preventDefault();event?.currentTarget?.setPointerCapture?.(event.pointerId);
      const VoiceRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!VoiceRecognition){change({type:'pause',input:true},false);status='当前浏览器不支持语音识别，已切换文字输入。';editor=true;render();return;}
      change({type:'pause',input:true},false);
      const token=generation,request=new VoiceRecognition();recognition=request;request.lang='zh-CN';request.interimResults=false;request.continuous=false;
      let heard='';request.onresult=e=>{heard=Array.from(e.results).map(r=>r[0]?.transcript||'').join('').trim();};
      request.onerror=e=>{if(recognition!==request||token!==generation)return;recognition=null;status=e.error==='not-allowed'?'麦克风未获授权，请改用文字输入。':'语音识别未成功，请改用文字输入。';editor=true;render();};
      request.onend=()=>{if(recognition!==request||token!==generation)return;recognition=null;editor=true;status=heard?'语音已转成文字，请核对后发送。':'没有识别到内容，可以重试或打字。';if(heard){session=api().tutorReduce(session,plan,{type:'draft',text:heard});persist();}render();};
      try{request.start();}catch{recognition=null;editor=true;status='语音识别未启动，请改用文字输入。';render();}
    },
    voiceEnd(event){event?.preventDefault();if(recognition){try{recognition.stop();}catch{}}},
    original(){change({type:'original'});},closeOriginal(){change({type:'closeOriginal'});},
    close(){cancel();if(session){session=api().tutorReduce(session,plan,{type:'pause'});persist();}session=null;editor=false;typing=false;sheetKind='';leave();const panel=document.querySelector('.parent-main');if(panel)panel.scrollTop=previousScroll;},
    suspend(){if(session){cancel();session=api().tutorReduce(session,plan,{type:'pause'});persist();if(document.querySelector('.ht-root'))render();}},
    inspect(){return session?JSON.parse(JSON.stringify(session)):null;}
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden)ui.suspend();});
  window.addEventListener('pagehide',()=>{cancel();if(session){session=api().tutorReduce(session,plan,{type:'pause'});persist();}});
  new MutationObserver(()=>{if(session&&!document.querySelector('.ht-root')){cancel();session=api().tutorReduce(session,plan,{type:'pause'});persist();}}).observe(document.body,{childList:true,subtree:true});
  return ui;
})();
