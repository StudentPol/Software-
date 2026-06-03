import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const geminiKey = process.env.GEMINI_API_KEY

    if (!geminiKey) {
      throw new Error("Falta la variable de entorno GEMINI_API_KEY en Vercel")
    }

    // 1. Extraemos SOLO el último mensaje que ha escrito el usuario
    // Así evitamos que Google bloquee la respuesta por culpa del historial
    const ultimoMensaje = messages[messages.length - 1].content

    // 2. Preparamos el contexto para que sepa quién es
    const systemMessage = 'Eres el asistente virtual de Planify, una app para planificar comidas en grupo. Ayudas a crear planes, votar y das consejos de restaurantes. Responde en español, de forma amable y directa.'
    const promptFinal = `[Instrucciones para ti: ${systemMessage}]\n\nPregunta del usuario: ${ultimoMensaje}`

    // 3. Formato hiper-simplificado que Google NUNCA rechaza
    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{ text: promptFinal }]
      }]
    }

    // Usamos gemini-1.5-flash (el más rápido y actual)
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    const data = await res.json()

    // Si Google nos devuelve un error interno
    if (data.error) {
      throw new Error(data.error.message)
    }

    // Verificamos que Google no haya censurado la respuesta o devuelto vacío
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("Google no devolvió ninguna respuesta válida.")
    }

    // Extraemos el texto
    const botReply = data.candidates[0].content.parts[0].text

    // Lo enviamos de vuelta a tu frontend
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