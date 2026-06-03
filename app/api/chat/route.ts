import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const geminiKey = process.env.GEMINI_API_KEY

    if (!geminiKey) {
      throw new Error("Falta la variable de entorno GEMINI_API_KEY en Vercel")
    }

    // 1. Extraemos SOLO el último mensaje que ha escrito el usuario
    const ultimoMensaje = messages[messages.length - 1].content

    // 2. Preparamos el contexto
    const systemMessage = 'Eres el asistente virtual de Planify, una app para planificar comidas en grupo. Ayudas a crear planes, votar y das consejos de restaurantes. Responde en español, de forma amable y directa.'
    const promptFinal = `[Instrucciones para ti: ${systemMessage}]\n\nPregunta del usuario: ${ultimoMensaje}`

    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{ text: promptFinal }]
      }]
    }

    // AHORA SÍ: Usamos gemini-pro que es la versión universal
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    const data = await res.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("Google no devolvió ninguna respuesta válida.")
    }

    const botReply = data.candidates[0].content.parts[0].text

    return NextResponse.json({ 
      message: { 
        role: 'assistant', 
        content: botReply
      } 
    })

  } catch (error: any) {
    console.error("Error en el backend del chat:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}