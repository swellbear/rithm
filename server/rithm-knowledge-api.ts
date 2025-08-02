import { Router } from 'express';
import { conceptNet } from './concept-net-integration';

const router = Router();

// ConceptNet knowledge endpoints
router.get('/api/rithm/knowledge/stats', (req, res) => {
  try {
    const stats = conceptNet.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get knowledge stats' });
  }
});

router.get('/api/rithm/knowledge/concept/:name', (req, res) => {
  try {
    const { name } = req.params;
    const concept = conceptNet.getConcept(name);
    
    if (!concept) {
      return res.status(404).json({ error: 'Concept not found' });
    }
    
    res.json(concept);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get concept' });
  }
});

router.post('/api/rithm/knowledge/search', (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const results = conceptNet.findRelatedConcepts(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search concepts' });
  }
});

router.post('/api/rithm/knowledge/enhance', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const enhancement = conceptNet.enhanceTextUnderstanding(text);
    res.json(enhancement);
  } catch (error) {
    res.status(500).json({ error: 'Failed to enhance text understanding' });
  }
});

export default router;