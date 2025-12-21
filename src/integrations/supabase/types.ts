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
      ai_knowledge_base: {
        Row: {
          answer: string | null
          category: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          priority: number | null
          question: string | null
          tags: string[] | null
          tenant_id: string
          title: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          answer?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          priority?: number | null
          question?: string | null
          tags?: string[] | null
          tenant_id: string
          title?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          answer?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          priority?: number | null
          question?: string | null
          tags?: string[] | null
          tenant_id?: string
          title?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_base_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          name: string
          tenant_id: string
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name: string
          tenant_id: string
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name?: string
          tenant_id?: string
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automations_tenant_id_fkey"
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
      broadcast_campaigns: {
        Row: {
          channel_id: string
          completed_at: string | null
          contact_filter: Json | null
          created_at: string | null
          created_by: string | null
          delivered_count: number | null
          failed_count: number | null
          id: string
          media_type: string | null
          media_url: string | null
          message: string | null
          name: string
          read_count: number | null
          scheduled_at: string | null
          sent_count: number | null
          started_at: string | null
          status: string
          template_name: string | null
          template_params: Json | null
          tenant_id: string
          total_contacts: number | null
          updated_at: string | null
        }
        Insert: {
          channel_id: string
          completed_at?: string | null
          contact_filter?: Json | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message?: string | null
          name: string
          read_count?: number | null
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string
          template_name?: string | null
          template_params?: Json | null
          tenant_id: string
          total_contacts?: number | null
          updated_at?: string | null
        }
        Update: {
          channel_id?: string
          completed_at?: string | null
          contact_filter?: Json | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message?: string | null
          name?: string
          read_count?: number | null
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string
          template_name?: string | null
          template_params?: Json | null
          tenant_id?: string
          total_contacts?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_campaigns_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agent_performance"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "broadcast_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_recipients: {
        Row: {
          campaign_id: string
          contact_id: string
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          read_at: string | null
          sent_at: string | null
          status: string | null
          waba_message_id: string | null
        }
        Insert: {
          campaign_id: string
          contact_id: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          waba_message_id?: string | null
        }
        Update: {
          campaign_id?: string
          contact_id?: string
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          waba_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "broadcast_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
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
      channel_sync_status: {
        Row: {
          channel_id: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          is_syncing: boolean | null
          last_synced_at: string | null
          progress: number | null
          started_at: string | null
          sync_type: string
          synced_items: number | null
          tenant_id: string
          total_items: number | null
          updated_at: string | null
        }
        Insert: {
          channel_id: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_syncing?: boolean | null
          last_synced_at?: string | null
          progress?: number | null
          started_at?: string | null
          sync_type?: string
          synced_items?: number | null
          tenant_id: string
          total_items?: number | null
          updated_at?: string | null
        }
        Update: {
          channel_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_syncing?: boolean | null
          last_synced_at?: string | null
          progress?: number | null
          started_at?: string | null
          sync_type?: string
          synced_items?: number | null
          tenant_id?: string
          total_items?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_sync_status_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_sync_status_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      chatbot_intents: {
        Row: {
          action: string | null
          confidence_threshold: number | null
          created_at: string | null
          description: string | null
          examples: Json | null
          id: string
          is_active: boolean | null
          name: string
          response: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          action?: string | null
          confidence_threshold?: number | null
          created_at?: string | null
          description?: string | null
          examples?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          response?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          action?: string | null
          confidence_threshold?: number | null
          created_at?: string | null
          description?: string | null
          examples?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          response?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_intents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_settings: {
        Row: {
          ai_provider: string | null
          auto_improve_enabled: boolean | null
          auto_summary_enabled: boolean | null
          auto_translate_enabled: boolean | null
          created_at: string | null
          default_confidence_threshold: number | null
          default_model: string | null
          enabled_channels: Json | null
          fallback_message: string | null
          id: string
          is_active: boolean | null
          max_tokens: number | null
          personality_prompt: string | null
          rate_limit: number | null
          suggestions_count: number | null
          suggestions_enabled: boolean | null
          suggestions_tone: string | null
          temperature: number | null
          tenant_id: string
          tone: string | null
          transfer_message: string | null
          updated_at: string | null
          welcome_message: string | null
        }
        Insert: {
          ai_provider?: string | null
          auto_improve_enabled?: boolean | null
          auto_summary_enabled?: boolean | null
          auto_translate_enabled?: boolean | null
          created_at?: string | null
          default_confidence_threshold?: number | null
          default_model?: string | null
          enabled_channels?: Json | null
          fallback_message?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          personality_prompt?: string | null
          rate_limit?: number | null
          suggestions_count?: number | null
          suggestions_enabled?: boolean | null
          suggestions_tone?: string | null
          temperature?: number | null
          tenant_id: string
          tone?: string | null
          transfer_message?: string | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Update: {
          ai_provider?: string | null
          auto_improve_enabled?: boolean | null
          auto_summary_enabled?: boolean | null
          auto_translate_enabled?: boolean | null
          created_at?: string | null
          default_confidence_threshold?: number | null
          default_model?: string | null
          enabled_channels?: Json | null
          fallback_message?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          personality_prompt?: string | null
          rate_limit?: number | null
          suggestions_count?: number | null
          suggestions_enabled?: boolean | null
          suggestions_tone?: string | null
          temperature?: number | null
          tenant_id?: string
          tone?: string | null
          transfer_message?: string | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_sessions: {
        Row: {
          created_at: string | null
          error_message: string | null
          expires_at: string | null
          external_id: string | null
          gateway: string
          id: string
          invoice_id: string | null
          metadata: Json | null
          qr_code: string | null
          retry_count: number | null
          status: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          external_id?: string | null
          gateway: string
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          qr_code?: string | null
          retry_count?: number | null
          status?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          external_id?: string | null
          gateway?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          qr_code?: string | null
          retry_count?: number | null
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
      contact_notes: {
        Row: {
          contact_id: string
          content: string
          created_at: string | null
          created_by: string
          id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          contact_id: string
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          contact_id?: string
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agent_performance"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "contact_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_notes_tenant_id_fkey"
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
      gateway_customers: {
        Row: {
          created_at: string | null
          customer_data: Json | null
          gateway: string
          gateway_customer_id: string
          id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_data?: Json | null
          gateway: string
          gateway_customer_id: string
          id?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_data?: Json | null
          gateway?: string
          gateway_customer_id?: string
          id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gateway_customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      global_themes: {
        Row: {
          accent_color: string | null
          background_gradient: string | null
          created_at: string | null
          css_overrides: Json | null
          description: string | null
          end_date: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          primary_color: string
          secondary_color: string
          slug: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          background_gradient?: string | null
          created_at?: string | null
          css_overrides?: Json | null
          description?: string | null
          end_date?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          primary_color: string
          secondary_color: string
          slug: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          background_gradient?: string | null
          created_at?: string | null
          css_overrides?: Json | null
          description?: string | null
          end_date?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          primary_color?: string
          secondary_color?: string
          slug?: string
          start_date?: string | null
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
            referencedRelation: "agent_performance"
            referencedColumns: ["agent_id"]
          },
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
            referencedRelation: "agent_performance"
            referencedColumns: ["agent_id"]
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
      invoice_notifications: {
        Row: {
          created_at: string | null
          delivery_method: string
          error_message: string | null
          id: string
          invoice_id: string | null
          notification_type: string
          sent_at: string | null
          status: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_method: string
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          notification_type: string
          sent_at?: string | null
          status?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_method?: string
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          notification_type?: string
          sent_at?: string | null
          status?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_notifications_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_notifications_tenant_id_fkey"
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
          proof_file_url: string | null
          proof_submitted_at: string | null
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
          proof_file_url?: string | null
          proof_submitted_at?: string | null
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
          proof_file_url?: string | null
          proof_submitted_at?: string | null
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
          accent_color: string | null
          benefit_1_description: string | null
          benefit_1_title: string | null
          benefit_2_description: string | null
          benefit_2_title: string | null
          benefit_3_description: string | null
          benefit_3_title: string | null
          benefit_4_description: string | null
          benefit_4_title: string | null
          created_at: string | null
          cta_button_text: string | null
          cta_subtitle: string | null
          cta_title: string | null
          favicon_url: string | null
          feature_1_description: string
          feature_1_icon: string
          feature_1_title: string
          feature_2_description: string
          feature_2_icon: string
          feature_2_title: string
          feature_3_description: string
          feature_3_icon: string
          feature_3_title: string
          feature_4_description: string | null
          feature_4_icon: string | null
          feature_4_title: string | null
          footer_company_description: string | null
          footer_link_1_text: string | null
          footer_link_1_url: string | null
          footer_link_2_text: string | null
          footer_link_2_url: string | null
          footer_link_3_text: string | null
          footer_link_3_url: string | null
          footer_link_4_text: string | null
          footer_link_4_url: string | null
          footer_text: string
          hero_cta_text: string
          hero_image_url: string | null
          hero_subtitle: string
          hero_title: string
          id: string
          legal_cookies_url: string | null
          legal_privacy_url: string | null
          legal_terms_url: string | null
          logo_url: string | null
          meta_description: string | null
          og_image_url: string | null
          pricing_subtitle: string
          pricing_title: string
          primary_color: string
          secondary_color: string
          social_github_url: string | null
          social_linkedin_url: string | null
          social_twitter_url: string | null
          stats_1_label: string | null
          stats_1_value: string | null
          stats_2_label: string | null
          stats_2_value: string | null
          stats_3_label: string | null
          stats_3_value: string | null
          support_contact_url: string | null
          support_docs_url: string | null
          support_help_url: string | null
          support_status_url: string | null
          testimonial_1_author: string | null
          testimonial_1_avatar: string | null
          testimonial_1_role: string | null
          testimonial_1_text: string | null
          testimonial_2_author: string | null
          testimonial_2_avatar: string | null
          testimonial_2_role: string | null
          testimonial_2_text: string | null
          testimonial_3_author: string | null
          testimonial_3_avatar: string | null
          testimonial_3_role: string | null
          testimonial_3_text: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          benefit_1_description?: string | null
          benefit_1_title?: string | null
          benefit_2_description?: string | null
          benefit_2_title?: string | null
          benefit_3_description?: string | null
          benefit_3_title?: string | null
          benefit_4_description?: string | null
          benefit_4_title?: string | null
          created_at?: string | null
          cta_button_text?: string | null
          cta_subtitle?: string | null
          cta_title?: string | null
          favicon_url?: string | null
          feature_1_description?: string
          feature_1_icon?: string
          feature_1_title?: string
          feature_2_description?: string
          feature_2_icon?: string
          feature_2_title?: string
          feature_3_description?: string
          feature_3_icon?: string
          feature_3_title?: string
          feature_4_description?: string | null
          feature_4_icon?: string | null
          feature_4_title?: string | null
          footer_company_description?: string | null
          footer_link_1_text?: string | null
          footer_link_1_url?: string | null
          footer_link_2_text?: string | null
          footer_link_2_url?: string | null
          footer_link_3_text?: string | null
          footer_link_3_url?: string | null
          footer_link_4_text?: string | null
          footer_link_4_url?: string | null
          footer_text?: string
          hero_cta_text?: string
          hero_image_url?: string | null
          hero_subtitle?: string
          hero_title?: string
          id?: string
          legal_cookies_url?: string | null
          legal_privacy_url?: string | null
          legal_terms_url?: string | null
          logo_url?: string | null
          meta_description?: string | null
          og_image_url?: string | null
          pricing_subtitle?: string
          pricing_title?: string
          primary_color?: string
          secondary_color?: string
          social_github_url?: string | null
          social_linkedin_url?: string | null
          social_twitter_url?: string | null
          stats_1_label?: string | null
          stats_1_value?: string | null
          stats_2_label?: string | null
          stats_2_value?: string | null
          stats_3_label?: string | null
          stats_3_value?: string | null
          support_contact_url?: string | null
          support_docs_url?: string | null
          support_help_url?: string | null
          support_status_url?: string | null
          testimonial_1_author?: string | null
          testimonial_1_avatar?: string | null
          testimonial_1_role?: string | null
          testimonial_1_text?: string | null
          testimonial_2_author?: string | null
          testimonial_2_avatar?: string | null
          testimonial_2_role?: string | null
          testimonial_2_text?: string | null
          testimonial_3_author?: string | null
          testimonial_3_avatar?: string | null
          testimonial_3_role?: string | null
          testimonial_3_text?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          benefit_1_description?: string | null
          benefit_1_title?: string | null
          benefit_2_description?: string | null
          benefit_2_title?: string | null
          benefit_3_description?: string | null
          benefit_3_title?: string | null
          benefit_4_description?: string | null
          benefit_4_title?: string | null
          created_at?: string | null
          cta_button_text?: string | null
          cta_subtitle?: string | null
          cta_title?: string | null
          favicon_url?: string | null
          feature_1_description?: string
          feature_1_icon?: string
          feature_1_title?: string
          feature_2_description?: string
          feature_2_icon?: string
          feature_2_title?: string
          feature_3_description?: string
          feature_3_icon?: string
          feature_3_title?: string
          feature_4_description?: string | null
          feature_4_icon?: string | null
          feature_4_title?: string | null
          footer_company_description?: string | null
          footer_link_1_text?: string | null
          footer_link_1_url?: string | null
          footer_link_2_text?: string | null
          footer_link_2_url?: string | null
          footer_link_3_text?: string | null
          footer_link_3_url?: string | null
          footer_link_4_text?: string | null
          footer_link_4_url?: string | null
          footer_text?: string
          hero_cta_text?: string
          hero_image_url?: string | null
          hero_subtitle?: string
          hero_title?: string
          id?: string
          legal_cookies_url?: string | null
          legal_privacy_url?: string | null
          legal_terms_url?: string | null
          logo_url?: string | null
          meta_description?: string | null
          og_image_url?: string | null
          pricing_subtitle?: string
          pricing_title?: string
          primary_color?: string
          secondary_color?: string
          social_github_url?: string | null
          social_linkedin_url?: string | null
          social_twitter_url?: string | null
          stats_1_label?: string | null
          stats_1_value?: string | null
          stats_2_label?: string | null
          stats_2_value?: string | null
          stats_3_label?: string | null
          stats_3_value?: string | null
          support_contact_url?: string | null
          support_docs_url?: string | null
          support_help_url?: string | null
          support_status_url?: string | null
          testimonial_1_author?: string | null
          testimonial_1_avatar?: string | null
          testimonial_1_role?: string | null
          testimonial_1_text?: string | null
          testimonial_2_author?: string | null
          testimonial_2_avatar?: string | null
          testimonial_2_role?: string | null
          testimonial_2_text?: string | null
          testimonial_3_author?: string | null
          testimonial_3_avatar?: string | null
          testimonial_3_role?: string | null
          testimonial_3_text?: string | null
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
          is_private: boolean | null
          media_type: string | null
          media_url: string | null
          mentioned_users: string[] | null
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
          is_private?: boolean | null
          media_type?: string | null
          media_url?: string | null
          mentioned_users?: string[] | null
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
          is_private?: boolean | null
          media_type?: string | null
          media_url?: string | null
          mentioned_users?: string[] | null
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
      n8n_configs: {
        Row: {
          api_key: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          tenant_id: string
          triggers: Json | null
          updated_at: string | null
          webhook_url: string
        }
        Insert: {
          api_key?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          tenant_id: string
          triggers?: Json | null
          updated_at?: string | null
          webhook_url: string
        }
        Update: {
          api_key?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          tenant_id?: string
          triggers?: Json | null
          updated_at?: string | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "n8n_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
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
          customer_email: string | null
          customer_name: string | null
          failure_reason: string | null
          gateway_payment_id: string | null
          gateway_response: Json | null
          id: string
          paid_at: string | null
          payment_gateway: string
          payment_method: string | null
          refund_amount: number | null
          refunded_at: string | null
          status: string
          subscription_id: string | null
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          failure_reason?: string | null
          gateway_payment_id?: string | null
          gateway_response?: Json | null
          id?: string
          paid_at?: string | null
          payment_gateway: string
          payment_method?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          status?: string
          subscription_id?: string | null
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          failure_reason?: string | null
          gateway_payment_id?: string | null
          gateway_response?: Json | null
          id?: string
          paid_at?: string | null
          payment_gateway?: string
          payment_method?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
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
      pre_chat_forms: {
        Row: {
          channel_id: string
          created_at: string | null
          fields: Json
          id: string
          is_active: boolean | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          fields?: Json
          id?: string
          is_active?: boolean | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          fields?: Json
          id?: string
          is_active?: boolean | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_chat_forms_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_chat_forms_tenant_id_fkey"
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
          current_ticket_count: number | null
          full_name: string
          id: string
          max_concurrent_tickets: number | null
          phone: string | null
          setup_completed: boolean | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_ticket_count?: number | null
          full_name: string
          id: string
          max_concurrent_tickets?: number | null
          phone?: string | null
          setup_completed?: boolean | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_ticket_count?: number | null
          full_name?: string
          id?: string
          max_concurrent_tickets?: number | null
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
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
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
      ticket_ai_sessions: {
        Row: {
          created_at: string | null
          id: string
          is_ai_active: boolean | null
          reason: string | null
          returned_to_ai_at: string | null
          taken_over_at: string | null
          taken_over_by: string | null
          tenant_id: string
          ticket_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_ai_active?: boolean | null
          reason?: string | null
          returned_to_ai_at?: string | null
          taken_over_at?: string | null
          taken_over_by?: string | null
          tenant_id: string
          ticket_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_ai_active?: boolean | null
          reason?: string | null
          returned_to_ai_at?: string | null
          taken_over_at?: string | null
          taken_over_by?: string | null
          tenant_id?: string
          ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_ai_sessions_taken_over_by_fkey"
            columns: ["taken_over_by"]
            isOneToOne: false
            referencedRelation: "agent_performance"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "ticket_ai_sessions_taken_over_by_fkey"
            columns: ["taken_over_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_ai_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_ai_sessions_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_metrics: {
        Row: {
          agent_id: string | null
          agent_message_count: number | null
          channel: string
          contact_message_count: number | null
          created_at: string | null
          first_response_time_seconds: number | null
          id: string
          message_count: number | null
          resolution_time_seconds: number | null
          resolved_at: string | null
          tenant_id: string
          ticket_id: string
          transfer_count: number | null
          wait_time_seconds: number | null
        }
        Insert: {
          agent_id?: string | null
          agent_message_count?: number | null
          channel: string
          contact_message_count?: number | null
          created_at?: string | null
          first_response_time_seconds?: number | null
          id?: string
          message_count?: number | null
          resolution_time_seconds?: number | null
          resolved_at?: string | null
          tenant_id: string
          ticket_id: string
          transfer_count?: number | null
          wait_time_seconds?: number | null
        }
        Update: {
          agent_id?: string | null
          agent_message_count?: number | null
          channel?: string
          contact_message_count?: number | null
          created_at?: string | null
          first_response_time_seconds?: number | null
          id?: string
          message_count?: number | null
          resolution_time_seconds?: number | null
          resolved_at?: string | null
          tenant_id?: string
          ticket_id?: string
          transfer_count?: number | null
          wait_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ticket_metrics_ticket"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_metrics_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_performance"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "ticket_metrics_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_metrics_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
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
            referencedRelation: "agent_performance"
            referencedColumns: ["agent_id"]
          },
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
      typing_indicators: {
        Row: {
          conversation_user_id: string | null
          id: string
          team_id: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_user_id?: string | null
          id?: string
          team_id?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_user_id?: string | null
          id?: string
          team_id?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_conversation_user_id_fkey"
            columns: ["conversation_user_id"]
            isOneToOne: false
            referencedRelation: "agent_performance"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "typing_indicators_conversation_user_id_fkey"
            columns: ["conversation_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_indicators_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_indicators_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_indicators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "agent_performance"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "typing_indicators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          is_online: boolean | null
          last_seen: string | null
          status: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          is_online?: boolean | null
          last_seen?: string | null
          status?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          is_online?: boolean | null
          last_seen?: string | null
          status?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "agent_performance"
            referencedColumns: ["agent_id"]
          },
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
      waba_templates: {
        Row: {
          category: string
          channel_id: string
          components: Json | null
          created_at: string | null
          id: string
          language: string
          last_synced_at: string | null
          rejected_reason: string | null
          status: string
          template_id: string
          template_name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          channel_id: string
          components?: Json | null
          created_at?: string | null
          id?: string
          language?: string
          last_synced_at?: string | null
          rejected_reason?: string | null
          status?: string
          template_id: string
          template_name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          channel_id?: string
          components?: Json | null
          created_at?: string | null
          id?: string
          language?: string
          last_synced_at?: string | null
          rejected_reason?: string | null
          status?: string
          template_id?: string
          template_name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waba_templates_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waba_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_configs: {
        Row: {
          created_at: string | null
          gateway: string
          id: string
          is_active: boolean | null
          tenant_id: string | null
          updated_at: string | null
          webhook_token: string
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          gateway: string
          id?: string
          is_active?: boolean | null
          tenant_id?: string | null
          updated_at?: string | null
          webhook_token: string
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          gateway?: string
          id?: string
          is_active?: boolean | null
          tenant_id?: string | null
          updated_at?: string | null
          webhook_token?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string | null
          event_type: string
          gateway: string
          id: string
          last_retry_at: string | null
          payload: Json
          processed_at: string | null
          retry_count: number
          signature: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          event_type: string
          gateway: string
          id?: string
          last_retry_at?: string | null
          payload: Json
          processed_at?: string | null
          retry_count?: number
          signature?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          event_type?: string
          gateway?: string
          id?: string
          last_retry_at?: string | null
          payload?: Json
          processed_at?: string | null
          retry_count?: number
          signature?: string | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      agent_performance: {
        Row: {
          agent_id: string | null
          avg_resolution_min: number | null
          avg_satisfaction: number | null
          closed_tickets: number | null
          full_name: string | null
          tenant_id: string | null
          total_tickets: number | null
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
      payment_statistics: {
        Row: {
          average_payment: number | null
          failed_payments: number | null
          month: string | null
          payment_gateway: string | null
          successful_payments: number | null
          tenant_id: string | null
          total_payments: number | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_tenant_id_fkey"
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
      ensure_webhook_idempotency:
        | {
            Args: {
              p_event_id: string
              p_event_type: string
              p_gateway: string
              p_payload: Json
            }
            Returns: string
          }
        | {
            Args: { p_event_id: string; p_gateway: string; p_payload: Json }
            Returns: boolean
          }
      get_agent_performance: {
        Args: { p_tenant_id?: string }
        Returns: {
          agent_id: string
          avg_resolution_min: number
          avg_satisfaction: number
          closed_tickets: number
          full_name: string
          tenant_id: string
          total_tickets: number
        }[]
      }
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
      log_audit: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_new_data?: Json
          p_old_data?: Json
        }
        Returns: string
      }
      mark_webhook_processed: {
        Args: {
          p_error_message?: string
          p_event_id: string
          p_gateway: string
          p_success: boolean
        }
        Returns: undefined
      }
      notify_due_invoices: { Args: never; Returns: undefined }
      notify_overdue_invoices: { Args: never; Returns: undefined }
      process_invoice_payment:
        | { Args: { invoice_id_param: string }; Returns: Json }
        | {
            Args: {
              p_gateway?: string
              p_gateway_payment_id?: string
              p_invoice_id: string
              p_payment_id?: string
            }
            Returns: Json
          }
      sanitize_text_input: { Args: { input_text: string }; Returns: string }
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
