<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\InventoryTransaction;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Model;

class InventoryTransactionService
{
    /**
     * Create a new inventory transaction.
     *
     * @param Inventory $inventory The inventory being updated
     * @param string $type Transaction type (stock_in, stock_out, adjustment)
     * @param float $quantity The quantity change (positive for in, negative for out)
     * @param string|null $referenceType Type of reference document
     * @param int|null $referenceId ID of the reference document
     * @param string|null $referenceNumber Reference number
     * @param string|null $notes Additional notes
     * @return InventoryTransaction
     */
    public function recordTransaction(
        Inventory $inventory,
        string $type,
        float $quantity,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $referenceNumber = null,
        ?string $notes = null
    ): InventoryTransaction {
        // Log the input parameters
        \Log::info('InventoryTransactionService::recordTransaction called', [
            'inventory_id' => $inventory->id ?? 'missing',
            'inventory_class' => get_class($inventory),
            'inventory_exists' => $inventory->exists ?? false,
            'type' => $type,
            'quantity' => $quantity
        ]);
    
        // Validate transaction type
        if (!in_array($type, ['stock_in', 'stock_out', 'adjustment'])) {
            \Log::error('Invalid transaction type provided', ['type' => $type]);
            throw new \InvalidArgumentException('Invalid transaction type');
        }

        // Get the current authenticated user
        $userId = Auth::id() ?? 1; // Default to ID 1 if not authenticated
        \Log::info('User ID for transaction', ['user_id' => $userId]);

        // Record previous quantity
        $previousQuantity = $inventory->quantity;
        \Log::info('Previous quantity', ['previous_quantity' => $previousQuantity]);

        // Calculate new quantity based on transaction type
        $newQuantity = $previousQuantity;

        if ($type === 'stock_in') {
            // Ensure quantity is positive for stock in
            if ($quantity <= 0) {
                \Log::error('Stock in quantity must be positive', ['quantity' => $quantity]);
                throw new \InvalidArgumentException('Stock in quantity must be positive');
            }
            $newQuantity = $previousQuantity + $quantity;
        } elseif ($type === 'stock_out') {
            // Ensure quantity is positive for stock out
            if ($quantity <= 0) {
                \Log::error('Stock out quantity must be positive', ['quantity' => $quantity]);
                throw new \InvalidArgumentException('Stock out quantity must be positive');
            }

            // Check if there's enough stock
            if ($previousQuantity < $quantity) {
                \Log::error('Insufficient stock', [
                    'available' => $previousQuantity, 
                    'requested' => $quantity
                ]);
                throw new \InvalidArgumentException("Insufficient stock. Available: {$previousQuantity}, Requested: {$quantity}");
            }

            $newQuantity = $previousQuantity - $quantity;
        } elseif ($type === 'adjustment') {
            // For adjustment, the quantity can be positive or negative
            $newQuantity = $previousQuantity + $quantity;

            // Prevent negative inventory after adjustment
            if ($newQuantity < 0) {
                \Log::error('Adjustment would result in negative inventory', [
                    'previous' => $previousQuantity,
                    'adjustment' => $quantity,
                    'result' => $newQuantity
                ]);
                throw new \InvalidArgumentException("Adjustment would result in negative inventory");
            }
        }
        
        \Log::info('New quantity calculated', ['new_quantity' => $newQuantity]);

        // Verify the inventory ID is valid before creating the transaction
        if (!$inventory->id) {
            \Log::error('Inventory ID is missing', ['inventory' => $inventory]);
            throw new \InvalidArgumentException('Inventory ID is required for creating a transaction');
        }

        try {
            // Create transaction record
            $transaction = InventoryTransaction::create([
                'inventory_id' => $inventory->id,
                'transaction_type' => $type,
                'quantity' => $quantity,
                'previous_quantity' => $previousQuantity,
                'new_quantity' => $newQuantity,
                'user_id' => $userId,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'reference_number' => $referenceNumber,
                'notes' => $notes,
            ]);
            
            \Log::info('Transaction created successfully', [
                'transaction_id' => $transaction->id, 
                'inventory_id' => $inventory->id
            ]);
            
            return $transaction;
        } catch (\Exception $e) {
            \Log::error('Failed to create inventory transaction', [
                'error' => $e->getMessage(),
                'inventory_id' => $inventory->id,
                'transaction_type' => $type
            ]);
            throw $e;
        }
    }
}
