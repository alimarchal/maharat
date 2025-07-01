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
        // DEPRECATED: Do not use for cash payments on invoices. Use TransactionFlowService::recordCashTransactionFlows instead.
        // This method uses a flat 15% VAT split, which is incorrect for partial payments.
        return [
            'account_receivable_updated' => false,
            'vat_collected_updated' => false,
            'vat_receivables_updated' => false,
            'messages' => ['DEPRECATED: handleCashCreditBalancing should not be used. Use proportional split logic.']
        ];
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