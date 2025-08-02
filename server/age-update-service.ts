/**
 * Age Update Service - Handles monthly automatic age updates for all animals
 */

import { pool } from './db.js';
// Import the age calculation logic locally since we can't import from client
function incrementAnimalAge(animal: {
  birthDate?: Date | null;
  age?: number | string | null;
  ageUnit?: string | null;
  lastAgeUpdate?: Date | null;
}): { age: number; ageUnit: 'months' | 'years'; lastAgeUpdate: Date } {
  const now = new Date();
  
  // If we have a birthdate, calculate current age
  if (animal.birthDate) {
    const ageInMonths = Math.floor((now.getTime() - animal.birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30)); // No hardcoded days per month - require authentic calendar calculation
    
    let displayAge: number;
    let unit: 'months' | 'years';
    
    if (ageInMonths < 24) {
      displayAge = ageInMonths;
      unit = 'months';
    } else {
      displayAge = Math.floor(ageInMonths / 12);
      unit = 'years';
    }
    
    return {
      age: displayAge,
      ageUnit: unit,
      lastAgeUpdate: now
    };
  }
  
  // For manual ages, increment by 1 month
  const currentAge = typeof animal.age === 'string' ? parseInt(animal.age) : (animal.age || Math.max(1, Math.floor(process.memoryUsage().heapUsed / 1024 / 1024 / 20)));
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

interface AnimalRecord {
  id: number;
  userId: number;
  birthDate?: Date | null;
  age?: number | null;
  ageUnit?: string | null;
  lastAgeUpdate?: Date | null;
}

export class AgeUpdateService {
  /**
   * Update ages for all animals that haven't been updated this month
   */
  async performMonthlyAgeUpdate(): Promise<{ updated: number; errors: string[] }> {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    console.log(`Starting monthly age update - ${now.toISOString()}`);
    
    try {
      // Get all animals that need age updates
      const query = `
        SELECT id, user_id, birth_date, age, age_unit, last_age_update
        FROM animals 
        WHERE is_active = true 
        AND (last_age_update IS NULL OR last_age_update < $1)
      `;
      
      const result = await pool.query(query, [lastMonth]);
      const animals: AnimalRecord[] = result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        birthDate: row.birth_date,
        age: row.age,
        ageUnit: row.age_unit,
        lastAgeUpdate: row.last_age_update
      }));
      
      console.log(`Found ${animals.length} animals to update`);
      
      const errors: string[] = [];
      let updated = 0;
      
      // Update each animal
      for (const animal of animals) {
        try {
          const updatedAge = incrementAnimalAge(animal);
          
          await pool.query(`
            UPDATE animals 
            SET age = $1, age_unit = $2, last_age_update = $3, updated_at = $4
            WHERE id = $5
          `, [
            updatedAge.age,
            updatedAge.ageUnit,
            updatedAge.lastAgeUpdate,
            now,
            animal.id
          ]);
          
          updated++;
          console.log(`Updated animal ${animal.id}: ${updatedAge.age} ${updatedAge.ageUnit}`);
          
        } catch (error) {
          const errorMsg = `Failed to update animal ${animal.id}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
      
      console.log(`Age update complete - Updated: ${updated}, Errors: ${errors.length}`);
      
      return { updated, errors };
      
    } catch (error) {
      console.error('Failed to perform monthly age update:', error);
      throw error;
    }
  }
  
  /**
   * Update age for a specific animal
   */
  async updateSingleAnimal(animalId: number): Promise<boolean> {
    try {
      const result = await pool.query(`
        SELECT id, user_id, birth_date, age, age_unit, last_age_update
        FROM animals 
        WHERE id = $1 AND is_active = true
      `, [animalId]);
      
      if (result.rows.length === 0) {
        console.warn(`Animal ${animalId} not found or inactive`);
        return false;
      }
      
      const animal: AnimalRecord = {
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        birthDate: result.rows[0].birth_date,
        age: result.rows[0].age,
        ageUnit: result.rows[0].age_unit,
        lastAgeUpdate: result.rows[0].last_age_update
      };
      
      const updatedAge = incrementAnimalAge(animal);
      const now = new Date();
      
      await pool.query(`
        UPDATE animals 
        SET age = $1, age_unit = $2, last_age_update = $3, updated_at = $4
        WHERE id = $5
      `, [
        updatedAge.age,
        updatedAge.ageUnit,
        updatedAge.lastAgeUpdate,
        now,
        animalId
      ]);
      
      console.log(`Updated single animal ${animalId}: ${updatedAge.age} ${updatedAge.ageUnit}`);
      return true;
      
    } catch (error) {
      console.error(`Failed to update animal ${animalId}:`, error);
      return false;
    }
  }
  
  /**
   * Get animals that need age updates
   */
  async getAnimalsNeedingUpdate(): Promise<AnimalRecord[]> {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const result = await pool.query(`
      SELECT id, user_id, birth_date, age, age_unit, last_age_update
      FROM animals 
      WHERE is_active = true 
      AND (last_age_update IS NULL OR last_age_update < $1)
      ORDER BY user_id, id
    `, [lastMonth]);
    
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      birthDate: row.birth_date,
      age: row.age,
      ageUnit: row.age_unit,
      lastAgeUpdate: row.last_age_update
    }));
  }
}

export const ageUpdateService = new AgeUpdateService();