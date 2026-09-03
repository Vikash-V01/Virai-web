$utf8 = New-Object System.Text.UTF8Encoding($false)
$map = @{ "11"=1672;"12"=1672;"13"=1672;"14"=1672;"15"=1672;"16"=1672;"18"=1448;"19"=1448;"20"=1448;"21"=1672;"22"=1672;"23"=1122;"24"=1586;"25"=1774;"26"=1024;"27"=1448;"28"=1448;"29"=1448;"30"=1448;"31"=1448 }
$files = Get-ChildItem "site" -Filter *.html
$changed = 0
foreach($f in $files){
  $c = [System.IO.File]::ReadAllText($f.FullName)
  $orig = $c
  foreach($k in $map.Keys){
    $n = [int]$k
    $wrongDeriv = if($n -le 15){ 1400 } elseif($n -ge 27){ 900 } else { 1200 }
    $wrong = ', img/' + $k + '.webp ' + $wrongDeriv + 'w"'
    $right = ', img/' + $k + '.webp ' + $map[$k] + 'w"'
    $c = $c.Replace($wrong, $right)
  }
  if($c -ne $orig){
    [System.IO.File]::WriteAllText($f.FullName, $c, $utf8)
    $changed++
  }
}
Write-Output "files changed: $changed"
Write-Output "--- unique srcset attrs now ---"
Select-String -Path "site\*.html" -Pattern 'srcset="[^"]+"' | ForEach-Object { $_.Matches[0].Value } | Sort-Object -Unique
