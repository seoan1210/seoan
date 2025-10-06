'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, LoaderIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Markdown } from './markdown';

interface MessageReasoningProps {
  isLoading: boolean;
  reasoning: string;
}

// 시간을 초 단위로 포맷팅하는 유틸리티 함수
const formatTime = (seconds: number): string => {
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)}ms`;
  }
  return `${seconds.toFixed(2)}초`;
};

export function MessageReasoning({
  isLoading,
  reasoning,
}: MessageReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  // 로딩 시작 시간을 저장
  const startTimeRef = useRef<number | null>(null);
  // 최종적으로 걸린 시간을 저장
  const [elapsedTime, setElapsedTime] = useState<number | null>(null);

  // 로딩 상태에 따라 시간 측정을 시작/종료하는 useEffect
  useEffect(() => {
    if (isLoading) {
      // 로딩 시작 시, 현재 시간을 저장
      startTimeRef.current = performance.now();
      setElapsedTime(null); // 새로운 로딩이 시작되면 시간 초기화
    } else if (startTimeRef.current !== null) {
      // 로딩이 끝났을 때, 경과 시간 계산 및 저장
      const endTime = performance.now();
      const duration = (endTime - startTimeRef.current) / 1000; // 밀리초를 초로 변환
      setElapsedTime(duration);
      startTimeRef.current = null; // 초기화
    }
  }, [isLoading]);

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      marginTop: '1rem',
      marginBottom: '0.5rem',
    },
  };

  const timeDisplay = elapsedTime !== null ? formatTime(elapsedTime) : '';

  return (
    <div className="flex flex-col">
      {isLoading ? (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium">추론 중...</div>
          <div className="animate-spin">
            <LoaderIcon />
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium">
            추론 완료{elapsedTime !== null && ` (${timeDisplay} 소요)`}
          </div>
          <button
            data-testid="message-reasoning-toggle"
            type="button"
            className="cursor-pointer"
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
          >
            <ChevronDownIcon
              // 확장 여부에 따라 아이콘 회전
              className={isExpanded ? 'rotate-180 transform' : ''}
            />
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            data-testid="message-reasoning"
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            className="pl-4 text-zinc-600 dark:text-zinc-400 border-l flex flex-col gap-4"
          >
            <Markdown>{reasoning}</Markdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
