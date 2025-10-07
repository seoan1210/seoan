// app/terms/page.tsx

import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관 - Seoan AI',
  description: 'Seoan AI 서비스 이용에 대한 약관 및 책임 제한 규정입니다.',
};

const TermsOfServicePage = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 lg:p-12 mt-12 mb-24">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">이용약관</h1>

      <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
        제1조 (목적)
      </h2>
      <p className="mb-6 text-gray-700 dark:text-gray-300">
        이 약관은 Seoan AI(이하 '당사')가 제공하는 챗봇 서비스(이하 '서비스')의 이용 조건 및 절차, 권리 및 의무 등 기본적인 사항을 규정함을 목적으로 합니다.
      </p>

      <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
        제2조 (서비스의 제공 및 책임의 제한)
      </h2>
      <ol className="list-decimal list-inside ml-4 mb-6 text-gray-700 dark:text-gray-300 space-y-2">
        <li>
          본 서비스는 인공지능 모델을 기반으로 한 챗봇 서비스이며, **당사는 챗봇이 생성하는 모든 정보의 정확성, 완전성, 신뢰성을 보증하지 않습니다.**
        </li>
        <li>
          이용자는 본 서비스에서 제공하는 정보를 **단순 참고 자료**로만 사용하여야 하며, 중요한 결정에는 반드시 전문가의 조언을 받아야 합니다.
        </li>
        <li>
          당사는 챗봇 응답의 오류로 인해 이용자에게 발생한 직·간접적인 손해에 대하여 책임을 지지 않습니다.
        </li>
      </ol>
      
      <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
        제3조 (이용자의 의무)
      </h2>
      <p className="mb-4 text-gray-700 dark:text-gray-300">
        이용자는 서비스를 이용하여 불법적이거나 타인의 권리를 침해하는 행위를 하여서는 안 됩니다. 또한, 서비스의 안정적인 운영을 방해하거나 저작권 등을 침해하는 행위를 금지합니다.
      </p>

      <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
        제4조 (저작권)
      </h2>
      <p className="mb-6 text-gray-700 dark:text-gray-300">
        서비스에서 제공되는 모든 콘텐츠의 저작권은 당사에 있으며, 이용자가 생성한 챗봇 질문 및 응답에 대한 저작권은 관련 법령에 따라 이용자에게 귀속될 수 있습니다.
      </p>
    </div>
  );
};

export default TermsOfServicePage;
