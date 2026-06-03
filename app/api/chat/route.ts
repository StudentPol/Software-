import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Asegúrate de tener OPENAI_API_KEY en tu .env.local
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    // Mensaje de sistema para darle contexto al bot sobre tu app Planify
    const systemMessage = {
      role: 'system',
      content: 'Eres el asistente virtual de Planify, una app para planificar comidas en grupo. Ayudas a los usuarios a usar la app, crear planes, entender cómo votar y das consejos sobre restaurantes en diferentes zonas (Gràcia, Eixample, etc.). Sé amable y conciso.'
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // o el modelo que prefieras
      messages: [systemMessage, ...messages],
      temperature: 0.7,
    })

    return NextResponse.json({ message: response.choices[0].message })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}