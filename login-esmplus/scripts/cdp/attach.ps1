param(
  [int]$Port = 9377,
  [string]$Selector = '#__up',
  [string[]]$Files = @(),
  [int]$TimeoutSec = 60
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
  $page = $targets | Where-Object { $_.type -eq 'page' -and ($_.url -notmatch '^devtools') } | Select-Object -First 1
  if (-not $page) { throw "no page target on port $Port" }
  $script:ws = New-Object System.Net.WebSockets.ClientWebSocket
  $script:cts = New-Object System.Threading.CancellationTokenSource
  $script:cts.CancelAfter($TimeoutSec * 1000)
  $script:ws.ConnectAsync([Uri]$page.webSocketDebuggerUrl, $script:cts.Token).Wait()

  $null = Send-Cdp 'DOM.enable' @{}
  $doc = Send-Cdp 'DOM.getDocument' @{ depth = 1 }
  $rootId = $doc.result.root.nodeId
  $q = Send-Cdp 'DOM.querySelector' @{ nodeId = $rootId; selector = $Selector }
  $nodeId = $q.result.nodeId
  if (-not $nodeId) { throw "selector $Selector not found" }
  $set = Send-Cdp 'DOM.setFileInputFiles' @{ files = $Files; nodeId = $nodeId }
  $out = @{ ok = $true; nodeId = $nodeId; files = $Files }
  try { $script:ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, 'done', [System.Threading.CancellationToken]::None).Wait() } catch {}
} catch {
  $out = @{ scriptError = ($_.Exception.Message) }
}
$out | ConvertTo-Json -Depth 10 -Compress
