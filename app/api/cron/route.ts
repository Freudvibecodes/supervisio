import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const now = new Date()
    
    const torontoOffset = -4 * 60
    const torontoTime = new Date(now.getTime() + torontoOffset * 60 * 1000)
    const fiveMinutesFromNow = new Date(torontoTime.getTime() + 5 * 60 * 1000)

    const currentDate = torontoTime.toISOString().split('T')[0]
    const currentHour = torontoTime.getUTCHours().toString().padStart(2, '0')
    const currentMinute = torontoTime.getUTCMinutes().toString().padStart(2, '0')
    const fiveMinHour = fiveMinutesFromNow.getUTCHours().toString().padStart(2, '0')
    const fiveMinMinute = fiveMinutesFromNow.getUTCMinutes().toString().padStart(2, '0')

    const currentTime = `${currentHour}:${currentMinute}`
    const fiveMinTime = `${fiveMinHour}:${fiveMinMinute}`

    console.log(`Checking for sessions between ${currentTime} and ${fiveMinTime} on ${currentDate}`)

    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('date', currentDate)
      .eq('status', 'scheduled')
      .gte('time', currentTime)
      .lte('time', fiveMinTime)

    console.log(`Found ${sessions?.length || 0} sessions`)

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ 
        message: 'No sessions to start',
        checked: { date: currentDate, from: currentTime, to: fiveMinTime }
      })
    }

    for (const session of sessions) {
      if (!session.zoom_link) continue

      const botResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/bot`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meetingUrl: session.zoom_link,
            sessionId: session.id,
          }),
        }
      )

      const botData = await botResponse.json()

      if (botData.botId) {
        await supabase
          .from('sessions')
          .update({ status: 'live' })
          .eq('id', session.id)

        console.log(`Bot joined session ${session.id}`)
      }
    }

    return NextResponse.json({ message: 'Cron job completed' })

  } catch (error) {
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}