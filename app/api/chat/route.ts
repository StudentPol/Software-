import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const geminiKey = process.env.GEMINI_API_KEY

    if (!geminiKey) {
      return NextResponse.json(
        { error: "Falta la variable de entorno GEMINI_API_KEY en Vercel" }, 
        { status: 500 }
      )
    }

    const systemMessage = 'Eres el asistente virtual de Planify, una app para planificar comidas en grupo. Ayudas a los usuarios a usar la app, crear planes, entender cómo votar y das consejos sobre restaurantes. Sé amable, conciso y responde en español.'

    // 🔴 SOLUCIÓN: Gemini exige que la conversación empiece siempre por el usuario.
    // Si el primer mensaje del historial es el saludo del bot, lo ignoramos.
    let mensajesValidos = messages;
    if (mensajesValidos.length > 0 && mensajesValidos[0].role === 'assistant') {
      mensajesValidos = mensajesValidos.slice(1);
    }

    const formattedMessages = mensajesValidos.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemMessage }]
      },
      contents: formattedMessages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    }

    // Usamos el modelo gemini-1.5-flash estándar
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const data = await res.json()

    // Si Google nos devuelve un error
    if (data.error) {
      throw new Error(data.error.message)
    }

    const botReply = data.candidates[0].content.parts[0].text

    return NextResponse.json({ 
      message: { 
        role: 'assistant', 
        content: botReply
      } 
    })

  } catch (error: any) {
    console.error("Error en el chatbot:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}