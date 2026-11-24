# 就活企業情報管理（job-hunting-manager）

就職活動の企業情報（業界・上場区分・説明会の参加状況・選考状況〈未応募〜ES提出済〜面接〜内定〉・志望度・メモ）を表形式で管理する Electron デスクトップアプリです。検索・業界フィルター・CSV 出力つき。データは localStorage に保存され、外部には送信しません。

## 使い方

```
npm install
npm start          # 起動
npm run build-win  # Windows インストーラを作成（dist/）
```

- 構成：`main.js`（Electron メインプロセス）、`index.html`（UI とロジック）、`icon.png`
- バージョン：1.0.0
