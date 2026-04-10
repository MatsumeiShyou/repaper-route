# .agent/run.ps1
# UTF-8 共通ランナー (Sovereign Root 版)
# 全ての Node.js ガバナンススクリプトはこれ経由で実行する。

param([Parameter(Mandatory=$true, ValueFromRemainingArguments=$true)][string[]]$ScriptArgs)

# 基準点の設定 ($PSScriptRoot = .agent/ フォルダ)
$AGENT_DIR = $PSScriptRoot
$ROOT = Split-Path -Path $AGENT_DIR -Parent

# UTF-8 強制
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
$OutputEncoding           = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

# NODE_OPTIONS: 警告抑制
$env:NODE_OPTIONS = "--no-warnings"

# 実行ディレクトリをルートに固定して実行
Set-Location -Path $ROOT
node $ScriptArgs
exit $LASTEXITCODE
