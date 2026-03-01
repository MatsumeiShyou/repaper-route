# Windows & WSL2 最適化マニュアル (DevContainer 移行用)

DevContainer 環境を 16GB メモリの Windows マシンで快適に動作させるためには、WSL2 (Vmmem) のメモリ制限と自動起動・停止ライフサイクルの管理が必須です。

## 1. `.wslconfig` の作成手順

1. Windows のユーザープロファイル直下（例: `C:\Users\shiyo\`）に `.wslconfig` という名前で新規ファイルを作成します。
2. 以下の内容をそのまま貼り付け、保存します。

```ini
[wsl2]
# メモリ上限を 6GB に制限。全体 16GB で、ブラウザ等の動作余力を確保する。
memory=6GB

# 15分 (90万ミリ秒) 無アクセスが続けば、WSL2 自体をシャットダウンしメモリを完全に解放する。
vmIdleTimeout=900000
```

## 2. 変更の適用

設定保存後、PowerShell 等で以下のコマンドを実行し、WSL をシャットダウンしてください。
次回アクセス時（Docker起動時）に設定が反映されます。

```powershell
wsl --shutdown
```

## 3. なぜ必要なのか？

- **Vmmem の暴走抑止**: デフォルトの WSL2 はホストメモリの 50% を上限まで仮想マシンキャッシュとして占有し続けます。
- **Auto-Shutdown の補完**: DevContainer 側の `"shutdownAction": "stopContainer"` により VS Code 終了と同時にコンテナは自爆しますが、VM 自体は待機状態を続けます。この `.wslconfig` により、その後 15分間 操作がなければ WSL 全体がシャットダウンし、ホストOSにメモリが100%返還されるパーフェクト・エコ環境が完成します。
