import { describe, it, expect } from 'vitest';
import { TemplateDiffCalculator } from './TemplateDiffCalculator';
import { BoardJob as Job } from '../../../types';

describe('TemplateDiffCalculator', () => {
  const baseJob: Partial<Job> = {
    id: 'job_1',
    location_id: 'cust_A',
    visitSlot: 'AM',
    duration: 60,
    requiredVehicle: undefined
  };

  it('全く同じスケルトン同士なら unchanged になる', () => {
    const original = [{ ...baseJob }];
    const actual = [{ ...baseJob }];

    const diffs = TemplateDiffCalculator.calculate(original, actual);
    
    expect(diffs).toHaveLength(1);
    expect(diffs[0].type).toBe('unchanged');
    expect(diffs[0].details).toHaveLength(0);
  });

  it('時間帯が同じで所要時間が変わっている場合は modified になる', () => {
    const original = [{ ...baseJob }];
    const actual = [{ ...baseJob, duration: 90 }];

    const diffs = TemplateDiffCalculator.calculate(original, actual);
    
    expect(diffs).toHaveLength(1);
    expect(diffs[0].type).toBe('modified');
    expect(diffs[0].details).toHaveLength(1);
    expect(diffs[0].details[0].field).toBe('duration');
    expect(diffs[0].details[0].oldValue).toBe(60);
    expect(diffs[0].details[0].newValue).toBe(90);
  });

  it('時間帯（visitSlot）が変更された場合も顧客IDが一致すれば modified として扱う', () => {
    const original = [{ ...baseJob, visitSlot: 'AM' }];
    const actual = [{ ...baseJob, visitSlot: 'PM' }];

    const diffs = TemplateDiffCalculator.calculate(original, actual);
    
    expect(diffs).toHaveLength(1);
    expect(diffs[0].type).toBe('modified');
    expect(diffs[0].details[0].field).toBe('visitSlot');
    expect(diffs[0].details[0].newValue).toBe('PM');
  });

  it('新しい顧客が追加された場合は added になる', () => {
    const original = [{ ...baseJob }];
    const actual = [
      { ...baseJob },
      { id: 'job_2', location_id: 'cust_B', visitSlot: 'ANY', duration: 30 }
    ];

    const diffs = TemplateDiffCalculator.calculate(original, actual);
    
    expect(diffs).toHaveLength(2);
    const addedDiff = diffs.find(d => d.type === 'added');
    expect(addedDiff).toBeDefined();
    expect(addedDiff?.location_id).toBe('cust_B');
    expect(addedDiff?.actualJob).toBeDefined();
    expect(addedDiff?.originalJob).toBeNull();
  });

  it('既存案件が消えた場合は removed になる', () => {
    const original = [
      { ...baseJob },
      { id: 'job_removed', location_id: 'cust_C', visitSlot: 'AM', duration: 30 }
    ];
    const actual = [{ ...baseJob }];

    const diffs = TemplateDiffCalculator.calculate(original, actual);
    
    expect(diffs).toHaveLength(2);
    const removedDiff = diffs.find(d => d.type === 'removed');
    expect(removedDiff).toBeDefined();
    expect(removedDiff?.location_id).toBe('cust_C');
    expect(removedDiff?.actualJob).toBeNull();
  });

  describe('merge()', () => {
    it('ユーザーの選択(acceptedDiffIds)に基づいてテンプレを正しく再構築する', () => {
      const original = [
        { id: '1', location_id: 'cust_A', visitSlot: 'AM', duration: 60 },
        { id: '2', location_id: 'cust_B', visitSlot: 'PM', duration: 120 }, // This will be removed
        { id: '3', location_id: 'cust_C', visitSlot: 'ANY', duration: 30 }  // Modified
      ];
      const actual = [
        { id: '1', location_id: 'cust_A', visitSlot: 'AM', duration: 60 },
        { id: '4', location_id: 'cust_C', visitSlot: 'ANY', duration: 45 }, // Modified (time changed)
        { id: '5', location_id: 'cust_D', visitSlot: 'AM', duration: 40 }  // Added
      ];

      const diffs = TemplateDiffCalculator.calculate(original, actual);
      expect(diffs).toHaveLength(4); // cust_A: unchanged, cust_B: removed, cust_C: modified, cust_D: added

      const diff_B = diffs.find(d => d.location_id === 'cust_B')!; // removed
      const diff_D = diffs.find(d => d.location_id === 'cust_D')!; // added

      // User behavior:
      // Accepts A implicitly (unchanged)
      // ACCEPTS B (removal is checked, so it will be removed from template)
      // REJECTS C (modified is not checked, so keeping original 30 min)
      // ACCEPTS D (added is checked, so it will be added to template)
      
      const acceptedIds = [diff_B.id, diff_D.id];
      const newTemplate = TemplateDiffCalculator.merge(diffs, acceptedIds);

      expect(newTemplate).toHaveLength(3); // A, C (original), D
      
      // A: kept
      expect(newTemplate.find(j => j.location_id === 'cust_A')).toBeDefined();
      
      // B: successfully removed
      expect(newTemplate.find(j => j.location_id === 'cust_B')).toBeUndefined();
      
      // C: modification rejected, so kept original '30'
      const keptC = newTemplate.find(j => j.location_id === 'cust_C');
      expect(keptC?.duration).toBe(30);
      
      // D: successfully added
      expect(newTemplate.find(j => j.location_id === 'cust_D')).toBeDefined();
    });
  });
});
