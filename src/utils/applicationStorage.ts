export interface ApplicationSubmission {
  id: string;
  type: 'tenant' | 'user_subscription';
  title: string;
  fullName: string;
  email: string;
  phone: string;
  facePhoto: string; // base64
  idDocument: string; // base64
  idDocumentName?: string;
  status: 'pending_review' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewEstimatedMinutes: string;
  refCode: 'Ten29' | 'User29';
  popDocument?: string; // base64
  popFileName?: string;
  popSubmittedAt?: string;
  popStatus?: 'pending_pop' | 'pop_submitted' | 'pop_verified' | 'pop_rejected';
  popNotes?: string;
}

const STORAGE_KEY = 'tenant_applications';

export const BANK_DETAILS = {
  bankName: 'Capitec',
  accountName: 'Matthews',
  accountNumber: '1334067366',
  tenantRef: 'Ten29',
  userRef: 'User29',
};

export function getApplications(): ApplicationSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed: ApplicationSubmission[] = JSON.parse(raw);
    // Purge any sample/mock data entries
    const cleaned = parsed.filter(a => !a.id.startsWith('app-sample-') && !a.id.includes('sample'));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    return [];
  }
}

export function saveApplication(app: ApplicationSubmission) {
  try {
    const current = getApplications();
    const index = current.findIndex(a => a.id === app.id);
    if (index >= 0) {
      current[index] = app;
    } else {
      current.unshift(app);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    // Trigger custom event so any active component can re-sync immediately
    window.dispatchEvent(new Event('tenant_applications_updated'));
  } catch (e) {
    console.error('Error saving application:', e);
  }
}

export function updateApplicationStatus(
  id: string, 
  status: 'pending_review' | 'approved' | 'rejected', 
  rejectionReason?: string
) {
  const list = getApplications();
  const target = list.find(a => a.id === id);
  if (target) {
    target.status = status;
    if (rejectionReason !== undefined) {
      target.rejectionReason = rejectionReason;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('tenant_applications_updated'));
  }
}

export function updateApplicationPoP(
  id: string, 
  popStatus: 'pending_pop' | 'pop_submitted' | 'pop_verified' | 'pop_rejected',
  notes?: string
) {
  const list = getApplications();
  const target = list.find(a => a.id === id);
  if (target) {
    target.popStatus = popStatus;
    if (notes !== undefined) {
      target.popNotes = notes;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('tenant_applications_updated'));
  }
}
