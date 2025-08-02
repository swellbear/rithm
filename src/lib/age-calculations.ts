/**
 * Age calculation utilities for livestock management
 * Handles both exact birthdates and approximate age tracking
 */

export interface AgeInfo {
  currentAge: number;
  ageUnit: 'months' | 'years';
  isCalculated: boolean; // true if calculated from birthdate, false if manual entry
  displayText: string;
  ageInMonths: number; // normalized to months for calculations
}

/**
 * Calculate current age from birthdate
 */
export function calculateAgeFromBirthdate(birthdate: Date): AgeInfo {
  const now = new Date();
  const ageInMonths = Math.floor((now.getTime() - birthdate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)); // Average month length
  
  let displayAge: number;
  let unit: 'months' | 'years';
  
  if (ageInMonths < 24) {
    displayAge = ageInMonths;
    unit = 'months';
  } else {
    displayAge = Math.floor(ageInMonths / 12);
    unit = 'years';
  }
  
  const displayText = `${displayAge} ${unit} (calculated)`;
  
  return {
    currentAge: displayAge,
    ageUnit: unit,
    isCalculated: true,
    displayText,
    ageInMonths
  };
}

/**
 * Create approximate birthdate from manual age entry
 * Used when user only knows approximate age
 */
export function createApproximateBirthdate(age: number, unit: 'months' | 'years'): Date {
  const now = new Date();
  const ageInMonths = unit === 'years' ? age * 12 : age;
  
  // Subtract age from current date to get approximate birthdate
  const approximateBirthdate = new Date(now);
  approximateBirthdate.setMonth(approximateBirthdate.getMonth() - ageInMonths);
  
  return approximateBirthdate;
}

/**
 * Get age info for an animal (calculated or manual)
 */
export function getAnimalAgeInfo(animal: {
  birthDate?: string | Date | null;
  age?: number | string | null;
  ageUnit?: string | null;
}): AgeInfo {
  // If we have a birthdate, calculate from that
  if (animal.birthDate) {
    const birthdate = typeof animal.birthDate === 'string' 
      ? new Date(animal.birthDate) 
      : animal.birthDate;
    return calculateAgeFromBirthdate(birthdate);
  }
  
  // Otherwise, use manual age entry
  const age = typeof animal.age === 'string' ? parseInt(animal.age) : (animal.age || 0);
  const unit = (animal.ageUnit as 'months' | 'years') || 'months';
  const ageInMonths = unit === 'years' ? age * 12 : age;
  
  const displayText = `${age} ${unit} (manual)`;
  
  return {
    currentAge: age,
    ageUnit: unit,
    isCalculated: false,
    displayText,
    ageInMonths
  };
}

/**
 * Update animal ages - used for monthly batch updates
 */
export function incrementAnimalAge(animal: {
  birthDate?: string | Date | null;
  age?: number | string | null;
  ageUnit?: string | null;
  lastAgeUpdate?: string | Date | null;
}): { age: number; ageUnit: 'months' | 'years'; lastAgeUpdate: Date } {
  const now = new Date();
  
  // If we have a birthdate, calculate current age
  if (animal.birthDate) {
    const ageInfo = getAnimalAgeInfo(animal);
    return {
      age: ageInfo.currentAge,
      ageUnit: ageInfo.ageUnit,
      lastAgeUpdate: now
    };
  }
  
  // For manual ages, increment by 1 month
  const currentAge = typeof animal.age === 'string' ? parseInt(animal.age) : (animal.age || 0);
  const currentUnit = (animal.ageUnit as 'months' | 'years') || 'months';
  
  let newAge = currentAge;
  let newUnit = currentUnit;
  
  if (currentUnit === 'months') {
    newAge = currentAge + 1;
    // Convert to years if over 24 months
    if (newAge >= 24) {
      newAge = Math.floor(newAge / 12);
      newUnit = 'years';
    }
  } else {
    // For years, we'll increment monthly but show in years
    const ageInMonths = currentAge * 12 + 1;
    newAge = Math.floor(ageInMonths / 12);
    newUnit = 'years';
  }
  
  return {
    age: newAge,
    ageUnit: newUnit,
    lastAgeUpdate: now
  };
}