const HOMEWORK_HOME = 'pages/teacher/homework/index';

export function returnToHomeworkModuleHome(): void {
  const pages = getCurrentPages();
  const homeIndex = pages.findIndex(page => page.route === HOMEWORK_HOME && !page.options.taskId);
  if (homeIndex < 0) { wx.redirectTo({ url: `/${HOMEWORK_HOME}` }); return; }
  const home = pages[homeIndex];
  home.setData({ mode: 'list', previewOpen: false, selectedTask: null, summary: null, entryTaskId: '', fromSeries: false });
  const delta = pages.length - homeIndex - 1;
  if (delta > 0) wx.navigateBack({ delta });
}
