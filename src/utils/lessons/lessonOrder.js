const CHINESE_CHAR_RE = /[\u3400-\u9fff\uf900-\ufaff]/u;

export function normalizeLessonOrder(value, fallback = 0) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }
  const fallbackParsed = Number(fallback);
  if (Number.isFinite(fallbackParsed) && fallbackParsed > 0) {
    return Math.floor(fallbackParsed);
  }
  return 0;
}

export function getLessonsByOrder(lessons = []) {
  if (!Array.isArray(lessons)) return [];
  return lessons
    .map((lesson, index) => ({
      lesson,
      index,
      order: normalizeLessonOrder(lesson?.order, Number.MAX_SAFE_INTEGER),
    }))
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.index - b.index;
    })
    .map((entry, sortedIndex) => ({
      ...entry.lesson,
      order: normalizeLessonOrder(entry.lesson?.order, sortedIndex + 1),
    }));
}

export function getPreviousLessons(lessonId, allLessons = []) {
  const sorted = getLessonsByOrder(allLessons);
  const currentIndex = sorted.findIndex((lesson) => lesson.id === lessonId);
  if (currentIndex <= 0) return [];
  return sorted.slice(0, currentIndex);
}

export function getNextLesson(lessonId, allLessons = []) {
  const sorted = getLessonsByOrder(allLessons);
  const currentIndex = sorted.findIndex((lesson) => lesson.id === lessonId);
  if (currentIndex < 0) return null;
  return sorted[currentIndex + 1] || null;
}

export function getAllSeenCharsBefore(lessonId, allLessons = []) {
  const previousLessons = getPreviousLessons(lessonId, allLessons);
  const chars = new Set();

  previousLessons.forEach((lesson) => {
    (lesson?.cards || []).forEach((card) => {
      const hanzi = String(card?.hanzi || '');
      Array.from(hanzi).forEach((char) => {
        if (CHINESE_CHAR_RE.test(char)) chars.add(char);
      });
    });
  });

  return Array.from(chars);
}
