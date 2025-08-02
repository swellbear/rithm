import { db } from "./db";
import { tutorials } from "@shared/schema";

const tutorialData = [
  {
    title: "Understanding Step Point Method",
    description: "Learn the scientific foundation of step point sampling for accurate pasture assessment.",
    content: "The step point method is a scientifically proven technique for measuring pasture composition and ground cover. Walk in a straight line across your paddock, taking measurements at regular intervals.",
    category: "basics",
    estimatedDuration: 300, // 5 minutes
    difficulty: "beginner",
    sortOrder: 1,
    isActive: true
  },
  {
    title: "Setting Up Your Transect",
    description: "Establish representative sampling paths through your paddock for consistent results.",
    content: "A transect is your sampling path across the paddock. Choose a path that represents the average conditions of your pasture, avoiding obvious wet spots, fence lines, or heavily trafficked areas.",
    category: "basics", 
    estimatedDuration: 480, // 8 minutes
    difficulty: "beginner",
    sortOrder: 2,
    isActive: true
  },
  {
    title: "Photo Capture Techniques",
    description: "Master consistent photo taking for accurate plant identification and analysis.",
    content: "Take photos from a consistent height (about 3 feet) looking straight down. Ensure good lighting and include a reference object for scale. Take multiple angles if needed.",
    category: "basics",
    estimatedDuration: 420, // 7 minutes
    difficulty: "beginner", 
    sortOrder: 3,
    isActive: true
  },
  {
    title: "Understanding Plant Species",
    description: "Identify key pasture plants and understand their nutritional value for livestock.",
    content: "Learn to distinguish between grasses, legumes, forbs, and weeds. Each plant type provides different nutritional benefits and responds differently to grazing pressure.",
    category: "identification",
    estimatedDuration: 900, // 15 minutes
    difficulty: "intermediate",
    sortOrder: 4,
    isActive: true
  },
  {
    title: "Calculating Grazing Duration",
    description: "Use assessment data to determine optimal grazing periods for your livestock.",
    content: "Combine pasture yield data with herd nutritional requirements to calculate recommended grazing duration. Factor in growth rates, rest periods, and seasonal variations.",
    category: "management",
    estimatedDuration: 600, // 10 minutes
    difficulty: "intermediate",
    sortOrder: 5,
    isActive: true
  }
];

export async function seedTutorials() {
  try {
    console.log("Seeding tutorial data...");
    
    // Insert tutorials
    for (const tutorial of tutorialData) {
      await db.insert(tutorials).values(tutorial).onConflictDoNothing();
    }
    
    console.log("Tutorial data seeded successfully");
  } catch (error) {
    console.error("Error seeding tutorial data:", error);
  }
}

// Run if called directly
if (require.main === module) {
  seedTutorials().then(() => process.exit(0));
}