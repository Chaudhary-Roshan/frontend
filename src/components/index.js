// Centralized Component Barrel Export

// Layout Components
export { default as Navbar } from './layout/Navbar';
export { default as Footer } from './layout/Footer';

// Auth & Route Guard Components
export { default as ProtectedRoute } from './auth/ProtectedRoute';
export { default as StudentOnlyRoute } from './auth/StudentOnlyRoute';

// Modal Dialog Components
export { default as CertificateModal } from './modals/CertificateModal';
export { default as CreateProposalModal } from './modals/CreateProposalModal';
export { default as EventProposalDocumentModal } from './modals/EventProposalDocumentModal';

// Ticketing & Payment Verification Components
export { default as ManualTicketingHub } from './ticketing/ManualTicketingHub';
export { default as PaymentVerificationDesk } from './ticketing/PaymentVerificationDesk';
export { default as StudentPaymentCheckout } from './ticketing/StudentPaymentCheckout';

// Membership & Student Portal Components
export { default as MembershipConfiguration } from './membership/MembershipConfiguration';
export { default as StudentDigitalWallet } from './membership/StudentDigitalWallet';

// Common & Reusable Utility Components
export { default as ImageUploader } from './common/ImageUploader';
