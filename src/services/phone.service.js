import prisma from '../database/prisma.js';
import { CustomError } from '../response/customError.js';
import {
  saveCode,
  verifyCode,
  deleteCode,
} from '../utils/phoneVerification.utils.js';
import smsUtil from '../utils/sms.util.js'; 


// 인증번호 발송. 무한 요청 방지.
const sendVerificationCode = async (phoneNumber) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
  
    try {
      saveCode(phoneNumber, code);
    } catch (err) {
      if (err.message === 'AUTH-429-001') {
        throw new CustomError(
          'AUTH-429-001',
          '인증번호 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          'phone.service.sendVerificationCode'
        );
      }
      throw err;
    }
  
    await smsUtil.sendVerificationSMS(phoneNumber, code);
  };

// 인증번호 확인 및 전화번호 저장.
const verifyCodeAndSavePhone = async ({ userId, phoneNumber, code }) => {
  const isValid = verifyCode(phoneNumber, code);

  if (!isValid) {
    throw new CustomError(
      'AUTH-401-006',
      '인증번호가 올바르지 않거나 만료되었습니다',
      'phone.service.verifyCodeAndSavePhone'
    );
  }

  // 인증 성공 → 전화번호 저장
  // 여기는 단순히 한 칼럼 업데이트라 레포지토리를 따로 파는게 과한 설계라고 판단했는데, 
  // 잘못 판단한거라면 언제든 말씀해주세요:)
  await prisma.user.update({
    where: { user_id: BigInt(userId) },
    data: { phone_number: phoneNumber },
  });

  // 인증 완료 후 코드 제거
  deleteCode(phoneNumber);
};

export default {
  sendVerificationCode,
  verifyCodeAndSavePhone,
};