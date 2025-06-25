<?php

namespace App\Services;

use App\Models\TransactionFlow;
use App\Models\Account;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class TransactionFlowService
{
    /**
     * Record a transaction flow for account balance changes.
     *
     * @param int $accountId
     * @param string $transactionType
     * @param float $amount
     * @param string $relatedEntityType
     * @param int $relatedEntityId
     * @param array $relatedAccounts
     * @param string $description
     * @param string $referenceNumber
     * @param string $transactionDate
     * @param string $attachment
     * @param string $originalName
     * @return TransactionFlow
     */
    public static function recordTransactionFlow(
        int $accountId,
        string $transactionType,
        float $amount,
        string $relatedEntityType = null,
        int $relatedEntityId = null,
        array $relatedAccounts = [],
        string $description = null,
        string $referenceNumber = null,
        string $transactionDate = null,
        string $attachment = null,
        string $originalName = null
    ): TransactionFlow {
        // Get current account balance and account type
        $account = Account::with('accountCode')->find($accountId);
        if (!$account) {
            throw new \Exception("Account not found with ID: {$accountId}");
        }

        // Calculate current balance from account's credit and debit amounts
        $currentBalance = $account->credit_amount - $account->debit_amount;

        // Determine if this is an asset account (normal debit balance) or revenue account (normal credit balance)
        $isAssetAccount = in_array($account->accountCode->account_type ?? '', ['Asset']);
        $isRevenueAccount = in_array($account->accountCode->account_type ?? '', ['Revenue']);

        // Calculate balance after this specific transaction
        $balanceAfter = $currentBalance;
        if ($isAssetAccount) {
            // Asset accounts: credits decrease balance, debits increase balance
            if ($transactionType === 'credit') {
                $balanceAfter -= $amount;
            } else {
                $balanceAfter += $amount;
            }
        } elseif ($isRevenueAccount) {
            // Revenue accounts: credits increase balance, debits decrease balance
            if ($transactionType === 'credit') {
                $balanceAfter += $amount;
            } else {
                $balanceAfter -= $amount;
            }
        } else {
            // Default behavior (for liability, equity, expense accounts)
            if ($transactionType === 'credit') {
                $balanceAfter += $amount;
            } else {
                $balanceAfter -= $amount;
            }
        }

        return TransactionFlow::create([
            'account_id' => $accountId,
            'transaction_type' => $transactionType,
            'amount' => $amount,
            'balance_after' => $balanceAfter,
            'related_entity_type' => $relatedEntityType,
            'related_entity_id' => $relatedEntityId,
            'related_accounts' => $relatedAccounts,
            'description' => $description,
            'reference_number' => $referenceNumber,
            'transaction_date' => $transactionDate ?? now()->toDateString(),
            'attachment' => $attachment,
            'original_name' => $originalName,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id()
        ]);
    }

    /**
     * Record Maharat invoice approval transaction flows.
     *
     * @param object $invoice
     * @return array
     */
    public static function recordInvoiceApprovalFlows($invoice): array
    {
        $flows = [];

        try {
            DB::beginTransaction();

            // Generate sequential reference number for invoice
            $lastInvoiceFlow = TransactionFlow::where('reference_number', 'like', 'INV-%')
                ->orderBy('id', 'desc')
                ->first();
            
            if ($lastInvoiceFlow) {
                // Extract the number from the last reference
                preg_match('/INV-(\d+)/', $lastInvoiceFlow->reference_number, $matches);
                $lastNumber = intval($matches[1] ?? 0);
                $nextNumber = $lastNumber + 1;
            } else {
                $nextNumber = 1;
            }
            
            $referenceNumber = 'INV-' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

            // Record Revenue/Income flow (ID 4)
            $revenueFlow = self::recordTransactionFlow(
                accountId: 4,
                transactionType: 'credit',
                amount: $invoice->subtotal,
                relatedEntityType: 'invoice',
                relatedEntityId: $invoice->id,
                relatedAccounts: [
                    [
                        'account_id' => 13, // VAT Receivables
                        'transaction_type' => 'credit',
                        'amount' => $invoice->tax_amount,
                        'description' => 'VAT Receivables credited for invoice tax'
                    ],
                    [
                        'account_id' => 11, // Account Receivable
                        'transaction_type' => 'credit',
                        'amount' => $invoice->total_amount,
                        'description' => 'Account Receivable credited for invoice total'
                    ]
                ],
                description: "Revenue credited for Maharat invoice subtotal",
                referenceNumber: $referenceNumber,
                transactionDate: now()->toDateString()
            );
            $flows[] = $revenueFlow;

            // Record VAT Receivables flow (ID 13)
            $vatFlow = self::recordTransactionFlow(
                accountId: 13,
                transactionType: 'credit',
                amount: $invoice->tax_amount,
                relatedEntityType: 'invoice',
                relatedEntityId: $invoice->id,
                relatedAccounts: [
                    [
                        'account_id' => 4, // Revenue/Income
                        'transaction_type' => 'credit',
                        'amount' => $invoice->subtotal,
                        'description' => 'Revenue credited for invoice subtotal'
                    ],
                    [
                        'account_id' => 11, // Account Receivable
                        'transaction_type' => 'credit',
                        'amount' => $invoice->total_amount,
                        'description' => 'Account Receivable credited for invoice total'
                    ]
                ],
                description: "VAT Receivables credited for Maharat invoice tax",
                referenceNumber: $referenceNumber,
                transactionDate: now()->toDateString()
            );
            $flows[] = $vatFlow;

            // Record Account Receivable flow (ID 11)
            $receivableFlow = self::recordTransactionFlow(
                accountId: 11,
                transactionType: 'credit',
                amount: $invoice->total_amount,
                relatedEntityType: 'invoice',
                relatedEntityId: $invoice->id,
                relatedAccounts: [
                    [
                        'account_id' => 4, // Revenue/Income
                        'transaction_type' => 'credit',
                        'amount' => $invoice->subtotal,
                        'description' => 'Revenue credited for invoice subtotal'
                    ],
                    [
                        'account_id' => 13, // VAT Receivables
                        'transaction_type' => 'credit',
                        'amount' => $invoice->tax_amount,
                        'description' => 'VAT Receivables credited for invoice tax'
                    ]
                ],
                description: "Account Receivable credited for Maharat invoice total",
                referenceNumber: $referenceNumber,
                transactionDate: now()->toDateString()
            );
            $flows[] = $receivableFlow;

            DB::commit();
            return $flows;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Record Cash transaction flows.
     *
     * @param float $cashAmount
     * @param string $description
     * @param string $invoiceNumber
     * @param string $attachment
     * @param string $originalName
     * @return array
     */
    public static function recordCashTransactionFlows(
        float $cashAmount,
        string $description = null,
        string $invoiceNumber = null,
        string $attachment = null,
        string $originalName = null
    ): array {
        $flows = [];
        $vatAmount = $cashAmount * 0.15; // 15% VAT

        try {
            DB::beginTransaction();

            // Handle reference number based on invoice number prefix
            $referenceNumber = null;
            $relatedEntityType = null;
            $relatedEntityId = null;

            if ($invoiceNumber) {
                $referenceNumber = $invoiceNumber; // Use invoice number as reference
                
                if (str_starts_with($invoiceNumber, 'INV')) {
                    // Maharat invoice logic
                    $relatedEntityType = 'Invoice';
                    // Find the invoice to get its ID
                    $invoice = \App\Models\Invoice::where('invoice_number', $invoiceNumber)->first();
                    if ($invoice) {
                        $relatedEntityId = $invoice->id;
                    }
                } elseif (str_starts_with($invoiceNumber, 'PMT')) {
                    // Payment order logic - will be implemented later
                    $relatedEntityType = 'PaymentOrder';
                    // TODO: Implement payment order logic
                }
            }

            // 1. Credit Cash Account (ID 12)
            $cashAccount = Account::find(12);
            if ($cashAccount) {
                $newCashCredit = ($cashAccount->credit_amount ?? 0) + $cashAmount;
                $cashAccount->update([
                    'credit_amount' => $newCashCredit,
                    'updated_by' => auth()->id()
                ]);

                // Record transaction flow for Cash
                $cashFlow = self::recordTransactionFlow(
                    $cashAccount->id,
                    'Credit',
                    $cashAmount,
                    $relatedEntityType,
                    $relatedEntityId,
                    [
                        'account_receivable' => 11,
                        'vat_collected' => 9,
                        'vat_receivables' => 13
                    ],
                    $description ?? 'Cash credit transaction',
                    $referenceNumber,
                    now()->toDateString(),
                    $attachment,
                    $originalName
                );
                $flows[] = $cashFlow;
            }

            // 2. Debit Account Receivable (ID 11) by the same amount
            $accountReceivable = Account::find(11);
            if ($accountReceivable) {
                $newReceivableCredit = ($accountReceivable->credit_amount ?? 0) - $cashAmount;
                $accountReceivable->update([
                    'credit_amount' => max(0, $newReceivableCredit), // Ensure it doesn't go negative
                    'updated_by' => auth()->id()
                ]);

                // Record transaction flow for Account Receivable
                $receivableFlow = self::recordTransactionFlow(
                    $accountReceivable->id,
                    'Debit',
                    $cashAmount,
                    $relatedEntityType,
                    $relatedEntityId,
                    ['cash' => 12],
                    $description ?? 'Account receivable debit',
                    $referenceNumber,
                    now()->toDateString(),
                    $attachment,
                    $originalName
                );
                $flows[] = $receivableFlow;
            }

            // 3. Credit VAT Collected (ID 9) by 15% of the cash amount
            $vatCollected = Account::find(9);
            if ($vatCollected) {
                $newVatCredit = ($vatCollected->credit_amount ?? 0) + $vatAmount;
                $vatCollected->update([
                    'credit_amount' => $newVatCredit,
                    'updated_by' => auth()->id()
                ]);

                // Record transaction flow for VAT Collected
                $vatCollectedFlow = self::recordTransactionFlow(
                    $vatCollected->id,
                    'Credit',
                    $vatAmount,
                    $relatedEntityType,
                    $relatedEntityId,
                    ['cash' => 12],
                    $description ?? 'VAT collected credit',
                    $referenceNumber,
                    now()->toDateString(),
                    $attachment,
                    $originalName
                );
                $flows[] = $vatCollectedFlow;
            }

            // 4. Debit VAT Receivables (ID 13) by the same VAT amount
            $vatReceivables = Account::find(13);
            if ($vatReceivables) {
                $newVatReceivablesCredit = ($vatReceivables->credit_amount ?? 0) - $vatAmount;
                $vatReceivables->update([
                    'credit_amount' => max(0, $newVatReceivablesCredit), // Ensure it doesn't go negative
                    'updated_by' => auth()->id()
                ]);

                // Record transaction flow for VAT Receivables
                $vatReceivablesFlow = self::recordTransactionFlow(
                    $vatReceivables->id,
                    'Debit',
                    $vatAmount,
                    $relatedEntityType,
                    $relatedEntityId,
                    ['cash' => 12],
                    $description ?? 'VAT receivables debit',
                    $referenceNumber,
                    now()->toDateString(),
                    $attachment,
                    $originalName
                );
                $flows[] = $vatReceivablesFlow;
            }

            DB::commit();

            Log::info('=== CASH TRANSACTION FLOWS RECORDED ===', [
                'cash_amount' => $cashAmount,
                'vat_amount' => $vatAmount,
                'invoice_number' => $invoiceNumber,
                'reference_number' => $referenceNumber,
                'flows_count' => count($flows)
            ]);

            return $flows;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to record cash transaction flows', [
                'error' => $e->getMessage(),
                'cash_amount' => $cashAmount,
                'invoice_number' => $invoiceNumber
            ]);
            throw $e;
        }
    }

    /**
     * Get transaction flows for a specific account.
     *
     * @param int $accountId
     * @param string $startDate
     * @param string $endDate
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getAccountTransactionFlows(int $accountId, string $startDate = null, string $endDate = null)
    {
        $query = TransactionFlow::with(['account', 'creator'])
            ->where('account_id', $accountId)
            ->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc');

        if ($startDate && $endDate) {
            $query->dateRange($startDate, $endDate);
        }

        $flows = $query->get();

        // Get the account to calculate starting balance
        $account = Account::with('accountCode')->find($accountId);
        if (!$account) {
            return collect();
        }

        // Calculate starting balance from account's credit and debit amounts
        $startingBalance = $account->credit_amount - $account->debit_amount;

        // Determine if this is an asset account (normal debit balance) or revenue account (normal credit balance)
        $isAssetAccount = in_array($account->accountCode->account_type ?? '', ['Asset']);
        $isRevenueAccount = in_array($account->accountCode->account_type ?? '', ['Revenue']);

        // Calculate running balance for each transaction
        $runningBalance = $startingBalance;
        foreach ($flows as $flow) {
            if ($isAssetAccount) {
                // Asset accounts: credits decrease balance, debits increase balance
                if ($flow->transaction_type === 'credit') {
                    $runningBalance -= $flow->amount;
                } else {
                    $runningBalance += $flow->amount;
                }
            } elseif ($isRevenueAccount) {
                // Revenue accounts: credits increase balance, debits decrease balance
                if ($flow->transaction_type === 'credit') {
                    $runningBalance += $flow->amount;
                } else {
                    $runningBalance -= $flow->amount;
                }
            } else {
                // Default behavior (for liability, equity, expense accounts)
                if ($flow->transaction_type === 'credit') {
                    $runningBalance += $flow->amount;
                } else {
                    $runningBalance -= $flow->amount;
                }
            }
            $flow->balance_after = $runningBalance;
        }

        // Reverse the collection to show newest first
        return $flows->reverse();
    }

    /**
     * Record Cash transaction flows without updating account balances (for use when balances are already updated).
     *
     * @param float $cashAmount
     * @param string $description
     * @param string $invoiceNumber
     * @param string $attachment
     * @param string $originalName
     * @return array
     */
    public static function recordCashTransactionFlowsWithoutBalanceUpdate(
        float $cashAmount,
        string $description = null,
        string $invoiceNumber = null,
        string $attachment = null,
        string $originalName = null
    ): array {
        Log::info('=== RECORD CASH TRANSACTION FLOWS WITHOUT BALANCE UPDATE STARTED ===', [
            'cash_amount' => $cashAmount,
            'description' => $description,
            'invoice_number' => $invoiceNumber,
            'attachment' => $attachment,
            'original_name' => $originalName
        ]);

        $flows = [];

        try {
            Log::info('=== STARTING DATABASE TRANSACTION ===');
            DB::beginTransaction();

            // Handle reference number based on invoice number prefix
            $referenceNumber = null;
            $relatedEntityType = null;
            $relatedEntityId = null;

            if ($invoiceNumber) {
                $referenceNumber = $invoiceNumber; // Use invoice number as reference
                
                if (str_starts_with($invoiceNumber, 'INV')) {
                    // Maharat invoice logic
                    $relatedEntityType = 'Invoice';
                    // Find the invoice to get its ID
                    $invoice = \App\Models\Invoice::where('invoice_number', $invoiceNumber)->first();
                    if ($invoice) {
                        $relatedEntityId = $invoice->id;
                    }
                } elseif (str_starts_with($invoiceNumber, 'PMT')) {
                    // Payment order logic - will be implemented later
                    $relatedEntityType = 'PaymentOrder';
                    // TODO: Implement payment order logic
                }
            }

            Log::info('=== REFERENCE NUMBER PROCESSED ===', [
                'reference_number' => $referenceNumber,
                'related_entity_type' => $relatedEntityType,
                'related_entity_id' => $relatedEntityId
            ]);

            // Only record transaction flow for Cash (ID 12) - the main account being updated
            Log::info('=== RECORDING CASH TRANSACTION FLOW ===');
            $cashFlow = self::recordTransactionFlow(
                12, // Cash account ID
                'credit',
                $cashAmount,
                $relatedEntityType,
                $relatedEntityId,
                [
                    'account_receivable' => 11,
                    'vat_collected' => 9,
                    'vat_receivables' => 13
                ],
                $description ?? 'Cash and cash equivalents held by the company',
                $referenceNumber,
                now()->toDateString(),
                $attachment,
                $originalName
            );
            $flows[] = $cashFlow;

            Log::info('=== COMMITTING DATABASE TRANSACTION ===');
            DB::commit();

            Log::info('=== CASH TRANSACTION FLOWS RECORDED (WITHOUT BALANCE UPDATE) ===', [
                'cash_amount' => $cashAmount,
                'invoice_number' => $invoiceNumber,
                'reference_number' => $referenceNumber,
                'flows_count' => count($flows)
            ]);

            return $flows;
        } catch (\Exception $e) {
            Log::error('=== FAILED TO RECORD CASH TRANSACTION FLOWS (WITHOUT BALANCE UPDATE) ===', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'cash_amount' => $cashAmount,
                'invoice_number' => $invoiceNumber
            ]);
            DB::rollBack();
            throw $e;
        }
    }
} 