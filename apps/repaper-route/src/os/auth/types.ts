import { Database } from '../../types/database.types';

export type StaffRow = Database['public']['Tables']['staffs']['Row'];
export type StaffRole = 'admin' | 'driver' | 'staff' | 'manager';

/** 本アプリケーションの DXOS 識別子 */
export const DXOS_APP_ID = 'repaper-route';

export interface Staff {
  /** Supabase Auth ユーザー ID */
  id: string;
  /** 氏名（表示用） */
  name: string;
  /** OS レベルの権限ロール */
  role: StaffRole;
  /** 
   * アプリケーションごとのアクセス権限 
   * 例: ['repaper-route', 'inventory-os'] 
   */
  allowed_apps: string[];
  /** 最終同期日時（ISOString / Offline キャッシュ用） */
  last_synced_at?: string;
  /** デバイス表示モード (auto/pc/mobile/tablet) */
  device_mode?: string;
  /** 車両情報紐付け（ドライバー用） */
  vehicle_info?: string;
  /** ロールに基づき導出された権限セット */
  permissions: StaffPermissions;
}

export interface StaffPermissions {
  /** 配車ボードの編集権限（ドラッグ＆ドロップ、ステータス変更等） */
  can_edit_board: boolean;
  /** マスタデータの編集権限 */
  can_manage_master: boolean;
  /** 過去の配車履歴の編集権限 */
  can_edit_past_records: boolean;
}

export interface AuthError {
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NETWORK_ERROR' | 'UNKNOWN';
  message: string;
  details?: any;
}

/** 認証基盤の基底エラー */
export class AuthBaseError extends Error {
  constructor(public code: AuthError['code'], message: string) {
    super(message);
    this.name = 'AuthBaseError';
  }
}

/** 未認証（セッションなし） */
export class NotAuthenticatedError extends AuthBaseError {
  constructor() {
    super('UNAUTHORIZED', 'セッションが見つかりません。サインインしてください。');
  }
}

/** ユーザーがスタッフ名簿に登録されていない */
export class StaffNotFoundError extends AuthBaseError {
  constructor() {
    super('FORBIDDEN', 'スタッフ名簿に登録されていません。管理者に申請してください。');
  }
}

/** 特定アプリへのアクセス権限がない */
export class AppAccessDeniedError extends AuthBaseError {
  constructor(appName: string) {
    super('FORBIDDEN', `このアプリ (${appName}) へのアクセス権限がありません。`);
  }
}

/**
 * 統合 OS における認証状態の列挙
 */
export type AuthStatus = 'INITIALIZING' | 'UNAUTHENTICATED' | 'AUTHENTICATED' | 'LOCKED';
