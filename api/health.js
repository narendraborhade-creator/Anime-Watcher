// Vercel Serverless Function: /api/health
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.status(200).json({
    status: 'online',
    platform: 'Vercel Serverless / Neo-Tokyo POSIX Engine',
    timestamp: new Date().toISOString(),
    version: '1.6.0'
  });
};
