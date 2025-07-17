import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'; // or 'nodejs' if you need Node APIs

export async function POST(req: NextRequest) {
    // Parse the incoming form data
    const formData = await req.formData();
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof Blob)) {
        return NextResponse.json({ error: 'No audio file uploaded' }, { status: 400 });
    }

    // TODO: Integrate with speech-to-text API here
    // For now, just return a placeholder
    return NextResponse.json({ text: 'Transcription will appear here.' });
} 