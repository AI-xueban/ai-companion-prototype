import type { HomeworkAttachment } from '../../services/homeworkMock';
import { fileVisual } from '../../services/fileVisual';

Component({
  properties: { items: { type: Array, value: [] as HomeworkAttachment[] }, removable: { type: Boolean, value: false } },
  data: { rows: [] as Array<HomeworkAttachment & { label: string; sizeLabel: string; iconKind: string; iconMark: string }>, audioFile: null as HomeworkAttachment | null },
  observers: {
    items(items: HomeworkAttachment[]) {
      this.setData({ rows: (items || []).map(file => { const icon = fileVisual(file.name, file.type); return { ...file, label: file.type === 'image' ? '图片' : file.type === 'video' ? '视频' : file.type === 'audio' ? '音频' : '文件', sizeLabel: !file.size ? '' : file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`, iconKind: icon.kind, iconMark: icon.mark }; }) });
    },
  },
  methods: {
    open(event: WechatMiniprogram.BaseEvent) {
      const file = (this.properties.items as HomeworkAttachment[]).find(row => row.id === event.currentTarget.dataset.id);
      if (!file) return;
      if (file.type === 'image') { wx.previewImage({ current: file.path, urls: (this.properties.items as HomeworkAttachment[]).filter(row => row.type === 'image').map(row => row.path) }); return; }
      if (file.type === 'video') { wx.previewMedia({ sources: [{ url: file.path, type: 'video' }] }); return; }
      if (file.type === 'audio') { this.setData({ audioFile: file }); return; }
      if (/\.txt$/i.test(file.name)) {
        wx.getFileSystemManager().readFile({ filePath: file.path, encoding: 'utf8', success: result => wx.showModal({ title: file.name, content: String(result.data).slice(0, 6000) || '文件内容为空', showCancel: false, confirmText: '关闭' }), fail: () => wx.showToast({ title: '文件暂时无法打开', icon: 'none' }) });
        return;
      }
      const fileType = (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'] as const).find(type => type === file.name.split('.').pop()?.toLowerCase());
      wx.openDocument({ filePath: file.path, fileType, showMenu: true, fail: () => wx.showToast({ title: '文件暂时无法打开', icon: 'none' }) });
    },
    closeAudio() { this.setData({ audioFile: null }); },
    noop() {},
    remove(event: WechatMiniprogram.BaseEvent) { this.triggerEvent('remove', { id: String(event.currentTarget.dataset.id) }); },
  },
});
