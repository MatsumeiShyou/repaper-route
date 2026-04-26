-- ==========================================
-- 20260419_02_mirroring_sync_final.sql
-- Description: 鏡面同期エンジン (最終安定版: インライン・サブクエリ)
-- ==========================================

BEGIN;

CREATE OR REPLACE FUNCTION public.rpc_execute_board_update(
    p_scheduled_date DATE,
    p_routes JSONB,
    p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS VOID AS $$
BEGIN
    -- [1] 鏡面削除：物理テーブルから「今回の入力に含まれない、当該日付の案件」を抹消
    -- 直接 jsonb_array_elements を評価することで、変数や一時テーブルへの依存を排除
    DELETE FROM public.job_contents 
    WHERE job_id IN (
        SELECT id FROM public.jobs 
        WHERE scheduled_date = p_scheduled_date 
        AND id NOT IN (
            SELECT (j_sub->>'id')::UUID 
            FROM jsonb_array_elements(p_routes) r_sub
            CROSS JOIN LATERAL jsonb_array_elements(r_sub->'jobs') j_sub
        )
    );

    DELETE FROM public.jobs 
    WHERE scheduled_date = p_scheduled_date 
    AND id NOT IN (
        SELECT (j_sub->>'id')::UUID 
        FROM jsonb_array_elements(p_routes) r_sub
        CROSS JOIN LATERAL jsonb_array_elements(r_sub->'jobs') j_sub
    );


    -- [2] 鏡面保存：物理テーブルを UI の送出データで最新化 (UPSERT)
    -- 案件 (Jobs)
    INSERT INTO public.jobs (
        id, scheduled_date, driver_id, vehicle_id, route_index, 
        start_at, end_at, status, updated_at
    )
    SELECT 
        (j->>'id')::UUID,
        p_scheduled_date,
        (r->>'driverId'),
        (r->>'vehicleId')::UUID,
        (r->>'index')::INTEGER,
        (j->>'startTime'),
        (j->>'endTime'),
        COALESCE(j->>'status', 'PLANNED'),
        NOW()
    FROM jsonb_array_elements(p_routes) r
    CROSS JOIN LATERAL jsonb_array_elements(r->'jobs') j
    ON CONFLICT (id) DO UPDATE SET
        scheduled_date = EXCLUDED.scheduled_date,
        driver_id = EXCLUDED.driver_id,
        vehicle_id = EXCLUDED.vehicle_id,
        route_index = EXCLUDED.route_index,
        start_at = EXCLUDED.start_at,
        end_at = EXCLUDED.end_at,
        status = EXCLUDED.status,
        updated_at = NOW();

    -- 明細 (Job Contents)
    INSERT INTO public.job_contents (
        id, job_id, item_id, quantity, weight, volume, 
        pickup_location_id, delivery_location_id, updated_at
    )
    SELECT 
        (c->>'id')::UUID,
        (j->>'id')::UUID,
        (c->>'itemId')::UUID,
        (c->>'quantity')::DECIMAL,
        (c->>'weight')::DECIMAL,
        (c->>'volume')::DECIMAL,
        (c->>'pickupLocationId'),
        (c->>'deliveryLocationId'),
        NOW()
    FROM jsonb_array_elements(p_routes) r
    CROSS JOIN LATERAL jsonb_array_elements(r->'jobs') j
    CROSS JOIN LATERAL jsonb_array_elements(j->'contents') c
    ON CONFLICT (id) DO UPDATE SET
        job_id = EXCLUDED.job_id,
        item_id = EXCLUDED.item_id,
        quantity = EXCLUDED.quantity,
        weight = EXCLUDED.weight,
        volume = EXCLUDED.volume,
        pickup_location_id = EXCLUDED.pickup_location_id,
        delivery_location_id = EXCLUDED.delivery_location_id,
        updated_at = NOW();

    -- [3] 全体 JSONB の保存（既存互換性保持）
    INSERT INTO public.routes (scheduled_date, data, updated_at)
    VALUES (p_scheduled_date, p_routes, NOW())
    ON CONFLICT (scheduled_date) DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = NOW();

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
