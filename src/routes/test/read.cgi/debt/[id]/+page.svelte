<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let name = $state('');
	let email = $state('');
	let body = $state('');
	let persona = $state(1);
	let isSubmitting = $state(false);

	function handleSubmit() {
		isSubmitting = true;
		return async ({ result }: { result: { type: string } }) => {
			if (result.type === 'success') {
				body = '';
				await invalidateAll();
			}
			isSubmitting = false;
		};
	}
</script>

<svelte:head>
	<title>{data.thread.title}</title>
</svelte:head>

<div class="container">
	<header class="header">
		<div class="breadcrumb">
			<a href="/search?q=闇金情報スレ">5ちゃんねる</a>
			<span class="separator">⇒</span>
			<span>借金生活(仮)</span>
		</div>
		<div class="header-right">
			<a href="/admin" class="admin-link">UPLIFT ログイン</a>
		</div>
	</header>

	<div class="thread-info">
		<span class="post-count">{data.thread.postCount}コメント</span>
		<span class="size">{data.size}</span>
	</div>

	<h1 class="thread-title">{data.thread.title}</h1>

	<div class="external-links">
		<span class="link-red">スレをまとめに</span>
		<span class="link-text">5ch即うp → gzo.ai</span>
	</div>

	<nav class="nav">
		<a href="#all">全部</a>
		<a href="#prev100">前100</a>
		<a href="#next100">次100</a>
		<a href="#latest50">最新50</a>
	</nav>

	<div class="posts">
		{#each data.posts as post}
			<article class="post" id="post-{post.postNumber}">
				<div class="post-header">
					<div class="post-header-left">
						<span class="post-number">{post.postNumber}</span>
						<span class="post-name">
							{#if post.isAdmin}
								<span class="admin-mark">★</span>
							{/if}
							{post.name}{#if post.trip}<span class="trip">{post.trip}</span>{/if}
						</span>
						<span class="post-date">{post.createdAt}</span>
					</div>
					<div class="post-header-right">
						<span class="post-links">垢版 | 大砲</span>
						<span class="post-id">ID:{post.userId}</span>
					</div>
				</div>
				<div class="post-body">
					{#if post.isDeleted}
						<span class="deleted">このレスは削除されました</span>
					{:else}
						{@html post.body}
					{/if}
				</div>
			</article>
		{/each}
	</div>

	{#if !data.thread.isArchived && data.thread.postCount < 1000}
		<section class="post-form-section">
			<h2>書き込み</h2>
			<form method="POST" action="?/post" use:enhance={handleSubmit} class="post-form">
				<div class="form-row">
					<label for="name">名前:</label>
					<input type="text" id="name" name="name" bind:value={name} placeholder="名無しさん＠お腹いっぱい。" />
				</div>
				<div class="form-row">
					<label for="email">E-mail:</label>
					<input type="text" id="email" name="email" bind:value={email} placeholder="sage" />
				</div>
				{#if data.isAdmin}
				<div class="form-row">
					<label for="persona">ペルソナ:</label>
					<select id="persona" name="persona" bind:value={persona}>
						<option value={1}>ペルソナ 1</option>
						<option value={2}>ペルソナ 2</option>
						<option value={3}>ペルソナ 3</option>
						<option value={4}>ペルソナ 4</option>
						<option value={5}>ペルソナ 5</option>
					</select>
					<span class="hint">※管理者専用</span>
				</div>
				{/if}
				<div class="form-row">
					<label for="body">本文:</label>
					<textarea id="body" name="body" bind:value={body} rows="5" required></textarea>
				</div>
				<div class="form-row">
					<button type="submit" disabled={isSubmitting}>
						{isSubmitting ? '書き込み中...' : '書き込む'}
					</button>
				</div>
			</form>
		</section>
	{:else if data.thread.postCount >= 1000}
		<div class="thread-archived">
			<p>このスレッドは1000レスを超えたため書き込みできません。</p>
			<p>次スレをお待ちください。</p>
		</div>
	{/if}

	<footer class="footer">
		<a href="/search?q=闇金情報スレ">← スレッド一覧に戻る</a>
	</footer>
</div>

<style>
	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 10px;
		font-family: 'MS PGothic', 'Meiryo', sans-serif;
		font-size: 14px;
		color: #333;
		background: #efefef;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}

	.breadcrumb {
		font-size: 13px;
	}

	.breadcrumb a {
		color: #0000cc;
		text-decoration: none;
	}

	.breadcrumb a:hover {
		text-decoration: underline;
	}

	.separator {
		margin: 0 5px;
		color: #666;
	}

	.admin-link {
		color: #0000cc;
		text-decoration: none;
		font-size: 12px;
	}

	.thread-info {
		text-align: center;
		font-size: 13px;
		color: #666;
		margin-bottom: 5px;
	}

	.post-count {
		margin-right: 20px;
	}

	.thread-title {
		font-size: 18px;
		font-weight: bold;
		margin: 10px 0;
		color: #333;
	}

	.external-links {
		text-align: center;
		margin: 15px 0;
		font-size: 13px;
	}

	.link-red {
		color: #ff0000;
		margin-right: 20px;
	}

	.link-text {
		color: #800080;
	}

	.nav {
		text-align: center;
		margin: 15px 0;
		padding: 10px 0;
		border-top: 1px solid #ccc;
		border-bottom: 1px solid #ccc;
	}

	.nav a {
		color: #0000cc;
		text-decoration: underline;
		margin: 0 15px;
	}

	.posts {
		margin: 20px 0;
	}

	.post {
		margin-bottom: 20px;
		padding: 10px 0;
		border-bottom: 1px dotted #ccc;
	}

	.post-header {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		margin-bottom: 5px;
	}

	.post-header-left {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: baseline;
	}

	.post-number {
		color: #333;
		font-weight: bold;
	}

	.post-name {
		color: #008000;
		font-weight: bold;
	}

	.admin-mark {
		color: #ff0000;
	}

	.trip {
		color: #008000;
	}

	.post-date {
		color: #666;
		font-size: 13px;
	}

	.post-header-right {
		display: flex;
		gap: 15px;
		font-size: 13px;
	}

	.post-links {
		color: #666;
	}

	.post-id {
		color: #333;
	}

	.post-body {
		margin-top: 8px;
		line-height: 1.6;
		word-break: break-word;
	}

	.post-body :global(.anchor) {
		color: #0000cc;
		text-decoration: none;
	}

	.post-body :global(.anchor:hover) {
		text-decoration: underline;
	}

	.deleted {
		color: #999;
		font-style: italic;
	}

	.post-form-section {
		background: #f5f5f5;
		padding: 15px;
		margin: 20px 0;
		border: 1px solid #ccc;
	}

	.post-form-section h2 {
		font-size: 14px;
		margin-bottom: 10px;
	}

	.form-row {
		margin-bottom: 10px;
		display: flex;
		align-items: flex-start;
	}

	.form-row label {
		width: 60px;
		font-size: 13px;
	}

	.form-row input[type="text"] {
		flex: 1;
		max-width: 300px;
		padding: 4px 8px;
		border: 1px solid #ccc;
		font-size: 13px;
	}

	.form-row textarea {
		flex: 1;
		max-width: 500px;
		padding: 4px 8px;
		border: 1px solid #ccc;
		font-size: 13px;
		font-family: inherit;
	}

	.form-row button {
		padding: 6px 20px;
		border: 1px solid #666;
		background: #f0f0f0;
		cursor: pointer;
		font-size: 13px;
	}

	.form-row button:hover {
		background: #e0e0e0;
	}

	.form-row button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.thread-archived {
		background: #fff3cd;
		border: 1px solid #ffc107;
		padding: 15px;
		margin: 20px 0;
		text-align: center;
	}

	.footer {
		margin-top: 30px;
		padding: 15px 0;
		border-top: 1px solid #ccc;
	}

	.footer a {
		color: #0000cc;
		text-decoration: none;
	}

	.footer a:hover {
		text-decoration: underline;
	}

	.form-row select {
		padding: 4px 8px;
		border: 1px solid #ccc;
		font-size: 13px;
	}

	.hint {
		font-size: 12px;
		color: #666;
		margin-left: 10px;
	}
</style>
