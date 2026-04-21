import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { sessionId, recordingUrl } = await request.json()

    console.log('Submitting recording for session:', sessionId)

    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const submitResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': process.env.ASSEMBLYAI_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: recordingUrl,
        speaker_labels: true,
        speakers_expected: session.students.length + 1,
        speech_model: 'universal-2',
      }),
    })

    const submitData = await submitResponse.json()
    console.log('AssemblyAI response:', JSON.stringify(submitData))

    if (!submitData.id) {
      return NextResponse.json({ error: 'Failed to submit to AssemblyAI', detail: submitData }, { status: 500 })
    }

    await supabase.from('sessions').update({
      transcript_id: submitData.id,
      status: 'processing',
    }).eq('id', sessionId)

    return NextResponse.json({ 
      success: true, 
      message: 'Recording submitted for processing',
      transcriptId: submitData.id
    })

  } catch (error) {
    console.log('Submit error:', error)
    return NextResponse.json({ error: 'Failed to submit recording' }, { status: 500 })
  }
}