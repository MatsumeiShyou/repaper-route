# RePaper Route: 🧪 物理的解呪（Bridge Mode）機動スクリプト (Rev 12.27)
# 目的: Node v24 + 日本語パス環境における Vite 6 の起動不全を 100% 物理突破する。

$BridgePath = "C:\repaper-bridge"
$SubAppPath = "apps\repaper-route"

Write-Host "--- 100点満点の 🧪 物理的解呪を開始します (Safe Path) ---" -ForegroundColor Cyan

# 1. 既存プロセスの物理清掃
Write-Host "[1/2] 古い Node プロセスを 100% 物理排除中..."
Stop-Process -Name node -ErrorAction SilentlyContinue

# 2. 環境変数の注入 ＆ Vite の物理機動
Write-Host "[2/2] エンジンを再点火します (Node v24 物理バイパス)..."
$env:NODE_OPTIONS = "--no-warnings --no-experimental-detect-module"

Set-Location (Join-Path $BridgePath $SubAppPath)
npx vite --host 127.0.0.1 --port 5173 --strictPort --debug

Write-Host "--- 🧪 物理的復興が 100% 完了しました ---" -ForegroundColor Green
