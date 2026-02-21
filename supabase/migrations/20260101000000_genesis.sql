-- 20260101000000_genesis.sql generated from DB dump with 13 tables



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
    "unit" "text" DEFAULT '袋'::"text",
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
    "work_type" "text" DEFAULT '袋'::"text",
    "task_details" "jsonb",
    "is_spot" boolean DEFAULT false,
    "time_constraint" "jsonb",
    "task_type" "text" DEFAULT '袋'::"text",
    "vehicle_lock" "text"
);


ALTER TABLE "public"."jobs" OWNER TO "postgres";














CREATE SEQUENCE IF NOT EXISTS "public"."jobs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."jobs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."jobs_id_seq" OWNED BY "public"."jobs"."id";


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
    "unit" "text" DEFAULT '袋'::"text" NOT NULL,
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


CREATE TABLE IF NOT EXISTS "public"."splits" (
    "id" "text" NOT NULL,
    "driver_id" "text" NOT NULL,
    "split_time" "text" NOT NULL,
    "replacement_driver_name" "text" NOT NULL,
    "replacement_vehicle_number" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."splits" OWNER TO "postgres";


ALTER TABLE ONLY "public"."jobs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."jobs_id_seq"'::"regclass");


ALTER TABLE ONLY "public"."customer_item_defaults"
    ADD CONSTRAINT "customer_item_defaults_pkey" PRIMARY KEY ("customer_id", "item_id");


ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."drivers"
    ADD CONSTRAINT "drivers_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."job_contents"
    ADD CONSTRAINT "job_contents_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."master_collection_points"
    ADD CONSTRAINT "master_collection_points_pkey" PRIMARY KEY ("location_id");


ALTER TABLE ONLY "public"."master_contractors"
    ADD CONSTRAINT "master_contractors_pkey" PRIMARY KEY ("contractor_id");


ALTER TABLE ONLY "public"."master_items"
    ADD CONSTRAINT "master_items_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."master_payees"
    ADD CONSTRAINT "master_payees_pkey" PRIMARY KEY ("payee_id");


ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");


ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");


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


ALTER TABLE ONLY "public"."customer_item_defaults"
    ADD CONSTRAINT "customer_item_defaults_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."master_collection_points"("location_id") ON DELETE CASCADE;


ALTER TABLE ONLY "public"."customer_item_defaults"
    ADD CONSTRAINT "customer_item_defaults_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."master_items"("id") ON DELETE CASCADE;


ALTER TABLE ONLY "public"."drivers"
    ADD CONSTRAINT "fk_drivers_profiles" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;


ALTER TABLE ONLY "public"."job_contents"
    ADD CONSTRAINT "job_contents_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE RESTRICT;


ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id");


ALTER TABLE ONLY "public"."master_collection_points"
    ADD CONSTRAINT "master_collection_points_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "public"."master_contractors"("contractor_id") ON DELETE SET NULL;


ALTER TABLE ONLY "public"."master_contractors"
    ADD CONSTRAINT "master_contractors_payee_id_fkey" FOREIGN KEY ("payee_id") REFERENCES "public"."master_payees"("payee_id") ON DELETE SET NULL;


ALTER TABLE ONLY "public"."splits"
    ADD CONSTRAINT "splits_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE;


GRANT ALL ON TABLE "public"."customer_item_defaults" TO "anon";
GRANT ALL ON TABLE "public"."customer_item_defaults" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_item_defaults" TO "service_role";


GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";


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


GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";


GRANT ALL ON TABLE "public"."splits" TO "anon";
GRANT ALL ON TABLE "public"."splits" TO "authenticated";
GRANT ALL ON TABLE "public"."splits" TO "service_role";