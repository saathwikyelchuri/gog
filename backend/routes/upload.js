const express = require('express');
const multer = require('multer');
const { loadDataset } = require('../services/dataService');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['text/csv', 'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream'];
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (['csv', 'xlsx', 'xls'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are supported.'));
    }
  }
});

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const result = await loadDataset(req.file.buffer, req.file.originalname);

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
