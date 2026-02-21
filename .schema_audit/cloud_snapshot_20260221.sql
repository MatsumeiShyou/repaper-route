


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."rpc_execute_board_update"("p_date" "date", "p_new_state" "jsonb", "p_decision_type" "text" DEFAULT NULL::"text", "p_reason" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_user_id UUID;
    v_result JSONB;
BEGIN
    v_current_user_id := auth.uid();
    
    INSERT INTO public.routes (
        date, jobs, drivers, splits, pending, updated_at, last_activity_at, edit_locked_by
    )
    VALUES (
        p_date,
        COALESCE(p_new_state->'jobs', '[]'::jsonb),
        COALESCE(p_new_state->'drivers', '[]'::jsonb),
        COALESCE(p_new_state->'splits', '[]'::jsonb),
        COALESCE(p_new_state->'pending', '[]'::jsonb),
        NOW(), NOW(), v_current_user_id
    )
    ON CONFLICT (date) DO UPDATE SET
        jobs = EXCLUDED.jobs,
        drivers = EXCLUDED.drivers,
        splits = EXCLUDED.splits,
        pending = EXCLUDED.pending,
        updated_at = NOW(),
        last_activity_at = NOW(),
        edit_locked_by = v_current_user_id;

    v_result := jsonb_build_object('success', true, 'message', 'Board updated successfully');
    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."rpc_execute_board_update"("p_date" "date", "p_new_state" "jsonb", "p_decision_type" "text", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_execute_master_update"("p_table_name" "text", "p_id" "text" DEFAULT NULL::"text", "p_core_data" "jsonb" DEFAULT '{}'::"jsonb", "p_ext_data" "jsonb" DEFAULT '{}'::"jsonb", "p_decision_type" "text" DEFAULT 'MASTER_UPDATE'::"text", "p_reason" "text" DEFAULT 'No reason provided'::"text", "p_user_id" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    v_proposal_id uuid;
    v_target_id_uuid uuid;
    v_target_id_text text;
BEGIN
    -- Diagnostic Log
    RAISE NOTICE 'RPC Executed: table=%, id=%, user=%', p_table_name, p_id, p_user_id;

    -- [A] ID Normalization
    v_target_id_text := CASE WHEN p_id IS NOT NULL AND p_id <> '' THEN p_id ELSE gen_random_uuid()::text END;

    -- [B] SDR Auditing
    INSERT INTO public.decision_proposals (proposal_type, status, proposed_value, reason, proposer_id, target_id)
    VALUES (p_decision_type, 'APPROVED', (COALESCE(p_core_data, '{}'::jsonb) || COALESCE(p_ext_data, '{}'::jsonb)), p_reason, p_user_id, v_target_id_text)
    RETURNING id INTO v_proposal_id;

    INSERT INTO public.decisions (proposal_id, decision, decider_id)
    VALUES (v_proposal_id, 'APPROVED', p_user_id);

    -- [C] Core Logic
    
    -- 1. VEHICLES
    IF p_table_name = 'vehicles' THEN
        v_target_id_uuid := CASE WHEN v_target_id_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN v_target_id_text::uuid ELSE gen_random_uuid() END;
        
        INSERT INTO public.master_vehicles (id, number, callsign, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'number',
            p_core_data->>'callsign',
            COALESCE((p_core_data->>'is_active')::boolean, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            number = EXCLUDED.number,
            callsign = EXCLUDED.callsign,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

        INSERT INTO public.logistics_vehicle_attrs (vehicle_id, max_payload, fuel_type, vehicle_type, updated_at)
        VALUES (
            v_target_id_uuid,
            (p_ext_data->>'max_payload')::numeric,
            p_ext_data->>'fuel_type',
            p_ext_data->>'vehicle_type',
            NOW()
        )
        ON CONFLICT (vehicle_id) DO UPDATE SET
            max_payload = EXCLUDED.max_payload,
            fuel_type = EXCLUDED.fuel_type,
            vehicle_type = EXCLUDED.vehicle_type,
            updated_at = NOW();

    -- 2. ITEMS
    ELSIF p_table_name = 'items' THEN
        v_target_id_uuid := CASE WHEN v_target_id_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN v_target_id_text::uuid ELSE gen_random_uuid() END;

        INSERT INTO public.master_items (id, name, unit, display_order, is_active, updated_at)
        VALUES (
            v_target_id_uuid,
            p_core_data->>'name',
            p_core_data->>'unit',
            COALESCE((p_core_data->>'display_order')::integer, 0),
            COALESCE((p_core_data->>'is_active')::boolean, true),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            unit = EXCLUDED.unit,
            display_order = EXCLUDED.display_order,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

    -- 3. POINTS (Collection Points)
    ELSIF p_table_name = 'points' OR p_table_name = 'master_collection_points' THEN
        RAISE NOTICE 'Inserting into master_collection_points: id=%', v_target_id_text;
        
        INSERT INTO public.master_collection_points (location_id, name, address, contractor_id, note, is_active, updated_at)
        VALUES (
            v_target_id_text,
            p_core_data->>'name',
            p_core_data->>'address',
            p_core_data->>'contractor_id',
            p_core_data->>'note',
            COALESCE((p_core_data->>'is_active')::boolean, true),
            NOW()
        )
        ON CONFLICT (location_id) DO UPDATE SET
            name = EXCLUDED.name,
            address = EXCLUDED.address,
            contractor_id = EXCLUDED.contractor_id,
            note = EXCLUDED.note,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();

    -- 4. DRIVERS
    ELSIF p_table_name = 'drivers' THEN
        INSERT INTO public.drivers (id, driver_name, display_order, user_id, updated_at)
        VALUES (
            v_target_id_text,
            COALESCE(p_core_data->>'name', p_core_data->>'driver_name'),
            COALESCE((p_core_data->>'display_order')::integer, 999),
            p_core_data->>'user_id',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            driver_name = EXCLUDED.driver_name,
            display_order = EXCLUDED.display_order,
            user_id = EXCLUDED.user_id,
            updated_at = NOW();

    -- 5. USERS (Profiles)
    ELSIF p_table_name = 'users' THEN
        v_target_id_text := v_target_id_text::text;
        INSERT INTO public.profiles (id, name, role, vehicle_info, updated_at)
        VALUES (
            v_target_id_text,
            p_core_data->>'name',
            p_core_data->>'role',
            p_core_data->>'vehicle_info',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            vehicle_info = EXCLUDED.vehicle_info,
            updated_at = NOW();
    
    ELSE
        RAISE EXCEPTION 'Unknown table name: %', p_table_name;
    END IF;
END;
$_$;


ALTER FUNCTION "public"."rpc_execute_master_update"("p_table_name" "text", "p_id" "text", "p_core_data" "jsonb", "p_ext_data" "jsonb", "p_decision_type" "text", "p_reason" "text", "p_user_id" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."customer_item_defaults" (
    "customer_id" "text" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."customer_item_defaults" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "area" "text",
    "default_duration" integer DEFAULT 30,
    "address" "text",
    "lat" double precision,
    "lng" double precision,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."decision_proposals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "proposal_type" "text" NOT NULL,
    "target_id" "text",
    "current_value" "jsonb",
    "proposed_value" "jsonb",
    "status" "text" DEFAULT 'PENDING'::"text",
    "proposer_id" "text",
    "reason" "text"
);


ALTER TABLE "public"."decision_proposals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."decisions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "proposal_id" "uuid",
    "decider_id" "text",
    "decision" "text",
    "comment" "text",
    "decided_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."decisions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drivers" (
    "id" "text" NOT NULL,
    "driver_name" "text" NOT NULL,
    "vehicle_number" "text",
    "route_name" "text",
    "display_color" "text",
    "default_split_time" "text",
    "default_split_driver_name" "text",
    "default_split_vehicle_number" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "display_order" integer DEFAULT 999,
    "user_id" "text"
);


ALTER TABLE "public"."drivers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "unit" "text" DEFAULT 'kg'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_contents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "job_id" "text",
    "item_id" "uuid",
    "expected_weight_kg" integer,
    "actual_weight_kg" integer,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."job_contents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "id" "text" NOT NULL,
    "job_title" "text",
    "driver_id" "text",
    "start_time" "text",
    "duration_minutes" integer DEFAULT 15 NOT NULL,
    "bucket_type" "text",
    "customer_id" "text",
    "required_vehicle" "text",
    "area" "text",
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "driver_name" "text",
    "vehicle_name" "text",
    "customer_name" "text",
    "item_category" "text",
    "weight_kg" numeric,
    "special_notes" "text",
    "is_synced_to_sheet" boolean DEFAULT false,
    "work_type" "text" DEFAULT 'pickup'::"text",
    "task_details" "jsonb",
    "is_spot" boolean DEFAULT false,
    "time_constraint" "jsonb",
    "task_type" "text" DEFAULT 'collection'::"text",
    "vehicle_lock" "text"
);


ALTER TABLE "public"."jobs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."jobs"."is_spot" IS 'スポット案件フラグ（true: 臨時・不定期案件）';



COMMENT ON COLUMN "public"."jobs"."time_constraint" IS '例: AM指定 -> {"type":"RANGE","range":{"start":"06:00","end":"12:00"},"label":"AM"}
例: PM指定 -> {"type":"RANGE","range":{"start":"12:00","end":"18:00"},"label":"PM"}
例: 時刻固定 -> {"type":"FIXED","fixed":"14:00"}';



COMMENT ON COLUMN "public"."jobs"."task_type" IS 'タスク種別 (collection: 回収業務, special: 特殊作業)';



COMMENT ON COLUMN "public"."jobs"."vehicle_lock" IS '車両固定制約 (指定車両以外への配置を禁止)';



CREATE SEQUENCE IF NOT EXISTS "public"."jobs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."jobs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."jobs_id_seq" OWNED BY "public"."jobs"."id";



CREATE TABLE IF NOT EXISTS "public"."logistics_vehicle_attrs" (
    "vehicle_id" "uuid" NOT NULL,
    "max_payload" numeric,
    "fuel_type" "text",
    "vehicle_type" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."logistics_vehicle_attrs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_collection_points" (
    "location_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "contractor_id" "text",
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."master_collection_points" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_contractors" (
    "contractor_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "payee_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."master_contractors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "unit" "text" DEFAULT '個'::"text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."master_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_payees" (
    "payee_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."master_payees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_vehicles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "number" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true,
    "callsign" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."master_vehicles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."point_access_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "point_id" "text" NOT NULL,
    "driver_id" "text" NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "note" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."point_access_permissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."point_access_permissions" IS '現場入場制限: 特定の地点に特定のドライバーが入場する際に使用必須の車両を定義する。エントリーが存在しない地点・ドライバーの組み合わせは制約なし（自由）として扱われる。';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "vehicle_info" "text",
    "user_id" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "can_edit_board" boolean DEFAULT false
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."routes" (
    "date" "text" NOT NULL,
    "jobs" "jsonb",
    "drivers" "jsonb",
    "splits" "jsonb",
    "pending" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "edit_locked_by" "text",
    "edit_locked_at" timestamp with time zone,
    "last_activity_at" timestamp with time zone
);


ALTER TABLE "public"."routes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."splits" (
    "id" "text" NOT NULL,
    "driver_id" "text" NOT NULL,
    "split_time" "text" NOT NULL,
    "replacement_driver_name" "text" NOT NULL,
    "replacement_vehicle_number" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."splits" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vehicles" AS
 SELECT "v"."id",
    "v"."number",
    "v"."callsign",
    "v"."is_active",
    "v"."created_at",
    "v"."updated_at",
    "a"."max_payload",
    "a"."fuel_type",
    "a"."vehicle_type"
   FROM ("public"."master_vehicles" "v"
     LEFT JOIN "public"."logistics_vehicle_attrs" "a" ON (("v"."id" = "a"."vehicle_id")));


ALTER VIEW "public"."vehicles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_master_points" AS
 SELECT "p"."location_id" AS "id",
    "p"."name",
    "p"."address",
    "p"."note",
    "p"."is_active",
    "p"."contractor_id",
    "c"."name" AS "contractor_name",
    "c"."payee_id",
    "py"."name" AS "payee_name",
    "p"."created_at",
    "p"."updated_at"
   FROM (("public"."master_collection_points" "p"
     LEFT JOIN "public"."master_contractors" "c" ON (("p"."contractor_id" = "c"."contractor_id")))
     LEFT JOIN "public"."master_payees" "py" ON (("c"."payee_id" = "py"."payee_id")));


ALTER VIEW "public"."view_master_points" OWNER TO "postgres";


ALTER TABLE ONLY "public"."jobs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."jobs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."customer_item_defaults"
    ADD CONSTRAINT "customer_item_defaults_pkey" PRIMARY KEY ("customer_id", "item_id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."decision_proposals"
    ADD CONSTRAINT "decision_proposals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."decisions"
    ADD CONSTRAINT "decisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drivers"
    ADD CONSTRAINT "drivers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_contents"
    ADD CONSTRAINT "job_contents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."logistics_vehicle_attrs"
    ADD CONSTRAINT "logistics_vehicle_attrs_pkey" PRIMARY KEY ("vehicle_id");



ALTER TABLE ONLY "public"."master_collection_points"
    ADD CONSTRAINT "master_collection_points_pkey" PRIMARY KEY ("location_id");



ALTER TABLE ONLY "public"."master_contractors"
    ADD CONSTRAINT "master_contractors_pkey" PRIMARY KEY ("contractor_id");



ALTER TABLE ONLY "public"."master_items"
    ADD CONSTRAINT "master_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_payees"
    ADD CONSTRAINT "master_payees_pkey" PRIMARY KEY ("payee_id");



ALTER TABLE ONLY "public"."point_access_permissions"
    ADD CONSTRAINT "point_access_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."point_access_permissions"
    ADD CONSTRAINT "point_access_permissions_point_id_driver_id_key" UNIQUE ("point_id", "driver_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."routes"
    ADD CONSTRAINT "routes_pkey" PRIMARY KEY ("date");



ALTER TABLE ONLY "public"."splits"
    ADD CONSTRAINT "splits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_vehicles"
    ADD CONSTRAINT "vehicles_number_key" UNIQUE ("number");



ALTER TABLE ONLY "public"."master_vehicles"
    ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_customers_area" ON "public"."customers" USING "btree" ("area");



CREATE INDEX "idx_job_contents_item_id" ON "public"."job_contents" USING "btree" ("item_id");



CREATE INDEX "idx_job_contents_job_id" ON "public"."job_contents" USING "btree" ("job_id");



CREATE INDEX "idx_jobs_is_spot" ON "public"."jobs" USING "btree" ("is_spot") WHERE ("is_spot" = true);



CREATE INDEX "idx_jobs_task_type" ON "public"."jobs" USING "btree" ("task_type");



CREATE INDEX "idx_jobs_time_constraint" ON "public"."jobs" USING "gin" ("time_constraint") WHERE ("time_constraint" IS NOT NULL);



CREATE INDEX "idx_profiles_edit_permission" ON "public"."profiles" USING "btree" ("user_id", "can_edit_board");



CREATE INDEX "idx_routes_date" ON "public"."routes" USING "btree" ("date");



CREATE INDEX "idx_routes_edit_lock" ON "public"."routes" USING "btree" ("edit_locked_by", "last_activity_at");



ALTER TABLE ONLY "public"."customer_item_defaults"
    ADD CONSTRAINT "customer_item_defaults_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."master_collection_points"("location_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_item_defaults"
    ADD CONSTRAINT "customer_item_defaults_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."master_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decisions"
    ADD CONSTRAINT "decisions_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."decision_proposals"("id");



ALTER TABLE ONLY "public"."drivers"
    ADD CONSTRAINT "fk_drivers_profiles" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."job_contents"
    ADD CONSTRAINT "job_contents_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id");



ALTER TABLE ONLY "public"."logistics_vehicle_attrs"
    ADD CONSTRAINT "logistics_vehicle_attrs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."master_vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."master_collection_points"
    ADD CONSTRAINT "master_collection_points_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."master_contractors"("contractor_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."master_contractors"
    ADD CONSTRAINT "master_contractors_payee_id_fkey" FOREIGN KEY ("payee_id") REFERENCES "public"."master_payees"("payee_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."point_access_permissions"
    ADD CONSTRAINT "point_access_permissions_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."point_access_permissions"
    ADD CONSTRAINT "point_access_permissions_point_id_fkey" FOREIGN KEY ("point_id") REFERENCES "public"."master_collection_points"("location_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."splits"
    ADD CONSTRAINT "splits_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE;



CREATE POLICY "Enable all access" ON "public"."drivers" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all access" ON "public"."jobs" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all access" ON "public"."splits" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all access for all users" ON "public"."customers" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all access for all users" ON "public"."decision_proposals" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all access for all users" ON "public"."decisions" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all access for all users" ON "public"."drivers" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all access for all users" ON "public"."items" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all access for all users" ON "public"."job_contents" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all access for all users" ON "public"."jobs" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all access for all users" ON "public"."profiles" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all access for all users" ON "public"."routes" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all access for all users" ON "public"."splits" USING (true) WITH CHECK (true);



CREATE POLICY "Enable delete for authenticated users only" ON "public"."customer_item_defaults" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for authenticated users only" ON "public"."master_items" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."customer_item_defaults" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."master_collection_points" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."master_contractors" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."master_items" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."master_payees" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert/update for authenticated users" ON "public"."jobs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Enable insert/update for authenticated users" ON "public"."routes" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."customer_item_defaults" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."master_collection_points" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."master_contractors" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."master_items" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."master_payees" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."master_vehicles" FOR SELECT USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."jobs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."routes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users only" ON "public"."customer_item_defaults" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users only" ON "public"."master_collection_points" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users only" ON "public"."master_contractors" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users only" ON "public"."master_items" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users only" ON "public"."master_payees" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."customer_item_defaults" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."decision_proposals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."decisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drivers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_contents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."master_collection_points" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."master_contractors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."master_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."master_payees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."master_vehicles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."point_access_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."routes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."splits" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "入場制限_認証済み参照可" ON "public"."point_access_permissions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "入場制限_認証済み編集可" ON "public"."point_access_permissions" TO "authenticated" USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."rpc_execute_board_update"("p_date" "date", "p_new_state" "jsonb", "p_decision_type" "text", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_execute_board_update"("p_date" "date", "p_new_state" "jsonb", "p_decision_type" "text", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_execute_board_update"("p_date" "date", "p_new_state" "jsonb", "p_decision_type" "text", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_execute_master_update"("p_table_name" "text", "p_id" "text", "p_core_data" "jsonb", "p_ext_data" "jsonb", "p_decision_type" "text", "p_reason" "text", "p_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_execute_master_update"("p_table_name" "text", "p_id" "text", "p_core_data" "jsonb", "p_ext_data" "jsonb", "p_decision_type" "text", "p_reason" "text", "p_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_execute_master_update"("p_table_name" "text", "p_id" "text", "p_core_data" "jsonb", "p_ext_data" "jsonb", "p_decision_type" "text", "p_reason" "text", "p_user_id" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."customer_item_defaults" TO "anon";
GRANT ALL ON TABLE "public"."customer_item_defaults" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_item_defaults" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."decision_proposals" TO "anon";
GRANT ALL ON TABLE "public"."decision_proposals" TO "authenticated";
GRANT ALL ON TABLE "public"."decision_proposals" TO "service_role";



GRANT ALL ON TABLE "public"."decisions" TO "anon";
GRANT ALL ON TABLE "public"."decisions" TO "authenticated";
GRANT ALL ON TABLE "public"."decisions" TO "service_role";



GRANT ALL ON TABLE "public"."drivers" TO "anon";
GRANT ALL ON TABLE "public"."drivers" TO "authenticated";
GRANT ALL ON TABLE "public"."drivers" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON TABLE "public"."job_contents" TO "anon";
GRANT ALL ON TABLE "public"."job_contents" TO "authenticated";
GRANT ALL ON TABLE "public"."job_contents" TO "service_role";



GRANT ALL ON TABLE "public"."jobs" TO "anon";
GRANT ALL ON TABLE "public"."jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."jobs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."jobs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."jobs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."logistics_vehicle_attrs" TO "anon";
GRANT ALL ON TABLE "public"."logistics_vehicle_attrs" TO "authenticated";
GRANT ALL ON TABLE "public"."logistics_vehicle_attrs" TO "service_role";



GRANT ALL ON TABLE "public"."master_collection_points" TO "anon";
GRANT ALL ON TABLE "public"."master_collection_points" TO "authenticated";
GRANT ALL ON TABLE "public"."master_collection_points" TO "service_role";



GRANT ALL ON TABLE "public"."master_contractors" TO "anon";
GRANT ALL ON TABLE "public"."master_contractors" TO "authenticated";
GRANT ALL ON TABLE "public"."master_contractors" TO "service_role";



GRANT ALL ON TABLE "public"."master_items" TO "anon";
GRANT ALL ON TABLE "public"."master_items" TO "authenticated";
GRANT ALL ON TABLE "public"."master_items" TO "service_role";



GRANT ALL ON TABLE "public"."master_payees" TO "anon";
GRANT ALL ON TABLE "public"."master_payees" TO "authenticated";
GRANT ALL ON TABLE "public"."master_payees" TO "service_role";



GRANT ALL ON TABLE "public"."master_vehicles" TO "anon";
GRANT ALL ON TABLE "public"."master_vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."master_vehicles" TO "service_role";



GRANT ALL ON TABLE "public"."point_access_permissions" TO "anon";
GRANT ALL ON TABLE "public"."point_access_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."point_access_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."routes" TO "anon";
GRANT ALL ON TABLE "public"."routes" TO "authenticated";
GRANT ALL ON TABLE "public"."routes" TO "service_role";



GRANT ALL ON TABLE "public"."splits" TO "anon";
GRANT ALL ON TABLE "public"."splits" TO "authenticated";
GRANT ALL ON TABLE "public"."splits" TO "service_role";



GRANT ALL ON TABLE "public"."vehicles" TO "anon";
GRANT ALL ON TABLE "public"."vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicles" TO "service_role";



GRANT ALL ON TABLE "public"."view_master_points" TO "anon";
GRANT ALL ON TABLE "public"."view_master_points" TO "authenticated";
GRANT ALL ON TABLE "public"."view_master_points" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































