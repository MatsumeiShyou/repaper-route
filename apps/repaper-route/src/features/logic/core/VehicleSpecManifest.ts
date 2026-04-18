import { LogicVehicle } from '../types';

/**
 * 車種ごとの基本スペック定義
 */
export interface VehicleSpec {
  capacityWeight: number; // 最大積載量 (kg)
  type: 'light' | '2t' | '4t' | 'huge' | 'special';
}

/**
 * 車両呼称（callsign）からスペックを推定するためのルールエンジン
 * 物理 DB の不足を論理で補完する
 */
const SPEC_RULES: { pattern: RegExp; spec: VehicleSpec }[] = [
  { pattern: /4t|４ｔ|中型|ユニック/, spec: { capacityWeight: 4000, type: '4t' } },
  { pattern: /2t|２ｔ|3t|小型/, spec: { capacityWeight: 2000, type: '2t' } },
  { pattern: /軽|350|ミニ/, spec: { capacityWeight: 350, type: 'light' } },
  { pattern: /大型|10t|パッカー/, spec: { capacityWeight: 8000, type: 'huge' } },
];

const DEFAULT_SPEC: VehicleSpec = {
  capacityWeight: 500, // 安全側に倒したデフォルト値
  type: 'special'
};

/**
 * 車両情報（物理データ）を論理スペック（LogicVehicle）へ変換する
 * @param maxPayload DB (logistics_vehicle_attrs) 由来の積載量。存在すれば最優先。
 */
export const resolveVehicleSpec = (
  id: string,
  name?: string,
  callsign?: string,
  maxPayload?: number
): Partial<LogicVehicle> => {
  // 1. DB (物理層) に有効な積載量がある場合は、それを絶対的 SSOT とする
  if (maxPayload !== undefined && maxPayload !== null && maxPayload > 0) {
    return {
      capacityWeight: maxPayload,
    };
  }

  // 2. DB に値がない場合、マニフェストルール (論理層) に従い決定論的に解決
  const searchString = `${name || ''} ${callsign || ''}`;
  const matchedRule = SPEC_RULES.find(rule => rule.pattern.test(searchString));
  const spec = matchedRule ? matchedRule.spec : DEFAULT_SPEC;

  return {
    capacityWeight: spec.capacityWeight,
  };
};
