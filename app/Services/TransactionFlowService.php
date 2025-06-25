<?php

namespace App\Services;

use App\Models\TransactionFlow;
use App\Models\Account;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

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
        string $transactionDate = null
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
                transactionDate: $invoice->issue_date ?? now()->toDateString()
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
                transactionDate: $invoice->issue_date ?? now()->toDateString()
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
                transactionDate: $invoice->issue_date ?? now()->toDateString()
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
     * @param string $referenceNumber
     * @return array
     */
    public static function recordCashTransactionFlows(
        float $cashAmount,
        string $description = null,
        string $referenceNumber = null
    ): array {
        $flows = [];
        $vatAmount = $cashAmount * 0.15; // 15% VAT

        try {
            DB::beginTransaction();

            // Generate sequential reference number if not provided
            if (!$referenceNumber) {
                $lastCashFlow = TransactionFlow::where('reference_number', 'like', 'CASH-%')
                    ->orderBy('id', 'desc')
                    ->first();
                
                if ($lastCashFlow) {
                    // Extract the number from the last reference
                    preg_match('/CASH-(\d+)/', $lastCashFlow->reference_number, $matches);
                    $lastNumber = intval($matches[1] ?? 0);
                    $nextNumber = $lastNumber + 1;
                } else {
                    $nextNumber = 1;
                }
                
                $referenceNumber = 'CASH-' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);
            }

            // Record Cash flow (ID 12)
            $cashFlow = self::recordTransactionFlow(
                accountId: 12,
                transactionType: 'credit',
                amount: $cashAmount,
                relatedEntityType: 'cash_transaction',
                relatedEntityId: null,
                relatedAccounts: [
                    [
                        'account_id' => 11, // Account Receivable
                        'transaction_type' => 'debit',
                        'amount' => $cashAmount,
                        'description' => 'Account Receivable debited for cash receipt'
                    ],
                    [
                        'account_id' => 9, // VAT Collected
                        'transaction_type' => 'credit',
                        'amount' => $vatAmount,
                        'description' => 'VAT Collected credited (15% of cash receipt)'
                    ],
                    [
                        'account_id' => 13, // VAT Receivables
                        'transaction_type' => 'debit',
                        'amount' => $vatAmount,
                        'description' => 'VAT Receivables debited for VAT collection'
                    ]
                ],
                description: $description ?? "Cash credited",
                referenceNumber: $referenceNumber,
                transactionDate: now()->toDateString()
            );
            $flows[] = $cashFlow;

            // Record Account Receivable debit (ID 11)
            $receivableFlow = self::recordTransactionFlow(
                accountId: 11,
                transactionType: 'debit',
                amount: $cashAmount,
                relatedEntityType: 'cash_transaction',
                relatedEntityId: null,
                relatedAccounts: [
                    [
                        'account_id' => 12, // Cash
                        'transaction_type' => 'credit',
                        'amount' => $cashAmount,
                        'description' => 'Cash credited for receipt'
                    ]
                ],
                description: "Account Receivable debited for cash receipt",
                referenceNumber: $referenceNumber,
                transactionDate: now()->toDateString()
            );
            $flows[] = $receivableFlow;

            // Record VAT Collected credit (ID 9)
            $vatCollectedFlow = self::recordTransactionFlow(
                accountId: 9,
                transactionType: 'credit',
                amount: $vatAmount,
                relatedEntityType: 'cash_transaction',
                relatedEntityId: null,
                relatedAccounts: [
                    [
                        'account_id' => 12, // Cash
                        'transaction_type' => 'credit',
                        'amount' => $cashAmount,
                        'description' => 'Cash credited for receipt'
                    ],
                    [
                        'account_id' => 13, // VAT Receivables
                        'transaction_type' => 'debit',
                        'amount' => $vatAmount,
                        'description' => 'VAT Receivables debited for VAT collection'
                    ]
                ],
                description: "VAT Collected credited (15% of cash receipt)",
                referenceNumber: $referenceNumber,
                transactionDate: now()->toDateString()
            );
            $flows[] = $vatCollectedFlow;

            // Record VAT Receivables debit (ID 13)
            $vatReceivablesFlow = self::recordTransactionFlow(
                accountId: 13,
                transactionType: 'debit',
                amount: $vatAmount,
                relatedEntityType: 'cash_transaction',
                relatedEntityId: null,
                relatedAccounts: [
                    [
                        'account_id' => 12, // Cash
                        'transaction_type' => 'credit',
                        'amount' => $cashAmount,
                        'description' => 'Cash credited for receipt'
                    ],
                    [
                        'account_id' => 9, // VAT Collected
                        'transaction_type' => 'credit',
                        'amount' => $vatAmount,
                        'description' => 'VAT Collected credited (15% of cash receipt)'
                    ]
                ],
                description: "VAT Receivables debited for VAT collection",
                referenceNumber: $referenceNumber,
                transactionDate: now()->toDateString()
            );
            $flows[] = $vatReceivablesFlow;

            DB::commit();
            return $flows;

        } catch (\Exception $e) {
            DB::rollBack();
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
            ->orderBy('transaction_date', 'asc')
            ->orderBy('created_at', 'asc');

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
} 