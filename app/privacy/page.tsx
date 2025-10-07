// app/privacy/page.tsx

import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보 처리방침 - Seoan AI',
  description: 'Seoan AI의 개인정보 처리방침 및 광고 게재 관련 내용을 안내합니다.',
};

const PrivacyPolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 lg:p-12 mt-12 mb-24">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">개인정보 처리방침</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        본 방침은 **[시행일자: 2025년 10월 8일]**부터 적용됩니다.
      </p>

      <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
        1. 수집하는 개인정보의 항목 및 수집 방법
      </h2>
      <p className="mb-4 text-gray-700 dark:text-gray-300">
        Seoan AI(이하 '당사')는 서비스 이용 과정에서 다음과 같은 정보를 **자동으로 수집**할 수 있습니다.
      </p>

      <div className="overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">수집 항목</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">수집 목적</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">IP 주소, 방문 기록, 서비스 이용 기록</td>
              <td className="px-6 py-4">서비스 품질 개선, 부정 이용 방지, 통계 분석 (비식별 정보)</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">챗봇과의 대화 내용</td>
              <td className="px-6 py-4">챗봇 서비스의 정확성 및 응답 품질 향상 (익명으로 저장될 수 있음)</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
        2. 개인정보의 제3자 제공 및 광고 게재
      </h2>
      <p className="mb-4 text-gray-700 dark:text-gray-300">
        당사는 서비스 운영 및 수익화를 위해 **Google AdSense**를 통해 광고를 게재하며, 이 과정에서 이용자의 IP 주소, Cookie 정보 등 비식별화된 정보가 Google 및 광고 파트너에게 제공될 수 있습니다. 이용자는 브라우저 설정을 통해 Cookie를 거부하거나, Google 광고 설정 페이지를 통해 맞춤형 광고를 거부할 수 있습니다.
      </p>
      
      <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
        3. 개인정보 보호책임자 및 연락처
      </h2>
      <p className="text-gray-700 dark:text-gray-300">
        이용자는 서비스 이용과 관련하여 발생하는 모든 개인정보 보호 관련 문의, 불만 처리 등에 관한 사항을 아래 연락처로 문의해 주시기 바랍니다.
      </p>
      <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300 mt-2">
        <li>**책임자:** 운영팀</li>
        <li>**연락처:** **contact@seoan-ai.com** (👈 이메일을 네 실제 주소로 변경해주세요!)</li>
      </ul>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-10">
        본 처리방침은 법령 및 정책 변경에 따라 변경될 수 있으며, 변경 시 웹사이트를 통해 고지합니다.
      </p>
    </div>
  );
};

export default PrivacyPolicyPage;
