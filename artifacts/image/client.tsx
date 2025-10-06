import { Artifact } from '@/components/create-artifact';
import { CopyIcon, RedoIcon, UndoIcon } from '@/components/icons';
import { ImageEditor } from '@/components/image-editor';
import { toast } from 'sonner';

export const imageArtifact = new Artifact({
  kind: 'image',
  description: '이미지 생성에 유용합니다.',
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === 'image-delta') {
      console.log('🧩 streamPart:', streamPart);

      // streamPart.content가 객체인 경우 (ex: { b64_json: '...' })
      let base64 = '';

      if (typeof streamPart.content === 'object' && streamPart.content !== null) {
        if ('b64_json' in streamPart.content) {
          base64 = streamPart.content.b64_json;
        } else {
          console.warn('⚠️ 예상치 못한 content 구조:', streamPart.content);
        }
      } else if (typeof streamPart.content === 'string') {
        base64 = streamPart.content;
      }

      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: base64,
        isVisible: true,
        status: 'streaming',
      }));
    }
  },
  content: ImageEditor,
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: '이전 버전 보기',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => currentVersionIndex === 0,
    },
    {
      icon: <RedoIcon size={18} />,
      description: '다음 버전 보기',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => isCurrentVersion,
    },
    {
      icon: <CopyIcon size={18} />,
      description: '이미지를 클립보드에 복사',
      onClick: ({ content }) => {
        if (!content) {
          toast.error('복사할 이미지가 없습니다.');
          return;
        }

        const img = new Image();
        img.src = `data:image/png;base64,${content}`;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob }),
              ]);
              toast.success('이미지가 클립보드에 복사되었습니다!');
            }
          }, 'image/png');
        };
      },
    },
  ],
  toolbar: [],
});
