# 学生照片按姓名匹配导入脚本说明

## 目标

在“学生人脸信息 → 导入照片”中，管理员先选择学校和班级，再上传该班照片 ZIP。脚本使用照片文件名中的完整姓名匹配当前班级学生，取得学生编号，并把原图上传或替换到该学生编号下。

脚本文件：`apps/admin/prototype/assets/js/face-photo-importer.js`

## 数据规则

- 每个班单独上传一个 ZIP，ZIP 不超过 50MB。
- 支持 JPG、JPEG、PNG，单张照片不超过 5MB。
- 照片文件名去掉扩展名后，必须与学生完整姓名一致。
- 只在当前选择的学校和班级内匹配，不跨班匹配。
- 同班重名学生需要在学生姓名和照片名中使用相同后缀，例如 `王五（01）.jpg`、`王五（02）.jpg`。
- 保留原图内容和原文件名，不将文件名改成学生编号。
- 学生已有照片时，后台接口应使用新照片替换旧照片。
- ZIP 中文文件名兼容 UTF-8 和常见 GBK/GB18030 编码。

## 脚本接口

页面引入脚本后，通过 `window.FacePhotoImporter` 使用：

- `readZip(zipFile)`：校验并解压 ZIP，返回原始图片 Blob 和文件信息。
- `matchAndUpload(options)`：按学生姓名匹配编号，并逐张调用上传接口。

`matchAndUpload` 参数：

```js
{
  zipFile,       // 用户选择的 ZIP File
  students,      // 当前学校、当前班级查询到的学生列表
  uploadPhoto    // 上传或替换单张学生照片的异步函数
}
```

学生列表至少包含：

```js
[
  { id: '2026003', name: '王五（01）' },
  { id: '2026025', name: '王五（02）' }
]
```

上传回调收到：

```js
{
  studentId,        // 匹配到的学生编号
  originalFileName, // 原照片文件名
  file              // 原图 Blob
}
```

## 接入示例

```html
<script src="/assets/js/face-photo-importer.js"></script>
```

```js
const students = await api.getStudents({ schoolId, classId });

const results = await window.FacePhotoImporter.matchAndUpload({
  zipFile,
  students,
  uploadPhoto: async ({ studentId, originalFileName, file }) => {
    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append('fileName', originalFileName);
    formData.append('file', file, originalFileName);

    const response = await fetch('/api/student-face-photo/replace', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || '照片上传失败');
    }
  },
});
```

`/api/student-face-photo/replace` 是示例地址，开发时替换为项目真实接口。不要手动设置 multipart 的 `Content-Type`，浏览器会自动带上 boundary。

## 返回结果

脚本返回每张照片的结果，页面可据此展示成功、失败和原因：

```js
[
  { fileName: '王五（01）.jpg', studentId: '2026003', success: true },
  { fileName: '李四.jpg', success: false, reason: '当前班级没有匹配学生' }
]
```

失败项不会关联到其他学生。支持的失败原因包括：格式不支持、单张超过 5MB、没有匹配学生、完整姓名重复、同一学生存在多张照片、上传接口失败等。

## 后端要求

正式接入需要后端提供：

1. 按学校、班级查询学生姓名和编号的接口。
2. 按学生编号上传或替换人脸照片的接口。
3. 登录鉴权及接口权限校验。
4. 服务端再次校验照片格式、大小、学生归属和访问权限。前端校验不能替代服务端校验。
5. 保存原文件名，并更新照片地址、识别来源和更新时间。

## 旧版编号改名脚本

原“将姓名照片改成编号文件名”的工具已保留为：`scripts/rename-face-photos-by-student-id.ps1`。它是本地预处理工具，不用于现在的原图上传流程。