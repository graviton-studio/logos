-- Create chat_messages table for storing persistent chat history
create table "public"."chat_messages" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "session_id" uuid not null default uuid_generate_v4(),
    "message_id" text not null,
    "role" text not null check (role in ('user', 'assistant', 'system')),
    "content" text,
    "parts" jsonb,
    "timestamp" timestamp with time zone not null default now(),
    "sequence_number" integer not null,
    "created_at" timestamp with time zone not null default now()
);

-- Create primary key
alter table "public"."chat_messages" add constraint "chat_messages_pkey" primary key ("id");

-- Create foreign key to users table
alter table "public"."chat_messages" add constraint "chat_messages_user_id_fkey" 
    foreign key ("user_id") references "public"."users"("id") on update cascade on delete cascade;

-- Create indexes for efficient queries
create index "idx_chat_messages_user_session" on "public"."chat_messages" using btree ("user_id", "session_id");
create index "idx_chat_messages_timestamp" on "public"."chat_messages" using btree ("timestamp");
create index "idx_chat_messages_sequence" on "public"."chat_messages" using btree ("session_id", "sequence_number");

-- Enable row level security
alter table "public"."chat_messages" enable row level security;

-- Create RLS policy for user access
create policy "Users can only access their own chat messages" 
on "public"."chat_messages" 
for all 
using (auth.uid() = user_id);

-- Create view for session summaries
create view "public"."chat_session_summaries" as
select 
    cm.session_id,
    cm.user_id,
    min(cm.created_at) as started_at,
    max(cm.created_at) as last_activity,
    count(*) as message_count,
    (
        select content 
        from chat_messages 
        where session_id = cm.session_id 
            and role = 'user' 
            and content is not null
        order by sequence_number asc 
        limit 1
    ) as first_user_message,
    (
        select content 
        from chat_messages 
        where session_id = cm.session_id 
            and content is not null
        order by sequence_number desc 
        limit 1
    ) as last_message
from chat_messages cm
group by cm.session_id, cm.user_id;

-- Grant permissions to authenticated users
grant select, insert, update, delete on table "public"."chat_messages" to "authenticated";
grant select on table "public"."chat_session_summaries" to "authenticated";
