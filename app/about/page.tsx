// app/about/page.tsx

import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seoan AI 소개 - Seoan AI',
  description: 'Seoan AI 챗봇 서비스의 목적과 운영 주체를 소개합니다.',
};

const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 lg:p-12 mt-12 mb-24">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Seoan AI 소개 및 문의</h1>
      
      <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
        1. Seoan AI는 무엇인가요?
      </h2>
      <p className="mb-6 text-gray-700 dark:text-gray-300">
        Seoan AI는 복잡한 코딩 문제를 쉽고 빠르게 해결해주고 사용자에게 큰 도움이 되기 위한 목표로 개발된 인공지능 기반의 챗봇 서비스입니다. 저희는 사용자들에게 빠르고 유용한 정보를 제공하여 일상과 업무를 돕기 위해 노력하고 있습니다.
      </p>

      <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
        2. 운영 주체
      </h2>
      <p className="mb-6 text-gray-700 dark:text-gray-300">
        Seoan AI는 **개인 개발자 [서안 님 이름]**에 의해 운영되고 있으며, 사용자 경험 개선과 더 나은 서비스 제공을 위해 지속적으로 업데이트하고 있습니다.
      </p>

      <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
        3. 문의
      </h2>
      <p className="text-gray-700 dark:text-gray-300">
        서비스 이용 중 궁금한 사항이나 피드백, 협업 제안 등이 있다면 언제든지 아래 이메일로 연락 주시기 바랍니다.
      </p>
      <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300 mt-2">
        <li>**이메일:** seoan102410@gmail.com</li>
      </ul>
    </div>
  );
};

export default AboutPage;
