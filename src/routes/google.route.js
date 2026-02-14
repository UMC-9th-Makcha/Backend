import express from 'express';
import axios from 'axios';

const router = express.Router();

/**
 * GET /api/google-photo?ref=xxx
 * Google Places photo proxy
 */
router.get('/google-photo', async (req, res) => {
  try {
    const { ref } = req.query;

    // ref 존재 + 형식 검증
    if (!ref || !ref.startsWith('places/')) {
        return res.status(400).send('Invalid photo reference');
      }      

    const googleUrl =
      `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=800`;

    const response = await axios.get(googleUrl, {
      headers: {
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY
      },
      responseType: 'stream'
    });

    // 캐싱 헤더
    res.setHeader('Cache-Control', 'public, max-age=86400');

    // Content-Type 그대로 전달
    res.setHeader('Content-Type', response.headers['content-type']);

    response.data.pipe(res);

  } catch (error) {
    console.error('[Google Photo Proxy Error]', error.message);
    res.status(404).end(); // 이미지 없음 처리.
  }
});

export default router;
