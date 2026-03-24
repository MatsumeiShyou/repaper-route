import { BoardJob as Job } from '../../../types';

export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface DiffDetail {
  field: keyof Job;
  oldValue: any;
  newValue: any;
}

export interface DiffItem {
  id: string; // 一意の行ID
  type: DiffType;
  location_id: string;
  originalJob: Partial<Job> | null;
  actualJob: Partial<Job> | null;
  details: DiffDetail[];
}

export class TemplateDiffCalculator {
  /**
   * 2つのJob配列（元のテンプレートと今日の盤面）を比較し、DiffItemの配列を返す純粋関数。
   * customer_id を主キーとして時間帯(visit_slot)の変更等も「変更」として追跡する。
   */
  static calculate(originalJobs: Partial<Job>[], actualJobs: Partial<Job>[]): DiffItem[] {
    const diffs: DiffItem[] = [];
    
    // Group by location_id
    const origMap = new Map<string, Partial<Job>[]>();
    const actMap = new Map<string, Partial<Job>[]>();
    
    for (const job of originalJobs) {
      if (!job.location_id) continue;
      if (!origMap.has(job.location_id)) origMap.set(job.location_id, []);
      origMap.get(job.location_id)!.push(job);
    }
    for (const job of actualJobs) {
      if (!job.location_id) continue;
      if (!actMap.has(job.location_id)) actMap.set(job.location_id, []);
      actMap.get(job.location_id)!.push(job);
    }
    
    const allCustomerIds = new Set([...origMap.keys(), ...actMap.keys()]);
    
    for (const cid of allCustomerIds) {
      const origList = [...(origMap.get(cid) || [])];
      const actList = [...(actMap.get(cid) || [])];
      
      // Pass 1: Match by exact visitSlot
      for (let i = origList.length - 1; i >= 0; i--) {
        const oJob = origList[i];
        const matchIdx = actList.findIndex(a => a.visitSlot === oJob.visitSlot);
        
        if (matchIdx !== -1) {
          const aJob = actList[matchIdx];
          const details = this.getDiffDetails(oJob, aJob);
          
          diffs.push({
            id: `diff_${cid}_${oJob.visitSlot}_${Math.random().toString(36).substr(2, 6)}`,
            type: details.length > 0 ? 'modified' : 'unchanged',
            location_id: cid,
            originalJob: oJob,
            actualJob: aJob,
            details
          });
          
          origList.splice(i, 1);
          actList.splice(matchIdx, 1);
        }
      }
      
      // Pass 2: Pair remaining mismatched by visitSlot (e.g. AM -> PM)
      while (origList.length > 0 && actList.length > 0) {
        const oJob = origList.shift()!;
        const aJob = actList.shift()!;
        const details = this.getDiffDetails(oJob, aJob);
        
        diffs.push({
          id: `diff_${cid}_modified_${Math.random().toString(36).substr(2, 6)}`,
          type: 'modified', 
          location_id: cid,
          originalJob: oJob,
          actualJob: aJob,
          details
        });
      }
      
      // Pass 3: Remaining in origList are 'removed'
      for (const oJob of origList) {
        diffs.push({
          id: `diff_${cid}_removed_${Math.random().toString(36).substr(2, 6)}`,
          type: 'removed',
          location_id: cid,
          originalJob: oJob,
          actualJob: null,
          details: []
        });
      }
      
      // Pass 4: Remaining in actList are 'added'
      for (const aJob of actList) {
        diffs.push({
          id: `diff_${cid}_added_${Math.random().toString(36).substr(2, 6)}`,
          type: 'added',
          location_id: cid,
          originalJob: null,
          actualJob: aJob,
          details: []
        });
      }
    }
    
    return diffs;
  }
  
  private static getDiffDetails(oJob: Partial<Job>, aJob: Partial<Job>): DiffDetail[] {
    const details: DiffDetail[] = [];
    const fieldsToCompare: (keyof Job)[] = [
        'visitSlot', 'duration', 'requiredVehicle', 'title', 
        'bucket', 'area', 'note', 'taskType', 'item_category'
    ];
    
    for (const field of fieldsToCompare) {
      const oVal = oJob[field];
      const aVal = aJob[field];
      if (oVal !== aVal) {
        // loose equality filtering for falsy equivalents (e.g empty string and null)
        if ((oVal == null || oVal === '') && (aVal == null || aVal === '')) {
            continue;
        }
        details.push({
          field,
          oldValue: oVal,
          newValue: aVal
        });
      }
    }
    return details;
  }

  /**
   * ユーザーが受け入れた(ONにした)差分のIDリストを受け取り、新たなテンプレート骨格データを生成する関数。
   */
  static merge(diffItems: DiffItem[], acceptedDiffIds: string[]): Partial<Job>[] {
    const newTemplate: Partial<Job>[] = [];
    const acceptedSet = new Set(acceptedDiffIds);
    
    for (const item of diffItems) {
      const isAccepted = acceptedSet.has(item.id);
      
      switch (item.type) {
        case 'unchanged':
          newTemplate.push(item.originalJob!);
          break;
        case 'added':
          if (isAccepted) {
            newTemplate.push(item.actualJob!);
          }
          break;
        case 'removed':
          if (!isAccepted) {
            // 削除を「拒否」した場合、元のテンプレ通り残す
            newTemplate.push(item.originalJob!);
          }
          break;
        case 'modified':
          if (isAccepted) {
            // 変更を受け入れた場合、当日の新しい実績データを使う
            newTemplate.push(item.actualJob!);
          } else {
            // 変更を拒否した場合、元のテンプレデータを使う
            newTemplate.push(item.originalJob!);
          }
          break;
      }
    }
    
    return newTemplate;
  }
}
