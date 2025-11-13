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
      ai_configs: {
        Row: {
          api_key_encrypted: string
          created_at: string | null
          id: string
          is_active: boolean | null
          provider: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          api_key_encrypted: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          api_key_encrypted?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
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
      channel_configs: {
        Row: {
          api_key_encrypted: string | null
          api_url: string | null
          config: Json | null
          config_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          api_url?: string | null
          config?: Json | null
          config_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          api_url?: string | null
          config?: Json | null
          config_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_menus: {
        Row: {
          channel_id: string
          created_at: string | null
          description: string | null
          greeting_message: string | null
          id: string
          is_active: boolean | null
          level: number
          name: string
          offline_message: string | null
          parent_menu_id: string | null
          position: number | null
          timeout_message: string | null
          timeout_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          description?: string | null
          greeting_message?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          name: string
          offline_message?: string | null
          parent_menu_id?: string | null
          position?: number | null
          timeout_message?: string | null
          timeout_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          description?: string | null
          greeting_message?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          name?: string
          offline_message?: string | null
          parent_menu_id?: string | null
          position?: number | null
          timeout_message?: string | null
          timeout_seconds?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_menus_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_menus_parent_menu_id_fkey"
            columns: ["parent_menu_id"]
            isOneToOne: false
            referencedRelation: "channel_menus"
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
          business_hours: Json | null
          chatbot_config: Json | null
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
          business_hours?: Json | null
          chatbot_config?: Json | null
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
          business_hours?: Json | null
          chatbot_config?: Json | null
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
      checkout_sessions: {
        Row: {
          created_at: string | null
          external_id: string | null
          gateway: string
          id: string
          invoice_id: string | null
          qr_code: string | null
          status: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          external_id?: string | null
          gateway: string
          id?: string
          invoice_id?: string | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          external_id?: string | null
          gateway?: string
          id?: string
          invoice_id?: string | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
      conversation_metadata: {
        Row: {
          channel_id: string
          contact_id: string
          created_at: string | null
          id: string
          menu_id: string | null
          menu_item_id: string | null
          metadata: Json | null
          routed_target_id: string | null
          routed_to: string | null
          routed_via: string | null
          ticket_id: string
          user_choice: string | null
        }
        Insert: {
          channel_id: string
          contact_id: string
          created_at?: string | null
          id?: string
          menu_id?: string | null
          menu_item_id?: string | null
          metadata?: Json | null
          routed_target_id?: string | null
          routed_to?: string | null
          routed_via?: string | null
          ticket_id: string
          user_choice?: string | null
        }
        Update: {
          channel_id?: string
          contact_id?: string
          created_at?: string | null
          id?: string
          menu_id?: string | null
          menu_item_id?: string | null
          metadata?: Json | null
          routed_target_id?: string | null
          routed_to?: string | null
          routed_via?: string | null
          ticket_id?: string
          user_choice?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_metadata_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_metadata_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_metadata_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "channel_menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_metadata_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_metadata_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
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
      evaluation_settings: {
        Row: {
          auto_send_on_close: boolean | null
          created_at: string | null
          enabled: boolean | null
          id: string
          message_template: string | null
          rating_scale: number | null
          tenant_id: string
          thank_you_message: string | null
          updated_at: string | null
        }
        Insert: {
          auto_send_on_close?: boolean | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          message_template?: string | null
          rating_scale?: number | null
          tenant_id: string
          thank_you_message?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_send_on_close?: boolean | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          message_template?: string | null
          rating_scale?: number | null
          tenant_id?: string
          thank_you_message?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          agent_id: string | null
          contact_id: string
          created_at: string | null
          feedback: string | null
          id: string
          score: number
          tenant_id: string
          ticket_id: string
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          contact_id: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          score: number
          tenant_id: string
          ticket_id: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          contact_id?: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          score?: number
          tenant_id?: string
          ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "fk_invoices_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
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
      menu_items: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          menu_id: string
          option_key: string
          option_label: string
          position: number | null
          target_data: Json | null
          target_id: string | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          menu_id: string
          option_key: string
          option_label: string
          position?: number | null
          target_data?: Json | null
          target_id?: string | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          menu_id?: string
          option_key?: string
          option_label?: string
          position?: number | null
          target_data?: Json | null
          target_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "channel_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          contact_id: string | null
          content: string
          created_at: string | null
          deleted_at: string | null
          id: string
          is_from_contact: boolean | null
          media_type: string | null
          media_url: string | null
          sender_id: string | null
          status: string | null
          telegram_message_id: number | null
          ticket_id: string
        }
        Insert: {
          contact_id?: string | null
          content: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_from_contact?: boolean | null
          media_type?: string | null
          media_url?: string | null
          sender_id?: string | null
          status?: string | null
          telegram_message_id?: number | null
          ticket_id: string
        }
        Update: {
          contact_id?: string | null
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_from_contact?: boolean | null
          media_type?: string | null
          media_url?: string | null
          sender_id?: string | null
          status?: string | null
          telegram_message_id?: number | null
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
          routing_message: string | null
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
          routing_message?: string | null
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
          routing_message?: string | null
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
      quick_replies: {
        Row: {
          created_at: string | null
          id: string
          message: string
          shortcut: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          shortcut: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          shortcut?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quick_replies_tenant_id_fkey"
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
      system_secrets: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          secret_name: string
          secret_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          secret_name: string
          secret_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          secret_name?: string
          secret_value?: string
          updated_at?: string
        }
        Relationships: []
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
      telegram_qr_sessions: {
        Row: {
          bot_token: string | null
          channel_id: string
          created_at: string | null
          expires_at: string
          id: string
          login_token: string
          qr_code_url: string
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          bot_token?: string | null
          channel_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          login_token: string
          qr_code_url: string
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          bot_token?: string | null
          channel_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          login_token?: string
          qr_code_url?: string
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_qr_sessions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telegram_qr_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          allow_agent_signature: boolean | null
          city: string | null
          cnpj_cpf: string | null
          created_at: string | null
          custom_css: Json | null
          custom_domain: string | null
          expiry_date: string | null
          force_agent_signature: boolean | null
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
          state: string | null
          subscription_status: string | null
          updated_at: string | null
          whatsapp: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          allow_agent_signature?: boolean | null
          city?: string | null
          cnpj_cpf?: string | null
          created_at?: string | null
          custom_css?: Json | null
          custom_domain?: string | null
          expiry_date?: string | null
          force_agent_signature?: boolean | null
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
          state?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          allow_agent_signature?: boolean | null
          city?: string | null
          cnpj_cpf?: string | null
          created_at?: string | null
          custom_css?: Json | null
          custom_domain?: string | null
          expiry_date?: string | null
          force_agent_signature?: boolean | null
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
          state?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          zip_code?: string | null
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
          bot_state: Json | null
          channel: string
          closed_at: string | null
          contact_id: string
          created_at: string | null
          evaluated_at: string | null
          evaluation_feedback: string | null
          evaluation_score: number | null
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
          bot_state?: Json | null
          channel: string
          closed_at?: string | null
          contact_id: string
          created_at?: string | null
          evaluated_at?: string | null
          evaluation_feedback?: string | null
          evaluation_score?: number | null
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
          bot_state?: Json | null
          channel?: string
          closed_at?: string | null
          contact_id?: string
          created_at?: string | null
          evaluated_at?: string | null
          evaluation_feedback?: string | null
          evaluation_score?: number | null
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
          can_takeover_ai: boolean | null
          created_at: string | null
          id: string
          is_active: boolean | null
          queue_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          can_takeover_ai?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          queue_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          can_takeover_ai?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          queue_id?: string
          role?: string | null
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
    }
    Views: {
      evaluation_rankings: {
        Row: {
          agent_id: string | null
          agent_name: string | null
          average_score: number | null
          excellent_count: number | null
          good_count: number | null
          poor_count: number | null
          tenant_id: string | null
          total_evaluations: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auto_assign_tenant: {
        Args: { _company_name?: string; _user_id: string }
        Returns: string
      }
      check_and_generate_invoices: { Args: never; Returns: undefined }
      get_users_with_emails: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          tenant_id: string
          tenant_name: string
        }[]
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      has_tenant_access: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      notify_overdue_invoices: { Args: never; Returns: undefined }
      process_invoice_payment: {
        Args: { invoice_id_param: string }
        Returns: Json
      }
      update_overdue_invoices: { Args: never; Returns: undefined }
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
