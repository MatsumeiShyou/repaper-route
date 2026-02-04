/**
 * Report Logic
 * Fat client calculations for End of Day report.
 */

export const calculateEodStats = (jobs, totalWeightInput) => {
    const weightNum = parseFloat(totalWeightInput);
    if (isNaN(weightNum) || weightNum <= 0) {
        throw new Error("有効な総重量を入力してください");
    }

    // Filter completed jobs for calculation
    // Note: jobs might include non-completed ones if we allow partial reporting?
    // User logic: "disabled={jobs.some(j => j.status !== 'COMPLETED')}" implies all must be done.

    let totalEstimate = 0;
    const jobResults = jobs.filter(j => j.status === 'COMPLETED').map(j => {
        const jobTotal = j.result_items?.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0) || 0;
        totalEstimate += jobTotal;
        return { ...j, estimated_total: jobTotal };
    });

    // Avoid division by zero
    const ratio = totalEstimate > 0 ? weightNum / totalEstimate : (weightNum > 0 ? 1 : 0);

    const breakdown = jobResults.map(j => ({
        job_id: j.id,
        customer: j.customer_name,
        items: j.result_items?.map(item => ({
            name: item.name,
            estimated: parseFloat(item.weight) || 0,
            final: Math.round((parseFloat(item.weight) || 0) * ratio)
        }))
    }));

    return {
        totalWeight: weightNum,
        totalEstimate,
        ratio,
        breakdown
    };
};
