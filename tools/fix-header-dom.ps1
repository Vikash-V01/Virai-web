$utf8 = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem "site" -Filter *.html
$changed = 0
foreach($f in $files){
  $c = [System.IO.File]::ReadAllText($f.FullName)
  $orig = $c
  $pattern = '<header class="site-head">\s*(<div class="wrap head-util">[\s\S]*?</div>)\s*(<div class="wrap head-main">)'
  $replacement = '<div class="top-announce">' + "`n" + '  $1' + "`n" + '</div>' + "`n" + '<header class="site-head">' + "`n" + '  $2'
  $c = [regex]::Replace($c, $pattern, $replacement)
  if($c -ne $orig){
    [System.IO.File]::WriteAllText($f.FullName, $c, $utf8)
    $changed++
  }
}
Write-Output "files restructured: $changed"
