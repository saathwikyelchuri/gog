const express = require('express');
const fs = require('fs');
const path = require('path');
const { loadDataset } = require('../services/dataService');

const router = express.Router();

// Path to the Nykaa dataset (in project root, one level up from backend/)
const DATASET_PATH = path.resolve(__dirname, '../../Nykaa Digital Marketing.csv');

/**
 * GET /api/preload
 * Preloads the Nykaa Digital Marketing.csv from the project root into SQLite
 */
router.get('/', async (req, res, next) => {
  try {
    if (!fs.existsSync(DATASET_PATH)) {
      return res.status(404).json({
        error: `Dataset file not found at: ${DATASET_PATH}`
      });
    }

    const buffer = fs.readFileSync(DATASET_PATH);
    const result = await loadDataset(buffer, 'Nykaa Digital Marketing.csv');

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
