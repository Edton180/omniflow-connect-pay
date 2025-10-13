import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItem {
  product_id: string;
  quantity: number;
  variations?: any[];
  optionals?: any[];
  notes?: string;
}

interface OrderRequest {
  tenant_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  delivery_address?: any;
  items: OrderItem[];
  payment_method: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const orderData: OrderRequest = await req.json();

    console.log('Processando pedido para tenant:', orderData.tenant_id);

    // 1. Buscar configurações do tenant
    const { data: settings } = await supabase
      .from('catalog_order_settings')
      .select('*')
      .eq('tenant_id', orderData.tenant_id)
      .maybeSingle();

    // 2. Buscar configurações de comissão
    const { data: commissionConfig } = await supabase
      .from('global_catalog_settings')
      .select('*')
      .maybeSingle();

    // 3. Calcular valores dos itens
    let subtotal = 0;
    const processedItems = [];

    for (const item of orderData.items) {
      const { data: product } = await supabase
        .from('catalog_products')
        .select('*')
        .eq('id', item.product_id)
        .single();

      if (!product) {
        throw new Error(`Produto ${item.product_id} não encontrado`);
      }

      // Calcular preço com variações
      let itemPrice = parseFloat(product.price);
      
      if (item.variations && item.variations.length > 0) {
        for (const variation of item.variations) {
          itemPrice += parseFloat(variation.price || 0);
        }
      }

      // Adicionar opcionais
      let optionalsTotal = 0;
      if (item.optionals && item.optionals.length > 0) {
        for (const optional of item.optionals) {
          optionalsTotal += parseFloat(optional.price || 0) * (optional.quantity || 1);
        }
      }

      const itemSubtotal = (itemPrice + optionalsTotal) * item.quantity;
      subtotal += itemSubtotal;

      processedItems.push({
        product_id: product.id,
        product_name: product.name,
        product_price: itemPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        variations: item.variations || [],
        optionals: item.optionals || [],
        notes: item.notes || null,
      });
    }

    // 4. Calcular frete
    const deliveryFee = settings?.default_delivery_fee || 0;
    const freeDeliveryAbove = settings?.free_delivery_above;
    const finalDeliveryFee = (freeDeliveryAbove && subtotal >= freeDeliveryAbove) ? 0 : deliveryFee;

    // 5. Verificar valor mínimo
    if (settings?.min_order_value && subtotal < settings.min_order_value) {
      return new Response(
        JSON.stringify({ 
          error: `Valor mínimo do pedido é R$ ${settings.min_order_value.toFixed(2)}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalAmount = subtotal + finalDeliveryFee;

    // 6. Calcular comissões
    const commissionPercent = commissionConfig?.commission_percent || 5;
    const platformCommission = totalAmount * (commissionPercent / 100);
    const tenantAmount = totalAmount - platformCommission;

    // 7. Criar pedido
    const { data: order, error: orderError } = await supabase
      .from('catalog_orders')
      .insert({
        tenant_id: orderData.tenant_id,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email || null,
        customer_phone: orderData.customer_phone || null,
        delivery_address: orderData.delivery_address || null,
        delivery_fee: finalDeliveryFee,
        total_amount: totalAmount,
        platform_commission_percent: commissionPercent,
        platform_commission_amount: platformCommission,
        tenant_amount: tenantAmount,
        payment_gateway: orderData.payment_method,
        status: 'pending',
        currency: 'BRL',
        notes: orderData.notes || null,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 8. Criar itens do pedido
    const itemsToInsert = processedItems.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from('catalog_order_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    console.log('Pedido criado:', order.id, order.order_number);

    // 9. Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        order_number: order.order_number,
        total_amount: totalAmount,
        message: settings?.order_message || 'Pedido realizado com sucesso!',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro ao processar pedido:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
