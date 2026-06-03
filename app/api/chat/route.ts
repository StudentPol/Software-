import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const anthropicKey = process.env.ANTHROPIC_API_KEY

    if (!anthropicKey) {
      return NextResponse.json(
        { error: "Falta la variable de entorno ANTHROPIC_API_KEY" }, 
        { status: 500 }
      )
    }

    const systemMessage = 'Eres el asistente virtual de Planify, una app para planificar comidas en grupo. Ayudas a los usuarios a usar la app, crear planes, entender cómo votar y das consejos sobre restaurantes. Sé amable, conciso y responde en español.'

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', 
        max_tokens: 500,
        system: systemMessage,
        messages: messages, 
      }),
    })

    const data = await res.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    return NextResponse.json({ 
      message: { 
        role: 'assistant', 
        content: data.content[0].text 
      } 
    })

  } catch (error: any) {
    console.error("Error en el chatbot:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}