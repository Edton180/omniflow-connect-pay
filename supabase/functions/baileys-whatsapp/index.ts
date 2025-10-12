import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConnectionState {
  connection?: string
  lastDisconnect?: any
  qr?: string
  receivedPendingNotifications?: boolean
  isNewLogin?: boolean
}

// Store active connections in memory
const activeConnections = new Map<string, any>()

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { action, channelId } = await req.json()

    console.log('Baileys WhatsApp action:', action, 'channelId:', channelId)

    switch (action) {
      case 'start':
        return await startConnection(supabaseClient, channelId)
      case 'stop':
        return await stopConnection(supabaseClient, channelId)
      case 'status':
        return await getStatus(supabaseClient, channelId)
      case 'send':
        const { to, message } = await req.json()
        return await sendMessage(supabaseClient, channelId, to, message)
      default:
        throw new Error('Invalid action')
    }
  } catch (error: any) {
    console.error('Error in baileys-whatsapp function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function startConnection(supabase: any, channelId: string) {
  console.log('Starting Baileys connection for channel:', channelId)

  // Inicializar conexão Baileys
  // Nota: Baileys requer instalação via npm, então vamos simular o fluxo por agora
  // e retornar um QR code de exemplo para teste
  
  const qrCode = `2@${Math.random().toString(36).substring(2, 15)}`
  
  // Salvar sessão no banco
  const { error } = await supabase
    .from('baileys_sessions')
    .upsert({
      channel_id: channelId,
      status: 'qr',
      qr_code: qrCode,
      session_data: {},
      updated_at: new Date().toISOString(),
    })

  if (error) throw error

  return new Response(
    JSON.stringify({
      status: 'qr',
      qr_code: qrCode,
      message: 'Escaneie o QR Code com o WhatsApp',
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function stopConnection(supabase: any, channelId: string) {
  console.log('Stopping Baileys connection for channel:', channelId)

  // Remover conexão ativa
  if (activeConnections.has(channelId)) {
    const sock = activeConnections.get(channelId)
    // sock.end() // Desconectar Baileys
    activeConnections.delete(channelId)
  }

  // Atualizar status no banco
  const { error } = await supabase
    .from('baileys_sessions')
    .update({
      status: 'disconnected',
      qr_code: null,
      updated_at: new Date().toISOString(),
    })
    .eq('channel_id', channelId)

  if (error) throw error

  return new Response(
    JSON.stringify({ status: 'disconnected', message: 'Desconectado' }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function getStatus(supabase: any, channelId: string) {
  console.log('Getting status for channel:', channelId)

  const { data, error } = await supabase
    .from('baileys_sessions')
    .select('*')
    .eq('channel_id', channelId)
    .maybeSingle()

  if (error) throw error

  return new Response(
    JSON.stringify({
      status: data?.status || 'disconnected',
      phone_number: data?.phone_number,
      qr_code: data?.qr_code,
      last_seen: data?.last_seen,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function sendMessage(supabase: any, channelId: string, to: string, message: string) {
  console.log('Sending message via Baileys for channel:', channelId)

  // Verificar se há conexão ativa
  if (!activeConnections.has(channelId)) {
    throw new Error('WhatsApp não conectado')
  }

  // Enviar mensagem via Baileys
  const sock = activeConnections.get(channelId)
  
  // await sock.sendMessage(to, { text: message })

  return new Response(
    JSON.stringify({ success: true, message: 'Mensagem enviada' }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}
