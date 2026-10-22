import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

// Real-browser regressions: entry reachability, reversible state previews and legacy flow tools.
const root=new URL('./',import.meta.url);
const base=process.env.DEMO_BASE_URL||root.href;
const output=process.env.DEMO_REPORT_DIR||resolve(fileURLToPath(root),'../../../output/demo-workspace');
mkdirSync(output,{recursive:true});
// Captured from the pre-migration console, not derived from the new navigation.
const baseline={parentScenarios:['first','returning','twoChildren','otherDevice','second','seventh','familyManage','ordinary','wrong','lostWechat','lostPhone','bothLost'],teacherFlows:['first','returning','otherDevice','expired','replace'],availability:['noClasses','noStudents','deleted','normal'],homeworkScenarios:['published','partial','queued','processing','partialGrade','failed','review','unreleased','partialRelease','released','resubmit','changed','late','closed']};
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1536,height:1080}});
const errors=[],results=[];
page.on('pageerror',error=>errors.push(error.message));
const url=(name='index.html',search='?review=1')=>new URL(name+search,base).href;
async function open(name='index.html',search='?review=1'){await page.goto(url(name,search));await page.waitForFunction(()=>window.demoWorkspace?.enabled);}
async function choose(id){await page.evaluate(id=>demoWorkspace.select(id),id);await page.waitForTimeout(15);}
async function externalState(){assert.equal(await page.locator('#app .parent-demo-toolbar,#app .parent-exception-mask,#app #page-demo-tools-host').count(),0,'Demo controls must stay outside the product canvas');if(await page.locator('#dw-state').isVisible()){const canvas=await page.locator('.device').boundingBox(),dock=await page.locator('#dw-state').boundingBox();assert.ok(dock.y>=canvas.y+canvas.height,'The state toolbar is below the complete product canvas');}}
try{
  await open();
  const entries=await page.evaluate(()=>demoWorkspace.entries);
  for(const scenario of baseline.parentScenarios)assert.ok(entries.some(e=>e.kind==='parent'&&e.value===scenario),'Missing parent scenario '+scenario);
  for(const flow of baseline.teacherFlows)assert.ok(entries.some(e=>e.kind==='teacher'&&e.value===flow),'Missing teacher flow '+flow);
  for(const state of baseline.availability)assert.equal(await page.locator('[data-availability="'+state+'"]').count(),1);
  for(const e of entries.filter(e=>!['control','controlModule','reference'].includes(e.kind))){await choose(e.id);assert.ok((await page.locator('#app .screen').count())>0,e.id);await externalState();results.push({entry:e.id,title:await page.locator('#app .wx-title').textContent()});}
  // Actual directory clicks, independent role groups and search results.
  await page.locator('[data-dw-group="login"]>summary').click();
  await page.locator('[data-dw-group="login"]>summary').click();
  await page.locator('[data-dw-entry="p-first"]').click();
  await page.locator('#dw-state-toggle').click();
  assert.equal(await page.locator('#dw-state-toggle').getAttribute('aria-expanded'),'true');
  await page.getByRole('button',{name:'微信登录失败',exact:false}).click();
  assert.equal(await page.locator('#dw-state .parent-exception-sheet').isVisible(),true,'Picking an exception keeps the picker open');
  assert.ok((await page.locator('#dw-state-active').textContent()).includes('微信登录失败'));
  await page.locator('#dw-state-restore').click();
  assert.equal(await page.locator('#dw-state-active').textContent(),'正常');
  await page.locator('#dw-search').fill('家长提交');
  assert.equal(await page.locator('[data-dw-entry]:visible').count(),1);
  await page.locator('#dw-search').fill('');
  // Page-only learning previews cannot mutate persisted source data or leak into another role.
  for(const role of ['learn-parent','learn-subject']){
    await choose(role);
    const before=await page.locator('#app .lp-page').innerHTML();
    const storage=await page.evaluate(()=>JSON.stringify({...localStorage}));
    for(const state of ['loading','load-failed','empty','delayed','denied']){
      await page.evaluate(id=>pageDemoTools.select(id),state);
      assert.equal(await page.evaluate(()=>pageDemoTools.getContext().active),state);
      assert.equal(await page.locator('#app .dw-demo-result').count(),1);
      await externalState();
      await page.evaluate(()=>pageDemoTools.restore());
      assert.equal(await page.locator('#app .lp-page').innerHTML(),before);
    }
    assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),storage);
  }
  await page.evaluate(()=>pageDemoTools.select('denied'));
  await choose('learn-parent');assert.equal(await page.locator('#app .dw-demo-result').count(),0);
  // Each old homework node remains directly reachable, and role changes stay in the same task.
  await choose('hw-review');await page.evaluate(()=>demoWorkspace.toggleFlow());
  for(const state of baseline.homeworkScenarios){
    await page.evaluate(id=>homeworkDemoConsole.start(id),state);
    assert.equal(await page.evaluate(()=>homeworkPrototype.getConsoleSnapshot().scenario),state);
    await page.evaluate(()=>homeworkDemoConsole.role('parent'));
    assert.ok(await page.locator('#app .screen').count());
    await page.evaluate(()=>homeworkDemoConsole.role('teacher'));
    await externalState();
  }
  await page.evaluate(()=>homeworkDemoConsole.start('review'));
  const localChoices=await page.evaluate(()=>pageDemoTools.getContext().choices.map(x=>x.id));
  for(const id of localChoices){await page.evaluate(id=>pageDemoTools.select(id),id);await page.evaluate(()=>pageDemoTools.restore());}
  await choose('hw-list');assert.equal(await page.locator('.dw-flow').isVisible(),false);
  const countBefore=await page.evaluate(()=>homeworkPrototype.getFilteredTaskIds().length);
  for(const id of ['empty','load-failed']){await page.evaluate(id=>pageDemoTools.select(id),id);await page.evaluate(()=>pageDemoTools.restore());}
  assert.equal(await page.evaluate(()=>homeworkPrototype.getFilteredTaskIds().length),countBefore);
  await page.screenshot({path:resolve(output,'作业列表-实际效果.png'),fullPage:true});
  await choose('mine-teacher');await page.screenshot({path:resolve(output,'教师我的-实际效果.png'),fullPage:true});
  // Original family review role actions must remain in the moved flow panel.
  await choose('mine-family');assert.ok((await page.locator('#dw-flow-body').textContent()).includes('家长'));
  await page.evaluate(()=>{parentPrototype.action('invite');parentPrototype.action('shareInvite');});
  await page.getByRole('button',{name:'模拟家人打开微信邀请卡片',exact:false}).click();
  assert.equal(await page.evaluate(()=>parentPrototype.getDemoContext().view),'inviteLanding');
  await choose('t-returning');
  for(let i=0;i<3&&await page.evaluate(()=>stage==='teacherLaunch');i++)await page.locator('#dw-flow-actions button').click();
  assert.equal(await page.evaluate(()=>stage),'teacherDesk','Moved system-step buttons still advance the login flow');
  await page.getByRole('button',{name:'重启本流程',exact:true}).click();
  assert.equal(await page.evaluate(()=>stage),'teacherLaunch');
  for(const state of baseline.availability){await page.evaluate(id=>demoWorkspace.availability(id),state);assert.equal(await page.evaluate(()=>teacherAvailability),state);}
  // The dedicated control page uses the same chrome, its original business controller remains intact.
  for(const e of entries.filter(e=>['control','controlModule'].includes(e.kind))){
    await open('control-prototype.html','?review=1&page=teacherDesk&tab=control&demo='+e.id);
    assert.equal(await page.locator('#app .screen').count(),1,e.id);await externalState();results.push({entry:e.id,title:await page.locator('#app .wx-title').textContent()});
  }
  await open('homework-preview.html','?review=1&demo=hw-list');await externalState();
  await open('index.html','?review=1&demo=p-first&demoState=loginFailed');
  assert.equal(await page.evaluate(()=>pageDemoTools.getContext().active),'loginFailed','Shared link restores the page state');
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow on mobile');
  await page.getByRole('button',{name:'展开功能目录'}).click();
  await page.locator('[data-dw-entry="p-first"]').click();
  assert.equal(await page.locator('.dw-sidebar').isVisible(),false);
  await externalState();await page.screenshot({path:resolve(output,'窄屏-实际效果.png'),fullPage:true});
  // Opening, choosing and closing page states must not resize, reposition or scroll the canvas.
  for(const viewport of [{width:1536,height:1080},{width:1280,height:800},{width:390,height:844}]){
    await page.setViewportSize(viewport);await open('index.html','?review=1&demo=hw-list');
    await page.locator('#dw-state-toggle').scrollIntoViewIfNeeded();
    const geometry=()=>page.evaluate(()=>{const r=document.querySelector('.device').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scroll:scrollY,pageHeight:document.documentElement.scrollHeight};});
    const before=await geometry();
    await page.locator('#dw-state-toggle').click();
    assert.deepEqual(await geometry(),before,'Opening the picker keeps canvas geometry and document scroll unchanged');
    const panel=await page.locator('#dw-state .parent-exception-sheet').boundingBox();
    assert.ok(panel.x>=0&&panel.y>=0&&panel.x+panel.width<=viewport.width&&panel.y+panel.height<=viewport.height,'The floating picker stays inside the viewport');
    await page.locator('#dw-state .parent-exception-option').first().click();
    assert.deepEqual(await geometry(),before,'Choosing a state keeps canvas geometry unchanged');
    assert.equal(await page.locator('#dw-state .parent-exception-sheet').isVisible(),true);
    await page.locator('#dw-state .parent-exception-close').click();
    assert.deepEqual(await geometry(),before,'Closing the picker keeps canvas geometry unchanged');
    await page.locator('#dw-state-restore').click();assert.deepEqual(await geometry(),before,'Restoring the state keeps canvas geometry unchanged');
  }
  await page.setViewportSize({width:1280,height:800});
  await open('index.html','?review=1&demo=learn-subject');
  await page.locator('#dw-state-toggle').click();
  assert.ok(await page.locator('.dw-state .parent-exception-list').evaluate(e=>e.scrollHeight<=e.clientHeight+1),'All five learning states fit without scrolling on desktop');
  assert.equal(await page.locator('.dw-state .parent-exception-sheet footer button').textContent(),'恢复正常');
  await page.locator('.dw-state .parent-exception-sheet footer button').click();
  assert.equal(await page.evaluate(()=>pageDemoTools.getContext().active),'');
  assert.equal(await page.locator('#dw-state .parent-exception-sheet').isVisible(),true,'Restore normal keeps the picker open');
  await page.locator('#dw-state .parent-exception-option').first().click();
  await page.locator('#dw-state .parent-exception-option').nth(2).click();
  assert.equal(await page.evaluate(()=>pageDemoTools.getContext().active),'empty');
  assert.equal(await page.locator('#dw-state .parent-exception-sheet').isVisible(),true,'Repeated switching keeps the picker open');
  await page.locator('#dw-state .parent-exception-close').click();
  assert.equal(await page.locator('#dw-state .parent-exception-sheet').count(),0);
  assert.deepEqual(errors,[],'No runtime errors in all exercised flows');
  const report={passed:true,legacyParentScenarios:baseline.parentScenarios.length,legacyTeacherFlows:baseline.teacherFlows.length,legacyAccountStates:baseline.availability.length,legacyHomeworkNodes:baseline.homeworkScenarios.length,reachableEntries:results.length,learningStatesPerRole:5,runtimeErrors:errors,entries:results};
  writeFileSync(resolve(output,'演示台回归结果.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
