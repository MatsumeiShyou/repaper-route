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
      } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        // サインイン時・リロード時は古いキャッシュ（Promise）を破棄し、最新を取得できる状態にする
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

    this.currentStaff = this.fetchStaff().catch(err => {
      // reject した Promise がキャッシュに固着するのを防止
      this.currentStaff = null;
      throw err;
    });
    return this.currentStaff;
  }

  /**
   * onAuthStateChange コールバックから呼ばれる専用メソッド。
   * 既に取得済みの Session を受け取り、getSession() の再呼び出しを回避する。
   * これにより Supabase クライアント内部のロック競合（デッドロック）を物理的に排除する。
   */
  public resolveStaffFromSession(session: import('@supabase/supabase-js').Session): Promise<Staff | null> {
    // セッション付き解決では常に新鮮な Promise を生成する（キャッシュを使わない）
    this.currentStaff = this.fetchStaff(session).catch(err => {
      this.currentStaff = null;
      throw err;
    });
    return this.currentStaff;
  }

  /**
   * staffs テーブル (OS 規格) から Staff 情報を取得・検証する。
   * ネットワークエラー時は IndexedDB キャッシュからの復旧を試みる。
   * 
   * @param preFetchedSession onAuthStateChange から渡されたセッション（デッドロック回避用）
   */
  private async fetchStaff(preFetchedSession?: import('@supabase/supabase-js').Session): Promise<Staff | null> {
    try {
      let session = preFetchedSession;
      
      // 引数でセッションが渡されなかった場合のみ、getSession() で取得する
      if (!session) {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn('[AuthAdapter] Session not found, attempting cache recovery:', sessionError);
        }
        session = data.session || undefined;
      }
      
      if (!session?.user) {
        const cached = await this.recoverFromCache();
        if (cached) return cached;
        throw new NotAuthenticatedError();
      }

      console.log('[AuthAdapter] >>> Native fetch(staffs) EXECUTE START');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const url = `${supabaseUrl}/rest/v1/staffs?id=eq.${session.user.id}&select=*`;
      
      const queryPromise = fetch(url, {
          method: 'GET',
          headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${session.access_token}`,
              // single() 相当（1件のみ取得しオブジェクトとして返す）
              'Accept': 'application/vnd.pgrst.object+json'
          }
      }).then(async (res) => {
          if (!res.ok) {
              const text = await res.text();
              throw new Error(`DB Fetch failed: ${res.status} ${text}`);
          }
          const data = await res.json();
          console.log('[AuthAdapter] <<< Native fetch(staffs) EXECUTE END', data);
          return { data, error: null };
      }).catch(err => {
          return { data: null, error: err };
      });
        
      const timeoutPromise = new Promise<any>((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT_DB_FETCH')), 15000);
      });
      
      const { data: staff, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error || !staff) {
        console.warn('[AuthAdapter] Staff record not found by auth_uid. Error:', error);
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

      // 権限検証: allowed_apps に管理者用またはドライバー用の権限が含まれているか
      const hasPermission = apps.includes('repaper-route') || apps.includes('repaper-route-admin') || apps.includes('repaper-route-driver');
      
      if (!hasPermission) {
        console.error(`[AuthAdapter] Forbidden: No permission for repaper-route modules. Found:`, apps);
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
        permissions: this.derivePermissions(role, {
          can_edit_board: rawStaff.can_edit_board ?? undefined
        })
      };

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
    * @param role スタッフのロール
    * @param overrides DB上の個別フラグによる上書き（SSOT）
    */
  private derivePermissions(role: StaffRole, overrides?: Partial<StaffPermissions>): StaffPermissions {
    let base: StaffPermissions;
    switch (role) {
      case 'admin':
        base = { can_edit_board: true, can_manage_master: true, can_edit_past_records: true };
        break;
      case 'manager':
        base = { can_edit_board: true, can_manage_master: true, can_edit_past_records: false };
        break;
      case 'staff':
        base = { can_edit_board: true, can_manage_master: false, can_edit_past_records: false };
        break;
      case 'driver':
      default:
        base = { can_edit_board: false, can_manage_master: false, can_edit_past_records: false };
        break;
    }

    // DB上のフラグを SSOT として優先適用
    return {
      ...base,
      ...Object.fromEntries(
        Object.entries(overrides || {}).filter(([_, v]) => v !== undefined)
      )
    } as StaffPermissions;
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
          permissions: this.derivePermissions(role, {
            can_edit_board: s.can_edit_board ?? undefined
          })
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
