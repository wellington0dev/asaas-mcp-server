export type PersonType = 'FISICA' | 'JURIDICA';

export type BillingType =
  'UNDEFINED' | 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER' | 'DEPOSIT' | 'PIX';

export type PaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'REFUND_IN_PROGRESS'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS';

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'INACTIVE';

export type SubscriptionCycle =
  'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';

export type RefundStatus =
  | 'PENDING'
  | 'AWAITING_CRITICAL_ACTION_AUTHORIZATION'
  | 'AWAITING_CUSTOMER_EXTERNAL_AUTHORIZATION'
  | 'CANCELLED'
  | 'DONE';

export type WebhookSendType = 'SEQUENTIALLY' | 'NON_SEQUENTIALLY';

export type WebhookEvent =
  | 'PAYMENT_AUTHORIZED'
  | 'PAYMENT_AWAITING_RISK_ANALYSIS'
  | 'PAYMENT_APPROVED_BY_RISK_ANALYSIS'
  | 'PAYMENT_REPROVED_BY_RISK_ANALYSIS'
  | 'PAYMENT_CREATED'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_ANTICIPATED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'PAYMENT_RESTORED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_REFUND_IN_PROGRESS'
  | 'PAYMENT_REFUND_DENIED'
  | 'PAYMENT_RECEIVED_IN_CASH_UNDONE'
  | 'PAYMENT_CHARGEBACK_REQUESTED'
  | 'PAYMENT_CHARGEBACK_DISPUTE'
  | 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL'
  | 'PAYMENT_DUNNING_RECEIVED'
  | 'PAYMENT_DUNNING_REQUESTED'
  | 'PAYMENT_BANK_SLIP_CANCELLED'
  | 'PAYMENT_BANK_SLIP_VIEWED'
  | 'PAYMENT_CHECKOUT_VIEWED'
  | 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED'
  | 'PAYMENT_PARTIALLY_REFUNDED'
  | 'PAYMENT_SPLIT_CANCELLED'
  | 'PAYMENT_SPLIT_DIVERGENCE_BLOCK'
  | 'PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED'
  | 'PAYMENT_SPLIT_DONE'
  | 'INVOICE_CREATED'
  | 'INVOICE_UPDATED'
  | 'INVOICE_SYNCHRONIZED'
  | 'INVOICE_AUTHORIZED'
  | 'INVOICE_PROCESSING_CANCELLATION'
  | 'INVOICE_CANCELED'
  | 'INVOICE_CANCELLATION_DENIED'
  | 'INVOICE_ERROR'
  | 'TRANSFER_CREATED'
  | 'TRANSFER_PENDING'
  | 'TRANSFER_IN_BANK_PROCESSING'
  | 'TRANSFER_BLOCKED'
  | 'TRANSFER_DONE'
  | 'TRANSFER_FAILED'
  | 'TRANSFER_CANCELLED'
  | 'BILL_CREATED'
  | 'BILL_PENDING'
  | 'BILL_BANK_PROCESSING'
  | 'BILL_PAID'
  | 'BILL_CANCELLED'
  | 'BILL_FAILED'
  | 'BILL_REFUNDED'
  | 'RECEIVABLE_ANTICIPATION_CANCELLED'
  | 'RECEIVABLE_ANTICIPATION_SCHEDULED'
  | 'RECEIVABLE_ANTICIPATION_PENDING'
  | 'RECEIVABLE_ANTICIPATION_CREDITED'
  | 'RECEIVABLE_ANTICIPATION_DEBITED'
  | 'RECEIVABLE_ANTICIPATION_DENIED'
  | 'RECEIVABLE_ANTICIPATION_OVERDUE'
  | 'MOBILE_PHONE_RECHARGE_PENDING'
  | 'MOBILE_PHONE_RECHARGE_CANCELLED'
  | 'MOBILE_PHONE_RECHARGE_CONFIRMED'
  | 'MOBILE_PHONE_RECHARGE_REFUNDED'
  | 'ACCOUNT_STATUS_BANK_ACCOUNT_INFO_APPROVED'
  | 'ACCOUNT_STATUS_BANK_ACCOUNT_INFO_AWAITING_APPROVAL'
  | 'ACCOUNT_STATUS_BANK_ACCOUNT_INFO_PENDING'
  | 'ACCOUNT_STATUS_BANK_ACCOUNT_INFO_REJECTED'
  | 'ACCOUNT_STATUS_COMMERCIAL_INFO_APPROVED'
  | 'ACCOUNT_STATUS_COMMERCIAL_INFO_AWAITING_APPROVAL'
  | 'ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRED'
  | 'ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRING_SOON'
  | 'ACCOUNT_STATUS_COMMERCIAL_INFO_PENDING'
  | 'ACCOUNT_STATUS_COMMERCIAL_INFO_REJECTED'
  | 'ACCOUNT_STATUS_DOCUMENT_APPROVED'
  | 'ACCOUNT_STATUS_DOCUMENT_AWAITING_APPROVAL'
  | 'ACCOUNT_STATUS_DOCUMENT_PENDING'
  | 'ACCOUNT_STATUS_DOCUMENT_REJECTED'
  | 'ACCOUNT_STATUS_GENERAL_APPROVAL_APPROVED'
  | 'ACCOUNT_STATUS_GENERAL_APPROVAL_AWAITING_APPROVAL'
  | 'ACCOUNT_STATUS_GENERAL_APPROVAL_PENDING'
  | 'ACCOUNT_STATUS_GENERAL_APPROVAL_REJECTED'
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPDATED'
  | 'SUBSCRIPTION_INACTIVATED'
  | 'SUBSCRIPTION_DELETED'
  | 'SUBSCRIPTION_SPLIT_DISABLED'
  | 'SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK'
  | 'SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK_FINISHED'
  | 'CHECKOUT_CREATED'
  | 'CHECKOUT_CANCELED'
  | 'CHECKOUT_EXPIRED'
  | 'CHECKOUT_PAID'
  | 'BALANCE_VALUE_BLOCKED'
  | 'BALANCE_VALUE_UNBLOCKED'
  | 'INTERNAL_TRANSFER_CREDIT'
  | 'INTERNAL_TRANSFER_DEBIT'
  | 'ACCESS_TOKEN_CREATED'
  | 'ACCESS_TOKEN_DELETED'
  | 'ACCESS_TOKEN_DISABLED'
  | 'ACCESS_TOKEN_ENABLED'
  | 'ACCESS_TOKEN_EXPIRED'
  | 'ACCESS_TOKEN_EXPIRING_SOON'
  | 'PIX_AUTOMATIC_RECURRING_AUTHORIZATION_CREATED'
  | 'PIX_AUTOMATIC_RECURRING_AUTHORIZATION_ACTIVATED'
  | 'PIX_AUTOMATIC_RECURRING_AUTHORIZATION_CANCELLED'
  | 'PIX_AUTOMATIC_RECURRING_AUTHORIZATION_EXPIRED'
  | 'PIX_AUTOMATIC_RECURRING_AUTHORIZATION_REFUSED'
  | 'PIX_AUTOMATIC_RECURRING_PAYMENT_INSTRUCTION_CREATED'
  | 'PIX_AUTOMATIC_RECURRING_PAYMENT_INSTRUCTION_SCHEDULED'
  | 'PIX_AUTOMATIC_RECURRING_PAYMENT_INSTRUCTION_REFUSED'
  | 'PIX_AUTOMATIC_RECURRING_PAYMENT_INSTRUCTION_CANCELLED'
  | 'PIX_AUTOMATIC_RECURRING_ELIGIBILITY_UPDATED';

export interface Customer {
  object: 'customer';
  id: string;
  dateCreated: string;
  name: string;
  email: string;
  phone: string;
  mobilePhone: string;
  address: string;
  addressNumber: string;
  complement: string;
  province: string;
  city: number;
  cityName: string;
  state: string;
  country: string;
  postalCode: string;
  cpfCnpj: string;
  personType: PersonType;
  deleted: boolean;
  additionalEmails: string;
  externalReference: string;
  notificationDisabled: boolean;
  observations: string;
  foreignCustomer: boolean;
}

export interface CustomerCreateRequest {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
  groupName?: string;
  groupNames?: string[];
  company?: string;
  foreignCustomer?: boolean;
}

export interface CustomerUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
  groupName?: string;
  groupNames?: string[];
  company?: string;
}

export interface PaginatedResponse<T> {
  object: 'list';
  data: T[];
  hasMore: boolean;
  limit: number;
  offset: number;
  totalCount: number;
}

export interface Payment {
  object: 'payment';
  id: string;
  dateCreated: string;
  customer: string;
  subscription: string | null;
  installment: string | null;
  checkoutSession: string | null;
  paymentLink: string | null;
  value: number;
  netValue: number;
  originalValue: number | null;
  interestValue: number | null;
  description: string;
  billingType: BillingType;
  creditCard: CreditCardInfo | null;
  canBePaidAfterDueDate: boolean;
  pixTransaction: string | null;
  pixQrCodeId: string | null;
  status: PaymentStatus;
  dueDate: string;
  originalDueDate: string;
  paymentDate: string | null;
  clientPaymentDate: string | null;
  installmentNumber: number | null;
  invoiceUrl: string;
  invoiceNumber: string;
  externalReference: string;
  deleted: boolean;
  anticipated: boolean;
  anticipable: boolean;
  creditDate: string | null;
  estimatedCreditDate: string | null;
  transactionReceiptUrl: string | null;
  nossoNumero: string | null;
  bankSlipUrl: string | null;
  discount: Discount | null;
  fine: Fine | null;
  interest: Interest | null;
  split: Split[];
  postalService: boolean;
  daysAfterDueDateToRegistrationCancellation: number | null;
  chargeback: Chargeback | null;
  escrow: Escrow | null;
  refunds: Refund[];
  threeDSecureChallengeUrl: string | null;
}

export interface CreditCardInfo {
  creditCardNumber: string;
  creditCardBrand: CreditCardBrand;
  creditCardToken: string | null;
}

export type CreditCardBrand =
  | 'VISA'
  | 'MASTERCARD'
  | 'ELO'
  | 'DINERS'
  | 'DISCOVER'
  | 'AMEX'
  | 'CABAL'
  | 'BANESCARD'
  | 'CREDZ'
  | 'SOROCRED'
  | 'CREDSYSTEM'
  | 'JCB'
  | 'UNKNOWN';

export interface Discount {
  value: number;
  dueDateLimitDays?: number;
  type?: 'FIXED' | 'PERCENTAGE';
}

export interface Fine {
  value: number;
  type?: 'FIXED' | 'PERCENTAGE';
}

export interface Interest {
  value: number;
}

export interface Split {
  id: string;
  walletId: string;
  fixedValue: number | null;
  percentualValue: number | null;
  totalValue: number;
  cancellationReason: string | null;
  status: string;
  externalReference: string | null;
  description: string | null;
}

export interface Chargeback {
  id: string;
  payment: string;
  installment: string | null;
  customerAccount: string;
  status: string;
  reason: string;
  disputeStartDate: string;
  value: number;
  paymentDate: string;
  creditCard: CreditCardInfo;
  disputeStatus: string;
  deadlineToSendDisputeDocuments: string;
}

export interface Escrow {
  id: string;
  status: string;
  expirationDate: string;
  finishDate: string | null;
  finishReason: string | null;
}

export interface Refund {
  dateCreated: string;
  status: RefundStatus;
  value: number;
  endToEndIdentifier: string | null;
  description: string | null;
  effectiveDate: string | null;
  transactionReceiptUrl: string | null;
  refundedSplits: RefundedSplit[];
}

export interface RefundedSplit {
  id: string;
  value: number;
  done: boolean;
}

export interface PaymentCreateRequest {
  customer: string;
  billingType: BillingType;
  value: number;
  dueDate: string;
  description?: string;
  daysAfterDueDateToRegistrationCancellation?: number;
  externalReference?: string;
  installmentCount?: number;
  totalValue?: number;
  installmentValue?: number;
  discount?: Discount;
  interest?: { value: number };
  fine?: { value: number; type?: 'FIXED' | 'PERCENTAGE' };
  postalService?: boolean;
  split?: SplitRequest[];
  callback?: { successUrl: string; autoRedirect?: boolean };
  pixAutomaticAuthorizationId?: string;
}

export interface SplitRequest {
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
  totalFixedValue?: number;
  externalReference?: string;
  description?: string;
}

export interface PaymentUpdateRequest {
  description?: string;
  externalReference?: string;
  discount?: Discount;
  interest?: { value: number };
  fine?: { value: number; type?: 'FIXED' | 'PERCENTAGE' };
  postalService?: boolean;
  split?: SplitRequest[];
  callback?: { successUrl: string; autoRedirect?: boolean };
}

export interface PaymentStatusResponse {
  paymentId: string;
  status: PaymentStatus;
  statusDescription: string;
  value: number;
  paidValue: number;
  dueDate: string;
}

export interface PixQrCodeResponse {
  payload: string;
  encodedImage: string;
  expirationDate: string;
}

export interface BankSlipResponse {
  digitableLine: string;
  nossoNumero: string;
  bankSlipUrl: string;
}

export interface Subscription {
  object: 'subscription';
  id: string;
  dateCreated: string;
  customer: string;
  paymentLink: string | null;
  billingType: BillingType;
  cycle: SubscriptionCycle;
  value: number;
  nextDueDate: string;
  endDate: string | null;
  description: string;
  status: SubscriptionStatus;
  discount: Discount | null;
  fine: Fine | null;
  interest: Interest | null;
  deleted: boolean;
  maxPayments: number | null;
  externalReference: string | null;
  checkoutSession: string | null;
  split: SubscriptionSplit[];
}

export interface SubscriptionSplit {
  walletId: string;
  fixedValue: number | null;
  percentualValue: number | null;
  externalReference: string | null;
  description: string | null;
  status: string;
  disabledReason: string | null;
}

export interface SubscriptionCreateRequest {
  customer: string;
  billingType: BillingType;
  value: number;
  nextDueDate: string;
  cycle: SubscriptionCycle;
  discount?: Discount;
  interest?: { value: number };
  fine?: { value: number; type?: 'FIXED' | 'PERCENTAGE' };
  description?: string;
  endDate?: string;
  maxPayments?: number;
  externalReference?: string;
  split?: SubscriptionSplitRequest[];
  callback?: { successUrl: string; autoRedirect?: boolean };
}

export interface SubscriptionSplitRequest {
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
  externalReference?: string;
  description?: string;
}

export interface SubscriptionUpdateRequest {
  billingType?: BillingType;
  value?: number;
  nextDueDate?: string;
  cycle?: SubscriptionCycle;
  discount?: Discount;
  interest?: { value: number };
  fine?: { value: number; type?: 'FIXED' | 'PERCENTAGE' };
  description?: string;
  endDate?: string;
  maxPayments?: number;
  externalReference?: string;
  split?: SubscriptionSplitRequest[];
  callback?: { successUrl: string; autoRedirect?: boolean };
}

export interface Installment {
  object: 'installment';
  id: string;
  value: number;
  netValue: number;
  paymentValue: number;
  installmentCount: number;
  billingType: BillingType;
  paymentDate: string | null;
  description: string;
  expirationDay: number;
  dateCreated: string;
  customer: string;
  paymentLink: string | null;
  checkoutSession: string | null;
  transactionReceiptUrl: string | null;
  chargeback: Chargeback | null;
  creditCard: CreditCardInfo | null;
  deleted: boolean;
  refunds: InstallmentRefund[];
  threeDSecureChallengeUrl: string | null;
}

export interface InstallmentRefund {
  dateCreated: string;
  status: RefundStatus;
  value: number;
  endToEndIdentifier: string | null;
  description: string | null;
  effectiveDate: string | null;
  transactionReceiptUrl: string | null;
  refundedSplits: RefundedSplit[];
  paymentId: string;
}

export interface InstallmentCreateRequest {
  installmentCount: number;
  customer: string;
  value: number;
  totalValue?: number;
  billingType: BillingType;
  dueDate: string;
  description?: string;
  postalService?: boolean;
  daysAfterDueDateToRegistrationCancellation?: number;
  paymentExternalReference?: string;
  discount?: Discount;
  interest?: { value: number };
  fine?: { value: number; type?: 'FIXED' | 'PERCENTAGE' };
  splits?: InstallmentSplitRequest[];
}

export interface InstallmentSplitRequest {
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
  totalFixedValue?: number;
  externalReference?: string;
  description?: string;
  installmentNumber?: number;
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  email: string;
  enabled: boolean;
  interrupted: boolean;
  apiVersion: number;
  hasAuthToken: boolean;
  sendType: WebhookSendType;
  penalizedRequestsCount: number;
  events: WebhookEvent[];
}

export interface WebhookCreateRequest {
  name: string;
  url: string;
  email: string;
  enabled: boolean;
  interrupted: boolean;
  apiVersion: 3;
  authToken: string;
  sendType: WebhookSendType;
  events: WebhookEvent[];
}

export interface WebhookUpdateRequest {
  name?: string;
  url?: string;
  email?: string;
  enabled?: boolean;
  interrupted?: boolean;
  apiVersion?: number;
  authToken?: string;
  sendType?: WebhookSendType;
  events?: WebhookEvent[];
}

export interface WebhookEventPayload {
  id: string;
  event: WebhookEvent;
  dateCreated: string;
  payment?: { id: string };
  subscription?: { id: string };
  installment?: { id: string };
  transfer?: { id: string };
  invoice?: { id: string };
  bill?: { id: string };
  anticipation?: { id: string };
  mobilePhoneRecharge?: { id: string };
  checkout?: { id: string };
  [key: string]: unknown;
}

export interface ErrorResponse {
  errors: Array<{
    code: string;
    description: string;
  }>;
}
