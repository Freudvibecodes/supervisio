import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const mammoth = require('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    const docText = result.value

    console.log('Extracted text length:', docText.length)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are analyzing a clinical supervision form document. Extract all the field names, sections, and blanks that need to be filled in.

Here is the document text:
${docText}

Return ONLY a raw JSON array of field names that need to be filled in. No markdown, no backticks, no explanation.

Example: ["Student name", "Date of session", "Case presented", "Supervisor feedback"]

Only include fields that require written input. Do not include checkboxes or signature lines unless they need written content.`,
      }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response' }, { status: 500 })
    }

    const cleaned = content.text
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/gi, '')
      .trim()

    const fields = JSON.parse(cleaned)

    return NextResponse.json({ fields, docText })

  } catch (error) {
    console.log('Parse error:', error)
    return NextResponse.json({ error: 'Failed to parse form' }, { status: 500 })
  }
}