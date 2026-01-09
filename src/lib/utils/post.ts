/**
 * HTMLエスケープ
 */
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

/**
 * アンカー処理
 * >>数字 をリンクに変換
 */
export function processAnchors(body: string, threadId: number): string {
	return body.replace(
		/&gt;&gt;(\d+)/g,
		'<a href="/test/read.cgi/debt/' + threadId + '/$1" class="anchor" data-post="$1">&gt;&gt;$1</a>'
	);
}

/**
 * URL自動リンク
 */
export function processUrls(body: string): string {
	const urlRegex = /(https?:\/\/[^\s<]+)/g;
	return body.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}

/**
 * 改行処理
 */
export function processNewlines(body: string): string {
	return body.replace(/\n/g, '<br>');
}

/**
 * 本文全体の処理
 */
export function processBody(body: string, threadId: number): string {
	let processed = escapeHtml(body);
	processed = processAnchors(processed, threadId);
	processed = processUrls(processed);
	processed = processNewlines(processed);
	return processed;
}

/**
 * 投稿サイズ計算（KB）
 */
export function calculateSize(posts: { body: string }[]): string {
	const totalBytes = posts.reduce((acc, post) => acc + new TextEncoder().encode(post.body).length, 0);
	const kb = totalBytes / 1024;
	return kb.toFixed(0) + 'KB';
}

/**
 * 日時フォーマット（5ch風）
 * 2025/12/31(水) 20:55:16.02
 */
export function formatDate(date: Date): string {
	const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const weekday = weekdays[date.getDay()];
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	const ms = String(Math.floor(date.getMilliseconds() / 10)).padStart(2, '0');

	return `${year}/${month}/${day}(${weekday}) ${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * 日時フォーマット（スレ一覧用）
 * 2026年01月07日 09:50
 */
export function formatDateShort(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');

	return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}
