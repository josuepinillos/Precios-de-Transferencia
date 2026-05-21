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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          title: string;
          completed?: boolean;
          assignee?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          completed?: boolean;
          assignee?: Json | null;
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
          method: string;
          year: number;
          lower_quartile: number | null;
          median: number | null;
          upper_quartile: number | null;
          company_result: number | null;
          three_year_average: number | null;
          source_file_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          method: string;
          year: number;
          lower_quartile?: number | null;
          median?: number | null;
          upper_quartile?: number | null;
          company_result?: number | null;
          three_year_average?: number | null;
          source_file_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          task_id?: string;
          method?: string;
          year?: number;
          lower_quartile?: number | null;
          median?: number | null;
          upper_quartile?: number | null;
          company_result?: number | null;
          three_year_average?: number | null;
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
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
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
