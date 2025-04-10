const fetchInvoices = async () => {
    try {
        console.log('Fetching external invoices...');
        const response = await axios.get('/api/v1/external-invoices');
        console.log('External invoices API response:', response.data);
        console.log('External invoices data:', response.data.data);
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
            console.log('Purchase order data for row:', row.original);
            return row.original.purchase_order?.purchase_order_no || 'N/A';
        }
    },
    // ... other columns ...
]; 