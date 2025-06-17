const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form data before submission:', form);
    console.log('Request data:', request);
    
    const selectedStatus = statusOptions.find(option => option.value === form.status);
    
    const formData = {
        material_request_id: request.id,
        items: request.items ? request.items.map(item => ({
            product_id: item.product_id,
            requestedQty: item.requestedQty,
            unit_id: item.unit_id,
            description: item.description
        })) : [],
        cost_center_id: request.cost_center_id,
        sub_cost_center_id: request.sub_cost_center_id,
        department_id: request.department_id,
        priority: request.priority,
        status: form.status,
        status_id: selectedStatus?.status_id,
        description: form.description,
        rejection_reason: form.status === "Rejected" ? form.description : null
    };
    
    console.log('Form data being submitted:', formData);
    onSave(formData);
};

const statusOptions = [
    { value: "Issue Material", label: "Issue Material", status_id: 51 },
    { value: "Reject", label: "Reject", status_id: 52 },
    { value: "Pending", label: "Pending", status_id: 1 }
]; 