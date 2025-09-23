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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          completed_at: string | null
          contact_id: string
          created_at: string
          description: string | null
          id: string
          response_received: boolean
          scheduled_for: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          contact_id: string
          created_at?: string
          description?: string | null
          id?: string
          response_received?: boolean
          scheduled_for?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string
          created_at?: string
          description?: string | null
          id?: string
          response_received?: boolean
          scheduled_for?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_weights: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          updated_at: string
          weight: number
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          weight?: number
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_credits: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          source: string | null
          status: string
          tokens_remaining: number
          tokens_total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          source?: string | null
          status?: string
          tokens_remaining: number
          tokens_total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          source?: string | null
          status?: string
          tokens_remaining?: number
          tokens_total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_requests_log: {
        Row: {
          created_at: string
          error_code: string | null
          id: string
          model: string | null
          period_start: string
          request_ms: number | null
          success: boolean | null
          tokens_completion: number | null
          tokens_prompt: number | null
          tokens_total: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          id?: string
          model?: string | null
          period_start: string
          request_ms?: number | null
          success?: boolean | null
          tokens_completion?: number | null
          tokens_prompt?: number | null
          tokens_total?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_code?: string | null
          id?: string
          model?: string | null
          period_start?: string
          request_ms?: number | null
          success?: boolean | null
          tokens_completion?: number | null
          tokens_prompt?: number | null
          tokens_total?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ai_tier_quotas: {
        Row: {
          created_at: string
          id: string
          monthly_token_quota: number
          overage_allowed: boolean
          per_request_token_limit: number
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_token_quota?: number
          overage_allowed?: boolean
          per_request_token_limit?: number
          tier: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_token_quota?: number
          overage_allowed?: boolean
          per_request_token_limit?: number
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage_monthly: {
        Row: {
          created_at: string
          id: string
          period_start: string
          requests_count: number
          tokens_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_start: string
          requests_count?: number
          tokens_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period_start?: string
          requests_count?: number
          tokens_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      badges_definition: {
        Row: {
          category: Database["public"]["Enums"]["badge_category"]
          created_at: string
          criteria: Json
          description: string | null
          icon_name: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          points_reward: number | null
          rarity: string | null
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["badge_category"]
          created_at?: string
          criteria?: Json
          description?: string | null
          icon_name: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          points_reward?: number | null
          rarity?: string | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["badge_category"]
          created_at?: string
          criteria?: Json
          description?: string | null
          icon_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          points_reward?: number | null
          rarity?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          business_name: string
          created_at: string
          id: string
          industry: string | null
          key_differentiators: string | null
          target_market: string | null
          updated_at: string
          user_id: string
          value_proposition: string | null
        }
        Insert: {
          business_name: string
          created_at?: string
          id?: string
          industry?: string | null
          key_differentiators?: string | null
          target_market?: string | null
          updated_at?: string
          user_id: string
          value_proposition?: string | null
        }
        Update: {
          business_name?: string
          created_at?: string
          id?: string
          industry?: string | null
          key_differentiators?: string | null
          target_market?: string | null
          updated_at?: string
          user_id?: string
          value_proposition?: string | null
        }
        Relationships: []
      }
      challenge_config: {
        Row: {
          created_at: string
          current_day: number
          end_date: string
          id: string
          is_active: boolean
          name: string
          start_date: string
          total_days: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_day?: number
          end_date: string
          id?: string
          is_active?: boolean
          name?: string
          start_date: string
          total_days?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_day?: number
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          total_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          is_published: boolean
          metadata: Json | null
          post_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          metadata?: Json | null
          post_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          metadata?: Json | null
          post_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reactions: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reaction_type: string
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reports: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: []
      }
      contact_research: {
        Row: {
          contact_id: string
          created_at: string
          error_message: string | null
          id: string
          research_data: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          research_data?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          research_data?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_contact_research_contact"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          archived: boolean
          booking_scheduled: boolean
          category: string
          city: string | null
          company: string | null
          country: string | null
          created_at: string
          email: string
          id: string
          is_demo: boolean
          last_contact_date: string | null
          linkedin_url: string | null
          name: string
          next_follow_up: string | null
          notes: string | null
          phone: string | null
          position: string | null
          relationship_type: string
          response_received: boolean
          revenue_amount: number | null
          social_media_links: Json | null
          source: string
          state: string | null
          status: string
          total_touchpoints: number
          updated_at: string
          user_id: string
          website_url: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          archived?: boolean
          booking_scheduled?: boolean
          category?: string
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email: string
          id?: string
          is_demo?: boolean
          last_contact_date?: string | null
          linkedin_url?: string | null
          name: string
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          relationship_type?: string
          response_received?: boolean
          revenue_amount?: number | null
          social_media_links?: Json | null
          source?: string
          state?: string | null
          status?: string
          total_touchpoints?: number
          updated_at?: string
          user_id: string
          website_url?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          archived?: boolean
          booking_scheduled?: boolean
          category?: string
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          is_demo?: boolean
          last_contact_date?: string | null
          linkedin_url?: string | null
          name?: string
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          relationship_type?: string
          response_received?: boolean
          revenue_amount?: number | null
          social_media_links?: Json | null
          source?: string
          state?: string | null
          status?: string
          total_touchpoints?: number
          updated_at?: string
          user_id?: string
          website_url?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      content_pages: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          is_published: boolean
          meta_description: string | null
          page_type: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_published?: boolean
          meta_description?: string | null
          page_type?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_published?: boolean
          meta_description?: string | null
          page_type?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_settings: {
        Row: {
          auto_followup_enabled: boolean
          cadences: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_followup_enabled?: boolean
          cadences?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_followup_enabled?: boolean
          cadences?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_tasks_definition: {
        Row: {
          category: string | null
          count_required: number
          created_at: string
          description: string | null
          external_link: string | null
          external_link_text: string | null
          id: string
          is_active: boolean
          name: string
          outreach_type: Database["public"]["Enums"]["outreach_type"] | null
          resource_id: string | null
          sort_order: number
        }
        Insert: {
          category?: string | null
          count_required?: number
          created_at?: string
          description?: string | null
          external_link?: string | null
          external_link_text?: string | null
          id?: string
          is_active?: boolean
          name: string
          outreach_type?: Database["public"]["Enums"]["outreach_type"] | null
          resource_id?: string | null
          sort_order?: number
        }
        Update: {
          category?: string | null
          count_required?: number
          created_at?: string
          description?: string | null
          external_link?: string | null
          external_link_text?: string | null
          id?: string
          is_active?: boolean
          name?: string
          outreach_type?: Database["public"]["Enums"]["outreach_type"] | null
          resource_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_tasks_definition_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "educational_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      educational_resources: {
        Row: {
          category: string | null
          content: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          idempotency_key: string | null
          metadata: Json | null
          recipient_email: string
          recipient_user_id: string | null
          resend_id: string | null
          sent_at: string | null
          status: string
          subject: string
          template_key: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          recipient_email: string
          recipient_user_id?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_key: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          recipient_email?: string
          recipient_user_id?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_key?: string
        }
        Relationships: []
      }
      email_sequence_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          scheduled_for: string
          sent_at: string | null
          sequence_id: string
          status: string
          step_id: string
          user_id: string
          variables: Json | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          scheduled_for: string
          sent_at?: string | null
          sequence_id: string
          status?: string
          step_id: string
          user_id: string
          variables?: Json | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          scheduled_for?: string
          sent_at?: string | null
          sequence_id?: string
          status?: string
          step_id?: string
          user_id?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_logs_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequence_logs_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "email_sequence_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequence_steps: {
        Row: {
          conditions: Json | null
          created_at: string
          delay_days: number
          delay_hours: number
          id: string
          is_active: boolean
          sequence_id: string
          step_order: number
          subject_override: string | null
          template_key: string
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          delay_days?: number
          delay_hours?: number
          id?: string
          is_active?: boolean
          sequence_id: string
          step_order: number
          subject_override?: string | null
          template_key: string
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          delay_days?: number
          delay_hours?: number
          id?: string
          is_active?: boolean
          sequence_id?: string
          step_order?: number
          subject_override?: string | null
          template_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          trigger_conditions: Json | null
          trigger_event: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          trigger_conditions?: Json | null
          trigger_event: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          trigger_conditions?: Json | null
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          html_content: string
          id: string
          is_active: boolean
          name: string
          subject: string
          template_key: string
          text_content: string | null
          updated_at: string
          variables: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          html_content: string
          id?: string
          is_active?: boolean
          name: string
          subject: string
          template_key: string
          text_content?: string | null
          updated_at?: string
          variables?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          html_content?: string
          id?: string
          is_active?: boolean
          name?: string
          subject?: string
          template_key?: string
          text_content?: string | null
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      guaranteed_rewards_definition: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          metric_key: string
          name: string
          reward_description: string | null
          reward_name: string
          shipping_required: boolean
          sort_order: number
          threshold: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metric_key: string
          name: string
          reward_description?: string | null
          reward_name: string
          shipping_required?: boolean
          sort_order?: number
          threshold: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metric_key?: string
          name?: string
          reward_description?: string | null
          reward_name?: string
          shipping_required?: boolean
          sort_order?: number
          threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      integration_inbound_tokens: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_used_at: string | null
          scopes: string[]
          token_hash: string
          token_name: string
          token_preview: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          scopes?: string[]
          token_hash: string
          token_name: string
          token_preview: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          scopes?: string[]
          token_hash?: string
          token_name?: string
          token_preview?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      integration_webhooks: {
        Row: {
          created_at: string
          id: string
          integration_type: string
          is_active: boolean
          updated_at: string
          user_id: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          integration_type?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          id?: string
          integration_type?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
          webhook_url?: string
        }
        Relationships: []
      }
      leaderboard_stats: {
        Row: {
          avatar_url: string | null
          completion_rate: number
          current_streak: number
          display_name: string | null
          id: string
          last_updated: string
          longest_streak: number
          overall_progress: number
          rank_position: number | null
          total_days_completed: number
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          completion_rate?: number
          current_streak?: number
          display_name?: string | null
          id?: string
          last_updated?: string
          longest_streak?: number
          overall_progress?: number
          rank_position?: number | null
          total_days_completed?: number
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          completion_rate?: number
          current_streak?: number
          display_name?: string | null
          id?: string
          last_updated?: string
          longest_streak?: number
          overall_progress?: number
          rank_position?: number | null
          total_days_completed?: number
          user_id?: string
        }
        Relationships: []
      }
      networking_event_contacts: {
        Row: {
          contact_id: string
          created_at: string
          follow_up_date: string | null
          follow_up_scheduled: boolean
          id: string
          networking_event_id: string
          notes: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          follow_up_date?: string | null
          follow_up_scheduled?: boolean
          id?: string
          networking_event_id: string
          notes?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          follow_up_date?: string | null
          follow_up_scheduled?: boolean
          id?: string
          networking_event_id?: string
          notes?: string | null
        }
        Relationships: []
      }
      networking_events: {
        Row: {
          challenge_day: number
          contacts_met_count: number
          created_at: string
          event_date: string
          event_name: string
          event_type: string
          follow_ups_scheduled: number
          id: string
          location: string | null
          notes: string | null
          outreach_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_day: number
          contacts_met_count?: number
          created_at?: string
          event_date: string
          event_name: string
          event_type?: string
          follow_ups_scheduled?: number
          id?: string
          location?: string | null
          notes?: string | null
          outreach_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_day?: number
          contacts_met_count?: number
          created_at?: string
          event_date?: string
          event_name?: string
          event_type?: string
          follow_ups_scheduled?: number
          id?: string
          location?: string | null
          notes?: string | null
          outreach_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_tasks_definition: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          external_link: string | null
          external_link_text: string | null
          id: string
          is_active: boolean
          name: string
          resource_id: string | null
          sort_order: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          external_link?: string | null
          external_link_text?: string | null
          id?: string
          is_active?: boolean
          name: string
          resource_id?: string | null
          sort_order?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          external_link?: string | null
          external_link_text?: string | null
          id?: string
          is_active?: boolean
          name?: string
          resource_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tasks_definition_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "educational_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_access_log: {
        Row: {
          accessed_at: string
          attempted_email: string
          id: string
          ip_address: unknown | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accessed_at?: string
          attempted_email: string
          id?: string
          ip_address?: unknown | null
          success: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accessed_at?: string
          attempted_email?: string
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_audit_log: {
        Row: {
          accessed_fields: string[] | null
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          payment_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accessed_fields?: string[] | null
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          payment_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accessed_fields?: string[] | null
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          payment_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_security_status: {
        Row: {
          created_at: string
          id: string
          last_checked: string
          policy_count: number | null
          resource: string
          rls_enabled: boolean | null
          total_payments: number | null
          vault_entries: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_checked?: string
          policy_count?: number | null
          resource: string
          rls_enabled?: boolean | null
          total_payments?: number | null
          vault_entries?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          last_checked?: string
          policy_count?: number | null
          resource?: string
          rls_enabled?: boolean | null
          total_payments?: number | null
          vault_entries?: number | null
        }
        Relationships: []
      }
      payment_vault: {
        Row: {
          data_integrity_hash: string | null
          id: string
          payment_id: string
          secure_stripe_intent: string | null
          secure_stripe_session: string | null
          vault_created_at: string
        }
        Insert: {
          data_integrity_hash?: string | null
          id?: string
          payment_id: string
          secure_stripe_intent?: string | null
          secure_stripe_session?: string | null
          vault_created_at?: string
        }
        Update: {
          data_integrity_hash?: string | null
          id?: string
          payment_id?: string
          secure_stripe_intent?: string | null
          secure_stripe_session?: string | null
          vault_created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_vault_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          access_expires_at: string
          amount: number
          coupon_code: string | null
          created_at: string
          currency: string
          discount_amount: number | null
          email: string
          id: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_expires_at: string
          amount: number
          coupon_code?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number | null
          email: string
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_expires_at?: string
          amount?: number
          coupon_code?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number | null
          email?: string
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          display_name: string | null
          id: string
          location: string | null
          show_in_leaderboard: boolean
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          location?: string | null
          show_in_leaderboard?: boolean
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          location?: string | null
          show_in_leaderboard?: boolean
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      program_tasks_definition: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          external_link: string | null
          external_link_text: string | null
          id: string
          is_active: boolean
          name: string
          resource_id: string | null
          sort_order: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          external_link?: string | null
          external_link_text?: string | null
          id?: string
          is_active?: boolean
          name: string
          resource_id?: string | null
          sort_order?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          external_link?: string | null
          external_link_text?: string | null
          id?: string
          is_active?: boolean
          name?: string
          resource_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_tasks_definition_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "educational_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          reward_data: Json
          reward_pack_id: string
          reward_type: Database["public"]["Enums"]["reward_type"]
          weight: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          reward_data?: Json
          reward_pack_id: string
          reward_type: Database["public"]["Enums"]["reward_type"]
          weight?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          reward_data?: Json
          reward_pack_id?: string
          reward_type?: Database["public"]["Enums"]["reward_type"]
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "reward_items_reward_pack_id_fkey"
            columns: ["reward_pack_id"]
            isOneToOne: false
            referencedRelation: "reward_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_packs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          trigger_criteria: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          trigger_criteria?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          trigger_criteria?: Json
          updated_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          progress_data: Json | null
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          progress_data?: Json | null
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          progress_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges_definition"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenge_goals: {
        Row: {
          created_at: string
          events_current: number
          events_goal: number
          id: string
          leads_current: number
          leads_goal: number
          revenue_current: number
          revenue_goal: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events_current?: number
          events_goal?: number
          id?: string
          leads_current?: number
          leads_goal?: number
          revenue_current?: number
          revenue_goal?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          events_current?: number
          events_goal?: number
          id?: string
          leads_current?: number
          leads_goal?: number
          revenue_current?: number
          revenue_goal?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_challenge_progress: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          is_active: boolean
          joined_at: string
          longest_streak: number
          overall_progress: number
          total_days_completed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          is_active?: boolean
          joined_at?: string
          longest_streak?: number
          overall_progress?: number
          total_days_completed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          is_active?: boolean
          joined_at?: string
          longest_streak?: number
          overall_progress?: number
          total_days_completed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_contact_categories: {
        Row: {
          color_class: string
          created_at: string
          icon_name: string
          id: string
          is_default: boolean
          label: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color_class?: string
          created_at?: string
          icon_name?: string
          id?: string
          is_default?: boolean
          label: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color_class?: string
          created_at?: string
          icon_name?: string
          id?: string
          is_default?: boolean
          label?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_daily_tasks: {
        Row: {
          challenge_day: number
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_day: number
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_day?: number
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "daily_tasks_definition"
            referencedColumns: ["id"]
          },
        ]
      }
      user_metrics: {
        Row: {
          challenge_day: number
          contact_id: string | null
          created_at: string
          id: string
          logged_at: string
          metric_name: string
          metric_type: string
          notes: string | null
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          challenge_day: number
          contact_id?: string | null
          created_at?: string
          id?: string
          logged_at?: string
          metric_name: string
          metric_type: string
          notes?: string | null
          unit: string
          user_id: string
          value: number
        }
        Update: {
          challenge_day?: number
          contact_id?: string | null
          created_at?: string
          id?: string
          logged_at?: string
          metric_name?: string
          metric_type?: string
          notes?: string | null
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_metrics_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding_tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          task_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_onboarding_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "onboarding_tasks_definition"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points_ledger: {
        Row: {
          activity_type: string
          challenge_day: number | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          points_earned: number
          user_id: string
        }
        Insert: {
          activity_type: string
          challenge_day?: number | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          points_earned?: number
          user_id: string
        }
        Update: {
          activity_type?: string
          challenge_day?: number | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          points_earned?: number
          user_id?: string
        }
        Relationships: []
      }
      user_program_tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          program_task_definition_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          program_task_definition_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          program_task_definition_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_project_goals: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          milestones: Json | null
          progress_percentage: number | null
          project_description: string | null
          project_name: string
          target_completion_day: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          milestones?: Json | null
          progress_percentage?: number | null
          project_description?: string | null
          project_name: string
          target_completion_day?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          milestones?: Json | null
          progress_percentage?: number | null
          project_description?: string | null
          project_name?: string
          target_completion_day?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          claimed_at: string | null
          context_data: Json | null
          earned_at: string
          id: string
          is_claimed: boolean
          reward_item_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          context_data?: Json | null
          earned_at?: string
          id?: string
          is_claimed?: boolean
          reward_item_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          context_data?: Json | null
          earned_at?: string
          id?: string
          is_claimed?: boolean
          reward_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_reward_item_id_fkey"
            columns: ["reward_item_id"]
            isOneToOne: false
            referencedRelation: "reward_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_trials: {
        Row: {
          created_at: string
          id: string
          status: string
          trial_end_at: string
          trial_start_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          trial_end_at?: string
          trial_start_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          trial_end_at?: string
          trial_start_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_weekly_tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          task_id: string
          updated_at: string
          user_id: string
          week_number: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          task_id: string
          updated_at?: string
          user_id: string
          week_number: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          task_id?: string
          updated_at?: string
          user_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_weekly_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "weekly_tasks_definition"
            referencedColumns: ["id"]
          },
        ]
      }
      variable_rewards_config: {
        Row: {
          base_probability: number
          created_at: string
          event_type: string
          id: string
          is_active: boolean
          performance_multiplier: number
          streak_multiplier: number
          updated_at: string
        }
        Insert: {
          base_probability?: number
          created_at?: string
          event_type: string
          id?: string
          is_active?: boolean
          performance_multiplier?: number
          streak_multiplier?: number
          updated_at?: string
        }
        Update: {
          base_probability?: number
          created_at?: string
          event_type?: string
          id?: string
          is_active?: boolean
          performance_multiplier?: number
          streak_multiplier?: number
          updated_at?: string
        }
        Relationships: []
      }
      weekly_tasks_definition: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          external_link: string | null
          external_link_text: string | null
          id: string
          is_active: boolean
          name: string
          resource_id: string | null
          sort_order: number
          week_number: number
          week_numbers: number[] | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          external_link?: string | null
          external_link_text?: string | null
          id?: string
          is_active?: boolean
          name: string
          resource_id?: string | null
          sort_order?: number
          week_number?: number
          week_numbers?: number[] | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          external_link?: string | null
          external_link_text?: string | null
          id?: string
          is_active?: boolean
          name?: string
          resource_id?: string | null
          sort_order?: number
          week_number?: number
          week_numbers?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_tasks_definition_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "educational_resources"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      recent_points_activity: {
        Row: {
          activity_type: string | null
          challenge_day: number | null
          created_at: string | null
          description: string | null
          display_name: string | null
          id: string | null
          metadata: Json | null
          points_earned: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_points_summary: {
        Row: {
          display_name: string | null
          recent_activities: number | null
          recent_points: number | null
          total_activities: number | null
          total_points: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_complete_weekly_task: {
        Args: {
          admin_notes?: string
          target_user_id: string
          task_id_param: string
          week_number_param: number
        }
        Returns: Json
      }
      admin_toggle_user_challenge: {
        Args: { enable_challenge: boolean; target_user_id: string }
        Returns: Json
      }
      admin_toggle_user_challenge_safe: {
        Args: { p_enable: boolean; p_target_user_id: string }
        Returns: Json
      }
      anonymize_payment_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      audit_function_call: {
        Args: { function_name: string; user_id_param?: string }
        Returns: undefined
      }
      auto_create_daily_tasks_for_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      automated_security_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      award_challenge_prizes: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      award_points: {
        Args: {
          p_activity_type: string
          p_challenge_day?: number
          p_description: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: boolean
      }
      backfill_all_daily_tasks: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      backfill_contact_added_points: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      backfill_missing_activity_points: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      backfill_missing_contact_points: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      backfill_networking_program_task_completions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      broadcast_challenge_email: {
        Args:
          | { p_template_key: string }
          | { subject_override_param?: string; template_key_param: string }
        Returns: Json
      }
      check_and_award_badges: {
        Args: { p_event_data?: Json; p_event_type: string; p_user_id: string }
        Returns: {
          badge_id: string
          badge_name: string
        }[]
      }
      check_milestone_bonuses_intelligent: {
        Args: { p_current_total_points: number; p_user_id: string }
        Returns: undefined
      }
      check_payment_status_secure: {
        Args: { check_email: string; requester_user_id: string }
        Returns: Json
      }
      check_performance_bonuses: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      check_user_onboarding_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_user_payment_access: {
        Args: { check_user_id: string }
        Returns: Json
      }
      cleanup_old_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      controlled_milestone_check: {
        Args: { p_user_id: string }
        Returns: Json
      }
      create_payment_secure: {
        Args: { payment_data: Json; requester_user_id: string }
        Returns: string
      }
      encrypt_payment_field: {
        Args: { field_value: string }
        Returns: string
      }
      enhanced_encrypt_payment_field: {
        Args: { field_type?: string; field_value: string }
        Returns: string
      }
      ensure_user_daily_task_exists: {
        Args: { p_challenge_day: number; p_task_id: string; p_user_id: string }
        Returns: string
      }
      get_active_challenge_participant_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_admin_activity_breakdown: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_admin_comprehensive_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_admin_emails: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_admin_user_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          contacts_count: number
          created_at: string
          display_name: string
          events_booked: number
          total_activities: number
          total_points: number
          total_revenue: number
          user_id: string
          win_rate: number
        }[]
      }
      get_admin_user_details: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          company_name: string
          created_at: string
          display_name: string
          email: string
          email_confirmed_at: string
          id: string
          last_sign_in_at: string
          location: string
          roles: string[]
          show_in_leaderboard: boolean
        }[]
      }
      get_admin_user_growth_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_admin_user_list: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          company_name: string
          created_at: string
          display_name: string
          email: string
          email_confirmed_at: string
          id: string
          last_sign_in_at: string
          location: string
          roles: string[]
          show_in_leaderboard: boolean
        }[]
      }
      get_admin_users_with_challenge: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          challenge_active: boolean
          challenge_days_completed: number
          challenge_joined_at: string
          challenge_progress: number
          company_name: string
          created_at: string
          display_name: string
          email: string
          email_confirmed_at: string
          id: string
          last_sign_in_at: string
          location: string
          roles: string[]
          show_in_leaderboard: boolean
        }[]
      }
      get_anonymized_leaderboard_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          anonymized_user_id: string
          avatar_url: string
          completion_rate: number
          display_name: string
          progress_tier: string
          rank_position: number
          total_days_completed: number
        }[]
      }
      get_challenge_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_participants: number
          avg_days_completed: number
          avg_progress: number
          total_participants: number
        }[]
      }
      get_comprehensive_admin_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_current_challenge_day: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_enhanced_encryption_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_enriched_leaderboard_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          completion_rate: number
          conversion_rate: number
          current_streak: number
          display_name: string
          goals_completion_rate: number
          longest_streak: number
          overall_progress: number
          rank_position: number
          total_days_completed: number
          total_events: number
          total_leads: number
          total_revenue: number
          user_id: string
        }[]
      }
      get_my_ai_quota: {
        Args: Record<PropertyKey, never>
        Returns: {
          credits_remaining: number
          monthly_quota: number
          monthly_used: number
          per_request_limit: number
          period_end: string
          period_start: string
          remaining: number
          tier: string
        }[]
      }
      get_my_challenge_goals_and_progress: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          events_current: number
          events_goal: number
          events_progress: number
          goals_id: string
          leads_current: number
          leads_goal: number
          leads_progress: number
          revenue_current: number
          revenue_goal: number
          revenue_progress: number
          updated_at: string
        }[]
      }
      get_my_payment_status: {
        Args: { payment_id_param?: string }
        Returns: {
          amount: number
          currency: string
          expires_at: string
          payment_exists: boolean
          status: string
        }[]
      }
      get_payment_encryption_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_points_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          display_name: string
          rank_position: number
          total_activities: number
          total_points: number
          user_id: string
        }[]
      }
      get_revenue_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          contacts_count: number
          display_name: string
          rank_position: number
          total_revenue: number
          user_id: string
        }[]
      }
      get_todays_full_completions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_access_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_challenge_day: {
        Args: { user_id_param: string; user_timezone?: string }
        Returns: number
      }
      get_user_challenge_points_summary: {
        Args: { target_user_id: string }
        Returns: {
          display_name: string
          recent_activities: number
          recent_points: number
          total_activities: number
          total_points: number
          user_id: string
        }[]
      }
      get_user_current_week: {
        Args: { user_id_param: string; user_timezone?: string }
        Returns: number
      }
      get_user_email_data: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_user_program_tasks_with_definitions: {
        Args: { p_user_id: string }
        Returns: {
          category: string
          completed: boolean
          definition_id: string
          notes: string
          sort_order: number
          task_description: string
          task_name: string
          user_task_id: string
        }[]
      }
      is_admin: {
        Args: { user_id_param?: string }
        Returns: boolean
      }
      is_demo_contact: {
        Args: {
          p_company: string
          p_email: string
          p_name: string
          p_notes: string
          p_source: string
        }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_action: string
          p_details?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: string
      }
      log_outreach_points: {
        Args: {
          p_activity_type: string
          p_base_count?: number
          p_challenge_day: number
          p_notes?: string
          p_user_id: string
        }
        Returns: number
      }
      mask_payment_data: {
        Args: { payment_id: string; requester_user_id: string }
        Returns: Json
      }
      process_scheduled_email_sequences: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      process_variable_reward: {
        Args: { p_context_data?: Json; p_event_type: string; p_user_id: string }
        Returns: {
          reward_description: string
          reward_earned: boolean
          reward_name: string
        }[]
      }
      remove_demo_data_for_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      secure_audit_cleanup: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      secure_audit_payment_access: {
        Args: {
          access_type: string
          accessed_payment_id: string
          requester_context?: string
        }
        Returns: undefined
      }
      secure_link_payment_to_user: {
        Args: { payment_id_param: string; user_email_param: string }
        Returns: boolean
      }
      secure_payment_data: {
        Args: { data_category?: string; data_value: string }
        Returns: string
      }
      seed_default_categories: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      seed_user_categories_and_backfill: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      toggle_user_daily_task: {
        Args: {
          p_challenge_day: number
          p_completed: boolean
          p_task_id: string
          p_user_id: string
        }
        Returns: Json
      }
      trigger_email_sequence: {
        Args:
          | { event_name: string; target_user_id: string; variables?: Json }
          | {
              p_trigger_event: string
              p_user_email: string
              p_user_id: string
              p_variables?: Json
            }
        Returns: boolean
      }
      trigger_weekly_bonus_checks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_daily_challenge_progress: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_leaderboard_stats: {
        Args: Record<PropertyKey, never> | { user_id_param: string }
        Returns: undefined
      }
      update_user_progress: {
        Args: {
          p_current_streak?: number
          p_longest_streak?: number
          p_overall_progress?: number
          p_total_days_completed?: number
          p_user_id: string
        }
        Returns: undefined
      }
      upsert_challenge_goals_by_email: {
        Args: {
          p_email: string
          p_events_goal: number
          p_leads_goal: number
          p_revenue_goal: number
        }
        Returns: Json
      }
      user_can_write: {
        Args: { user_id_param?: string }
        Returns: boolean
      }
      user_can_write_secure: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      user_has_active_trial: {
        Args: { user_id_param?: string }
        Returns: boolean
      }
      user_has_valid_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_is_challenge_participant: {
        Args: Record<PropertyKey, never> | { user_id_param?: string }
        Returns: boolean
      }
      validate_payment_access: {
        Args: { payment_email: string }
        Returns: boolean
      }
      verify_payment_integrity: {
        Args: { payment_id_param: string }
        Returns: Json
      }
      verify_payment_security: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user" | "moderator"
      badge_category: "milestone" | "consistency" | "performance" | "special"
      outreach_type: "cold" | "warm" | "social"
      reward_type: "badge" | "points" | "title" | "cosmetic"
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
      app_role: ["admin", "user", "moderator"],
      badge_category: ["milestone", "consistency", "performance", "special"],
      outreach_type: ["cold", "warm", "social"],
      reward_type: ["badge", "points", "title", "cosmetic"],
    },
  },
} as const
