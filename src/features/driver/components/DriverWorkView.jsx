import React from 'react';
import { ToastContainer } from '../../../components/Toast';
import { JobCard } from '../../../components/JobCard'; // Assuming reuse of existing component
import { JobCardSkeleton } from '../../../components/Skeleton';
import { LogOut, Sun, Moon, Camera, X } from 'lucide-react';
import { Modal } from '../../../components/Modal';

export const DriverWorkView = ({
    driverName,
    vehicleInfo,
    theme,
    onToggleTheme,
    toasts,
    removeToast,
    jobs,
    loading,
    activeJobId,
    photoPreview,
    manualData,
    onManualDataChange,
    onPhotoClick,
    onPhotoReset,
    onPhotoSelect,
    fileInputRef,
    onJobUpdate,
    addToast,
    openModal,
    onStartEOD,
    modalConfig,
    setModalConfig
}) => {

    // Progress Bar Logic
    const total = jobs.length;
    const completed = jobs.filter(j => j.status === 'COMPLETED').length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    // Sorting Logic: 
    // User Requirement: 
    // 1. Completed jobs come FIRST (Top) - ordered by completion time
    // 2. Incomplete jobs come AFTER (Bottom) - ordered by schedule time
    const sortedJobs = [...jobs].sort((a, b) => {
        const isCompletedA = a.status === 'COMPLETED';
        const isCompletedB = b.status === 'COMPLETED';

        // Primary: Status (Completed at Top)
        if (isCompletedA && !isCompletedB) return -1; // A is Completed -> Moves up
        if (!isCompletedA && isCompletedB) return 1;  // B is Completed -> Moves up

        // Secondary: Inside Completed Group (Sort by completion time)
        if (isCompletedA && isCompletedB) {
            const timeA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
            const timeB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
            return timeA - timeB; // Ascending (First completed at top)
        }

        // Secondary: Inside Incomplete Group (Sort by schedule time)
        // Convert 'HH:MM' to comparison
        if (a.startTime < b.startTime) return -1;
        if (a.startTime > b.startTime) return 1;

        return 0;
    });

    return (
        <div className="bg-[#111827] dark:bg-gray-950 min-h-screen flex flex-col transition-colors">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <header className="bg-[#111827] dark:bg-gray-900 text-white p-4 sticky top-0 z-20 border-b border-gray-800">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">本日のミッション</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="font-semibold">{driverName}</p>
                            <p className="text-xs text-gray-400">{vehicleInfo}</p>
                        </div>
                        <button onClick={onToggleTheme} className="p-2 rounded-full hover:bg-gray-800 transition-colors">
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="bg-gray-800 pb-1">
                <div className="h-1 w-full bg-gray-700">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="text-[10px] text-gray-400 text-right px-2">
                    完了: {completed} / {total}
                </div>
            </div>

            <main className="flex-grow p-4 overflow-y-auto bg-[#111827] dark:bg-gray-950 transition-colors">
                <div className="max-w-md mx-auto relative pb-20">
                    {loading ? (
                        <>
                            <JobCardSkeleton />
                            <JobCardSkeleton />
                            <JobCardSkeleton />
                        </>
                    ) : (
                        <>
                            {sortedJobs.map((job, index) => (
                                <div key={`${job.id}_${job.status}`}>
                                    <JobCard
                                        job={job}
                                        isActive={activeJobId === job.id}
                                        isOtherActive={activeJobId && activeJobId !== job.id}
                                        onJobUpdate={onJobUpdate}
                                        driverId={driverName} // ID or Name? Parent passed ID usually. Check usage.
                                        manualData={manualData}
                                        onManualDataChange={onManualDataChange}
                                        isLast={index === jobs.length - 1}
                                        addToast={addToast}
                                        openConfirmModal={openModal}
                                    />
                                    {/* Photo Input Overlay */}
                                    {activeJobId === job.id && job.status === 'WORKING' && (
                                        <div className="mb-4 bg-white dark:bg-gray-800 p-3 rounded-lg -mt-2 mx-2 border-t border-gray-100 dark:border-gray-700 shadow-inner animate-in slide-in-from-top-2">
                                            <h4 className="font-bold text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2"><Camera size={16} /> 現場写真</h4>

                                            {!photoPreview ? (
                                                <button onClick={onPhotoClick}
                                                    className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                    <Camera size={24} />
                                                    <span className="text-xs mt-1">タップして撮影/選択</span>
                                                </button>
                                            ) : (
                                                <div className="relative">
                                                    <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                                                    <button onClick={onPhotoReset}
                                                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                className="hidden"
                                                ref={fileInputRef}
                                                onChange={onPhotoSelect}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* End of Day Button */}
                            <div className="mt-8 mb-8">
                                <button
                                    onClick={onStartEOD}
                                    disabled={jobs.some(j => j.status !== 'COMPLETED')}
                                    className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white p-4 rounded-xl font-bold text-lg border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                                    <LogOut /> 業務終了・帰社報告
                                </button>
                                {jobs.some(j => j.status !== 'COMPLETED') && (
                                    <p className="text-center text-xs text-gray-500 mt-2">※全ての案件完了後に報告できます</p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
            <Modal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                title={modalConfig.title}
                footer={
                    <>
                        <button onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-bold">キャンセル</button>
                        <button onClick={modalConfig.onConfirm} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700">OK</button>
                    </>
                }
            >
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{modalConfig.message}</p>
            </Modal>
        </div>
    );
};
