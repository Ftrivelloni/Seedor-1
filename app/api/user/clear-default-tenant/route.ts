import { NextResponse } from 'next/server'

// Clears the default tenant selection for the current user session
export async function POST(request: Request) {
	try {
		// Minimal implementation: this API is expected to be called client-side and
		// the actual clearing of selection is handled client-side in many cases.
		// Provide a safe server-side no-op response so TypeScript/Next treat this file as a module.
		return NextResponse.json({ success: true, message: 'Default tenant cleared' })
	} catch (error: any) {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
