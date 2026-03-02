import { describe, it, expect } from 'vitest';
import { TemplateExpander } from './TemplateExpander';

describe('TemplateExpander', () => {
    it('should assign jobs when resources are available', () => {
        const templateJobs: any[] = [
            { id: 'job-1', driver_id: 'd-1', vehicle_name: 'v-1', required_vehicle: 'MT' }
        ];
        const drivers: any[] = [
            { id: 's-1', display_order: 1 }, // Sorting Staff 1
            { id: 's-2', display_order: 2 }, // Sorting Staff 2
            { id: 'd-1', vehicle_number: 'MT' } // Driver
        ];
        const vehicles: any[] = [
            { number: 'v-1' }
        ];

        const result = TemplateExpander.expand(templateJobs, drivers, vehicles);
        expect(result.assigned).toHaveLength(1);
        expect(result.unassigned).toHaveLength(0);
        expect(result.sortingStaff).toHaveLength(2);
    });

    it('should evacuate jobs to unassigned when driver is missing', () => {
        const templateJobs: any[] = [
            { id: 'job-1', driver_id: 'd-missing', vehicle_name: 'v-1' }
        ];
        const drivers: any[] = [
            { id: 's-1', display_order: 1 },
            { id: 's-2', display_order: 2 }
        ];
        const vehicles: any[] = [{ number: 'v-1' }];

        const result = TemplateExpander.expand(templateJobs, drivers, vehicles);
        expect(result.assigned).toHaveLength(0);
        expect(result.unassigned).toHaveLength(1);
        expect(result.unassigned[0].id).toBe('job-1');
    });

    it('should evacuate jobs due to license mismatch', () => {
        const templateJobs: any[] = [
            { id: 'job-1', driver_id: 'd-1', vehicle_name: 'v-1', required_vehicle: 'MT' }
        ];
        const drivers: any[] = [
            { id: 's-1', display_order: 1 },
            { id: 's-2', display_order: 2 },
            { id: 'd-1', vehicle_number: 'AT' } // AT Driver for MT Job
        ];
        const vehicles: any[] = [{ number: 'v-1' }];

        const result = TemplateExpander.expand(templateJobs, drivers, vehicles);
        expect(result.assigned).toHaveLength(0);
        expect(result.unassigned).toHaveLength(1);
    });
});
