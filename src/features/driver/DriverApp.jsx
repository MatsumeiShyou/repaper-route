// src/features/driver/DriverApp.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

// Logic Hook (New Furniture)
import { useDriverLogic } from './logic/useDriverLogic';

// Components
import { InspectionGate } from './components/InspectionGate';
import { DriverWorkView } from './components/DriverWorkView';
import { DailyReport } from './components/DailyReport';
import { MISSION_STATES } from './logic/missionStateMachine';

// --- Safety Guard (Honesty Principle) ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Internal Error Screen
const FatalErrorScreen = () => (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={40} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">システム設定エラー</h1>
        <p className="text-gray-400 mb-8">
            データベースへの接続情報が見つかりません。<br />
            管理者へ連絡してください。
        </p>
    </div>
);

export default function DriverApp({ initialDriverName = '佐藤 ドライバー', initialVehicle = '車両: 1122AB' }) {
    // 1. Safety Check
    if (!supabaseUrl || !supabaseKey) return <FatalErrorScreen />;

    // 2. Use the "New Furniture" (Logic Hook)
    // 全てのロジック・状態はここで一括管理されます
    const {
        // Data
        driverName,
        vehicleInfo,
        missionState,
        jobs,
        loading,
        inspection,
        activeJobId,
        manualData,
        photoPreview,
        // undoStack,
        theme,
        toasts,
        modalConfig,
        fileInputRef,

        // Actions
        toggleTheme,
        handleInspectionCheck,
        startWork,
        handleJobUpdate,
        handlePhotoSelect,
        startEndOfDay,
        submitEndOfDay,
        cancelReport, // Added this!
        setModalConfig,
        setManualData,
        setPhotoPreview,
        addToast,
        removeToast,
        openModal
    } = useDriverLogic(initialDriverName, initialVehicle);

    // 3. Render Views based on State (Pure Router)
    if (missionState === MISSION_STATES.INSPECTION) {
        return <InspectionGate
            vehicleInfo={vehicleInfo}
            inspectionItems={inspection}
            onCheck={handleInspectionCheck}
            onStartWork={startWork}
            theme={theme}
            onToggleTheme={toggleTheme}
            toasts={toasts}
            removeToast={removeToast}
        />;
    }

    if (missionState === MISSION_STATES.REPORTING) {
        return <DailyReport
            toasts={toasts}
            removeToast={removeToast}
            modalConfig={modalConfig}
            setModalConfig={setModalConfig}
            onSubmit={submitEndOfDay}
            onCancel={cancelReport}
        />;
    }

    // Default: WORKING
    return <DriverWorkView
        driverName={driverName}
        vehicleInfo={vehicleInfo}
        theme={theme}
        onToggleTheme={toggleTheme}
        toasts={toasts}
        removeToast={removeToast}
        jobs={jobs}
        loading={loading}
        activeJobId={activeJobId}
        photoPreview={photoPreview}
        manualData={manualData}
        onManualDataChange={(idx, val) => {
            const newItems = [...manualData.items];
            newItems[idx].weight = val;
            setManualData({ ...manualData, items: newItems });
        }}
        onPhotoClick={() => fileInputRef.current?.click()}
        onPhotoReset={() => { setManualData(prev => ({ ...prev, photo: null })); setPhotoPreview(null); }}
        onPhotoSelect={handlePhotoSelect}
        fileInputRef={fileInputRef}
        onJobUpdate={handleJobUpdate}
        addToast={addToast}
        openModal={openModal}
        onStartEOD={startEndOfDay}
        modalConfig={modalConfig}
        setModalConfig={setModalConfig}
    />;
}
