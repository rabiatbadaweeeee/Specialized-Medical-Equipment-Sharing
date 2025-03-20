import { describe, it, expect, beforeEach } from 'vitest';

// Mock implementation for testing Clarity contracts
const mockPrincipal = (address) => ({ address });
const txSender = mockPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
const admin = txSender;

// Mock state
let trainingCertifications = new Map();
let authorizedTrainers = new Map();
const mockBlockHeight = 12345;

// Mock contract functions
const addTrainer = (trainer, equipmentType) => {
  if (txSender.address !== admin.address) {
    return { error: 1 };
  }
  
  const key = `${trainer.address}-${equipmentType}`;
  authorizedTrainers.set(key, { authorized: true });
  return { value: true };
};

const certifyUser = (user, equipmentType, validityPeriod) => {
  const key = `${txSender.address}-${equipmentType}`;
  const trainerAuth = authorizedTrainers.get(key);
  
  if (!trainerAuth || !trainerAuth.authorized) {
    return { error: 2 };
  }
  
  const certKey = `${user.address}-${equipmentType}`;
  trainingCertifications.set(certKey, {
    certifiedBy: txSender,
    certificationDate: mockBlockHeight,
    expirationDate: mockBlockHeight + validityPeriod,
    valid: true
  });
  
  return { value: true };
};

const revokeCertification = (user, equipmentType) => {
  const certKey = `${user.address}-${equipmentType}`;
  const certification = trainingCertifications.get(certKey);
  
  if (!certification) {
    return { error: 1 };
  }
  
  if (txSender.address !== admin.address && txSender.address !== certification.certifiedBy.address) {
    return { error: 2 };
  }
  
  trainingCertifications.set(certKey, {
    ...certification,
    valid: false
  });
  
  return { value: true };
};

const getCertification = (user, equipmentType) => {
  const certKey = `${user.address}-${equipmentType}`;
  return trainingCertifications.get(certKey) || null;
};

const isCertified = (user, equipmentType) => {
  const certKey = `${user.address}-${equipmentType}`;
  const certification = trainingCertifications.get(certKey);
  
  if (!certification) {
    return false;
  }
  
  return certification.valid && certification.expirationDate >= mockBlockHeight;
};

describe('Training Verification Contract', () => {
  beforeEach(() => {
    trainingCertifications.clear();
    authorizedTrainers.clear();
  });
  
  it('should add an authorized trainer', () => {
    const trainer = mockPrincipal('ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    const result = addTrainer(trainer, 'Ventilator');
    
    expect(result.value).toBe(true);
    
    const key = `${trainer.address}-Ventilator`;
    expect(authorizedTrainers.get(key).authorized).toBe(true);
  });
  
  it('should certify a user when authorized', () => {
    // Add the current tx-sender as a trainer for ventilators
    const key = `${txSender.address}-Ventilator`;
    authorizedTrainers.set(key, { authorized: true });
    
    const user = mockPrincipal('ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    const result = certifyUser(user, 'Ventilator', 10000);
    
    expect(result.value).toBe(true);
    expect(isCertified(user, 'Ventilator')).toBe(true);
    
    const certification = getCertification(user, 'Ventilator');
    expect(certification).not.toBeNull();
    expect(certification.valid).toBe(true);
    expect(certification.expirationDate).toBe(mockBlockHeight + 10000);
  });
  
  it('should fail to certify when not an authorized trainer', () => {
    // No trainers added
    
    const user = mockPrincipal('ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    const result = certifyUser(user, 'Ventilator', 10000);
    
    expect(result.error).toBe(2);
  });
  
  it('should revoke certification', () => {
    // Add the current tx-sender as a trainer
    const key = `${txSender.address}-Ventilator`;
    authorizedTrainers.set(key, { authorized: true });
    
    // Certify a user
    const user = mockPrincipal('ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    certifyUser(user, 'Ventilator', 10000);
    
    // Revoke certification
    const revokeResult = revokeCertification(user, 'Ventilator');
    expect(revokeResult.value).toBe(true);
    
    expect(isCertified(user, 'Ventilator')).toBe(false);
    
    const certification = getCertification(user, 'Ventilator');
    expect(certification.valid).toBe(false);
  });
});
