export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      baileys_sessions: {
        Row: {
          channel_id: string
          created_at: string | null
          id: string
          last_seen: string | null
          phone_number: string | null
          qr_code: string | null
          session_data: Json
          status: string
          updated_at: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          id?: string
          last_seen?: string | null
          phone_number?: string | null
          qr_code?: string | null
          session_data?: Json
          status?: string
          updated_at?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          id?: string
          last_seen?: string | null
          phone_number?: string | null
          qr_code?: string | null
          session_data?: Json
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "baileys_sessions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          position: number
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          position?: number
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          position?: number
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "catalog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_landing_settings: {
        Row: {
          created_at: string | null
          custom_css: Json | null
          footer_text: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          primary_color: string
          secondary_color: string
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_css?: Json | null
          footer_text?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_css?: Json | null
          footer_text?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_landing_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_order_items: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          optionals: Json | null
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          quantity: number
          subtotal: number
          variations: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          optionals?: Json | null
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          quantity?: number
          subtotal: number
          variations?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          optionals?: Json | null
          order_id?: string
          product_id?: string
          product_name?: string
          product_price?: number
          quantity?: number
          subtotal?: number
          variations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "catalog_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_products"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_order_settings: {
        Row: {
          accepts_scheduled_orders: boolean | null
          auto_print: boolean | null
          created_at: string | null
          default_delivery_fee: number | null
          free_delivery_above: number | null
          id: string
          min_order_value: number | null
          order_message: string | null
          sound_notification: boolean | null
          tenant_id: string
          updated_at: string | null
          working_hours: Json | null
        }
        Insert: {
          accepts_scheduled_orders?: boolean | null
          auto_print?: boolean | null
          created_at?: string | null
          default_delivery_fee?: number | null
          free_delivery_above?: number | null
          id?: string
          min_order_value?: number | null
          order_message?: string | null
          sound_notification?: boolean | null
          tenant_id: string
          updated_at?: string | null
          working_hours?: Json | null
        }
        Update: {
          accepts_scheduled_orders?: boolean | null
          auto_print?: boolean | null
          created_at?: string | null
          default_delivery_fee?: number | null
          free_delivery_above?: number | null
          id?: string
          min_order_value?: number | null
          order_message?: string | null
          sound_notification?: boolean | null
          tenant_id?: string
          updated_at?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_order_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_orders: {
        Row: {
          created_at: string | null
          currency: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          delivery_address: Json | null
          delivery_fee: number | null
          discount_amount: number | null
          estimated_delivery: string | null
          gateway_payment_id: string | null
          gateway_response: Json | null
          id: string
          notes: string | null
          order_number: string | null
          paid_at: string | null
          payment_gateway: string | null
          platform_commission_amount: number
          platform_commission_percent: number
          product_id: string
          quantity: number
          status: string
          tenant_amount: number
          tenant_id: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_address?: Json | null
          delivery_fee?: number | null
          discount_amount?: number | null
          estimated_delivery?: string | null
          gateway_payment_id?: string | null
          gateway_response?: Json | null
          id?: string
          notes?: string | null
          order_number?: string | null
          paid_at?: string | null
          payment_gateway?: string | null
          platform_commission_amount?: number
          platform_commission_percent?: number
          product_id: string
          quantity: number
          status?: string
          tenant_amount: number
          tenant_id: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_address?: Json | null
          delivery_fee?: number | null
          discount_amount?: number | null
          estimated_delivery?: string | null
          gateway_payment_id?: string | null
          gateway_response?: Json | null
          id?: string
          notes?: string | null
          order_number?: string | null
          paid_at?: string | null
          payment_gateway?: string | null
          platform_commission_amount?: number
          platform_commission_percent?: number
          product_id?: string
          quantity?: number
          status?: string
          tenant_amount?: number
          tenant_id?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_product_optionals: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          max_quantity: number | null
          name: string
          price: number
          product_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_quantity?: number | null
          name: string
          price?: number
          product_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_quantity?: number | null
          name?: string
          price?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_product_optionals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_products"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_product_variations: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          option_name: string
          price_adjustment: number | null
          product_id: string
          stock_quantity: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          option_name: string
          price_adjustment?: number | null
          product_id: string
          stock_quantity?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          option_name?: string
          price_adjustment?: number | null
          product_id?: string
          stock_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_products"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_products: {
        Row: {
          category_id: string | null
          created_at: string | null
          currency: string
          description: string | null
          has_variations: boolean | null
          height_cm: number | null
          highlight: boolean | null
          id: string
          image_url: string | null
          is_active: boolean | null
          length_cm: number | null
          max_quantity_per_order: number | null
          metadata: Json | null
          name: string
          preparation_time: number | null
          price: number
          stock_quantity: number | null
          tenant_id: string
          updated_at: string | null
          weight_kg: number | null
          width_cm: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          has_variations?: boolean | null
          height_cm?: number | null
          highlight?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          length_cm?: number | null
          max_quantity_per_order?: number | null
          metadata?: Json | null
          name: string
          preparation_time?: number | null
          price: number
          stock_quantity?: number | null
          tenant_id: string
          updated_at?: string | null
          weight_kg?: number | null
          width_cm?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          has_variations?: boolean | null
          height_cm?: number | null
          highlight?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          length_cm?: number | null
          max_quantity_per_order?: number | null
          metadata?: Json | null
          name?: string
          preparation_time?: number | null
          price?: number
          stock_quantity?: number | null
          tenant_id?: string
          updated_at?: string | null
          weight_kg?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "catalog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_settings: {
        Row: {
          created_at: string | null
          custom_css: Json | null
          footer_text: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_css?: Json | null
          footer_text?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_css?: Json | null
          footer_text?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_shipping_settings: {
        Row: {
          created_at: string | null
          default_height_cm: number | null
          default_length_cm: number | null
          default_weight_kg: number | null
          default_width_cm: number | null
          enable_correios_pac: boolean | null
          enable_correios_sedex: boolean | null
          enable_local_delivery: boolean | null
          handling_fee: number | null
          id: string
          local_delivery_fee: number | null
          local_delivery_zipcodes: string[] | null
          origin_zipcode: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_height_cm?: number | null
          default_length_cm?: number | null
          default_weight_kg?: number | null
          default_width_cm?: number | null
          enable_correios_pac?: boolean | null
          enable_correios_sedex?: boolean | null
          enable_local_delivery?: boolean | null
          handling_fee?: number | null
          id?: string
          local_delivery_fee?: number | null
          local_delivery_zipcodes?: string[] | null
          origin_zipcode: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_height_cm?: number | null
          default_length_cm?: number | null
          default_weight_kg?: number | null
          default_width_cm?: number | null
          enable_correios_pac?: boolean | null
          enable_correios_sedex?: boolean | null
          enable_local_delivery?: boolean | null
          handling_fee?: number | null
          id?: string
          local_delivery_fee?: number | null
          local_delivery_zipcodes?: string[] | null
          origin_zipcode?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_shipping_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_queues: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          queue_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          queue_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          queue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_queues_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_queues_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          config: Json | null
          created_at: string | null
          credentials_encrypted: string | null
          id: string
          is_default: boolean | null
          name: string
          queue_id: string | null
          status: string
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          credentials_encrypted?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          queue_id?: string | null
          status?: string
          tenant_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          credentials_encrypted?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          queue_id?: string | null
          status?: string
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          metadata: Json | null
          name: string
          phone: string | null
          tags: string[] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name: string
          phone?: string | null
          tags?: string[] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          phone?: string | null
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_columns: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          position: number
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          name: string
          position?: number
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          position?: number
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_columns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          column_id: string
          contact_id: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          position: number
          tenant_id: string
          ticket_id: string | null
          updated_at: string | null
          value: number | null
        }
        Insert: {
          column_id: string
          contact_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          position?: number
          tenant_id: string
          ticket_id?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          column_id?: string
          contact_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          position?: number
          tenant_id?: string
          ticket_id?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "crm_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      global_catalog_settings: {
        Row: {
          commission_percent: number
          created_at: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          is_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          commission_percent?: number
          created_at?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          commission_percent?: number
          created_at?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      internal_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          media_type: string | null
          media_url: string | null
          read_at: string | null
          recipient_id: string
          sender_id: string
          team_id: string | null
          tenant_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
          team_id?: string | null
          tenant_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          team_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_messages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          description: string | null
          due_date: string
          id: string
          metadata: Json | null
          paid_at: string | null
          payment_id: string | null
          status: string
          subscription_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          description?: string | null
          due_date: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_id?: string | null
          status?: string
          subscription_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          description?: string | null
          due_date?: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_id?: string | null
          status?: string
          subscription_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_settings: {
        Row: {
          created_at: string | null
          feature_1_description: string
          feature_1_icon: string
          feature_1_title: string
          feature_2_description: string
          feature_2_icon: string
          feature_2_title: string
          feature_3_description: string
          feature_3_icon: string
          feature_3_title: string
          footer_text: string
          hero_cta_text: string
          hero_image_url: string | null
          hero_subtitle: string
          hero_title: string
          id: string
          logo_url: string | null
          pricing_subtitle: string
          pricing_title: string
          primary_color: string
          secondary_color: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          feature_1_description?: string
          feature_1_icon?: string
          feature_1_title?: string
          feature_2_description?: string
          feature_2_icon?: string
          feature_2_title?: string
          feature_3_description?: string
          feature_3_icon?: string
          feature_3_title?: string
          footer_text?: string
          hero_cta_text?: string
          hero_image_url?: string | null
          hero_subtitle?: string
          hero_title?: string
          id?: string
          logo_url?: string | null
          pricing_subtitle?: string
          pricing_title?: string
          primary_color?: string
          secondary_color?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          feature_1_description?: string
          feature_1_icon?: string
          feature_1_title?: string
          feature_2_description?: string
          feature_2_icon?: string
          feature_2_title?: string
          feature_3_description?: string
          feature_3_icon?: string
          feature_3_title?: string
          footer_text?: string
          hero_cta_text?: string
          hero_image_url?: string | null
          hero_subtitle?: string
          hero_title?: string
          id?: string
          logo_url?: string | null
          pricing_subtitle?: string
          pricing_title?: string
          primary_color?: string
          secondary_color?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          contact_id: string | null
          content: string
          created_at: string | null
          id: string
          is_from_contact: boolean | null
          media_type: string | null
          media_url: string | null
          sender_id: string | null
          ticket_id: string
        }
        Insert: {
          contact_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_from_contact?: boolean | null
          media_type?: string | null
          media_url?: string | null
          sender_id?: string | null
          ticket_id: string
        }
        Update: {
          contact_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_from_contact?: boolean | null
          media_type?: string | null
          media_url?: string | null
          sender_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateways: {
        Row: {
          api_key_encrypted: string | null
          config: Json | null
          created_at: string | null
          gateway_name: string
          id: string
          is_active: boolean | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          config?: Json | null
          created_at?: string | null
          gateway_name: string
          id?: string
          is_active?: boolean | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          config?: Json | null
          created_at?: string | null
          gateway_name?: string
          id?: string
          is_active?: boolean | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_gateways_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          gateway_payment_id: string | null
          gateway_response: Json | null
          id: string
          paid_at: string | null
          payment_gateway: string
          payment_method: string | null
          status: string
          subscription_id: string | null
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          gateway_payment_id?: string | null
          gateway_response?: Json | null
          id?: string
          paid_at?: string | null
          payment_gateway: string
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          gateway_payment_id?: string | null
          gateway_response?: Json | null
          id?: string
          paid_at?: string | null
          payment_gateway?: string
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          billing_period: string
          created_at: string | null
          currency: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_tickets: number | null
          max_users: number | null
          name: string
          price: number
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          billing_period?: string
          created_at?: string | null
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_tickets?: number | null
          max_users?: number | null
          name: string
          price: number
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_period?: string
          created_at?: string | null
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_tickets?: number | null
          max_users?: number | null
          name?: string
          price?: number
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string
          id: string
          phone: string | null
          setup_completed: boolean | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name: string
          id: string
          phone?: string | null
          setup_completed?: boolean | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          setup_completed?: boolean | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      queues: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sla_minutes: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sla_minutes?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sla_minutes?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queues_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          gateway_subscription_id: string | null
          id: string
          payment_gateway: string | null
          plan_id: string
          started_at: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          gateway_subscription_id?: string | null
          id?: string
          payment_gateway?: string | null
          plan_id: string
          started_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          gateway_subscription_id?: string | null
          id?: string
          payment_gateway?: string | null
          plan_id?: string
          started_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenant_balances: {
        Row: {
          available_balance: number
          created_at: string | null
          currency: string
          id: string
          pending_balance: number
          tenant_id: string
          total_earned: number
          total_withdrawn: number
          updated_at: string | null
        }
        Insert: {
          available_balance?: number
          created_at?: string | null
          currency?: string
          id?: string
          pending_balance?: number
          tenant_id: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string | null
        }
        Update: {
          available_balance?: number
          created_at?: string | null
          currency?: string
          id?: string
          pending_balance?: number
          tenant_id?: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_balances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          custom_css: Json | null
          custom_domain: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          max_tickets: number | null
          max_users: number | null
          name: string
          plan_id: string | null
          primary_color: string | null
          secondary_color: string | null
          slug: string
          subscription_status: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string | null
          custom_css?: Json | null
          custom_domain?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_tickets?: number | null
          max_users?: number | null
          name: string
          plan_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          subscription_status?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string | null
          custom_css?: Json | null
          custom_domain?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_tickets?: number | null
          max_users?: number | null
          name?: string
          plan_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          subscription_status?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          channel: string
          closed_at: string | null
          contact_id: string
          created_at: string | null
          id: string
          last_message: string | null
          priority: string | null
          queue_id: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          channel: string
          closed_at?: string | null
          contact_id: string
          created_at?: string | null
          id?: string
          last_message?: string | null
          priority?: string | null
          queue_id?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          channel?: string
          closed_at?: string | null
          contact_id?: string
          created_at?: string | null
          id?: string
          last_message?: string | null
          priority?: string | null
          queue_id?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_queues: {
        Row: {
          created_at: string | null
          id: string
          queue_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          queue_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          queue_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_queues_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          amount: number
          bank_info: Json
          created_at: string | null
          currency: string
          id: string
          notes: string | null
          processed_at: string | null
          rejection_reason: string | null
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          bank_info: Json
          created_at?: string | null
          currency?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          rejection_reason?: string | null
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bank_info?: Json
          created_at?: string | null
          currency?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          rejection_reason?: string | null
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_assign_tenant: {
        Args: { _company_name?: string; _user_id: string }
        Returns: string
      }
      check_and_generate_invoices: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      has_tenant_access: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      process_catalog_order_payment: {
        Args: { order_id_param: string }
        Returns: Json
      }
      process_invoice_payment: {
        Args: { invoice_id_param: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "super_admin" | "tenant_admin" | "manager" | "agent" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "tenant_admin", "manager", "agent", "user"],
    },
  },
} as const
