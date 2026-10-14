<# 根据姓名与学生编号对应表，将姓名命名的照片批量改为编号命名；输出图片文件、ZIP和改名明细。 #>
param(
  [Parameter(Mandatory=$true)][string]$Photos,
  [Parameter(Mandatory=$true)][string]$Students,
  [Parameter(Mandatory=$true)][string]$Output
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
function Import-StudentList([string]$ListPath) {
  $resolved = (Resolve-Path -LiteralPath $ListPath).Path
  $extension = [IO.Path]::GetExtension($resolved).ToLowerInvariant()
  if ($extension -eq '.csv') { return @(Import-Csv -LiteralPath $resolved -Encoding UTF8) }
  if ($extension -eq '.xls') { throw 'Legacy .xls is unsupported; save it as .xlsx first.' }
  if ($extension -ne '.xlsx') { throw 'Student list must be .xlsx or UTF-8 CSV.' }
  $book = [IO.Compression.ZipFile]::OpenRead($resolved)
  try {
    $shared = @()
    $sharedEntry = $book.GetEntry('xl/sharedStrings.xml')
    if ($sharedEntry) {
      $reader = [IO.StreamReader]::new($sharedEntry.Open())
      try { [xml]$sharedXml = $reader.ReadToEnd() } finally { $reader.Dispose() }
      foreach ($item in $sharedXml.sst.si) { $shared += [string]$item.InnerText }
    }
    $sheetEntry = $book.GetEntry('xl/worksheets/sheet1.xml')
    if (!$sheetEntry) { throw 'First worksheet not found.' }
    $reader = [IO.StreamReader]::new($sheetEntry.Open())
    try { [xml]$sheetXml = $reader.ReadToEnd() } finally { $reader.Dispose() }
    $matrix = @()
    foreach ($row in $sheetXml.worksheet.sheetData.row) {
      $values = @{}
      foreach ($cell in $row.c) {
        $column = [regex]::Match([string]$cell.r, '^[A-Z]+').Value
        $value = if ($cell.t -eq 's') { $shared[[int]$cell.v] } elseif ($cell.t -eq 'inlineStr') { [string]$cell.is.InnerText } else { [string]$cell.v }
        $values[$column] = $value
      }
      $matrix += ,$values
    }
    if (!$matrix.Count) { return @() }
    $headers = @{}
    foreach ($column in $matrix[0].Keys) { $headers[$column] = ([string]$matrix[0][$column]).Trim() }
    $result = @()
    foreach ($values in $matrix | Select-Object -Skip 1) {
      $record = [ordered]@{}
      foreach ($column in $headers.Keys) { $record[$headers[$column]] = [string]$values[$column] }
      if (($record.Values -join '').Trim()) { $result += [pscustomobject]$record }
    }
    return $result
  } finally { $book.Dispose() }
}
$rows = @(Import-StudentList $Students)
if (!$rows.Count -or !($rows[0].PSObject.Properties.Name -contains '姓名') -or !($rows[0].PSObject.Properties.Name -contains '学生编号')) { throw '名单需要姓名、学生编号两列' }
$roster = $rows

$names = @{}; $ids = @{}
foreach ($student in $roster) {
  $name = $student.姓名.Trim().Normalize(); $sid = $student.学生编号.Trim()
  if (!$name -or $sid -cnotmatch '^[A-Za-z0-9_-]+$') { throw '姓名为空或编号格式错误' }
  if ($ids.ContainsKey($sid)) { throw "编号重复：$sid" }
  $ids[$sid] = $true
  if (!$names.ContainsKey($name)) { $names[$name] = @() }
  $names[$name] += $sid
}
if (Test-Path -LiteralPath $Output) { throw '输出目录已存在，请使用新的目录' }
$photoPath = (Resolve-Path -LiteralPath $Photos).Path
if ((Get-Item -LiteralPath $photoPath).Length -gt 50MB) { throw '照片ZIP超过50MB，请缩小照片后重新打包' }
$archive = [IO.Compression.ZipFile]::OpenRead($photoPath)
$report = [Collections.Generic.List[object]]::new()
$candidates = [Collections.Generic.List[object]]::new()
try {
  $total = ($archive.Entries | Measure-Object Length -Sum).Sum
  if ($archive.Entries.Count -gt 10000 -or $total -gt 512MB) { throw 'ZIP超过10000条目或512MB解压大小限制' }
  foreach ($entry in $archive.Entries) {
    $path = $entry.FullName.Replace('\','/')
    if (!$entry.Name -or $path -match '(^|/)(__MACOSX|\.[^/]*)(/|$)') { continue }
    $file = ($path -split '/')[-1]
    $name = [IO.Path]::GetFileNameWithoutExtension($file).Trim().Normalize()
    $ext = [IO.Path]::GetExtension($file).ToLowerInvariant()
    $row = [pscustomobject]@{原文件=$path; 姓名=$name; 学生编号=''; 新文件名=''; 结果=''; 说明=''}
    $report.Add($row)
    if ($ext -notin @('.jpg','.jpeg','.png')) { $row.结果='跳过'; $row.说明='不支持的文件类型'; continue }
    if (!$names.ContainsKey($name)) { $row.结果='失败'; $row.说明='学生名单中无此姓名'; continue }
    if ($names[$name].Count -ne 1) { $row.结果='失败'; $row.说明='名单中完整姓名重复，请添加不同后缀并同步照片文件名'; continue }
    $sid = $names[$name][0]
    if ($entry.Length -gt 5MB) { $row.结果='失败'; $row.说明='照片超过5MB'; continue }
    $row.学生编号=$sid
    $candidates.Add([pscustomobject]@{Entry=$entry; Extension=$ext; Row=$row})
  }
  $counts = @{}
  foreach ($item in $candidates) { $counts[$item.Row.学生编号] += 1 }
  $directory = New-Item -ItemType Directory -Path $Output
  $renamedDirectory = New-Item -ItemType Directory -Path (Join-Path $directory.FullName '编号照片')
  $target = [IO.Compression.ZipFile]::Open((Join-Path $directory.FullName '编号照片.zip'), [IO.Compression.ZipArchiveMode]::Create)
  try {
    foreach ($item in $candidates) {
      $row = $item.Row
      if ($counts[$row.学生编号] -gt 1) { $row.结果='失败'; $row.说明='同一学生有多张照片，请仅保留一张'; continue }
      $stream = $null; $memory = $null
      try {
        $stream = $item.Entry.Open(); $memory = [IO.MemoryStream]::new()
        $stream.CopyTo($memory); $bytes = $memory.ToArray()
        $signature = [BitConverter]::ToString($bytes, 0, [Math]::Min(8,$bytes.Length))
        $valid = if ($item.Extension -eq '.png') { $signature -eq '89-50-4E-47-0D-0A-1A-0A' } else { $signature.StartsWith('FF-D8-FF') }
        if (!$valid) { throw '照片内容与扩展名不符' }
      } catch { $row.结果='失败'; $row.说明=$_.Exception.Message; continue }
      finally { if ($stream) { $stream.Dispose() }; if ($memory) { $memory.Dispose() } }
      $newName = $row.学生编号 + $item.Extension
      [IO.File]::WriteAllBytes((Join-Path $renamedDirectory.FullName $newName), $bytes)
      $newEntry = $target.CreateEntry($newName)
      $row.新文件名 = $newName
      $dest = $newEntry.Open()
      try { $dest.Write($bytes,0,$bytes.Length) } finally { $dest.Dispose() }
      $row.结果='成功'; $row.说明=$newEntry.FullName
    }
  } finally { $target.Dispose() }
  $outputZip = Join-Path $directory.FullName '编号照片.zip'
  if ((Get-Item -LiteralPath $outputZip).Length -gt 50MB) {
    Remove-Item -LiteralPath $outputZip
    throw '生成的编号照片ZIP超过50MB，已移除超限输出，请缩小照片后重新处理'
  }
  foreach ($row in $report) {
    foreach ($property in $row.PSObject.Properties) {
      if ([string]$property.Value -match '^[=+@\-\t\r]') { $property.Value = "'" + $property.Value }
    }
  }
  if ($report.Count) { $report | Export-Csv -LiteralPath (Join-Path $directory.FullName '匹配明细.csv') -NoTypeInformation -Encoding UTF8 }
  else { '原文件,姓名,学生编号,新文件名,结果,说明' | Set-Content -LiteralPath (Join-Path $directory.FullName '匹配明细.csv') -Encoding UTF8 }
  $success = @($report | Where-Object 结果 -eq '成功').Count
  $failed = @($report | Where-Object 结果 -eq '失败').Count
  Write-Host "照片改名成功 $success，失败 $failed；输出：$($directory.FullName)"
  if ($failed -or !$success) { exit 2 }
} finally { $archive.Dispose() }
