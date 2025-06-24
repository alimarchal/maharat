<?php

namespace App\Services;

use App\Models\Account;
use Illuminate\Support\Facades\Log;

class AccountBalancingService
{
    /**
     * Handle automatic account balancing when Cash account is credited
     * 
     * @param int $cashAccountId
     * @param float $creditAmount
     * @param float $originalCreditAmount
     * @return array
     */
    public static function handleCashCreditBalancing($cashAccountId, $creditAmount, $originalCreditAmount = 0)
    {
        $results = [
            'account_receivable_updated' => false,
            'vat_collected_updated' => false,
            'vat_receivables_updated' => false,
            'messages' => []
        ];

        $creditIncrease = $creditAmount - $originalCreditAmount;

        // Only proceed if there's an actual increase in credit amount
        if ($creditIncrease <= 0) {
            return $results;
        }

        Log::info('=== AUTOMATIC ACCOUNT BALANCING FOR CASH CREDIT ===', [
            'cash_account_id' => $cashAccountId,
            'credit_amount' => $creditAmount,
            'credit_increase' => $creditIncrease
        ]);

        // 1. Debit Account Receivable (ID 11) by the same amount
        $accountReceivable = Account::find(11);
        if ($accountReceivable && $accountReceivable->name === 'Account Receivable') {
            $newReceivableCredit = ($accountReceivable->credit_amount ?? 0) - $creditIncrease;
            $accountReceivable->update([
                'credit_amount' => max(0, $newReceivableCredit), // Ensure it doesn't go negative
                'updated_by' => auth()->id()
            ]);

            $results['account_receivable_updated'] = true;
            $results['messages'][] = "Account Receivable debited by " . number_format($creditIncrease, 2);

            Log::info('=== ACCOUNT RECEIVABLE DEBITED ===', [
                'account_id' => 11,
                'account_name' => 'Account Receivable',
                'amount_debited' => $creditIncrease,
                'new_credit_amount' => $accountReceivable->credit_amount
            ]);
        } else {
            Log::warning('=== ACCOUNT RECEIVABLE NOT FOUND ===', [
                'account_id' => 11,
                'account_found' => $accountReceivable ? true : false
            ]);
        }

        // 2. Credit VAT Collected (ID 9) by 15% of the credit amount
        $vatCollected = Account::find(9);
        if ($vatCollected && $vatCollected->name === 'VAT Collected (on Maharat invoices)') {
            $vatAmount = $creditIncrease * 0.15; // 15% of the credit amount
            $newVatCredit = ($vatCollected->credit_amount ?? 0) + $vatAmount;
            $vatCollected->update([
                'credit_amount' => $newVatCredit,
                'updated_by' => auth()->id()
            ]);

            $results['vat_collected_updated'] = true;
            $results['messages'][] = "VAT Collected credited by " . number_format($vatAmount, 2) . " (15%)";

            Log::info('=== VAT COLLECTED CREDITED ===', [
                'account_id' => 9,
                'account_name' => 'VAT Collected (on Maharat invoices)',
                'amount_credited' => $vatAmount,
                'new_credit_amount' => $vatCollected->credit_amount
            ]);

            // 3. Debit VAT Receivables (ID 13) by the same VAT amount
            $vatReceivables = Account::find(13);
            if ($vatReceivables && $vatReceivables->name === 'VAT Receivables (On Maharat Invoice)') {
                $newVatReceivablesCredit = ($vatReceivables->credit_amount ?? 0) - $vatAmount;
                $vatReceivables->update([
                    'credit_amount' => max(0, $newVatReceivablesCredit), // Ensure it doesn't go negative
                    'updated_by' => auth()->id()
                ]);

                $results['vat_receivables_updated'] = true;
                $results['messages'][] = "VAT Receivables debited by " . number_format($vatAmount, 2);

                Log::info('=== VAT RECEIVABLES DEBITED ===', [
                    'account_id' => 13,
                    'account_name' => 'VAT Receivables (On Maharat Invoice)',
                    'amount_debited' => $vatAmount,
                    'new_credit_amount' => $vatReceivables->credit_amount
                ]);
            } else {
                Log::warning('=== VAT RECEIVABLES ACCOUNT NOT FOUND ===', [
                    'account_id' => 13,
                    'account_found' => $vatReceivables ? true : false
                ]);
            }
        } else {
            Log::warning('=== VAT COLLECTED ACCOUNT NOT FOUND ===', [
                'account_id' => 9,
                'account_found' => $vatCollected ? true : false
            ]);
        }

        return $results;
    }

    /**
     * Handle automatic VAT balancing when VAT Collected account is directly updated
     * 
     * @param int $vatCollectedId
     * @param float $creditAmount
     * @param float $originalCreditAmount
     * @return array
     */
    public static function handleVatCollectedBalancing($vatCollectedId, $creditAmount, $originalCreditAmount = 0)
    {
        $results = [
            'vat_receivables_updated' => false,
            'messages' => []
        ];

        $creditIncrease = $creditAmount - $originalCreditAmount;

        // Only proceed if there's an actual increase in credit amount
        if ($creditIncrease <= 0) {
            return $results;
        }

        Log::info('=== AUTOMATIC VAT BALANCING FOR VAT COLLECTED CREDIT ===', [
            'vat_collected_id' => $vatCollectedId,
            'credit_amount' => $creditAmount,
            'credit_increase' => $creditIncrease
        ]);

        // Debit VAT Receivables (ID 13) by the same amount
        $vatReceivables = Account::find(13);
        if ($vatReceivables && $vatReceivables->name === 'VAT Receivables (On Maharat Invoice)') {
            $newVatReceivablesCredit = ($vatReceivables->credit_amount ?? 0) - $creditIncrease;
            $vatReceivables->update([
                'credit_amount' => max(0, $newVatReceivablesCredit), // Ensure it doesn't go negative
                'updated_by' => auth()->id()
            ]);

            $results['vat_receivables_updated'] = true;
            $results['messages'][] = "VAT Receivables debited by " . number_format($creditIncrease, 2);

            Log::info('=== VAT RECEIVABLES DEBITED ===', [
                'account_id' => 13,
                'account_name' => 'VAT Receivables (On Maharat Invoice)',
                'amount_debited' => $creditIncrease,
                'new_credit_amount' => $vatReceivables->credit_amount
            ]);
        } else {
            Log::warning('=== VAT RECEIVABLES ACCOUNT NOT FOUND ===', [
                'account_id' => 13,
                'account_found' => $vatReceivables ? true : false
            ]);
        }

        return $results;
    }
} 