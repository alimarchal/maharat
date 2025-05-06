const fetchInvoices = async () => {
    try {
        const response = await axios.get('/api/v1/external-invoices');
        setInvoices(response.data.data || []);
    } catch (error) {
        console.error('Error fetching external invoices:', error);
        console.error('Error response:', error.response?.data);
    }
};

const columns = [
    // ... other columns ...
    {
        header: 'Purchase Order',
        accessorKey: 'purchase_order',
        cell: ({ row }) => {
            return row.original.purchase_order?.purchase_order_no || 'N/A';
        }
    },
    // ... other columns ...
]; 