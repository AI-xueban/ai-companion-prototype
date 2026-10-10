import React, { useMemo } from 'react';
import type { TeacherPortalUser } from '../data/teacherAccess';
import baseCss from '../../../../admin/prototype/assets/css/style.css?raw';
import templateCss from '../../../../admin/prototype/assets/css/layout-templates.css?raw';
import deviceCss from '../../../../admin/prototype/assets/css/device.css?raw';
import mockDataJs from '../../../../admin/prototype/assets/js/mock-data.js?raw';
import layoutTemplatesJs from '../../../../admin/prototype/assets/js/layout-templates.js?raw';
import layoutJs from '../../../../admin/prototype/assets/js/layout.js?raw';
import contentModalJs from '../../../../admin/prototype/assets/js/content-view-modal.js?raw';
import confirmModalJs from '../../../../admin/prototype/assets/js/confirm-modal.js?raw';
import batchImportJs from '../../../../admin/prototype/assets/js/batch-import-modal.js?raw';
import addCabinetJs from '../../../../admin/prototype/assets/js/add-cabinet-modal.js?raw';
import editTabletJs from '../../../../admin/prototype/assets/js/edit-tablet-modal.js?raw';
import devicePagesJs from '../../../../admin/prototype/assets/js/device-pages.js?raw';
import facePagesJs from '../../../../admin/prototype/assets/js/face-pages.js?raw';
import restoreDeviceJs from '../../../../admin/prototype/assets/js/restore-device-modal.js?raw';
import carouselJs from '../../../../admin/prototype/assets/js/carousel-config.js?raw';
import pagesJs from '../../../../admin/prototype/assets/js/pages.js?raw';
import appJs from '../../../../admin/prototype/assets/js/app.js?raw';

type View='overview'|'cabinets'|'tablets'|'usage'|'alerts'|'faces';
const routes:Record<View,string>={overview:'device-overview',cabinets:'cabinet',tablets:'tablet',usage:'device-usage',alerts:'device-alert',faces:'face-library'};
const safeScript=(value:string)=>value.replace(/<\/script/gi,'<\\/script');

export const DeviceManagement:React.FC<{initialView:View;currentUser:TeacherPortalUser}>=({initialView,currentUser})=>{
 const route=routes[initialView];
 const srcDoc=useMemo(()=>{
  const isolatedMock=mockDataJs.replace('ai_study_prototype_v47',`teacher_device_${currentUser.schoolId}`);
  const scope=String.raw`
    window.__teacherSchool=${JSON.stringify({id:currentUser.schoolId,name:currentUser.schoolName})};
    const __baseLoadData=loadData;
    loadData=function(){
      const d=__baseLoadData();
      const sourceSchool='school-001';
      const kept=(d.cabinets||[]).filter(c=>c.schoolId===sourceSchool||c.schoolId===window.__teacherSchool.id);
      const ids=new Set(kept.map(c=>c.id));
      d.cabinets=kept.map(c=>({...c,schoolId:window.__teacherSchool.id,schoolName:window.__teacherSchool.name}));
      d.tablets=(d.tablets||[]).filter(t=>ids.has(t.cabinetId));
      d.usageRecords=(d.usageRecords||[]).filter(r=>ids.has(r.cabinetBorrow)||ids.has(r.cabinetReturn));
      d.deviceAlerts=(d.deviceAlerts||[]).filter(a=>ids.has(a.cabinetId));
      d.cabinetCarousels=Object.fromEntries(Object.entries(d.cabinetCarousels||{}).filter(([id])=>ids.has(id)));
      return d;
    };
    function setReqPanelOpen(){}
  `;
  const enforceSchool=String.raw`
    const __renderCabinetFormModal=renderCabinetFormModal;
    renderCabinetFormModal=function(cabinet){
      __renderCabinetFormModal(cabinet);
      const select=document.getElementById('add-cabinet-school');
      if(select){
        select.innerHTML='<option value="'+esc(window.__teacherSchool.id)+'">'+esc(window.__teacherSchool.name)+'</option>';
        select.value=window.__teacherSchool.id;
        select.disabled=true;
        const field=select.closest('.add-tag-field');
        if(field) field.style.display='none';
      }
    };
    FACE_SCHOOLS.splice(0,FACE_SCHOOLS.length,{id:'school-001',name:window.__teacherSchool.name});
    faceSelectedSchool='school-001';
    const __faceStudentIds=new Set(FACE_STUDENTS.filter(student=>student.schoolId==='school-001').map(student=>student.id));
    FACE_LOGIN_RECORDS.splice(0,FACE_LOGIN_RECORDS.length,...FACE_LOGIN_RECORDS.filter(record=>__faceStudentIds.has(record.id)));    const __teacherRenderPage=renderPage;
    renderPage=function(targetRoute,params){
      if(targetRoute==='cabinet-carousel'||targetRoute==='cabinet-carousel-batch') return __teacherRenderPage('cabinet',null);
      return __teacherRenderPage(targetRoute,params);
    };
    function stripTeacherCarouselUi(root=document){
      root.querySelectorAll('button,.btn-link').forEach(el=>{const text=(el.textContent||'').trim();if(text.includes('轮播')||text==='导入设备'||text==='设备还原'||text==='添加柜机'||text==='远程重启') el.remove();});
      root.querySelectorAll('.filter-item').forEach(el=>{if((el.textContent||'').includes('广告轮播')) el.remove();});
      root.querySelectorAll('.filter-row').forEach(row=>{if(Array.from(row.querySelectorAll('label')).some(label=>(label.textContent||'').trim().startsWith('学校'))) row.remove();});
      root.querySelectorAll('.form-hint').forEach(el=>{if((el.textContent||'').includes('柜机台账与广告轮播')) el.remove();});
      root.querySelectorAll('table').forEach(table=>{
        const headers=Array.from(table.querySelectorAll('thead th'));
        if(!headers.some(th=>(th.textContent||'').includes('轮播素材'))) return;
        const indexes=headers.map((th,index)=>((th.textContent||'').includes('轮播素材')||th.querySelector('input[type="checkbox"]'))?index:-1).filter(index=>index>=0).sort((a,b)=>b-a);
        table.querySelectorAll('tr').forEach(row=>indexes.forEach(index=>row.children[index]?.remove()));
      });
      root.querySelectorAll('.toolbar-right').forEach(el=>{if((el.textContent||'').includes('已选')) el.remove();});
      root.querySelectorAll('.form-section-title').forEach(title=>{
        if(!(title.textContent||'').includes('广告轮播')) return;
        let node=title;
        while(node){const next=node.nextElementSibling;if(node!==title&&node.classList.contains('form-section-title')) break;node.remove();node=next;}
      });
    }
    const __content=document.getElementById('main-content');
    if(__content)new MutationObserver(()=>stripTeacherCarouselUi(__content)).observe(__content,{childList:true,subtree:true});
    location.hash=${JSON.stringify(route)};
  `;
  const scripts=[isolatedMock,scope,layoutTemplatesJs,layoutJs,contentModalJs,confirmModalJs,batchImportJs,addCabinetJs,editTabletJs,devicePagesJs,facePagesJs,restoreDeviceJs,carouselJs,pagesJs,enforceSchool,appJs];
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${baseCss}\n${templateCss}\n${deviceCss}\nhtml,body{height:100%;overflow:auto;background:#f5f7fa}.layout{min-height:100%}.sider,.header,.tabs-bar,.req-panel,.req-panel-fab,.req-float-btn{display:none!important}.layout-main{margin-left:0!important;margin-right:0!important;height:100vh!important;min-height:0!important;overflow:hidden!important}.content{padding:20px!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain}.page-card{min-height:auto!important;box-shadow:0 1px 2px rgba(15,23,42,.05)}.modal-overlay{z-index:1000}.toast-container{z-index:1100}</style></head><body><div class="layout"><aside class="sider" id="sider"><nav id="sider-menu"></nav></aside><div class="layout-main"><header class="header"><button id="menu-toggle"></button><div id="breadcrumb"></div></header><div id="tabs-bar"></div><main class="content" id="main-content"></main></div><aside id="req-panel"><button id="req-panel-close"></button><div id="req-panel-body"></div></aside><button id="req-panel-fab"></button></div><div id="toast-container" class="toast-container"></div><div class="modal-overlay" id="modal-overlay" hidden><div class="modal modal-xl" id="modal"><div class="modal-header"><div><h3 class="modal-title" id="modal-title"></h3><p class="modal-subtitle" id="modal-subtitle"></p></div><button type="button" class="modal-close" id="modal-close">&times;</button></div><div class="modal-body" id="modal-body"></div><div class="modal-footer" id="modal-footer"></div></div></div>${scripts.map(s=>`<script>${safeScript(s)}</script>`).join('')}</body></html>`;
 },[route,currentUser.schoolId,currentUser.schoolName]);
 return <div className="flex h-full min-h-0 flex-col bg-[#f5f7fa]"><iframe key={`${route}-${currentUser.schoolId}`} title={`设备管理-${route}`} srcDoc={srcDoc} sandbox="allow-scripts allow-forms allow-modals allow-same-origin" className="min-h-0 flex-1 border-0 bg-[#f5f7fa]"/></div>;
};










