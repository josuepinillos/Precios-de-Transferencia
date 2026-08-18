import { createClient } from '@supabase/supabase-js';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          assignee: Json;
          due_date: string;
          date_block: string;
          empresa: string;
          prioridad: 'Alta' | 'Media' | 'Baja';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          assignee: Json;
          due_date: string;
          date_block: string;
          empresa?: string;
          prioridad?: 'Alta' | 'Media' | 'Baja';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          assignee?: Json;
          due_date?: string;
          date_block?: string;
          empresa?: string;
          prioridad?: 'Alta' | 'Media' | 'Baja';
          updated_at?: string;
        };
        Relationships: [];
      };
      subtasks: {
        Row: {
          id: string;
          task_id: string;
          title: string;
          completed: boolean;
          assignee: Json | null;
          sort_order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          title: string;
          completed?: boolean;
          assignee?: Json | null;
          sort_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          completed?: boolean;
          assignee?: Json | null;
          sort_order?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subtasks_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
        ];
      };
      client_emails: {
        Row: {
          id: string;
          task_id: string;
          subject: string;
          sender: string;
          email_date: string;
          status: 'Enviado' | 'Recibido';
          outlook_link: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          subject: string;
          sender: string;
          email_date: string;
          status: 'Enviado' | 'Recibido';
          outlook_link?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          task_id?: string;
          subject?: string;
          sender?: string;
          email_date?: string;
          status?: 'Enviado' | 'Recibido';
          outlook_link?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'client_emails_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
        ];
      };
      controlled_operations: {
        Row: {
          id: string;
          task_id: string;
          section: string;
          operation_number: string | null;
          related_party: string | null;
          transaction_description: string | null;
          transaction_code: string | null;
          transaction_type: string | null;
          currency: string | null;
          amount_origin: number | null;
          amount_pen: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          section: string;
          operation_number?: string | null;
          related_party?: string | null;
          transaction_description?: string | null;
          transaction_code?: string | null;
          transaction_type?: string | null;
          currency?: string | null;
          amount_origin?: number | null;
          amount_pen?: number | null;
          created_at?: string;
        };
        Update: {
          task_id?: string;
          section?: string;
          operation_number?: string | null;
          related_party?: string | null;
          transaction_description?: string | null;
          transaction_code?: string | null;
          transaction_type?: string | null;
          currency?: string | null;
          amount_origin?: number | null;
          amount_pen?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'controlled_operations_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
        ];
      };
      historical_results: {
        Row: {
          id: string;
          task_id: string;
          method: string | null;
          year: number | null;
          exercise_year: number | null;
          method_name: string | null;
          company_name: string | null;
          lower_quartile: number | null;
          median: number | null;
          upper_quartile: number | null;
          company_result: number | null;
          three_year_average: number | null;
          company_2025: number | null;
          company_2024: number | null;
          company_2023: number | null;
          average_value: number | null;
          comparable_2025: number | null;
          comparable_2024: number | null;
          comparable_2023: number | null;
          technical_table: Json | null;
          source_file_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          method?: string | null;
          year?: number | null;
          exercise_year?: number | null;
          method_name?: string | null;
          company_name?: string | null;
          lower_quartile?: number | null;
          median?: number | null;
          upper_quartile?: number | null;
          company_result?: number | null;
          three_year_average?: number | null;
          company_2025?: number | null;
          company_2024?: number | null;
          company_2023?: number | null;
          average_value?: number | null;
          comparable_2025?: number | null;
          comparable_2024?: number | null;
          comparable_2023?: number | null;
          technical_table?: Json | null;
          source_file_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          task_id?: string;
          method?: string | null;
          year?: number | null;
          exercise_year?: number | null;
          method_name?: string | null;
          company_name?: string | null;
          lower_quartile?: number | null;
          median?: number | null;
          upper_quartile?: number | null;
          company_result?: number | null;
          three_year_average?: number | null;
          company_2025?: number | null;
          company_2024?: number | null;
          company_2023?: number | null;
          average_value?: number | null;
          comparable_2025?: number | null;
          comparable_2024?: number | null;
          comparable_2023?: number | null;
          technical_table?: Json | null;
          source_file_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'historical_results_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
        ];
      };
      sunat_due_dates: {
        Row: {
          id: string;
          task_id: string;
          ruc: string;
          condition: 'general' | 'good_taxpayer';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          ruc: string;
          condition?: 'general' | 'good_taxpayer';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          task_id?: string;
          ruc?: string;
          condition?: 'general' | 'good_taxpayer';
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sunat_due_dates_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: true;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string;
          avatar_url: string | null;
          role: 'admin' | 'editor' | 'consultor' | 'lector';
          is_active: boolean;
          last_sign_in_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email: string;
          avatar_url?: string | null;
          role?: 'admin' | 'editor' | 'consultor' | 'lector';
          is_active?: boolean;
          last_sign_in_at?: string | null;
        };
        Update: {
          full_name?: string | null;
          email?: string;
          avatar_url?: string | null;
          role?: 'admin' | 'editor' | 'consultor' | 'lector';
          is_active?: boolean;
          last_sign_in_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_email: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id: string | null;
          actor_email?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserClient: ReturnType<typeof createClient<Database>> | null = null;

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseKey);

export const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  if (!browserClient) {
    browserClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        // Supabase Auth owns the session: keep it across reloads, refresh it
        // before it expires, and read the tokens back from recovery links.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'tp-auth',
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return browserClient;
};
