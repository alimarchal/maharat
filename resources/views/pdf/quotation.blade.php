<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quotation {{ $quotation->quotation_number }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .quotation-info {
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f4f4f4;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Quotation</h1>
        <p>{{ $quotation->quotation_number }}</p>
    </div>

    <div class="quotation-info">
        <p><strong>Date:</strong> {{ $quotation->issue_date->format('d/m/Y') }}</p>
        <p><strong>Valid Until:</strong> {{ $quotation->valid_until->format('d/m/Y') }}</p>
        <p><strong>Supplier:</strong> {{ $quotation->supplier->name }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($quotation->items as $item)
            <tr>
                <td>{{ $item->item_name }}</td>
                <td>{{ $item->description }}</td>
                <td>{{ $item->quantity }}</td>
                <td>{{ number_format($item->unit_price, 2) }}</td>
                <td>{{ number_format($item->quantity * $item->unit_price, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="4" style="text-align: right;"><strong>Total Amount:</strong></td>
                <td>{{ number_format($quotation->total_amount, 2) }}</td>
            </tr>
        </tfoot>
    </table>

    @if($quotation->terms_and_conditions)
    <div class="terms">
        <h3>Terms and Conditions</h3>
        <p>{{ $quotation->terms_and_conditions }}</p>
    </div>
    @endif
</body>
</html> 