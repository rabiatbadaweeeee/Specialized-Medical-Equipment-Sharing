import { describe, it, expect, beforeEach } from 'vitest';

// Mock implementation for testing Clarity contracts
const mockPrincipal = (address) => ({ address });
const txSender = mockPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');

// Mock state
let equipmentRegistry = new Map();
let lastEquipmentId = 0;

// Mock contract functions
const registerEquipment = (name, description, location, lastMaintenance) => {
  const newId = lastEquipmentId + 1;
  lastEquipmentId = newId;
  
  equipmentRegistry.set(newId, {
    owner: txSender,
    name,
    description,
    available: true,
    location,
    lastMaintenance
  });
  
  return { value: true };
};

const updateAvailability = (equipmentId, available) => {
  if (!equipmentRegistry.has(equipmentId)) {
    return { error: 1 };
  }
  
  const equipment = equipmentRegistry.get(equipmentId);
  if (equipment.owner.address !== txSender.address) {
    return { error: 2 };
  }
  
  equipmentRegistry.set(equipmentId, {
    ...equipment,
    available
  });
  
  return { value: true };
};

const getEquipment = (equipmentId) => {
  return equipmentRegistry.get(equipmentId) || null;
};

describe('Equipment Registry Contract', () => {
  beforeEach(() => {
    equipmentRegistry.clear();
    lastEquipmentId = 0;
  });
  
  it('should register new equipment', () => {
    const result = registerEquipment(
        'Ventilator',
        'Portable ventilator for respiratory support',
        'Hospital A',
        12345
    );
    
    expect(result.value).toBe(true);
    expect(lastEquipmentId).toBe(1);
    
    const equipment = getEquipment(1);
    expect(equipment).not.toBeNull();
    expect(equipment.name).toBe('Ventilator');
    expect(equipment.available).toBe(true);
  });
  
  it('should update equipment availability', () => {
    registerEquipment('Wheelchair', 'Standard wheelchair', 'Clinic B', 12345);
    
    const updateResult = updateAvailability(1, false);
    expect(updateResult.value).toBe(true);
    
    const equipment = getEquipment(1);
    expect(equipment.available).toBe(false);
  });
  
  it('should fail to update equipment if not the owner', () => {
    registerEquipment('Wheelchair', 'Standard wheelchair', 'Clinic B', 12345);
    
    // Change tx-sender
    const originalTxSender = txSender;
    Object.assign(txSender, mockPrincipal('ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'));
    
    const updateResult = updateAvailability(1, false);
    expect(updateResult.error).toBe(2);
    
    // Restore tx-sender
    Object.assign(txSender, originalTxSender);
  });
});
