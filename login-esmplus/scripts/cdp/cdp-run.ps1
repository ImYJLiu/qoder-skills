param(
  [int]$Port = 9377,
  [string]$Navigate,
  [string]$EvalFile,
  [string]$EvalStr,
  [string]$AddInitFile,
  [string]$Screenshot,
  [string]$UrlMatch,
  [int]$TimeoutSec = 90
)
$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$script:ws = $null
$script:cts = $null
$script:cdpId = 0

function Send-Cdp([string]$method, $params) {
  $script:cdpId++
  $myId = $script:cdpId
  $msg = @{ id = $myId; method = $method; params = $params } | ConvertTo-Json -Depth 20 -Compress
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
  $seg = New-Object System.ArraySegment[byte] -ArgumentList @(,$bytes)
  $script:ws.SendAsync($seg, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $script:cts.Token).Wait()
  $buf = New-Object byte[] 1048576
  $sb = New-Object System.Text.StringBuilder
  while ($true) {
    $sb.Clear() | Out-Null
    do {
      $rseg = New-Object System.ArraySegment[byte] -ArgumentList @(,$buf)
      $res = $script:ws.ReceiveAsync($rseg, $script:cts.Token).Result
      $sb.Append([System.Text.Encoding]::UTF8.GetString($buf, 0, $res.Count)) | Out-Null
    } while (-not $res.EndOfMessage)
    $json = $sb.ToString() | ConvertFrom-Json
    if ($json.id -eq $myId) { return $json }
  }
}

$out = $null
try {
  $targets = Invoke-RestMethod -Uri ("http://127.0.0.1:{0}/json/list" -f $Port) -TimeoutSec 10
  $page = $targets | Where-Object { $_.type -eq 'page' -and ($_.url -notmatch '^devtools') -and (-not $UrlMatch -or $_.url -match $UrlMatch) } | Select-Object -First 1
  if (-not $page) { throw "no page target on port $Port" }
  $script:ws = New-Object System.Net.WebSockets.ClientWebSocket
  $script:cts = New-Object System.Threading.CancellationTokenSource
  $script:cts.CancelAfter($TimeoutSec * 1000)
  $script:ws.ConnectAsync([Uri]$page.webSocketDebuggerUrl, $script:cts.Token).Wait()

  if ($Navigate) {
    $out = Send-Cdp 'Page.navigate' @{ url = $Navigate }
  } elseif ($AddInitFile) {
    $src = [System.IO.File]::ReadAllText($AddInitFile)
    $out = Send-Cdp 'Page.addScriptToEvaluateOnNewDocument' @{ source = $src }
  } elseif ($EvalFile -or $EvalStr) {
    $js = $EvalStr
    if ($EvalFile) { $js = [System.IO.File]::ReadAllText($EvalFile) }
    if ($env:ESMP_PW) { $js = $js.Replace('__PW__', $env:ESMP_PW) }
    $out = Send-Cdp 'Runtime.evaluate' @{ expression = $js; awaitPromise = $true; returnByValue = $true }
  } elseif ($Screenshot) {
    $out = Send-Cdp 'Page.captureScreenshot' @{ format = 'png' }
    if ($out.result.data) {
      [System.IO.File]::WriteAllBytes($Screenshot, [Convert]::FromBase64String($out.result.data))
      $out = @{ saved = $Screenshot; bytes = (Get-Item $Screenshot).Length }
    }
  } else {
    $out = Send-Cdp 'Runtime.evaluate' @{ expression = 'JSON.stringify({u:location.href,t:document.title})'; returnByValue = $true }
  }
  try { $script:ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, 'done', [System.Threading.CancellationToken]::None).Wait() } catch {}
} catch {
  $out = @{ scriptError = ($_.Exception.Message) }
}
$out | ConvertTo-Json -Depth 25 -Compress
