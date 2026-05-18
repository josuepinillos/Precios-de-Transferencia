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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          title: string;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          completed?: boolean;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const fallbackUrl = 'https://example.supabase.co';
const fallbackKey = 'missing-supabase-anon-key';

if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseKey)) {
  console.warn('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabase = createClient<Database>(
  supabaseUrl || fallbackUrl,
  supabaseKey || fallbackKey,
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  },
);
