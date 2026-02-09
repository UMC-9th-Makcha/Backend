import axios from 'axios';
import { CustomError } from '../response/customError.js';
import { createSolapiAuthHeader } from './solapiAuth.js';

const sendVerificationSMS = async (phoneNumber, code) => {
  try {
    const apiKey = process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.SOLAPI_API_SECRET;

    const authHeader = createSolapiAuthHeader(apiKey, apiSecret);

    await axios.post(
      'https://api.solapi.com/messages/v4/send',
      {
        message: {
          to: phoneNumber,
          from: process.env.SOLAPI_SENDER,
          text: `[Makcha] 인증번호는 ${code} 입니다.`,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
      }
    );
  } catch (err) {
    console.error('📛 SOLAPI ERROR:', err.response?.data || err.message);

    throw new CustomError(
      'AUTH-500-010',
      'SMS 발송 실패',
      'sms.util.sendVerificationSMS'
    );
  }
};

// 일반 알림용
export const sendSMS = async (phoneNumber, text) => {
  await sendMessage(phoneNumber, `[Makcha] ${text}`);
};

export default { sendVerificationSMS, sendSMS };
