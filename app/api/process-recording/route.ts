import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { sessionId, recordingUrl } = await request.json()

    console.log('Processing recording for session:', sessionId)

    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const { data: formTemplates, error: formError } = await supabase
      .from('form_templates')
      .select('*')
      .eq('supervisor_id', session.supervisor_id)

console.log('Form templates found:', formTemplates?.length, 'Error:', formError?.message)
console.log('Looking for supervisor_id:', session.supervisor_id)

const formTemplate = formTemplates?.[0]

if (!formTemplate) {
  return NextResponse.json({ error: 'No form template found', supervisorId: session.supervisor_id, formError: formError?.message }, { status: 404 })
}

    console.log('Submitting to AssemblyAI...')
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
      }),
    })

    const submitData = await submitResponse.json()
    const transcriptId = submitData.id

    console.log('Transcript ID:', transcriptId)

    let transcript = null
    let attempts = 0

    while (attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { 'Authorization': process.env.ASSEMBLYAI_API_KEY! },
      })
      
      const pollData = await pollResponse.json()
      console.log('Transcript status:', pollData.status)

      if (pollData.status === 'completed') {
        transcript = pollData
        break
      } else if (pollData.status === 'error') {
        return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
      }

      attempts++
    }

    if (!transcript) {
      return NextResponse.json({ error: 'Transcription timed out' }, { status: 500 })
    }

    const fullTranscript = transcript.utterances
      ? transcript.utterances.map((u: { speaker: string, text: string }) => `Speaker ${u.speaker}: ${u.text}`).join('\n')
      : transcript.text

    console.log('Transcript ready, filling forms...')

    for (const studentName of session.students) {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `You are helping fill in a clinical supervision form for a student named ${studentName}.

Here is the transcript from the supervision session:
${fullTranscript}

Please fill in the following form fields based on what was discussed about ${studentName} in the transcript. If a field cannot be determined, write "Not discussed in this session".

Form fields:
${formTemplate.fields.map((f: string) => `- ${f}`).join('\n')}

Respond ONLY with a valid JSON object where each key is the field name and the value is what should be filled in. No explanation, just JSON.`,
        }],
      })

      const content = message.content[0]
      if (content.type !== 'text') continue

      let formData
      try {
        formData = JSON.parse(content.text)
      } catch {
        formData = { note: content.text }
      }

      await supabase.from('generated_forms').insert({
        session_id: sessionId,
        student_name: studentName,
        form_data: formData,
        status: 'pending',
      })

      console.log(`Form generated for ${studentName}`)
    }

    await supabase.from('sessions').update({ status: 'complete' }).eq('id', sessionId)

    return NextResponse.json({ success: true, message: 'Forms generated successfully' })

  } catch (error) {
    console.log('Processing error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}