/**
 * Section 1. 三層の制約レイヤー - L1: Hard Lock（絶対制約）:
 * 免許不一致（MT/中型）、車両入場制約。
 * これらはUI操作を物理的にブロックし、配置・移動を拒否する。
 */
export class LicenseMatcher {
    /** 
     * 短縮コードの定義。
     * MT: Manual Transmission
     * AT: Automatic Transmission
     * MID: 中型免許
     * LRG: 大型免許
     */

    /**
     * ドライバーが特定の車両を運転可能か判定する。
     * @param driverLicense ドライバーの免許区分 (例: "MT")
     * @param vehicleRequirement 車両の要求免許 (例: "MT")
     */
    static canDrive(driverLicense: string, vehicleRequirement: string): boolean {
        const d = driverLicense.toUpperCase();
        const v = vehicleRequirement.toUpperCase();

        if (d === v) return true;

        // MT免許はAT車両を運転可能
        if (d === 'MT' && v === 'AT') return true;

        // 大型は中型・普通を兼ねる（簡略化）
        if (d === 'LRG') return true;
        if (d === 'MID' && (v === 'AT' || v === 'MT')) return true;

        return false;
    }
}
