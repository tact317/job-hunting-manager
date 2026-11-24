# 就活企業情報管理（job-hunting-manager）

就職活動で応募・検討している企業の情報（選考状況・締切・メモなど）を一画面で管理する Electron デスクトップアプリです。データはブラウザの localStorage に保存され、外部には送信しません。

## 使い方

```
npm install
npm start          # 起動
npm run build-win  # Windows インストーラを作成（dist/）
```

- 構成：`main.js`（Electron メインプロセス）、`index.html`（UI とロジック）、`icon.png`
- バージョン：1.0.0
