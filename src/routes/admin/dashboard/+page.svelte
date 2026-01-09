<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data, form } = $props();

	// 新規スレッド作成
	let newThreadNumber = $state(1);
	let newThreadTitle = $state('');
	let newThreadBody = $state('');

	// IP規制
	let banIpAddress = $state('');
	let banReason = $state('');
	let banDuration = $state(0);

	// レス削除
	let deletePostId = $state('');

	function handleFormSubmit() {
		return async ({ result }: { result: { type: string } }) => {
			if (result.type === 'success' || result.type === 'redirect') {
				await invalidateAll();
				// フォームリセット
				newThreadTitle = '';
				newThreadBody = '';
				banIpAddress = '';
				banReason = '';
				banDuration = 0;
				deletePostId = '';
			}
		};
	}
</script>

<svelte:head>
	<title>管理者ダッシュボード</title>
</svelte:head>

<div class="container">
	<header class="header">
		<h1>管理者ダッシュボード</h1>
		<form method="POST" action="?/logout" use:enhance>
			<button type="submit" class="logout-btn">ログアウト</button>
		</form>
	</header>

	{#if form?.error}
		<div class="alert error">{form.error}</div>
	{/if}

	{#if form?.message}
		<div class="alert success">{form.message}</div>
	{/if}

	<section class="section">
		<h2>新規スレッド作成</h2>
		<form method="POST" action="?/createThread" use:enhance={handleFormSubmit}>
			<div class="form-row">
				<label for="threadNumber">スレッド番号:</label>
				<input type="number" id="threadNumber" name="threadNumber" bind:value={newThreadNumber} min="1" />
			</div>
			<div class="form-row">
				<label for="title">タイトル:</label>
				<input type="text" id="title" name="title" bind:value={newThreadTitle} placeholder="闇金情報スレ(新)19" required />
			</div>
			<div class="form-row">
				<label for="body">>>1本文:</label>
				<textarea id="body" name="body" bind:value={newThreadBody} rows="5" placeholder="テンプレート本文（省略可）"></textarea>
			</div>
			<button type="submit">スレッド作成</button>
		</form>
	</section>

	<section class="section">
		<h2>スレッド管理</h2>
		<table class="data-table">
			<thead>
				<tr>
					<th>ID</th>
					<th>タイトル</th>
					<th>レス数</th>
					<th>状態</th>
					<th>操作</th>
				</tr>
			</thead>
			<tbody>
				{#each data.threads as thread}
					<tr>
						<td>{thread.id}</td>
						<td>
							<a href="/test/read.cgi/debt/{thread.id}" target="_blank">{thread.title}</a>
						</td>
						<td>{thread.postCount}</td>
						<td>{thread.isArchived ? 'アーカイブ済み' : 'アクティブ'}</td>
						<td>
							<form method="POST" action="?/deleteThread" use:enhance={handleFormSubmit} class="inline-form">
								<input type="hidden" name="threadId" value={thread.id} />
								<button type="submit" class="delete-btn" onclick={(e) => { if (!confirm('本当に削除しますか？')) e.preventDefault(); }}>削除</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<section class="section">
		<h2>レス削除</h2>
		<form method="POST" action="?/deletePost" use:enhance={handleFormSubmit}>
			<div class="form-row inline">
				<label for="postId">投稿ID:</label>
				<input type="number" id="postId" name="postId" bind:value={deletePostId} placeholder="投稿ID" required />
				<button type="submit">削除</button>
			</div>
		</form>
	</section>

	<section class="section">
		<h2>IP規制</h2>
		<form method="POST" action="?/banIp" use:enhance={handleFormSubmit}>
			<div class="form-row">
				<label for="ipAddress">IPアドレス:</label>
				<input type="text" id="ipAddress" name="ipAddress" bind:value={banIpAddress} placeholder="xxx.xxx.xxx.xxx" required />
			</div>
			<div class="form-row">
				<label for="reason">理由:</label>
				<input type="text" id="reason" name="reason" bind:value={banReason} placeholder="荒らし行為など" />
			</div>
			<div class="form-row">
				<label for="duration">期間:</label>
				<select id="duration" name="duration" bind:value={banDuration}>
					<option value="0">永久</option>
					<option value="1">1日</option>
					<option value="7">7日</option>
					<option value="30">30日</option>
				</select>
			</div>
			<button type="submit">規制追加</button>
		</form>

		<h3>規制中IP一覧</h3>
		<table class="data-table">
			<thead>
				<tr>
					<th>IP</th>
					<th>理由</th>
					<th>規制日</th>
					<th>期限</th>
					<th>操作</th>
				</tr>
			</thead>
			<tbody>
				{#each data.bannedIps as ban}
					<tr>
						<td>{ban.ipAddress}</td>
						<td>{ban.reason || '-'}</td>
						<td>{new Date(ban.createdAt).toLocaleDateString('ja-JP')}</td>
						<td>{ban.expiresAt ? new Date(ban.expiresAt).toLocaleDateString('ja-JP') : '永久'}</td>
						<td>
							<form method="POST" action="?/unbanIp" use:enhance={handleFormSubmit} class="inline-form">
								<input type="hidden" name="banId" value={ban.id} />
								<button type="submit" class="delete-btn">解除</button>
							</form>
						</td>
					</tr>
				{/each}
				{#if data.bannedIps.length === 0}
					<tr>
						<td colspan="5" class="empty">規制中のIPはありません</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</section>

	<footer class="footer">
		<a href="/search?q=闇金情報スレ">← トップページに戻る</a>
	</footer>
</div>

<style>
	.container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 20px;
		font-family: 'Meiryo', 'MS PGothic', sans-serif;
		font-size: 14px;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding-bottom: 15px;
		border-bottom: 2px solid #333;
	}

	.header h1 {
		font-size: 20px;
		margin: 0;
	}

	.logout-btn {
		padding: 8px 16px;
		border: 1px solid #666;
		background: #f0f0f0;
		cursor: pointer;
	}

	.alert {
		padding: 12px;
		margin-bottom: 15px;
		border-radius: 4px;
	}

	.alert.error {
		background: #ffebee;
		color: #c62828;
	}

	.alert.success {
		background: #e8f5e9;
		color: #2e7d32;
	}

	.section {
		background: #fff;
		padding: 20px;
		margin-bottom: 20px;
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	.section h2 {
		font-size: 16px;
		margin: 0 0 15px;
		padding-bottom: 10px;
		border-bottom: 1px solid #ddd;
	}

	.section h3 {
		font-size: 14px;
		margin: 20px 0 10px;
	}

	.form-row {
		margin-bottom: 12px;
	}

	.form-row.inline {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.form-row label {
		display: block;
		margin-bottom: 4px;
		font-weight: bold;
		font-size: 13px;
	}

	.form-row.inline label {
		margin-bottom: 0;
	}

	.form-row input[type="text"],
	.form-row input[type="number"],
	.form-row textarea,
	.form-row select {
		width: 100%;
		max-width: 400px;
		padding: 6px 10px;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 13px;
		font-family: inherit;
	}

	.form-row.inline input {
		width: auto;
	}

	button[type="submit"] {
		padding: 8px 20px;
		border: 1px solid #333;
		background: #4a90d9;
		color: #fff;
		cursor: pointer;
		font-size: 13px;
		border-radius: 4px;
	}

	button[type="submit"]:hover {
		background: #3a7bc8;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 10px;
	}

	.data-table th,
	.data-table td {
		padding: 8px 12px;
		border: 1px solid #ddd;
		text-align: left;
		font-size: 13px;
	}

	.data-table th {
		background: #f5f5f5;
		font-weight: bold;
	}

	.data-table a {
		color: #0000cc;
		text-decoration: none;
	}

	.data-table a:hover {
		text-decoration: underline;
	}

	.inline-form {
		display: inline;
	}

	.delete-btn {
		padding: 4px 10px;
		border: 1px solid #c62828;
		background: #ffebee;
		color: #c62828;
		cursor: pointer;
		font-size: 12px;
		border-radius: 4px;
	}

	.delete-btn:hover {
		background: #ffcdd2;
	}

	.empty {
		text-align: center;
		color: #666;
	}

	.footer {
		margin-top: 30px;
		padding-top: 15px;
		border-top: 1px solid #ddd;
	}

	.footer a {
		color: #0000cc;
		text-decoration: none;
	}

	.footer a:hover {
		text-decoration: underline;
	}
</style>
