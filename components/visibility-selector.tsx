'use client';

import { ReactNode, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import {
  CheckCircleFillIcon,
  ChevronDownIcon,
  GlobeIcon,
  LockIcon,
} from './icons';
import { useChatVisibility } from '@/hooks/use-chat-visibility';

export type VisibilityType = 'private' | 'public';

const visibilities: Array<{
  id: VisibilityType;
  label: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    id: 'private',
    label: '비공개', // Private -> 비공개
    description: '나만 이 채팅에 접근할 수 있습니다', // Only you can access this chat -> 나만 이 채팅에 접근할 수 있습니다
    icon: <LockIcon />,
  },
  {
    id: 'public',
    label: '공개', // Public -> 공개
    description: '링크를 가진 누구나 이 채팅에 접근할 수 있습니다', // Anyone with the link can access this chat -> 링크를 가진 누구나 이 채팅에 접근할 수 있습니다
    icon: <GlobeIcon />,
  },
];

export function VisibilitySelector({
  chatId,
  className,
  selectedVisibilityType,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);

  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId,
    initialVisibility: selectedVisibilityType,
  });

  const selectedVisibility = useMemo(
    () => visibilities.find((visibility) => visibility.id === visibilityType),
    [visibilityType],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          variant="outline"
          className="hidden md:flex md:px-2 md:h-[34px]"
        >
          {selectedVisibility?.icon}
          {selectedVisibility?.label}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[300px]">
        {visibilities.map((visibility) => (
          <DropdownMenuItem
            key={visibility.id}
            onSelect={() => {
              setVisibilityType(visibility.id);
              setOpen(false);
            }}
            className="gap-4 group/item flex flex-row justify-between items-center"
            data-active={visibility.id === visibilityType}
          >
            <div className="flex flex-col gap-1 items-start">
              {visibility.label}
              {visibility.description && (
                <div className="text-xs text-muted-foreground">
                  {visibility.description}
                </div>
              )}
            </div>
            <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
              <CheckCircleFillIcon />
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
