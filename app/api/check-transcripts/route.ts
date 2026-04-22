import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function GET() {
  try {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('status', 'processing')
      .not('transcript_id', 'is', null)

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ message: 'No sessions processing' })
    }

    console.log(`Checking ${sessions.length} sessions`)

    for (const session of sessions) {
      const pollResponse = await fetch(
        `https://api.assemblyai.com/v2/transcript/${session.transcript_id}`,
        { headers: { 'Authorization': process.env.ASSEMBLYAI_API_KEY! } }
      )

      const pollData = await pollResponse.json()
      console.log(`Session ${session.id} transcript status: ${pollData.status}`)

      if (pollData.status === 'completed') {
        const fullTranscript = pollData.utterances
          ? pollData.utterances.map((u: { speaker: string, text: string }) =>
              `Speaker ${u.speaker}: ${u.text}`).join('\n')
          : pollData.text

        const { data: formTemplates } = await supabase
          .from('form_templates')
          .select('*')
          .eq('supervisor_id', session.supervisor_id)

        const formTemplate = formTemplates?.[0]

        if (!formTemplate) {
          console.log('No form template found for session', session.id)
          await supabase.from('sessions').update({ status: 'failed' }).eq('id', session.id)
          continue
        }

        for (const studentName of session.students) {
          const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            messages: [{
              role: 'user',
              content: `You are helping fill in a clinical supervision form for a student named ${studentName}.

Here is the transcript from the supervision session:
${fullTranscript}

Please fill in the following form fields based on what was discussed about ${studentName} in the transcript. If a field cannot be determined from the transcript, write "Not discussed in this session".

Form fields:
${formTemplate.fields.map((f: string) => `- ${f}`).join('\n')}

Rules:
- Respond ONLY with a raw JSON object
- Do NOT wrap in markdown code blocks
- Do NOT include backticks or the word json
- Each key must exactly match the field name
- Each value should be a clear, professional sentence or two
- Never use bullet points inside values

Example format:
{"Field name": "Professional answer here", "Another field": "Another answer here"}`,
            }],
          })

          const content = message.content[0]
          if (content.type !== 'text') continue

          let formData
          try {
            const cleaned = content.text
              .replace(/```json\n?/gi, '')
              .replace(/```\n?/gi, '')
              .trim()
            formData = JSON.parse(cleaned)
          } catch {
            formData = { note: content.text }
          }

          await supabase.from('generated_forms').insert({
            session_id: session.id,
            student_name: studentName,
            form_data: formData,
            status: 'pending',
          })

          console.log(`Form generated for ${studentName}`)
        }

        await supabase.from('sessions').update({ status: 'complete' }).eq('id', session.id)
        console.log(`Session ${session.id} complete`)

      } else if (pollData.status === 'error') {
        console.log(`Transcript error: ${pollData.error}`)
        await supabase.from('sessions').update({ status: 'failed' }).eq('id', session.id)
      }
    }

    return NextResponse.json({ message: 'Check complete', checked: sessions.length })

  } catch (error) {
    console.log('Check error:', error)
    return NextResponse.json({ error: 'Check failed' }, { status: 500 })
  }
}