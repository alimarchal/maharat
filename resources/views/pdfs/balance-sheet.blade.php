<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Balance Sheet - {{ $year }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            color: #333;
            line-height: 1.5;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2C323C;
            margin-bottom: 5px;
        }
        .header p {
            color: #666;
            margin-top: 0;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #2C323C;
            border-bottom: 2px solid #009FDC;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .subsection {
            margin-bottom: 20px;
        }
        .subsection-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            padding: 5px;
            background-color: #f5f5f5;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f2f2f2;
        }
        .amount {
            text-align: right;
        }
        .total-row {
            font-weight: bold;
            background-color: #DCECF2;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            text-align: center;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Balance Sheet</h1>
        <p>For the Year Ended December 31, {{ $year }}</p>
        <p>Generated on: {{ $generated_at }}</p>
    </div>

    <!-- Assets Section -->
    <div class="section">
        <h2 class="section-title">Assets</h2>
        
        <!-- Current Assets -->
        <div class="subsection">
            <h3 class="subsection-title">Current Assets</h3>
            <table>
                <tr>
                    <th>Description</th>
                    <th class="amount">Amount</th>
                </tr>
                @php
                $currentAssetsTotal = 0;
                @endphp
                @foreach($balanceSheetData['assets']['current'] as $asset)
                    <tr>
                        <td>{{ $asset['name'] ?? $asset['category'] }}</td>
                        <td class="amount">{{ number_format($asset['total'], 2) }}</td>
                    </tr>
                    @php
                    $currentAssetsTotal += floatval($asset['total']);
                    @endphp
                @endforeach
                <tr class="total-row">
                    <td>Total Current Assets</td>
                    <td class="amount">{{ number_format($currentAssetsTotal, 2) }}</td>
                </tr>
            </table>
        </div>
        
        <!-- Non-Current Assets -->
        <div class="subsection">
            <h3 class="subsection-title">Non-Current Assets</h3>
            <table>
                <tr>
                    <th>Description</th>
                    <th class="amount">Amount</th>
                </tr>
                @php
                $nonCurrentAssetsTotal = 0;
                @endphp
                @foreach($balanceSheetData['assets']['nonCurrent'] as $asset)
                    <tr>
                        <td>{{ $asset['name'] ?? $asset['category'] }}</td>
                        <td class="amount">{{ number_format($asset['total'], 2) }}</td>
                    </tr>
                    @php
                    $nonCurrentAssetsTotal += floatval($asset['total']);
                    @endphp
                @endforeach
                <tr class="total-row">
                    <td>Total Non-Current Assets</td>
                    <td class="amount">{{ number_format($nonCurrentAssetsTotal, 2) }}</td>
                </tr>
            </table>
        </div>
        
        <div class="subsection">
            <table>
                <tr class="total-row">
                    <td>Total Assets</td>
                    <td class="amount">{{ number_format($summary['totalAssets'], 2) }}</td>
                </tr>
            </table>
        </div>
    </div>
    
    <!-- Liabilities Section -->
    <div class="section">
        <h2 class="section-title">Liabilities</h2>
        
        <!-- Current Liabilities -->
        <div class="subsection">
            <h3 class="subsection-title">Current Liabilities</h3>
            <table>
                <tr>
                    <th>Description</th>
                    <th class="amount">Amount</th>
                </tr>
                @php
                $currentLiabilitiesTotal = 0;
                @endphp
                @foreach($balanceSheetData['liabilities']['current'] as $liability)
                    <tr>
                        <td>{{ $liability['name'] ?? $liability['category'] }}</td>
                        <td class="amount">{{ number_format($liability['total'], 2) }}</td>
                    </tr>
                    @php
                    $currentLiabilitiesTotal += floatval($liability['total']);
                    @endphp
                @endforeach
                <tr class="total-row">
                    <td>Total Current Liabilities</td>
                    <td class="amount">{{ number_format($currentLiabilitiesTotal, 2) }}</td>
                </tr>
            </table>
        </div>
        
        <!-- Non-Current Liabilities -->
        <div class="subsection">
            <h3 class="subsection-title">Non-Current Liabilities</h3>
            <table>
                <tr>
                    <th>Description</th>
                    <th class="amount">Amount</th>
                </tr>
                @php
                $nonCurrentLiabilitiesTotal = 0;
                @endphp
                @foreach($balanceSheetData['liabilities']['nonCurrent'] as $liability)
                    <tr>
                        <td>{{ $liability['name'] ?? $liability['category'] }}</td>
                        <td class="amount">{{ number_format($liability['total'], 2) }}</td>
                    </tr>
                    @php
                    $nonCurrentLiabilitiesTotal += floatval($liability['total']);
                    @endphp
                @endforeach
                <tr class="total-row">
                    <td>Total Non-Current Liabilities</td>
                    <td class="amount">{{ number_format($nonCurrentLiabilitiesTotal, 2) }}</td>
                </tr>
            </table>
        </div>
        
        <div class="subsection">
            <table>
                <tr class="total-row">
                    <td>Total Liabilities</td>
                    <td class="amount">{{ number_format($summary['totalLiabilities'], 2) }}</td>
                </tr>
            </table>
        </div>
    </div>
    
    <!-- Net Assets Section -->
    <div class="section">
        <h2 class="section-title">Net Assets</h2>
        
        <!-- Without Donor Restrictions -->
        <div class="subsection">
            <h3 class="subsection-title">Without Donor Restrictions</h3>
            <table>
                <tr>
                    <th>Description</th>
                    <th class="amount">Amount</th>
                </tr>
                @php
                $withoutDonorRestrictionsTotal = 0;
                @endphp
                @foreach($balanceSheetData['netAssets']['withoutDonorRestrictions'] as $equity)
                    <tr>
                        <td>{{ $equity['name'] ?? $equity['category'] }}</td>
                        <td class="amount">{{ number_format($equity['total'], 2) }}</td>
                    </tr>
                    @php
                    $withoutDonorRestrictionsTotal += floatval($equity['total']);
                    @endphp
                @endforeach
                <tr class="total-row">
                    <td>Total Without Donor Restrictions</td>
                    <td class="amount">{{ number_format($withoutDonorRestrictionsTotal, 2) }}</td>
                </tr>
            </table>
        </div>
        
        <!-- With Donor Restrictions -->
        <div class="subsection">
            <h3 class="subsection-title">With Donor Restrictions</h3>
            <table>
                <tr>
                    <th>Description</th>
                    <th class="amount">Amount</th>
                </tr>
                @php
                $withDonorRestrictionsTotal = 0;
                @endphp
                @foreach($balanceSheetData['netAssets']['withDonorRestrictions'] as $equity)
                    <tr>
                        <td>{{ $equity['name'] ?? $equity['category'] }}</td>
                        <td class="amount">{{ number_format($equity['total'], 2) }}</td>
                    </tr>
                    @php
                    $withDonorRestrictionsTotal += floatval($equity['total']);
                    @endphp
                @endforeach
                <tr class="total-row">
                    <td>Total With Donor Restrictions</td>
                    <td class="amount">{{ number_format($withDonorRestrictionsTotal, 2) }}</td>
                </tr>
            </table>
        </div>
        
        <div class="subsection">
            <table>
                <tr class="total-row">
                    <td>Total Net Assets</td>
                    <td class="amount">{{ number_format($summary['totalEquity'], 2) }}</td>
                </tr>
            </table>
        </div>
    </div>
    
    <!-- Total Liabilities and Net Assets -->
    <div class="section">
        <table>
            <tr class="total-row">
                <td><strong>Total Liabilities and Net Assets</strong></td>
                <td class="amount">{{ number_format($summary['totalLiabilities'] + $summary['totalEquity'], 2) }}</td>
            </tr>
        </table>
    </div>
    
    <div class="footer">
        <p>This is an automatically generated document. For official use only.</p>
    </div>
</body>
</html> 