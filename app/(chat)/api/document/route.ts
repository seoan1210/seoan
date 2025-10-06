import { auth } from '@/app/(auth)/auth';
import type { ArtifactKind } from '@/components/artifact';
import {
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
  saveDocument,
} from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('필수 항목인 id가 누락되었습니다.', { status: 400 });
  }

  const session = await auth();

  if (!session?.user?.id) {
    return new Response('인증되지 않았습니다.', { status: 401 });
  }

  const documents = await getDocumentsById({ id });

  const [document] = documents;

  if (!document) {
    return new Response('문서를 찾을 수 없습니다.', { status: 404 });
  }

  if (document.userId !== session.user.id) {
    return new Response('접근이 금지되었습니다.', { status: 403 });
  }

  return Response.json(documents, { status: 200 });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('필수 항목인 id가 누락되었습니다.', { status: 400 });
  }

  const session = await auth();

  if (!session?.user?.id) {
    return new Response('인증되지 않았습니다.', { status: 401 });
  }

  const {
    content,
    title,
    kind,
  }: { content: string; title: string; kind: ArtifactKind } =
    await request.json();

  const documents = await getDocumentsById({ id });

  if (documents.length > 0) {
    const [document] = documents;

    if (document.userId !== session.user.id) {
      return new Response('접근이 금지되었습니다.', { status: 403 });
    }
  }

  const document = await saveDocument({
    id,
    content,
    title,
    kind,
    userId: session.user.id,
  });

  return Response.json(document, { status: 200 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const timestamp = searchParams.get('timestamp');

  if (!id) {
    return new Response('필수 항목인 id가 누락되었습니다.', { status: 400 });
  }

  if (!timestamp) {
    return new Response('필수 항목인 timestamp가 누락되었습니다.', { status: 400 });
  }

  const session = await auth();

  if (!session?.user?.id) {
    return new Response('인증되지 않았습니다.', { status: 401 });
  }

  const documents = await getDocumentsById({ id });

  const [document] = documents;

  if (document.userId !== session.user.id) {
    return new Response('인증되지 않았습니다.', { status: 401 }); // 여기는 Forbidden(403) 대신 Unauthorized(401)를 유지할게.
  }

  const documentsDeleted = await deleteDocumentsByIdAfterTimestamp({
    id,
    timestamp: new Date(timestamp),
  });

  return Response.json(documentsDeleted, { status: 200 });
}
