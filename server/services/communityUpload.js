const multer = require('multer');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const extensions = {'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp'};
function communityUpload(directory) {
  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, done) => done(null, directory),
      filename: (_req, file, done) => done(null, randomUUID() + extensions[file.mimetype]),
    }),
    limits: {fileSize: 5 * 1024 * 1024, files: 1},
    fileFilter: (_req, file, done) => done(extensions[file.mimetype] ? null : Object.assign(Error('Choose a PNG, JPEG or WebP image.'), {statusCode: 400}), Boolean(extensions[file.mimetype])),
  }).single('image');
  return (req, res, next) => upload(req, res, error => {
    if (!error) return next();
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : error.statusCode || 500;
    return res.status(status).json({error: status === 413 ? 'Choose an image no larger than 5 MB.' : status === 400 ? error.message : 'Image upload is unavailable.'});
  });
}
module.exports = {communityUpload, uploadDirectory: path.resolve(__dirname, '../uploads')};
