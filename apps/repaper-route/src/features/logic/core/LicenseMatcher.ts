/**
 * Section 1. 三層の制紁E��イヤー - L1: Hard Lock�E�絶対制紁E��E
 * 免許不一致�E�ET/中型）、車両入場制紁E��E * これら�EUI操作を物琁E��にブロチE��し、E�E置・移動を拒否する、E */
export class LicenseMatcher {
    /** 
     * 短縮コード�E定義、E     * MT: Manual Transmission
     * AT: Automatic Transmission
     * MID: 中型�E許
     * LRG: 大型�E許
     */

    /**
     * ドライバ�Eが特定�E車両を運転可能か判定する、E     * @param driverLicense ドライバ�Eの免許区刁E(侁E "MT")
     * @param vehicleRequirement 車両の要求�E許 (侁E "MT")
     */
    static canDrive(driverLicense: string, vehicleRequirement: string): boolean {
        const d = driverLicense.toUpperCase();
        const v = vehicleRequirement.toUpperCase();

        if (d === v) return true;

        // MT免許はAT車両を運転可能
        if (d === 'MT' && v === 'AT') return true;

        // 大型�E中型�E普通を兼ねる（簡略化！E        if (d === 'LRG') return true;
        if (d === 'MID' && (v === 'AT' || v === 'MT')) return true;

        return false;
    }
}
