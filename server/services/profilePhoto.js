const { PNG } = require('pngjs');
function normalizeProfilePhoto(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length > 512 * 1024 || buffer.length < 24 ||
      buffer.subarray(0,8).toString('hex') !== '89504e470d0a1a0a') {
    throw Object.assign(new Error('Please upload a valid PNG photo under 512 KB.'), {status:400});
  }
  const width=buffer.readUInt32BE(16),height=buffer.readUInt32BE(20);
  if (!width || !height || width>512 || height>512) throw Object.assign(new Error('Photo dimensions must be at most 512 × 512.'),{status:400});
  try {
    const decoded=PNG.sync.read(buffer,{checkCRC:true});
    return 'data:image/png;base64,'+PNG.sync.write(decoded).toString('base64');
  } catch { throw Object.assign(new Error('This photo could not be read. Choose another image.'),{status:400}); }
}
module.exports={normalizeProfilePhoto};
