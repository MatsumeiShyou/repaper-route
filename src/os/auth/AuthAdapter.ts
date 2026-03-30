import { supabase } from '../../lib/supabase/client';
import type { Staff, StaffRow, StaffRole, StaffPermissions } from './types';
import { 
  DXOS_APP_ID, 
  NotAuthenticatedError, 
  StaffNotFoundError, 
  AppAccessDeniedError,
  AuthBaseError
} from './types';
import { authStore } from './authStore';

/**
 * TBNY DXOS : Auth Gateway Adapter (v1.0)
 * React 19 の非同期解決 (use フック等) を前提とした Promise ベースの認証アダプター。
 */
export class AuthAdapter {
  private static instance: AuthAdapter;
  private currentStaff: Promise<Staff | null> | null = null;

  private constructor() {
    this.setupAuthListener();
  }
  
  private setupAuthListener() {
    supabase.auth.onAuthStateChange((event) => {
      console.log(`[AuthAdapter] Event: ${event}`);
      if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        this.clearCache().catch(e => console.error('[AuthAdapter] Error clearing cache on auth event:', e));
      } else if (event === 'SIGNED_IN') {
        // サインイン時は古いキャッシュ（Promise）を破棄し、最新を取得できる状態にする
        this.currentStaff = null;
      }
    });
  }

  public static getInstance(): AuthAdapter {
    if (!AuthAdapter.instance) {
      AuthAdapter.instance = new AuthAdapter();
    }
    return AuthAdapter.instance;
  }

  /**
   * 現在のセッションから Staff 情報を解決する。
   * React 19 の use() で直接 Promise を渡せるように設計。
   */
  public resolveStaff(): Promise<Staff | null> {
    if (this.currentStaff) return this.currentStaff;

    this.currentStaff = this.fetchStaff();
    return this.currentStaff;
  }

  /**
   * staffs テーブル (OS 規格) から Staff 情報を取得・検証する。
   * ネットワークエラー時は IndexedDB キャッシュからの復旧を試みる。
   */
  private async fetchStaff(): Promise<Staff | null> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.warn('[AuthAdapter] Session not found, attempting cache recovery:', sessionError);
        const cached = await this.recoverFromCache();
        if (cached) return cached;
        throw new NotAuthenticatedError();
      }

      // staffs テーブルから市民情報を取得
      const { data: staff, error } = await supabase
        .from('staffs')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !staff) {
        console.warn('[AuthAdapter] Staff record not found or inaccessible, attempting cache recovery:', error);
        const cached = await this.recoverFromCache(session.user.id);
        if (cached) return cached;
        throw new StaffNotFoundError();
      }

      // 型安全なデータ抽出
      const rawStaff = staff as StaffRow;
      const apps = Array.isArray(rawStaff.allowed_apps) 
        ? (rawStaff.allowed_apps as string[]) 
        : [];
      
      const role = (rawStaff.role || 'staff') as StaffRole;

      // 権限検証: allowed_apps にこのアプリが含まれているか
      if (!apps.includes(DXOS_APP_ID)) {
        console.error(`[AuthAdapter] Forbidden: No permission for ${DXOS_APP_ID}`);
        throw new AppAccessDeniedError(DXOS_APP_ID);
      }

      const resolvedStaff: Staff = {
        id: rawStaff.id,
        name: rawStaff.name,
        role: role,
        allowed_apps: apps,
        last_synced_at: new Date().toISOString(),
        device_mode: rawStaff.device_mode || undefined,
        vehicle_info: rawStaff.vehicle_info || undefined,
        permissions: this.derivePermissions(role)
      };

      // 正常に取得できたらキャッシュを更新 (Fire-and-forget)
      authStore.saveStaff(resolvedStaff).catch(e => console.error('[AuthAdapter] Cache save failed:', e));

      return resolvedStaff;
    } catch (error) {
      if (error instanceof AuthBaseError) {
        throw error; // 既知の認証エラーはそのまま投げる
      }
      console.error('[AuthAdapter] Unexpected error fetching staff:', error);
      const cached = await this.recoverFromCache();
      if (cached) return cached;
      throw error;
    }
  }

  /**
   * ロールから物理権限を導出する。 (F-SSOT 準拠)
   */
  private derivePermissions(role: StaffRole): StaffPermissions {
    switch (role) {
      case 'admin':
        return { can_edit_board: true, can_manage_master: true, can_edit_past_records: true };
      case 'manager':
        return { can_edit_board: true, can_manage_master: true, can_edit_past_records: false };
      case 'staff':
        return { can_edit_board: true, can_manage_master: false, can_edit_past_records: false };
      case 'driver':
      default:
        return { can_edit_board: false, can_manage_master: false, can_edit_past_records: false };
    }
  }

  /**
   * IndexedDB キャッシュから Staff 情報を復旧する。
   */
  private async recoverFromCache(userId?: string): Promise<Staff | null> {
    try {
      if (userId) {
        return await authStore.getStaff(userId);
      }
      
      // IDが不明な場合（未ログイン状態からのオフライン復帰等）、最後に保存されたものを探す
      const staffs = await authStore.listStaffs();
      if (staffs.length > 0) {
        return staffs[0];
      }
      
      return null;
    } catch (error) {
      console.error('[AuthAdapter] Cache recovery failed:', error);
      return null;
    }
  }

  /**
   * セッション状態の変更を監視し、キャッシュをパージする。
   */
  public async clearCache(): Promise<void> {
    this.currentStaff = null;
    await authStore.clear();
  }

  /**
   * staffs テーブルから全市民情報を取得し、権限を導出する。
   * 取得後は IDB キャッシュを一括更新する。
   */
  public async fetchAllStaffs(): Promise<Staff[]> {
    try {
      const { data, error } = await supabase
        .from('staffs')
        .select('*')
        .order('role', { ascending: true })
        .order('name');

      if (error) {
        console.warn('[AuthAdapter] Staff fetch failed, using cache:', error);
        return await authStore.listStaffs();
      }

      if (!data) return [];

      const resolvedStaffs: Staff[] = (data as StaffRow[]).map(s => {
        const apps = Array.isArray(s.allowed_apps) ? (s.allowed_apps as string[]) : [];
        const role = (s.role || 'staff') as StaffRole;
        return {
          id: s.id,
          name: s.name,
          role: role,
          allowed_apps: apps,
          last_synced_at: new Date().toISOString(),
          device_mode: s.device_mode || undefined,
          vehicle_info: s.vehicle_info || undefined,
          permissions: this.derivePermissions(role)
        };
      });

      // キャッシュの一括更新 (Fire-and-forget)
      authStore.saveStaffs(resolvedStaffs).catch(e => console.error('[AuthAdapter] Batch cache save failed:', e));

      return resolvedStaffs;
    } catch (error) {
      console.error('[AuthAdapter] Unexpected error in fetchAllStaffs:', error);
      return await authStore.listStaffs();
    }
  }

  /**
   * 指定したアプリへのアクセス権限があるか検証する。
   */
  public async checkAppPermission(appName: string): Promise<boolean> {
    const staff = await this.resolveStaff();
    if (!staff) return false;
    return staff.allowed_apps.includes(appName);
  }
}

export const authAdapter = AuthAdapter.getInstance();
