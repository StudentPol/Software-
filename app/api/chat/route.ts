import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const groqKey = process.env.GROQ_API_KEY

    if (!groqKey) {
      throw new Error("Falta la variable de entorno GROQ_API_KEY en Vercel")
    }

    const systemMessage = 'Eres el asistente virtual de Planify, una app para planificar comidas en grupo. Ayudas a crear planes, votar y das consejos de restaurantes. Responde en español, de forma amable y directa. Sé conciso: máximo 3-4 frases por respuesta.'

    const historial = (messages as { role: string; content: string }[])
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }))

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // gratis, rápido, sin tarjeta
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemMessage },
          ...historial,
        ],
      }),
    })

    const data = await res.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    const botReply = data.choices[0].message.content.trim()

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: botReply,
      }
    })

  } catch (error: any) {
    console.error("Error en el backend del chat:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}