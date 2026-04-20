import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.event !== 'bot.status_change') {
      return NextResponse.json({ received: true })
    }

    const botId = body.data?.bot_id
    const status = body.data?.status?.code

    if (status !== 'done') {
      return NextResponse.json({ received: true })
    }

    const transcriptResponse = await fetch(
      `https://us-west-2.recall.ai/api/v1/bot/${botId}/transcript`,
      {
        headers: {
          'Authorization': `Token ${process.env.RECALL_API_KEY}`,
        },
      }
    )

    const transcriptData = await transcriptResponse.json()

    const transcript = transcriptData
      .map((t: { speaker: string; words: { text: string }[] }) =>
        `${t.speaker}: ${t.words.map((w: { text: string }) => w.text).join(' ')}`
      )
      .join('\n')

    const sessionId = body.data?.metadata?.session_id

    if (!sessionId) {
      return NextResponse.json({ received: true })
    }

    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (!session) {
      return NextResponse.json({ received: true })
    }

    const { data: formTemplate } = await supabase
      .from('form_templates')
      .select('*')
      .eq('supervisor_id', session.supervisor_id)
      .single()

    if (!formTemplate) {
      return NextResponse.json({ received: true })
    }

    for (const student of session.students) {
      const fillResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/fill-form`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript,
            studentName: student,
            formFields: formTemplate.fields,
          }),
        }
      )

      const { formData } = await fillResponse.json()

      await supabase.from('generated_forms').insert({
        session_id: sessionId,
        student_name: student,
        form_data: formData,
        status: 'pending',
      })
    }

    await supabase
      .from('sessions')
      .update({ status: 'complete' })
      .eq('id', sessionId)

    return NextResponse.json({ received: true })

  } catch (error) {
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}