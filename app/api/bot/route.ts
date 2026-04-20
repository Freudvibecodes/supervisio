import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { meetingUrl, sessionId } = await request.json()

    const response = await fetch('https://us-west-2.recall.ai/api/v1/bot', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.RECALL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meeting_url: meetingUrl,
        bot_name: 'Supervisio',
        transcription_options: {
          provider: 'assembly_ai',
        },
        metadata: {
          session_id: sessionId,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: response.status })
    }

    return NextResponse.json({ botId: data.id })

  } catch (error) {
    return NextResponse.json({ error: 'Failed to create bot' }, { status: 500 })
  }
}