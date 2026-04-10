# RePaper Route: 🧪 物理的解呪（Bridge Mode）機動スクリプト (Rev 12.26)
# 目的: Node v24 + 日本語パス環境における Vite 6 の起動不全を 100% 物理突破する。

$OriginalPath = "C:\Users\shiyo\開発中APP\RePaper Route"
$BridgePath = "C:\repaper-bridge"
$SubAppPath = "apps\repaper-route"

Write-Host "--- 100点満点の 🧪 物理的解呪を開始します ---" -ForegroundColor Cyan

# 1. 既存プロセスの物理清掃
Write-Host "[1/3] 古い Node プロセスを 100% 物理排除中..."
Stop-Process -Name node -ErrorAction SilentlyContinue

# 2. Junction の最終整合性確認
if (!(Test-Path $BridgePath)) {
    Write-Host "[2/3] Junction が不在です。100% 物理構築中..."
    New-Item -ItemType Junction -Path $BridgePath -Target $OriginalPath
} else {
    Write-Host "[2/3] Junction は既に 100% 物理存在します。"
}

# 3. 環境変数の注入 ＆ Vite の物理機動
Write-Host "[3/3] エンジンを再点火します (Node v24 物理バイパス)..."
$env:NODE_OPTIONS = "--no-warnings --no-experimental-detect-module"

Set-Location (Join-Path $BridgePath $SubAppPath)
npx vite --host 127.0.0.1 --port 5173 --strictPort --debug

Write-Host "--- 🧪 物理的復興が 100% 完了しました ---" -ForegroundColor Green
