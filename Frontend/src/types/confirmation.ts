export interface ConversationConfirmation {
  id?: string;
  conversationId: string;
  customerConfirmation: boolean;
  providerConfirmation: boolean;
  startDate: string | null; // ISO string
  endDate: string | null;   // ISO string
  serviceFee?: number | null; // Service fee amount - only editable by provider
  currency?: string; // Currency for the service fee (default: USD)
  feeLocked?: boolean; // Provider locks the fee once it's final, unlocking Pay Now for the customer
  feeLockedAt?: string | null;
  cashReceived?: boolean; // Provider marks this when paid in cash, outside the online flow
  cashReceivedAt?: string | null;
  updatedAt?: string;
}
