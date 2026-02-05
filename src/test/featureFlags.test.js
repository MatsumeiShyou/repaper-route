import { describe, it, expect } from 'vitest';
import { FEATURE_FLAGS, getFeatureFlag, getEnabledFeatures } from '../config/featureFlags';

describe('featureFlags', () => {
    describe('FEATURE_FLAGS', () => {
        it('has all expected flags defined', () => {
            expect(FEATURE_FLAGS).toHaveProperty('USE_REFACTORED_BOARD');
            expect(FEATURE_FLAGS).toHaveProperty('USE_REPOSITORY_LAYER');
            expect(FEATURE_FLAGS).toHaveProperty('USE_ZUSTAND_STATE');
            expect(FEATURE_FLAGS).toHaveProperty('USE_VOICE_INPUT');
            expect(FEATURE_FLAGS).toHaveProperty('USE_GAMIFICATION');
        });

        it('all flags are initially false (safe default)', () => {
            expect(FEATURE_FLAGS.USE_REFACTORED_BOARD).toBe(false);
            expect(FEATURE_FLAGS.USE_REPOSITORY_LAYER).toBe(false);
            expect(FEATURE_FLAGS.USE_ZUSTAND_STATE).toBe(false);
            expect(FEATURE_FLAGS.USE_VOICE_INPUT).toBe(false);
            expect(FEATURE_FLAGS.USE_GAMIFICATION).toBe(false);
        });
    });

    describe('getFeatureFlag', () => {
        it('returns correct flag value', () => {
            expect(getFeatureFlag('USE_REFACTORED_BOARD')).toBe(false);
        });

        it('returns false for unknown flags', () => {
            expect(getFeatureFlag('UNKNOWN_FLAG')).toBe(false);
        });

        it('logs warning for unknown flags', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            getFeatureFlag('UNKNOWN_FLAG');
            expect(consoleSpy).toHaveBeenCalledWith('Unknown feature flag: UNKNOWN_FLAG');
            consoleSpy.mockRestore();
        });
    });

    describe('getEnabledFeatures', () => {
        it('returns empty array when all flags are false', () => {
            const enabled = getEnabledFeatures();
            expect(enabled).toEqual([]);
        });

        it('returns enabled flag names', () => {
            // Temporarily modify FEATURE_FLAGS for this test
            FEATURE_FLAGS.USE_REFACTORED_BOARD = true;
            FEATURE_FLAGS.USE_VOICE_INPUT = true;

            const enabled = getEnabledFeatures();
            expect(enabled).toContain('USE_REFACTORED_BOARD');
            expect(enabled).toContain('USE_VOICE_INPUT');
            expect(enabled).not.toContain('USE_ZUSTAND_STATE');

            // Reset
            FEATURE_FLAGS.USE_REFACTORED_BOARD = false;
            FEATURE_FLAGS.USE_VOICE_INPUT = false;
        });
    });
});
