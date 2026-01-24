import { CustomSuccess } from '../response/customSuccess.js';
import { CustomError } from '../response/customError.js';
import phoneService from '../services/phone.service.js';

const PHONE_REGEX = /^010\d{8}$/; //010만 허용하겠습니다.

/**
 * POST /auth/phone/send
 * 인증번호 발송
 */
const send = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    const normalized = phoneNumber.replace(/-/g, ''); //프론트에서 010- 형태로 줄 수 있음을 방지.

    if (!phoneNumber) {
    throw new CustomError(
        'AUTH-400-010',
        '전화번호가 필요합니다',
        req.originalUrl
    );
    }

    if (!PHONE_REGEX.test(normalized)) {
    throw new CustomError(
        'AUTH-400-012',
        '전화번호 형식이 올바르지 않습니다',
        req.originalUrl
    );
    }

    await phoneService.sendVerificationCode(normalized);

    const response = new CustomSuccess(
      'AUTH-200-006',
      200,
      '인증번호 발송 성공'
    );

    return res.status(response.statusCode).json(response);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/phone/verify
 * 인증번호 검증
 */
const verify = async (req, res, next) => {
  try {
    const { phoneNumber, code } = req.body;
    const { userId } = req.user; // isLoggedIn에서 주입
    const normalized = phoneNumber?.replace(/-/g, ''); //프론트에서 010- 형태로 줄 수 있음을 방지.

    if (!phoneNumber || !code) {
      throw new CustomError(
        'AUTH-400-011',
        '전화번호와 인증번호가 필요합니다',
        req.originalUrl
      );
    }


    if (!PHONE_REGEX.test(normalized)) {
        throw new CustomError(
          'AUTH-400-012',
          '전화번호 형식이 올바르지 않습니다',
          req.originalUrl
        );
      }

      await phoneService.verifyCodeAndSavePhone({
        userId,
        phoneNumber: normalized,
        code,
      });
  
      const response = new CustomSuccess(
        'AUTH-200-007',
        200,
        '전화번호 인증 완료'
      );
  
      return res.status(response.statusCode).json(response);
    } catch (err) {
      next(err);
    }
  };
  
  export default { send, verify };
