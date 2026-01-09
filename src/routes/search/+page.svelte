<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	let searchQuery = $state(data.query);

	function handleSearch(e: Event) {
		e.preventDefault();
		goto(`/search?q=${encodeURIComponent(searchQuery)}`);
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${year}年${month}月${day}日 ${hours}:${minutes}`;
	}
</script>

<svelte:head>
	<title>{data.query} - 5ちゃんねる検索</title>
</svelte:head>

<div class="container">
	<header class="header">
		<a href="/search?q=闇金情報スレ" class="logo">5ちゃんねる</a>
		<form class="search-form" onsubmit={handleSearch}>
			<input
				type="text"
				class="search-input"
				bind:value={searchQuery}
				placeholder="検索..."
			/>
			<button type="button" class="clear-btn" onclick={() => searchQuery = ''}>×</button>
			<button type="submit" class="search-btn">🔍 検索</button>
		</form>
	</header>

	<main class="main">
		{#if data.threads.length === 0}
			<p class="no-results">スレッドがありません</p>
		{:else}
			<div class="thread-list">
				{#each data.threads as thread}
					<div class="thread-item">
						<a href="/test/read.cgi/debt/{thread.id}" class="thread-title">
							{thread.title} ({thread.postCount})
						</a>
						<div class="thread-meta">
							<span class="board-name">借金生活</span>
							<span class="thread-date">{formatDate(thread.updatedAt)}</span>
							<span class="thread-momentum">{thread.momentum.toFixed(1)}/日</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>

	<footer class="footer">
		<span>5ちゃんねる</span>
	</footer>
</div>

<style>
	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 10px;
		font-family: 'Meiryo', 'MS PGothic', sans-serif;
		font-size: 14px;
		color: #333;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 20px;
		margin-bottom: 30px;
		padding: 10px 0;
	}

	.logo {
		font-size: 24px;
		font-weight: bold;
		color: #333;
		text-decoration: none;
		font-family: 'MS PGothic', sans-serif;
	}

	.search-form {
		display: flex;
		align-items: center;
		flex: 1;
		max-width: 500px;
	}

	.search-input {
		flex: 1;
		padding: 8px 12px;
		border: 1px solid #ccc;
		border-radius: 4px 0 0 4px;
		font-size: 14px;
		outline: none;
	}

	.search-input:focus {
		border-color: #4a90d9;
	}

	.clear-btn {
		padding: 8px 12px;
		border: 1px solid #ccc;
		border-left: none;
		background: #fff;
		color: #999;
		cursor: pointer;
	}

	.clear-btn:hover {
		color: #333;
	}

	.search-btn {
		padding: 8px 16px;
		border: none;
		border-radius: 0 4px 4px 0;
		background: #4a90d9;
		color: #fff;
		cursor: pointer;
		font-size: 14px;
	}

	.search-btn:hover {
		background: #3a7bc8;
	}

	.main {
		min-height: 400px;
	}

	.no-results {
		text-align: center;
		color: #666;
		padding: 40px;
	}

	.thread-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.thread-item {
		padding: 8px 0;
	}

	.thread-title {
		color: #0000cc;
		text-decoration: none;
		font-size: 15px;
		font-weight: bold;
	}

	.thread-title:hover {
		text-decoration: underline;
	}

	.thread-title:visited {
		color: #551a8b;
	}

	.thread-meta {
		margin-top: 4px;
		font-size: 13px;
	}

	.board-name {
		color: #008000;
		margin-right: 10px;
	}

	.thread-date {
		color: #666;
		margin-right: 10px;
	}

	.thread-momentum {
		color: #ff6600;
	}

	.footer {
		margin-top: 50px;
		padding: 20px;
		text-align: right;
		color: #666;
		font-size: 12px;
	}
</style>
