# .agent/run.ps1
# UTF-8 共通ランナー
# 全ての Node.js ガバナンススクリプトはこれ経由で実行する。
# 目的: 文字化け(CP932/UTF-8混在)の排除 & ターミナル雑音の最小化

param([Parameter(Mandatory=$true, ValueFromRemainingArguments=$true)][string[]]$ScriptArgs)

# UTF-8 強制
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
$OutputEncoding           = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

# NODE_OPTIONS: 出力エンコーディングをUTF-8に固定
$env:NODE_OPTIONS = "--no-warnings"

# 実行
node $ScriptArgs
exit $LASTEXITCODE
