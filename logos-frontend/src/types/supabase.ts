export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      agent_execution_logs: {
        Row: {
          content: Json;
          created_at: string | null;
          execution_id: string;
          id: string;
          log_type: string;
          node_id: string | null;
          step_number: number | null;
          timestamp: string;
        };
        Insert: {
          content: Json;
          created_at?: string | null;
          execution_id: string;
          id?: string;
          log_type: string;
          node_id?: string | null;
          step_number?: number | null;
          timestamp: string;
        };
        Update: {
          content?: Json;
          created_at?: string | null;
          execution_id?: string;
          id?: string;
          log_type?: string;
          node_id?: string | null;
          step_number?: number | null;
          timestamp?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_execution_logs_execution_id_fkey";
            columns: ["execution_id"];
            isOneToOne: false;
            referencedRelation: "agent_executions";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_executions: {
        Row: {
          agent_id: string;
          completed_at: string | null;
          created_at: string | null;
          error_details: Json | null;
          error_message: string | null;
          final_outputs: Json | null;
          id: string;
          initial_context: Json | null;
          started_at: string;
          state: string;
          trigger_id: string | null;
          trigger_type: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          agent_id: string;
          completed_at?: string | null;
          created_at?: string | null;
          error_details?: Json | null;
          error_message?: string | null;
          final_outputs?: Json | null;
          id?: string;
          initial_context?: Json | null;
          started_at: string;
          state: string;
          trigger_id?: string | null;
          trigger_type: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          agent_id?: string;
          completed_at?: string | null;
          created_at?: string | null;
          error_details?: Json | null;
          error_message?: string | null;
          final_outputs?: Json | null;
          id?: string;
          initial_context?: Json | null;
          started_at?: string;
          state?: string;
          trigger_id?: string | null;
          trigger_type?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agent_executions_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_executions_trigger_id_fkey";
            columns: ["trigger_id"];
            isOneToOne: false;
            referencedRelation: "agent_triggers";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_tools: {
        Row: {
          created_at: string;
          id: string;
          parameters: Json;
          tool_name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          parameters: Json;
          tool_name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          parameters?: Json;
          tool_name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      agent_triggers: {
        Row: {
          agent_id: string;
          config: Json;
          created_at: string;
          id: string;
          is_active: boolean;
          trigger_type: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          agent_id?: string;
          config: Json;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          trigger_type: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          agent_id?: string;
          config?: Json;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          trigger_type?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agent_triggers_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_triggers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      agents: {
        Row: {
          created_at: string;
          description: string | null;
          graph: Json;
          id: string;
          is_public: boolean;
          name: string;
          prompt: string;
          structured_instructions: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          graph: Json;
          id?: string;
          is_public?: boolean;
          name: string;
          prompt?: string;
          structured_instructions: Json;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          graph?: Json;
          id?: string;
          is_public?: boolean;
          name?: string;
          prompt?: string;
          structured_instructions?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      beta_submissions: {
        Row: {
          created_at: string | null;
          email: string;
          id: number;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: number;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: number;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          content: string | null;
          created_at: string;
          id: string;
          message_id: string;
          parts: Json | null;
          role: string;
          sequence_number: number;
          session_id: string;
          timestamp: string;
          user_id: string;
        };
        Insert: {
          content?: string | null;
          created_at?: string;
          id?: string;
          message_id: string;
          parts?: Json | null;
          role: string;
          sequence_number: number;
          session_id?: string;
          timestamp?: string;
          user_id: string;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          id?: string;
          message_id?: string;
          parts?: Json | null;
          role?: string;
          sequence_number?: number;
          session_id?: string;
          timestamp?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      oauth_credentials: {
        Row: {
          access_token: string;
          created_at: string;
          expires_at: string | null;
          id: string;
          provider: string;
          refresh_token: string | null;
          scope: string | null;
          token_type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          access_token: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          provider: string;
          refresh_token?: string | null;
          scope?: string | null;
          token_type?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          access_token?: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          provider?: string;
          refresh_token?: string | null;
          scope?: string | null;
          token_type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_agent_feedback: {
        Row: {
          agent_id: string | null;
          created_at: string;
          feedback: number | null;
          id: number;
          style: string | null;
          user_id: string | null;
        };
        Insert: {
          agent_id?: string | null;
          created_at?: string;
          feedback?: number | null;
          id?: number;
          style?: string | null;
          user_id?: string | null;
        };
        Update: {
          agent_id?: string | null;
          created_at?: string;
          feedback?: number | null;
          id?: number;
          style?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          name: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          name?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      chat_session_summaries: {
        Row: {
          first_user_message: string | null;
          last_activity: string | null;
          last_message: string | null;
          message_count: number | null;
          session_id: string | null;
          started_at: string | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
