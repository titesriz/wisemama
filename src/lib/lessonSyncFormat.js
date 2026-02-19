const LESSONS_SYNC_SCHEMA = 'wisemama.lessons.v1';

export function buildLessonsSyncEnvelope(lessons = []) {
  return {
    schema: LESSONS_SYNC_SCHEMA,
    exportedAt: new Date().toISOString(),
    app: {
      name: 'WiseMama',
      formatVersion: 1,
    },
    device: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    },
    data: {
      lessons,
    },
  };
}

export function extractLessonsFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.lessons)) return payload.lessons;
  if (Array.isArray(payload?.data?.lessons)) return payload.data.lessons;
  return null;
}

export function isSyncEnvelope(payload) {
  return payload?.schema === LESSONS_SYNC_SCHEMA && Array.isArray(payload?.data?.lessons);
}
