<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { form } = $props();
	let username = $state('');
	let password = $state('');
	let isSubmitting = $state(false);

	function handleSubmit() {
		isSubmitting = true;
		return async ({ result, update }) => {
			isSubmitting = false;
			if (result.type === 'redirect') {
				await goto(result.location);
			} else {
				await update();
			}
		};
	}
</script>

<svelte:head>
	<title>管理者ログイン</title>
</svelte:head>

<div class="container">
	<div class="login-box">
		<h1>管理者ログイン</h1>

		{#if form?.error}
			<div class="error">{form.error}</div>
		{/if}

		<form method="POST" action="?/login" use:enhance={handleSubmit}>
			<div class="form-row">
				<label for="username">ユーザー名:</label>
				<input
					type="text"
					id="username"
					name="username"
					bind:value={username}
					required
					autofocus
				/>
			</div>
			<div class="form-row">
				<label for="password">パスワード:</label>
				<input
					type="password"
					id="password"
					name="password"
					bind:value={password}
					required
				/>
			</div>
			<div class="form-row">
				<button type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'ログイン中...' : 'ログイン'}
				</button>
			</div>
		</form>

		<div class="back-link">
			<a href="/search?q=闇金情報スレ">← トップページに戻る</a>
		</div>
	</div>
</div>

<style>
	.container {
		min-height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		background: #f5f5f5;
		font-family: 'MS PGothic', 'Meiryo', sans-serif;
	}

	.login-box {
		background: #fff;
		padding: 30px;
		border: 1px solid #ccc;
		border-radius: 4px;
		width: 100%;
		max-width: 400px;
	}

	h1 {
		font-size: 18px;
		margin-bottom: 20px;
		text-align: center;
	}

	.error {
		background: #ffebee;
		color: #c62828;
		padding: 10px;
		margin-bottom: 15px;
		border-radius: 4px;
		font-size: 14px;
	}

	.form-row {
		margin-bottom: 15px;
	}

	.form-row label {
		display: block;
		margin-bottom: 5px;
		font-size: 14px;
	}

	.form-row input {
		width: 100%;
		padding: 8px 12px;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 14px;
		box-sizing: border-box;
	}

	.form-row button {
		width: 100%;
		padding: 10px;
		border: none;
		border-radius: 4px;
		background: #4a90d9;
		color: #fff;
		font-size: 14px;
		cursor: pointer;
	}

	.form-row button:hover {
		background: #3a7bc8;
	}

	.form-row button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.back-link {
		margin-top: 20px;
		text-align: center;
		font-size: 13px;
	}

	.back-link a {
		color: #0000cc;
		text-decoration: none;
	}

	.back-link a:hover {
		text-decoration: underline;
	}
</style>
