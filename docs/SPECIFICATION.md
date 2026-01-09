# 闘金情報スレ掲示板 - 詳細仕様書

## 1. 画面仕様

### 1.1 トップページ（スレッド一覧）

**URL**: `/search?q=闇金情報スレ`

**デザイン**: 5ch検索結果ページ風

**要素**:
- ヘッダー
  - サイトロゴ（5ちゃんねる風）
  - 検索バー（プリセット: 闇金情報スレ）
  - 検索ボタン
- メインコンテンツ
  - バナー画像（オプション）
  - スレッド一覧
    - スレッドタイトル（リンク）: `闇金情報スレ(新){番号} ({レス数})`
    - 板名: `借金生活`
    - 最終更新日時: `2026年01月07日 09:50`
    - 勢い: `55.5/日`（赤字）
- フッター
  - サイト名

**表示順**: 勢い順（降順）

---

### 1.2 スレッド詳細ページ

**URL**: `/test/read.cgi/debt/{threadId}`

**デザイン**: 5chスレッドページ風

**要素**:
- パンくずリスト: `5ちゃんねる ⇒ 借金生活(仮)`
- ログインリンク（管理者用）
- スレッド情報
  - コメント数: `368コメント`
  - サイズ: `196KB`
- スレッドタイトル: `闇金情報スレ(新)19`
- 外部リンク（ダミー）
  - `スレをまとめに`
  - `5ch即うp → gzo.ai`
- ナビゲーション: `全部 | 前100 | 次100 | 最新50`
- レス一覧
- 投稿フォーム（下部）

**レス表示フォーマット**:
```
{レス番号}  {名前}
    {日時}                                      垢版 | 大砲
                                               ID:{ID}
{本文}
```

**日時フォーマット**: `2025/12/31(水) 20:55:16.02`

---

### 1.3 管理者ページ

**URL**: `/admin`

**機能**:
- ログインフォーム
- ダッシュボード（ログイン後）
  - スレッド管理
  - レス削除
  - IP規制管理
  - 新規スレッド作成

---

## 2. データベース設計

### 2.1 threads テーブル

| カラム | 型 | 説明 |
|--------|-----|------|
| id | INTEGER | 主キー（自動採番） |
| thread_number | INTEGER | スレッド番号（例: 19） |
| title | TEXT | スレッドタイトル |
| created_at | DATETIME | 作成日時 |
| updated_at | DATETIME | 最終更新日時 |
| post_count | INTEGER | レス数 |
| is_archived | BOOLEAN | dat落ちフラグ |

### 2.2 posts テーブル

| カラム | 型 | 説明 |
|--------|-----|------|
| id | INTEGER | 主キー（自動採番） |
| thread_id | INTEGER | スレッドID（外部キー） |
| post_number | INTEGER | レス番号（スレッド内連番） |
| name | TEXT | 名前 |
| trip | TEXT | トリップ（ハッシュ済み） |
| email | TEXT | メール欄（sage判定用） |
| body | TEXT | 本文 |
| ip_address | TEXT | IPアドレス |
| user_id | TEXT | 表示用ID |
| created_at | DATETIME | 投稿日時 |
| is_deleted | BOOLEAN | 削除フラグ |
| is_admin | BOOLEAN | 管理者投稿フラグ |

### 2.3 banned_ips テーブル

| カラム | 型 | 説明 |
|--------|-----|------|
| id | INTEGER | 主キー |
| ip_address | TEXT | 規制IPアドレス |
| reason | TEXT | 規制理由 |
| created_at | DATETIME | 規制日時 |
| expires_at | DATETIME | 規制解除日時（NULL=永久） |

---

## 3. API仕様

### 3.1 スレッド一覧取得

**GET** `/api/threads`

**レスポンス**:
```json
{
  "threads": [
    {
      "id": 1,
      "threadNumber": 19,
      "title": "闇金情報スレ(新)19",
      "postCount": 368,
      "createdAt": "2026-01-07T00:00:00Z",
      "updatedAt": "2026-01-07T09:50:00Z",
      "momentum": 55.5
    }
  ]
}
```

### 3.2 スレッド詳細取得

**GET** `/api/threads/{threadId}`

**クエリパラメータ**:
- `start`: 開始レス番号
- `end`: 終了レス番号

**レスポンス**:
```json
{
  "thread": {
    "id": 1,
    "threadNumber": 19,
    "title": "闗金情報スレ(新)19",
    "postCount": 368,
    "size": "196KB"
  },
  "posts": [
    {
      "postNumber": 1,
      "name": "名無しさん＠お腹いっぱい。",
      "trip": null,
      "userId": "7oGHLFSE0",
      "createdAt": "2025-12-31T20:55:16.020Z",
      "body": "本文...",
      "isAdmin": false
    }
  ]
}
```

### 3.3 レス投稿

**POST** `/api/threads/{threadId}/posts`

**リクエスト**:
```json
{
  "name": "名無しさん＠お腹いっぱい。",
  "email": "",
  "body": "本文"
}
```

**レスポンス**:
```json
{
  "success": true,
  "postNumber": 369
}
```

### 3.4 新規スレッド作成（管理者のみ）

**POST** `/api/threads`

**リクエスト**:
```json
{
  "threadNumber": 20,
  "body": ">>1のテンプレ本文"
}
```

---

## 4. 機能詳細

### 4.1 ID生成アルゴリズム

```typescript
function generateUserId(ip: string, date: string, secret: string): string {
  const hash = sha256(ip + date + secret);
  return hash.substring(0, 8);
}
```

- IPアドレス + 日付（YYYY-MM-DD） + シークレットキーを結合
- SHA256ハッシュを生成
- 先頭8文字を使用

### 4.2 トリップ生成アルゴリズム

```typescript
function generateTrip(password: string): string {
  const hash = sha256(password);
  return '◆' + hash.substring(0, 10);
}
```

入力フォーマット: `名前#パスワード`

### 4.3 勢い計算

```typescript
function calculateMomentum(postCount: number, createdAt: Date): number {
  const now = new Date();
  const days = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return postCount / Math.max(days, 0.01); // 0除算防止
}
```

### 4.4 アンカー処理

本文中の `>>数字` をリンクに変換:

```typescript
function processAnchors(body: string, threadId: number): string {
  return body.replace(
    />>(\d+)/g,
    '<a href="#post-$1" class="anchor">&gt;&gt;$1</a>'
  );
}
```

### 4.5 sage機能

- メール欄に `sage` が含まれている場合、スレッドの `updated_at` を更新しない
- スレッド一覧での表示順に影響

---

## 5. セキュリティ

### 5.1 入力バリデーション
- 名前: 最大100文字
- 本文: 最大4000文字
- HTMLタグはエスケープ

### 5.2 レート制限
- 同一IPから連続投稿: 30秒間隔

### 5.3 IP規制
- 管理者がIPアドレスを規制可能
- 規制中のIPからは投稿不可

### 5.4 管理者認証
- 環境変数でパスワード管理
- セッションベース認証

---

## 6. デプロイ構成

### 6.1 Docker構成

```
┌─────────────────────────────────────┐
│           Docker Container          │
│  ┌─────────────────────────────┐   │
│  │       SvelteKit (Node)      │   │
│  │         Port: 3000          │   │
│  └──────────────┬──────────────┘   │
│                 │                   │
│  ┌──────────────▼──────────────┐   │
│  │      SQLite Database        │   │
│  │    /app/data/sqlite.db      │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
              │
    Volume: ./data:/app/data
```

### 6.2 Coolify設定

- ビルド方式: Dockerfile
- 環境変数:
  - `ADMIN_PASSWORD`
  - `SECRET_KEY`
- ボリューム: `/app/data` を永続ストレージにマウント
- ヘルスチェック: `GET /api/health`
