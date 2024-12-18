create table "public"."user_settings" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "email_address" text not null,
    "user_id" uuid default gen_random_uuid()
);


alter table "public"."tasks" add column "status" character varying;

alter table "public"."tasks" disable row level security;

CREATE UNIQUE INDEX "user-settings_email_address_key" ON public.user_settings USING btree (email_address);

CREATE UNIQUE INDEX "user-settings_pkey" ON public.user_settings USING btree (id);

alter table "public"."user_settings" add constraint "user-settings_pkey" PRIMARY KEY using index "user-settings_pkey";

alter table "public"."user_settings" add constraint "user-settings_email_address_key" UNIQUE using index "user-settings_email_address_key";

alter table "public"."user_settings" add constraint "user-settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."user_settings" validate constraint "user-settings_user_id_fkey";

grant delete on table "public"."user_settings" to "anon";

grant insert on table "public"."user_settings" to "anon";

grant references on table "public"."user_settings" to "anon";

grant select on table "public"."user_settings" to "anon";

grant trigger on table "public"."user_settings" to "anon";

grant truncate on table "public"."user_settings" to "anon";

grant update on table "public"."user_settings" to "anon";

grant delete on table "public"."user_settings" to "authenticated";

grant insert on table "public"."user_settings" to "authenticated";

grant references on table "public"."user_settings" to "authenticated";

grant select on table "public"."user_settings" to "authenticated";

grant trigger on table "public"."user_settings" to "authenticated";

grant truncate on table "public"."user_settings" to "authenticated";

grant update on table "public"."user_settings" to "authenticated";

grant delete on table "public"."user_settings" to "service_role";

grant insert on table "public"."user_settings" to "service_role";

grant references on table "public"."user_settings" to "service_role";

grant select on table "public"."user_settings" to "service_role";

grant trigger on table "public"."user_settings" to "service_role";

grant truncate on table "public"."user_settings" to "service_role";

grant update on table "public"."user_settings" to "service_role";

