import { NextResponse } from 'next/server'

// Sets the default tenant selection for the current user session
export async function POST(request: Request) {
	try {
		const body = await request.json().catch(() => ({}))
		// Minimal server-side action: echo back the selection so client can confirm
		const { tenantId } = body || {}
		return NextResponse.json({ success: true, tenantId: tenantId || null })
	} catch (error: any) {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
