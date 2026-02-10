
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import BoardCanvas from '../BoardCanvas';
import * as useBoardDataHook from '../hooks/useBoardData';
import * as useBoardDragDropHook from '../hooks/useBoardDragDrop';

// Mock Hooks
vi.mock('../hooks/useBoardData');
vi.mock('../hooks/useBoardDragDrop', () => ({
    useBoardDragDrop: () => ({
        draggingJobId: null,
        draggingSplitId: null,
        dropPreview: null,
        dropSplitPreview: null,
        dragMousePos: null,
        handleJobMouseDown: vi.fn(),
        handleSplitMouseDown: vi.fn(),
        handleBackgroundMouseMove: vi.fn(),
        handleBackgroundMouseUp: vi.fn()
    })
}));

describe('BoardCanvas Integration', () => {

    const mockBoardData = {
        masterDrivers: [{ id: 'd1', name: 'Tanaka' }],
        vehicles: [{ id: 'v1', name: 'Truck1' }],
        customers: [{ id: 'c1', name: 'Customer A' }],
        items: [{ id: 'i1', name: 'Cardboard', unit: 'kg' }],
        customerItemDefaults: [{ customer_id: 'c1', collection_point_id: 'c1', item_id: 'i1' }],
        drivers: [
            { id: 'course_A', name: 'A Course', driverName: 'Tanaka', course: 'A' },
            { id: 'course_B', name: 'B Course', driverName: 'Suzuki', course: 'B' }
        ],
        jobs: [],
        pendingJobs: [],
        splits: [],
        isDataLoaded: true,
        editMode: true, // Test in Edit Mode
        canEditBoard: true,
        requestEditLock: vi.fn(),
        releaseEditLock: vi.fn(),
        handleSave: vi.fn(),
        addColumn: vi.fn(),
        deleteColumn: vi.fn(),
        setJobs: vi.fn()
    };

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
        // Setup default hook return
        useBoardDataHook.useBoardData.mockReturnValue(mockBoardData);
    });

    it('renders board with columns', () => {
        render(<BoardCanvas />);
        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.getByText(/未割当案件/)).toBeInTheDocument(); // Sidebar check (regex)
        expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('opens add job modal on cell double click', async () => {
        render(<BoardCanvas />);

        // Find a cell in A Course (first column)
        // Since TimeGrid renders many cells, let's find one by some attribute or just first one
        // Note: TimeGrid cells usually don't have text, but we can target by class or role if added
        // The current implementation TimeGrid cells have `cursor-cell`. 
        // Let's rely on checking if modal opens.

        // Strategy: Use a known test ID or query selector on a cell.
        // Since we can't easily modify code now just for test ID without more steps, 
        // let's try to find element by class name.
        const cells = document.getElementsByClassName('cursor-cell');
        if (cells.length > 0) {
            fireEvent.doubleClick(cells[0]);

            // Check if modal opened
            await waitFor(() => {
                expect(screen.getByText('案件詳細編集')).toBeInTheDocument();
            });
        }
    });

    it('populates default items when customer is selected', async () => {
        render(<BoardCanvas />);
        const cells = document.getElementsByClassName('cursor-cell');
        fireEvent.doubleClick(cells[0]);

        await waitFor(() => screen.getByText('案件詳細編集'));

        // Find customer select
        // Label: "顧客から自動入力"
        const select = screen.getByDisplayValue('(顧客を選択して自動入力)'); // Initial value

        // Change selection to Customer A (value: c1)
        fireEvent.change(select, { target: { value: 'c1' } });

        // Verify Title Update
        expect(screen.getByPlaceholderText('案件名または顧客名')).toHaveValue('Customer A');

        // Verify Item Added
        await waitFor(() => {
            expect(screen.getByText('Cardboard')).toBeInTheDocument(); // Name of item
            expect(screen.getByText('kg')).toBeInTheDocument(); // Unit
        });
    });
});
