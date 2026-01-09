import { createHash } from 'crypto';

/**
 * ユーザーID生成（日替わり）
 * IP + 日付 + シークレットからハッシュを生成
 */
export function generateUserId(ip: string): string {
	const secret = process.env.SECRET_KEY || 'default-secret-key';
	const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
	const hash = createHash('sha256').update(`${ip}${today}${secret}`).digest('hex');
	return hash.substring(0, 9); // 9文字（末尾に0を付与する形式を想定）
}

/**
 * ペルソナID生成（管理者用・日替わり）
 * ペルソナ番号 + 日付 + シークレットからハッシュを生成
 * 一般ユーザーと同じ形式のIDを生成するが、別人として振る舞える
 */
export function generatePersonaId(personaNumber: number): string {
	const secret = process.env.SECRET_KEY || 'default-secret-key';
	const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
	const hash = createHash('sha256').update(`persona${personaNumber}${today}${secret}`).digest('hex');
	return hash.substring(0, 9);
}

/**
 * トリップ生成
 * 名前#パスワード形式からトリップを生成
 */
export function generateTrip(password: string): string {
	const hash = createHash('sha256').update(password).digest('base64');
	// Base64から英数字のみを抽出して10文字
	const trip = hash.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
	return `◆${trip}`;
}

/**
 * 名前とトリップを分離
 * "名前#パスワード" → { name: "名前", trip: "◆xxxxx" }
 */
export function parseName(input: string): { name: string; trip: string | null } {
	const match = input.match(/^(.*)#(.+)$/);
	if (match) {
		const name = match[1] || '名無しさん＠お腹いっぱい。';
		const trip = generateTrip(match[2]);
		return { name, trip };
	}
	return { name: input || '名無しさん＠お腹いっぱい。', trip: null };
}

/**
 * 勢い計算
 * レス数 / 経過日数
 */
export function calculateMomentum(postCount: number, createdAt: Date): number {
	const now = new Date();
	const diffMs = now.getTime() - createdAt.getTime();
	const diffDays = diffMs / (1000 * 60 * 60 * 24);
	return postCount / Math.max(diffDays, 0.01); // 0除算防止
}
