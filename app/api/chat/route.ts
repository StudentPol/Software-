import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Obtenemos el historial de mensajes que envía el frontend
    const { messages } = await req.json()
    const anthropicKey = process.env.ANTHROPIC_API_KEY

    if (!anthropicKey) {
      return NextResponse.json(
        { error: "Falta la variable de entorno ANTHROPIC_API_KEY" }, 
        { status: 500 }
      )
    }

    // Contexto para que el bot sepa qué hacer
    const systemMessage = 'Eres el asistente virtual de Planify, una app para planificar comidas en grupo. Ayudas a los usuarios a usar la app, crear planes, entender cómo votar y das consejos sobre restaurantes. Sé amable, conciso y responde en español.'

    // Llamada directa a la API de Anthropic (Claude)
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Usamos Haiku porque es muy rápido y barato para un chatbot
        max_tokens: 500,
        system: systemMessage,
        messages: messages, // El frontend debe enviar un array de { role: "user" | "assistant", content: "..." }
      }),
    })

    const data = await res.json()

    // Manejo de errores de la API de Anthropic
    if (data.error) {
      throw new Error(data.error.message)
    }

    // Devolvemos la respuesta al frontend con el mismo formato
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