const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

router.post('/', upload.single('audio'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        // Return relative path, the server will serve this statically
        const filePath = `/uploads/${req.file.filename}`;

        res.json({
            msg: 'File uploaded successfully',
            url: filePath
        });
    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ msg: 'Server error during upload' });
    }
});

module.exports = router;
