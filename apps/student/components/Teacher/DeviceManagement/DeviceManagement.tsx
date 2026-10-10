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
      const octoberAlerts=[
        {id:'ALT-202610-001',tabletId:'TAB-001',sn:'SN20260301001',cabinetId:'CAB-001',slotNo:3,type:'damage',severity:'high',title:'外观损坏',message:'外观对比发现损坏',status:'pending',createdAt:'2026-10-10 16:42:18'},
        {id:'ALT-202610-002',tabletId:'TAB-002',sn:'SN20260301002',cabinetId:'CAB-001',slotNo:4,type:'overdue',severity:'medium',title:'逾期提醒',message:'借出满24小时未归还',status:'pending',createdAt:'2026-10-10 15:26:05'},
        {id:'ALT-202610-003',tabletId:'TAB-003',sn:'SN20260301003',cabinetId:'CAB-001',slotNo:8,type:'return_door_open',severity:'medium',title:'归还异常',message:'未关门',status:'pending',createdAt:'2026-10-10 14:18:42'},
        {id:'ALT-202610-004',tabletId:'TAB-004',sn:'SN20260301004',cabinetId:'CAB-001',slotNo:2,type:'return_not_charging',severity:'medium',title:'归还异常',message:'未充电',status:'pending',createdAt:'2026-10-10 13:05:31'},
        {id:'ALT-202610-005',tabletId:'—',sn:'—',cabinetId:'CAB-003',slotNo:null,type:'cabinet_offline',severity:'high',title:'柜机离线',message:'柜机心跳超时',status:'pending',createdAt:'2026-10-10 11:48:09'},
        {id:'ALT-202610-006',tabletId:'TAB-005',sn:'SN20260301005',cabinetId:'CAB-001',slotNo:5,type:'manual_feedback',severity:'medium',title:'人工问题反馈',message:'门关不上',status:'pending',createdAt:'2026-10-09 17:20:14'},
        {id:'ALT-202610-007',tabletId:'TAB-006',sn:'SN20260301006',cabinetId:'CAB-001',slotNo:6,type:'manual_feedback',severity:'medium',title:'人工问题反馈',message:'充电线损坏',status:'pending',createdAt:'2026-10-09 15:37:26'},
        {id:'ALT-202610-008',tabletId:'TAB-007',sn:'SN20260301007',cabinetId:'CAB-001',slotNo:1,type:'manual_feedback',severity:'medium',title:'人工问题反馈',message:'格口内有异物',status:'pending',createdAt:'2026-10-09 10:12:50'},
        {id:'ALT-202610-009',tabletId:'TAB-008',sn:'SN20260301008',cabinetId:'CAB-001',slotNo:7,type:'manual_feedback',severity:'high',title:'人工问题反馈',message:'设备损坏',status:'pending',createdAt:'2026-10-08 16:08:33'},
        {id:'ALT-202610-010',tabletId:'TAB-009',sn:'SN20260301009',cabinetId:'CAB-002',slotNo:1,type:'damage',severity:'high',title:'外观损坏',message:'外观对比发现损坏',status:'resolved',createdAt:'2026-10-08 14:45:19'},
        {id:'ALT-202610-011',tabletId:'TAB-010',sn:'SN20260301010',cabinetId:'CAB-002',slotNo:4,type:'overdue',severity:'medium',title:'逾期提醒',message:'借出满24小时未归还',status:'resolved',createdAt:'2026-10-08 09:30:02'},
        {id:'ALT-202610-012',tabletId:'TAB-011',sn:'SN20260301011',cabinetId:'CAB-002',slotNo:5,type:'return_door_open',severity:'low',title:'归还异常',message:'未关门',status:'resolved',createdAt:'2026-10-07 16:22:47'},
        {id:'ALT-202610-013',tabletId:'TAB-012',sn:'SN20260301012',cabinetId:'CAB-002',slotNo:6,type:'return_not_charging',severity:'low',title:'归还异常',message:'未充电',status:'resolved',createdAt:'2026-10-07 13:11:36'},
        {id:'ALT-202610-014',tabletId:'—',sn:'—',cabinetId:'CAB-002',slotNo:null,type:'cabinet_offline',severity:'high',title:'柜机离线',message:'柜机心跳超时',status:'resolved',createdAt:'2026-10-06 18:05:12'},
        {id:'ALT-202610-015',tabletId:'TAB-013',sn:'SN20260301013',cabinetId:'CAB-002',slotNo:2,type:'manual_feedback',severity:'medium',title:'人工问题反馈',message:'门关不上',status:'pending',createdAt:'2026-10-06 15:49:28'},
        {id:'ALT-202610-016',tabletId:'TAB-014',sn:'SN20260301014',cabinetId:'CAB-002',slotNo:3,type:'damage',severity:'high',title:'外观损坏',message:'外观对比发现损坏',status:'pending',createdAt:'2026-10-05 14:36:54'},
        {id:'ALT-202610-017',tabletId:'TAB-015',sn:'SN20260301015',cabinetId:'CAB-002',slotNo:7,type:'overdue',severity:'medium',title:'逾期提醒',message:'借出满24小时未归还',status:'pending',createdAt:'2026-10-04 12:24:17'},
        {id:'ALT-202610-018',tabletId:'TAB-016',sn:'SN20260301016',cabinetId:'CAB-002',slotNo:8,type:'return_door_open',severity:'medium',title:'归还异常',message:'未关门',status:'pending',createdAt:'2026-10-03 17:16:43'},
        {id:'ALT-202610-019',tabletId:'TAB-017',sn:'SN20260301017',cabinetId:'CAB-003',slotNo:7,type:'return_not_charging',severity:'medium',title:'归还异常',message:'未充电',status:'pending',createdAt:'2026-10-02 11:08:25'},
        {id:'ALT-202610-020',tabletId:'TAB-019',sn:'SN20260301019',cabinetId:'CAB-003',slotNo:3,type:'manual_feedback',severity:'high',title:'人工问题反馈',message:'设备损坏',status:'pending',createdAt:'2026-10-01 09:42:10'}
      ];
      const existingOctoberAlerts=new Map(d.deviceAlerts.map(item=>[item.id,item]));
      const mergedOctoberAlerts=octoberAlerts.map(item=>({...item,status:existingOctoberAlerts.get(item.id)?.status||item.status}));
      const octoberIds=new Set(octoberAlerts.map(item=>item.id));
      d.deviceAlerts=[...mergedOctoberAlerts,...d.deviceAlerts.filter(item=>!octoberIds.has(item.id))];
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
      if(cabinet){
        document.querySelector('.device-form-readonly')?.remove();
        const subtitle=document.getElementById('modal-subtitle');
        if(subtitle)subtitle.style.display='none';
        const locationInput=document.getElementById('add-cabinet-location');
        if(locationInput)locationInput.placeholder='例如：图书馆一楼大厅';
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
      root.querySelectorAll('.filter-item,.filter-row label').forEach(field=>{
        const label=(field.querySelector('label')?.textContent||field.childNodes?.[0]?.textContent||'').trim();
        const input=field.querySelector('input');
        if(!input)return;
        if(label==='设备SN'||label==='设备 SN')input.placeholder='请输入设备背面的 SN';
        if(label==='柜机ID'||label==='所属柜机ID')input.placeholder='请输入柜机编号，如 CAB-001';
        if(label==='安装位置')input.placeholder='例如：图书馆一楼大厅';
        if(label==='编号 / 姓名')input.placeholder='输入学生姓名或学号';
      });
      root.querySelectorAll('.form-section-title').forEach(title=>{
        if(!(title.textContent||'').includes('广告轮播')) return;
        let node=title;
        while(node){const next=node.nextElementSibling;if(node!==title&&node.classList.contains('form-section-title')) break;node.remove();node=next;}
      });

      // 教师端保留后台的信息架构，但隐藏只用于解释原型规则的大段说明。
      if(location.hash.replace(/^#/,'').split('?')[0]==='device-overview'){
        root.querySelectorAll('.placement-guide').forEach(el=>el.remove());
      }

      // 列表只保留学校管理员日常识别和处理设备所需的信息；完整技术信息仍可在详情中查看。
      const removeColumns=(table,labels)=>{
        const headers=Array.from(table.querySelectorAll('thead th'));
        const indexes=headers.map((th,index)=>labels.includes((th.textContent||'').trim())?index:-1).filter(index=>index>=0).sort((a,b)=>b-a);
        table.querySelectorAll('tr').forEach(row=>indexes.forEach(index=>row.children[index]?.remove()));
      };
      const pageTitle=(root.querySelector('.page-card-title')?.textContent||'').trim();
      const firstTable=root.querySelector('.page-card > .table-wrap table');
      if(firstTable&&pageTitle==='设备概览') removeColumns(firstTable,['记录ID','所属柜机ID']);
      if(firstTable&&pageTitle==='柜机管理') removeColumns(firstTable,['柜机 ID','最近心跳','绑定手机号','负责人联系方式']);
      if(firstTable&&pageTitle==='平板设备') removeColumns(firstTable,['设备ID','柜机ID','柜门','格口状态']);
      if(firstTable&&pageTitle==='使用记录') removeColumns(firstTable,['登录方式']);

      if(pageTitle.startsWith('柜机详情')){
        root.querySelectorAll('.form-section-title').forEach(title=>{
          const text=(title.textContent||'').trim();
          if(!text.startsWith('绑定本柜机设备')&&text!=='最近告警')return;
          const content=title.nextElementSibling;
          title.remove();
          if(content?.classList.contains('table-wrap'))content.remove();
        });
      }
    }

    // 所有远程开门操作均再次确认，并明确展示柜机、位置和格口，降低误操作风险。
    const __openRemoteDoorModal=openRemoteDoorModal;
    openRemoteDoorModal=function(cabinetId,presetSlotNo){
      window.__teacherRemoteCabinetId=cabinetId;
      return __openRemoteDoorModal(cabinetId,presetSlotNo);
    };
    document.addEventListener('click',event=>{
      const button=event.target.closest?.('#remote-door-confirm');
      if(!button)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const selected=document.querySelector('.remote-door-slot.selected');
      if(!selected){toast('请先选择格口','warning');return;}
      const slotNo=Number(selected.dataset.slot);
      const cab=data.cabinets.find(item=>item.id===window.__teacherRemoteCabinetId);
      if(!cab)return;
      const modal=document.getElementById('modal');
      modal?.classList.remove('modal-md');
      modal?.classList.add('modal-xl');
      const subtitle=document.getElementById('modal-subtitle');
      if(subtitle)subtitle.style.display='none';
      delete window.selectRemoteDoorSlot;
      closeModal();
      showConfirmModal({
        title:'确认远程开门',
        message:'确认打开 '+cab.name+'（'+cab.location+'）的格口 #'+slotNo+'？',
        hint:'请确认本人或学校工作人员正在柜机现场，避免误开其他格口。',
        confirmText:'确认开门',
        onConfirm:()=>toast('已向 '+cab.name+' 格口 #'+slotNo+' 下发开门指令','success'),
      });
    },true);
    // 教师端告警默认展示当月待处理数据。
    getDefaultAlertFilter=function(){
      return {type:'全部',status:'待处理',sn:'',cabinetId:'',month:formatYm(new Date())};
    };

    const TEACHER_ALERT_PAGE_SIZE=10;
    let teacherAlertListPage=1;
    let teacherOverviewAlertPage=1;

    function renderTeacherAlertPagination(total,page,handlerName){
      const totalPages=Math.max(1,Math.ceil(total/TEACHER_ALERT_PAGE_SIZE));
      const current=Math.min(Math.max(1,page),totalPages);
      const pages=Array.from({length:totalPages},(_,index)=>index+1);
      return '<div class="pagination pagination--with-size">'+
        '<span class="page-btn'+(current<=1?' disabled':'')+'" '+(current<=1?'':'onclick="'+handlerName+'('+(current-1)+')" role="button" tabindex="0"')+'>‹</span>'+
        pages.map(item=>'<span class="page-btn'+(item===current?' active':'')+'" '+(item===current?'':'onclick="'+handlerName+'('+item+')" role="button" tabindex="0"')+'>'+item+'</span>').join('')+
        '<span class="page-btn'+(current>=totalPages?' disabled':'')+'" '+(current>=totalPages?'':'onclick="'+handlerName+'('+(current+1)+')" role="button" tabindex="0"')+'>›</span>'+
        '<span class="page-size-picker">每页 '+TEACHER_ALERT_PAGE_SIZE+' 条</span>'+
        '<span class="page-jump">共 '+total+' 条 · 第 '+current+'/'+totalPages+' 页</span>'+
      '</div>';
    }

    function changeTeacherAlertStatus(alertId){
      const item=data.deviceAlerts.find(alert=>alert.id===alertId);
      if(!item)return;
      const restore=item.status==='resolved';
      showConfirmModal({
        title:restore?'确认恢复告警':'确认处理告警',
        message:restore
          ?'确认将告警 '+item.id+'（'+alertTypeLabel(item.type)+'：'+alertContentText(item)+'）恢复为待处理？'
          :'确认将告警 '+item.id+'（'+alertTypeLabel(item.type)+'：'+alertContentText(item)+'）标记为已解决？',
        hint:restore?'恢复后，该告警将重新进入待处理列表。':'请确认问题已经现场处理完成。标记后，该告警将进入已解决列表。',
        confirmText:restore?'恢复待处理':'标记已解决',
        onConfirm:()=>{
          item.status=restore?'pending':'resolved';
          saveData(data);
          toast('告警 '+item.id+(restore?' 已恢复为待处理':' 已标记为已解决'),'success');
          const currentRoute=location.hash.slice(1).split('?')[0];
          navigate(currentRoute==='device-alert'?'device-alert':'device-overview',currentRoute==='device-alert'?{keepFilter:true}:null);
        },
      });
    }

    function teacherAlertAdvice(item){
      const advice={
        damage:'请核对设备并联系平台运维',
        overdue:'请联系当前借用学生归还',
        return_door_open:'请到柜机现场检查对应格口',
        return_not_charging:'请检查设备是否放稳、充电线是否连接',
        cabinet_offline:'请检查柜机电源和网络',
        manual_feedback:'请根据反馈内容进行现场检查',
      };
      return advice[item.type]||'请现场核实并处理';
    }

    renderAlertTableRows=function(alerts){
      if(!alerts.length)return '<tr><td colspan="10" style="text-align:center;color:var(--text-muted);padding:32px">暂无符合条件的告警</td></tr>';
      return alerts.map(item=>'<tr>'+
        '<td>'+esc(item.id)+'</td>'+
        '<td>'+alertTypeLabel(item.type)+'</td>'+
        '<td>'+esc(item.sn||'—')+'</td>'+
        '<td>'+esc(formatAlertSlot(item))+'</td>'+
        '<td>'+esc(item.cabinetId||data.tablets.find(tablet=>tablet.id===item.tabletId)?.cabinetId||'—')+'</td>'+
        '<td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(alertContentText(item))+'</td>'+
        '<td style="max-width:240px">'+esc(teacherAlertAdvice(item))+'</td>'+
        '<td>'+alertStatusTag(item.status)+'</td>'+
        '<td>'+item.createdAt+'</td>'+
        '<td><button class="btn-link" onclick="changeTeacherAlertStatus(\''+item.id+'\')">'+(item.status==='resolved'?'恢复待处理':'标记已解决')+'</button></td>'+
      '</tr>').join('');
    };

    const __applyTeacherAlertFilter=applyAlertFilter;
    applyAlertFilter=function(){
      teacherAlertListPage=1;
      return __applyTeacherAlertFilter();
    };
    const __resetTeacherAlertFilter=resetAlertFilter;
    resetAlertFilter=function(){
      teacherAlertListPage=1;
      return __resetTeacherAlertFilter();
    };

    function goToTeacherAlertPage(page){
      teacherAlertListPage=Math.max(1,Number(page)||1);
      navigate('device-alert',{keepFilter:true});
    }

    const __renderTeacherAlertPage=renderDeviceAlertPage;
    renderDeviceAlertPage=function(params){
      const root=document.createElement('div');
      root.innerHTML=__renderTeacherAlertPage(params);
      const contentHeader=Array.from(root.querySelectorAll('thead th')).find(th=>(th.textContent||'').trim()==='告警内容');
      if(contentHeader&&(contentHeader.nextElementSibling?.textContent||'').trim()!=='处理建议')contentHeader.insertAdjacentHTML('afterend','<th>处理建议</th>');
      const filtered=filterDeviceAlerts(data.deviceAlerts,alertFilterState)
        .sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
      const totalPages=Math.max(1,Math.ceil(filtered.length/TEACHER_ALERT_PAGE_SIZE));
      teacherAlertListPage=Math.min(teacherAlertListPage,totalPages);
      const start=(teacherAlertListPage-1)*TEACHER_ALERT_PAGE_SIZE;
      const tableWrap=root.querySelector('.page-card > .table-wrap');
      const tbody=tableWrap?.querySelector('tbody');
      if(tbody)tbody.innerHTML=renderAlertTableRows(filtered.slice(start,start+TEACHER_ALERT_PAGE_SIZE));
      if(tableWrap)tableWrap.insertAdjacentHTML('afterend',renderTeacherAlertPagination(filtered.length,teacherAlertListPage,'goToTeacherAlertPage'));
      return root.innerHTML;
    };

    let teacherOverviewAlertFilter={month:formatYm(new Date()),status:'待处理'};

    function applyTeacherOverviewAlertFilter(){
      teacherOverviewAlertFilter={
        month:document.getElementById('overview-alert-month')?.value||formatYm(new Date()),
        status:document.getElementById('overview-alert-status')?.value||'待处理',
      };
      teacherOverviewAlertPage=1;
      navigate('device-overview');
    }

    function resetTeacherOverviewAlertFilter(){
      teacherOverviewAlertFilter={month:formatYm(new Date()),status:'待处理'};
      teacherOverviewAlertPage=1;
      navigate('device-overview');
    }

    function goToTeacherOverviewAlertPage(page){
      teacherOverviewAlertPage=Math.max(1,Number(page)||1);
      navigate('device-overview');
    }

    const __renderTeacherOverview=renderDeviceOverviewPage;
    renderDeviceOverviewPage=function(){
      const root=document.createElement('div');
      root.innerHTML=__renderTeacherOverview();
      const section=Array.from(root.querySelectorAll('.form-section-title')).find(el=>(el.textContent||'').trim()==='最近使用记录');
      const tableWrap=section?.nextElementSibling;
      if(section&&tableWrap){
        const filter={
          type:'全部',
          status:teacherOverviewAlertFilter.status,
          sn:'',
          cabinetId:'',
          month:teacherOverviewAlertFilter.month,
        };
        const alerts=filterDeviceAlerts(data.deviceAlerts,filter)
          .sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
        const totalPages=Math.max(1,Math.ceil(alerts.length/TEACHER_ALERT_PAGE_SIZE));
        teacherOverviewAlertPage=Math.min(teacherOverviewAlertPage,totalPages);
        const start=(teacherOverviewAlertPage-1)*TEACHER_ALERT_PAGE_SIZE;
        section.textContent='状态告警';
        const filterForm=document.createElement('div');
        filterForm.className='filter-form';
        filterForm.innerHTML=
          '<div class="filter-item"><label>产生月份</label><select class="select" id="overview-alert-month">'+renderAlertMonthSelect(teacherOverviewAlertFilter.month)+'</select></div>'+
          '<div class="filter-item"><label>处理状态</label><select class="select" id="overview-alert-status">'+
            '<option'+(teacherOverviewAlertFilter.status==='全部'?' selected':'')+'>全部</option>'+
            '<option'+(teacherOverviewAlertFilter.status==='待处理'?' selected':'')+'>待处理</option>'+
            '<option'+(teacherOverviewAlertFilter.status==='已解决'?' selected':'')+'>已解决</option>'+
          '</select></div>'+
          '<div class="filter-actions"><button type="button" class="btn" onclick="resetTeacherOverviewAlertFilter()">重置</button><button type="button" class="btn btn-primary" onclick="applyTeacherOverviewAlertFilter()">搜索</button></div>';
        section.insertAdjacentElement('afterend',filterForm);
        tableWrap.innerHTML='<table class="data-table"><thead><tr><th>告警ID</th><th>类型</th><th>设备SN</th><th>格口</th><th>所属柜机ID</th><th>告警内容</th><th>处理建议</th><th>状态</th><th>产生时间</th><th>操作</th></tr></thead><tbody>'+renderAlertTableRows(alerts.slice(start,start+TEACHER_ALERT_PAGE_SIZE))+'</tbody></table>';
        tableWrap.insertAdjacentHTML('afterend',renderTeacherAlertPagination(alerts.length,teacherOverviewAlertPage,'goToTeacherOverviewAlertPage'));
      }
      return root.innerHTML;
    };

    const __content=document.getElementById('main-content');
    if(__content)new MutationObserver(()=>stripTeacherCarouselUi(__content)).observe(__content,{childList:true,subtree:true});
    location.hash=${JSON.stringify(route)};
  `;
  const scripts=[isolatedMock,scope,layoutTemplatesJs,layoutJs,contentModalJs,confirmModalJs,batchImportJs,addCabinetJs,editTabletJs,devicePagesJs,facePagesJs,restoreDeviceJs,carouselJs,pagesJs,enforceSchool,appJs];
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${baseCss}\n${templateCss}\n${deviceCss}\nhtml,body{height:100%;overflow:auto;background:#f5f7fa}.layout{min-height:100%}.sider,.header,.tabs-bar,.req-panel,.req-panel-fab,.req-float-btn{display:none!important}.layout-main{margin-left:0!important;margin-right:0!important;height:100vh!important;min-height:0!important;overflow:hidden!important}.content{padding:20px!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain}.page-card{min-height:auto!important;box-shadow:0 1px 2px rgba(15,23,42,.05)}.modal-overlay{z-index:1000}.toast-container{z-index:1100}</style></head><body><div class="layout"><aside class="sider" id="sider"><nav id="sider-menu"></nav></aside><div class="layout-main"><header class="header"><button id="menu-toggle"></button><div id="breadcrumb"></div></header><div id="tabs-bar"></div><main class="content" id="main-content"></main></div><aside id="req-panel"><button id="req-panel-close"></button><div id="req-panel-body"></div></aside><button id="req-panel-fab"></button></div><div id="toast-container" class="toast-container"></div><div class="modal-overlay" id="modal-overlay" hidden><div class="modal modal-xl" id="modal"><div class="modal-header"><div><h3 class="modal-title" id="modal-title"></h3><p class="modal-subtitle" id="modal-subtitle"></p></div><button type="button" class="modal-close" id="modal-close">&times;</button></div><div class="modal-body" id="modal-body"></div><div class="modal-footer" id="modal-footer"></div></div></div>${scripts.map(s=>`<script>${safeScript(s)}</script>`).join('')}</body></html>`;
 },[route,currentUser.schoolId,currentUser.schoolName]);
 return <div className="flex h-full min-h-0 flex-col bg-[#f5f7fa]"><iframe key={`${route}-${currentUser.schoolId}`} title={`设备管理-${route}`} srcDoc={srcDoc} sandbox="allow-scripts allow-forms allow-modals allow-same-origin" className="min-h-0 flex-1 border-0 bg-[#f5f7fa]"/></div>;
};










