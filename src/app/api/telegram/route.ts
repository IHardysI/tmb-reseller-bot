import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BOT_TOKEN = process.env.BOT_TOKEN
const APP_URL = process.env.NEXT_PUBLIC_APP_URL
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: any) {
	if (!BOT_TOKEN) return NextResponse.json({ message: 'BOT_TOKEN is not configured' }, { status: 500 })
	const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ chat_id: chatId, text, reply_markup: replyMarkup }),
		cache: 'no-store',
	})
	return res
}

export async function POST(req: NextRequest) {
	try {
		if (WEBHOOK_SECRET) {
			const header = req.headers.get('x-telegram-bot-api-secret-token')
			if (header !== WEBHOOK_SECRET) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
		}
		const update = await req.json().catch(() => null)
		if (!update) return NextResponse.json({ ok: true })
		const message = update.message || update.edited_message
		if (!message) return NextResponse.json({ ok: true })
		const chatId = message.chat?.id
		const text: string | undefined = message.text
		if (!chatId) return NextResponse.json({ ok: true })
		if (text && text.startsWith('/start')) {
			const url = APP_URL ? APP_URL : ''
			const replyMarkup = url
				? { inline_keyboard: [[{ text: 'Open Reseller App', web_app: { url } }]] }
				: undefined
			await sendTelegramMessage(chatId, 'Welcome to Reseller App', replyMarkup)
			return NextResponse.json({ ok: true })
		}
		return NextResponse.json({ ok: true })
	} catch (e: any) {
		return NextResponse.json({ message: e?.message || 'Internal error' }, { status: 500 })
	}
}

export async function GET(req: NextRequest) {
	try {
		const url = new URL(req.url)
		const op = url.searchParams.get('op')
		if (op === 'setWebhook') {
			if (!BOT_TOKEN) return NextResponse.json({ message: 'BOT_TOKEN is not configured' }, { status: 500 })
			const secret = url.searchParams.get('secret')
			if ((WEBHOOK_SECRET || '') !== (secret || '')) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
			const webhookUrlBase = APP_URL
			if (!webhookUrlBase) return NextResponse.json({ message: 'NEXT_PUBLIC_APP_URL is not configured' }, { status: 500 })
			const webhookUrl = `${webhookUrlBase.replace(/\/$/, '')}/api/telegram`
			const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: webhookUrl, secret_token: WEBHOOK_SECRET || undefined, drop_pending_updates: true }),
				cache: 'no-store',
			})
			const data = await res.json().catch(() => null)
			return NextResponse.json({ ok: true, telegram: data })
		}
		return NextResponse.json({ ok: true })
	} catch (e: any) {
		return NextResponse.json({ message: e?.message || 'Internal error' }, { status: 500 })
	}
}

