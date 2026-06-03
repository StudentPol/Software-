import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    
    // Ahora usamos la variable de Gemini
    const geminiKey = process.env.GEMINI_API_KEY

    if (!geminiKey) {
      return NextResponse.json(
        { error: "Falta la variable de entorno GEMINI_API_KEY en Vercel" }, 
        { status: 500 }
      )
    }

    const systemMessage = 'Eres el asistente virtual de Planify, una app para planificar comidas en grupo. Ayudas a los usuarios a usar la app, crear planes, entender cómo votar y das consejos sobre restaurantes. Sé amable, conciso y responde en español.'

    // Gemini usa un formato un poco diferente ("model" en lugar de "assistant")
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))

    // Preparamos los datos para enviar a Google Gemini (usamos el modelo flash que es el más rápido)
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

    // Llamada gratuita a la API de Gemini
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`, {
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

    // Extraemos la respuesta del bot
    const botReply = data.candidates[0].content.parts[0].text

    // La devolvemos a tu frontend
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