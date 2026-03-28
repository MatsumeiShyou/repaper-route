import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

export function useMasterCRUD({
    viewName,
    rpcTableName,
    rpcName = 'rpc_execute_master_update',
    searchFields = [],
    initialSort = { column: 'name', ascending: true }
}) {
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            let query = supabase.from(viewName).select('*');
            try { query = query.eq('is_active', true); } catch (e) { }

            if (initialSort) query = query.order(initialSort.column, { ascending: initialSort.ascending });

            const { data: result, error } = await query;
            if (error) throw error;
            setData(result || []);
        } catch (e) {
            console.error(`Fetch Error [${viewName}]:`, e);
            showNotification(`データの取得に失敗しました [${viewName}]`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [viewName, initialSort, showNotification]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenAdd = () => { setSelectedItem(null); setReason(''); setIsModalOpen(true); };
    const handleOpenEdit = (item) => { setSelectedItem(item); setReason(''); setIsModalOpen(true); };
    const handleOpenDelete = (item) => { setSelectedItem(item); setReason(''); setIsDeleteModalOpen(true); };

    const handleSave = async (formData, coreDataFactory, extDataFactory, decisionTypeOverride = null) => {
        if (!reason) { showNotification("変更理由を入力してください (SDR必須)", "warning"); return; }
        setIsSubmitting(true);
        try {
            const isEdit = !!selectedItem;
            const coreData = coreDataFactory(formData);
            const extData = extDataFactory ? extDataFactory(formData) : {};

            const { error } = await supabase.rpc(rpcName, {
                p_table_name: rpcTableName,
                p_id: selectedItem?.id || null,
                p_core_data: coreData,
                p_ext_data: extData,
                p_decision_type: decisionTypeOverride || (isEdit ? 'MASTER_UPDATE' : 'MASTER_REGISTRATION'),
                p_reason: reason,
                p_user_id: currentUser.id
            });

            if (error) throw error;
            await fetchData();
            setIsModalOpen(false);
            showNotification(isEdit ? "マスタを更新しました" : "マスタを新規登録しました", "success");
        } catch (e) {
            showNotification("保存エラー: " + e.message, "error");
        } finally { setIsSubmitting(false); }
    };

    const handleArchive = async (idField = 'id') => {
        if (!reason) { showNotification("アーカイブ理由を入力してください", "warning"); return; }
        setIsSubmitting(true);
        try {
            const { error } = await supabase.rpc(rpcName, {
                p_table_name: rpcTableName,
                p_id: selectedItem[idField],
                p_core_data: { is_active: false },
                p_ext_data: {},
                p_decision_type: 'MASTER_ARCHIVE',
                p_reason: reason,
                p_user_id: currentUser.id
            });

            if (error) throw error;
            await fetchData();
            setIsDeleteModalOpen(false);
            showNotification("データをアーカイブしました", "success");
        } catch (e) { showNotification("アーカイブエラー: " + e.message, "error"); } finally { setIsSubmitting(false); }
    };

    return {
        data: data.filter(item => {
            if (!searchTerm) return true;
            return searchFields.some(field => String(item[field]).toLowerCase().includes(searchTerm.toLowerCase()));
        }),
        isLoading, searchTerm, setSearchTerm, isModalOpen, setIsModalOpen, isDeleteModalOpen, setIsDeleteModalOpen,
        selectedItem, reason, setReason, isSubmitting, handleOpenAdd, handleOpenEdit, handleOpenDelete, handleSave, handleArchive, refresh: fetchData
    };
}
