export type PrivacyPolicySection = {
  title: string;
  paragraphs: string[];
  items?: string[];
};

// 앱과 docs/privacy.html은 이 원문을 기준으로 함께 갱신합니다.
export const PRIVACY_POLICY_TITLE = 'easy-do 개인정보처리방침';
export const PRIVACY_POLICY_EFFECTIVE_DATE = '2026년 9월 18일';
export const PRIVACY_POLICY_WEB_URL = 'https://justinhjm.github.io/easy-do/privacy.html';

export const PRIVACY_POLICY_INTRO = 'easy-do는 사용자의 개인정보를 중요하게 생각하며, 서비스 제공에 필요한 최소한의 정보만 처리하는 것을 원칙으로 합니다.';

export const PRIVACY_POLICY_SECTIONS: PrivacyPolicySection[] = [
  {
    title: '1. 앱에서 처리하는 정보',
    paragraphs: [
      'easy-do는 현재 별도의 회원가입이나 계정 기능을 제공하지 않습니다.',
      '사용자가 앱에서 입력하거나 생성하는 다음 정보는 사용자의 기기 내부에 저장됩니다.',
      '위 정보는 현재 easy-do 개발자의 서버로 전송되지 않으며, 다른 사용자 또는 제3자에게 제공되지 않습니다.',
    ],
    items: ['할 일(Todo) 내용', '할 일의 우선순위, 기한 및 반복 설정', '완료 기록 및 통계 정보', '사용자 프로필 설정', '캐릭터 및 앱 설정', '튜토리얼 완료 여부'],
  },
  {
    title: '2. 데이터의 저장 및 삭제',
    paragraphs: [
      'easy-do에서 생성된 데이터는 사용자의 Android 기기에 로컬로 저장됩니다.',
      '사용자는 앱에서 제공하는 데이터 삭제 기능을 통해 easy-do에 저장된 데이터를 삭제할 수 있습니다.',
      '또한 앱을 삭제하거나 Android 설정에서 앱 데이터를 삭제하는 경우 기기에 저장된 정보가 삭제될 수 있습니다.',
      'easy-do는 현재 클라우드 백업 및 기기 간 동기화 기능을 제공하지 않습니다.',
    ],
  },
  {
    title: '3. 의견 보내기 기능',
    paragraphs: [
      'easy-do는 사용자 의견을 받기 위해 외부 서비스인 Google Forms로 연결되는 기능을 제공합니다.',
      '사용자가 의견 보내기 기능을 이용할 경우, Google Forms에서 사용자가 직접 입력한 정보가 제출될 수 있습니다.',
      'easy-do 앱은 Google Forms에 입력된 내용을 앱 내부에서 직접 수집하거나 저장하지 않습니다.',
      'Google Forms를 통해 제출되는 정보의 종류와 처리 방식은 해당 설문 설정 및 Google의 서비스 정책에 따라 달라질 수 있습니다.',
      '사용자는 의견 보내기 기능을 이용하지 않아도 easy-do의 주요 기능을 정상적으로 사용할 수 있습니다.',
    ],
  },
  {
    title: '4. 개인정보의 제3자 제공',
    paragraphs: [
      'easy-do는 앱 내부에 저장되는 Todo, 프로필, 설정 등의 정보를 제3자에게 판매하거나 제공하지 않습니다.',
      '다만 사용자가 Google Forms와 같은 외부 서비스를 직접 이용하는 경우 해당 서비스의 개인정보처리방침이 적용될 수 있습니다.',
    ],
  },
  {
    title: '5. 앱 권한',
    paragraphs: [
      'easy-do는 현재 Todo 관리 기능 제공을 위해 카메라, 위치정보, 연락처 등 민감한 개인정보 접근 권한을 요구하지 않습니다.',
      '향후 새로운 기능 추가로 별도의 권한이 필요한 경우 해당 기능 제공에 필요한 범위에서만 권한을 요청하며, 개인정보 처리 방식이 변경되는 경우 본 개인정보처리방침을 함께 갱신합니다.',
    ],
  },
  {
    title: '6. 개인정보처리방침의 변경',
    paragraphs: [
      'easy-do의 기능 추가 또는 개인정보 처리 방식 변경에 따라 본 개인정보처리방침이 수정될 수 있습니다.',
      '중요한 변경이 있는 경우 앱 또는 배포 페이지 등을 통해 안내할 수 있습니다.',
    ],
  },
  {
    title: '7. 문의',
    paragraphs: ['easy-do 및 개인정보처리방침과 관련한 문의는 아래 연락처를 통해 할 수 있습니다.'],
    items: ['개발자명: 코드세바', '문의 이메일: codeceba@gmail.com'],
  },
];
