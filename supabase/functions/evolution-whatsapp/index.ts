import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    const requestData = await req.json()
    const { action, channelId, instanceName } = requestData

    console.log('Evolution API action:', action, 'channelId:', channelId)

    // Get Evolution API credentials from environment
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      throw new Error('Evolution API credentials not configured. Please set EVOLUTION_API_URL and EVOLUTION_API_KEY in Supabase secrets.')
    }

    switch (action) {
      case 'create':
        return await createInstance(supabaseClient, channelId, instanceName, EVOLUTION_API_URL, EVOLUTION_API_KEY)
      case 'status':
        return await getStatus(supabaseClient, channelId, EVOLUTION_API_URL, EVOLUTION_API_KEY)
      case 'logout':
        return await logoutInstance(supabaseClient, channelId, EVOLUTION_API_URL, EVOLUTION_API_KEY)
      case 'delete':
        return await deleteInstance(supabaseClient, channelId, EVOLUTION_API_URL, EVOLUTION_API_KEY)
      case 'send':
        const { to, message } = requestData
        return await sendMessage(supabaseClient, channelId, to, message, EVOLUTION_API_URL, EVOLUTION_API_KEY)
      default:
        throw new Error('Invalid action')
    }
  } catch (error: any) {
    console.error('Error in evolution-whatsapp function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function createInstance(
  supabase: any,
  channelId: string,
  instanceName: string,
  apiUrl: string,
  apiKey: string
) {
  console.log('Creating Evolution API instance for channel:', channelId)

  try {
    // Check if instance already exists in our database
    const { data: existingSession } = await supabase
      .from('baileys_sessions')
      .select('*')
      .eq('channel_id', channelId)
      .maybeSingle()

    // Delete old session if exists
    if (existingSession) {
      await supabase
        .from('baileys_sessions')
        .delete()
        .eq('channel_id', channelId)
    }

    // Create instance in Evolution API
    const response = await fetch(`${apiUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Evolution API error:', errorText)
      throw new Error(`Evolution API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Evolution API response:', data)

    // Fetch QR code
    const qrResponse = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
      },
    })

    let qrCode = ''
    if (qrResponse.ok) {
      const qrData = await qrResponse.json()
      qrCode = qrData.code || qrData.qrcode?.code || ''
    }

    // Save session in database
    const { error: dbError } = await supabase
      .from('baileys_sessions')
      .insert({
        channel_id: channelId,
        status: 'qr',
        qr_code: qrCode,
        session_data: { instance_name: instanceName },
        updated_at: new Date().toISOString(),
      })

    if (dbError) throw dbError

    return new Response(
      JSON.stringify({
        status: 'qr',
        qr_code: qrCode,
        instance_name: instanceName,
        message: 'Instância criada. Escaneie o QR Code.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error creating instance:', error)
    throw error
  }
}

async function getStatus(
  supabase: any,
  channelId: string,
  apiUrl: string,
  apiKey: string
) {
  console.log('Getting status for channel:', channelId)

  try {
    const { data: session } = await supabase
      .from('baileys_sessions')
      .select('*')
      .eq('channel_id', channelId)
      .maybeSingle()

    if (!session) {
      return new Response(
        JSON.stringify({
          status: 'disconnected',
          phone_number: null,
          qr_code: null,
          instance_name: null,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const instanceName = session.session_data?.instance_name

    if (instanceName) {
      // Check status in Evolution API
      const response = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const isConnected = data.state === 'open'

        if (isConnected && session.status !== 'connected') {
          // Update status in database
          await supabase
            .from('baileys_sessions')
            .update({
              status: 'connected',
              phone_number: data.instance?.number || null,
              updated_at: new Date().toISOString(),
            })
            .eq('channel_id', channelId)

          return new Response(
            JSON.stringify({
              status: 'connected',
              phone_number: data.instance?.number || null,
              instance_name: instanceName,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
      }
    }

    return new Response(
      JSON.stringify({
        status: session.status,
        phone_number: session.phone_number,
        qr_code: session.qr_code,
        instance_name: instanceName,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error getting status:', error)
    throw error
  }
}

async function logoutInstance(
  supabase: any,
  channelId: string,
  apiUrl: string,
  apiKey: string
) {
  console.log('Logging out instance for channel:', channelId)

  try {
    const { data: session } = await supabase
      .from('baileys_sessions')
      .select('*')
      .eq('channel_id', channelId)
      .maybeSingle()

    if (session?.session_data?.instance_name) {
      const instanceName = session.session_data.instance_name

      // Logout in Evolution API
      await fetch(`${apiUrl}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': apiKey,
        },
      })
    }

    // Update status in database
    await supabase
      .from('baileys_sessions')
      .update({
        status: 'disconnected',
        qr_code: null,
        phone_number: null,
        updated_at: new Date().toISOString(),
      })
      .eq('channel_id', channelId)

    return new Response(
      JSON.stringify({ status: 'disconnected', message: 'Desconectado com sucesso' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error logging out:', error)
    throw error
  }
}

async function deleteInstance(
  supabase: any,
  channelId: string,
  apiUrl: string,
  apiKey: string
) {
  console.log('Deleting instance for channel:', channelId)

  try {
    const { data: session } = await supabase
      .from('baileys_sessions')
      .select('*')
      .eq('channel_id', channelId)
      .maybeSingle()

    if (session?.session_data?.instance_name) {
      const instanceName = session.session_data.instance_name

      // Delete in Evolution API
      await fetch(`${apiUrl}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': apiKey,
        },
      })
    }

    // Delete from database
    await supabase
      .from('baileys_sessions')
      .delete()
      .eq('channel_id', channelId)

    return new Response(
      JSON.stringify({ status: 'deleted', message: 'Instância deletada com sucesso' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error deleting instance:', error)
    throw error
  }
}

async function sendMessage(
  supabase: any,
  channelId: string,
  to: string,
  message: string,
  apiUrl: string,
  apiKey: string
) {
  console.log('Sending message via Evolution API for channel:', channelId)

  try {
    const { data: session } = await supabase
      .from('baileys_sessions')
      .select('*')
      .eq('channel_id', channelId)
      .maybeSingle()

    if (!session?.session_data?.instance_name) {
      throw new Error('Instância não encontrada ou não conectada')
    }

    const instanceName = session.session_data.instance_name

    // Send message via Evolution API
    const response = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: to,
        text: message,
      }),
    })

    if (!response.ok) {
      throw new Error(`Erro ao enviar mensagem: ${response.status}`)
    }

    const data = await response.json()

    return new Response(
      JSON.stringify({ success: true, message: 'Mensagem enviada', data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error sending message:', error)
    throw error
  }
}
