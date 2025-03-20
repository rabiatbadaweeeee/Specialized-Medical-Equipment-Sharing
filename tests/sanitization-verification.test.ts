import { describe, it, expect, beforeEach } from 'vitest';

// Mock implementation for testing Clarity contracts
const mockPrincipal = (address) => ({ address });
const txSender = mockPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
const admin = txSender;

// Mock state
let sanitizationRecords = new Map();
let authorizedVerifiers = new Map();

// Mock contract functions
const addVerifier = (verifier) => {
  if (txSender.address !== admin.address) {
    return { error: 1 };
  }
  
  authorizedVerifiers.set(verifier.address, { authorized: true });
  return { value: true };
};

const verifySanitization = (equipmentId, methodUsed, notes) => {
  const verifierAuth = authorizedVerifiers.get(txSender.address);
  if (!verifierAuth || !verifierAuth.authorized) {
    return { error: 2 };
  }
  
  const recordKey = `${equipmentId}-${12345}`; // 12345 is mock block height
  sanitizationRecords.set(recordKey, {
    verifier: txSender,
    methodUsed,
    notes,
    verified: true
  });
  
  return { value: true };
};

const getSanitizationRecord = (equipmentId, timestamp) => {
  const recordKey = `${equipmentId}-${timestamp}`;
  return sanitizationRecords.get(recordKey) || null;
};

const isVerifier = (verifier) => {
  const verifierAuth = authorizedVerifiers.get(verifier.address);
  return verifierAuth ? verifierAuth.authorized : false;
};

describe('Sanitization Verification Contract', () => {
  beforeEach(() => {
    sanitizationRecords.clear();
    authorizedVerifiers.clear();
  });
  
  it('should add an authorized verifier', () => {
    const verifier = mockPrincipal('ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    const result = addVerifier(verifier);
    
    expect(result.value).toBe(true);
    expect(isVerifier(verifier)).toBe(true);
  });
  
  it('should verify sanitization when authorized', () => {
    // Add the current tx-sender as a verifier
    authorizedVerifiers.set(txSender.address, { authorized: true });
    
    const result = verifySanitization(1, 'UV Sterilization', 'Complete sterilization performed');
    expect(result.value).toBe(true);
    
    const record = getSanitizationRecord(1, 12345); // 12345 is mock block height
    expect(record).not.toBeNull();
    expect(record.methodUsed).toBe('UV Sterilization');
    expect(record.verified).toBe(true);
  });
  
  it('should fail to verify sanitization when not authorized', () => {
    // No verifiers added
    
    const result = verifySanitization(1, 'UV Sterilization', 'Complete sterilization performed');
    expect(result.error).toBe(2);
  });
});
