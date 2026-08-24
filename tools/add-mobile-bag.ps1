$utf8 = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem "site" -Filter *.html
$changed = 0
foreach($f in $files){
  $c = [System.IO.File]::ReadAllText($f.FullName)
  $orig = $c
  if($c -match 'data-open-bag'){
    $c = $c.Replace(@'
    </nav>
  </div>
</header>
'@, @'
    </nav>
    <button class="icon-btn m-bag" data-open-bag aria-label="Open bag">Bag <span class="bag-count">0</span></button>
  </div>
</header>
'@)
  }
  if($c -ne $orig){
    [System.IO.File]::WriteAllText($f.FullName, $c, $utf8)
    $changed++
  }
}
Write-Output "files changed: $changed"
