export async function searchWeb({ query }: { query: string }) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error('❌ SERPER_API_KEY가 설정되지 않았어요!');

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query }),
    });

    if (!response.ok) throw new Error(`검색 요청 실패: ${response.status}`);

    const data = await response.json();

    // 검색 결과 5개만 추출
    const organic = data.organic ?? [];
    const results = organic
      .slice(0, 5)
      .map(
        (item: any, index: number) =>
          `${index + 1}. ${item.title}\n${item.snippet}\n출처: ${item.link}`
      )
      .join('\n\n');

    return { role: 'tool', content: results || '검색 결과가 없습니다.' };
  } catch (error) {
    console.error('🌐 searchWeb 오류:', error);
    return { role: 'tool', content: '검색 중 오류가 발생했어요.' };
  }
}