---
description: アプリを起動する（Cloud-Native 同期対応版）
---

## 1. 土台の健全性確認（Operational Health Check）
開発を開始する前に、リモート DB との同期および型定義の整合性を確認します。

// turbo
1. リモート DB から最新の型定義を取得します
   npm run gen:types

2. 全体の型チェックを実行し、基底レイヤーの不整合がないか確認します
   npm run type-check

## 2. アプリケーションの起動
健全性が確認された後、開発サーバーを起動します。

// turbo
3. 開発サーバーを最小化状態で起動します
   Start-Process powershell -ArgumentList "-NoProfile -Command npm run dev" -WindowStyle Minimized

4. アプリ画面を開くには、ブラウザで以下のURLにアクセスしてください。
   http://localhost:5173
