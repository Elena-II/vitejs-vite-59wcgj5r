import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Subject, TestResult, SubjectStats as StatsType, TestAttempt } from '../types';
import { db } from '../db';

const SubjectStatsPage = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [stats, setStats] = useState<StatsType | null>(null);
  const [recentResults, setRecentResults] = useState<TestResult[]>([]);
  const [hasUnfinishedAttempt, setHasUnfinishedAttempt] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!subjectId) return;

      try {
        const res = await fetch(`/subjects/${subjectId}.json`);
        if (res.ok) {
          const subj = await res.json();
          setSubject(subj);
        }

        const subjectStats = await db.stats.get(subjectId);
        setStats(subjectStats || null);

        const results = await db.results
          .where('subjectId')
          .equals(subjectId)
          .reverse()
          .limit(3)
          .toArray();

        setRecentResults(results);

        // Проверка на незавершенный тест
        const unfinished = await db.attempts.get(subjectId);
        setHasUnfinishedAttempt(!!unfinished);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [subjectId]);

  const startNewTest = async () => {
    if (hasUnfinishedAttempt) {
      // Удаляем незавершенный тест (не сохраняем)
      await db.attempts.delete(subjectId!);
    }
    navigate(`/test/${subjectId}`);
  };

  const continueUnfinishedTest = () => {
    navigate(`/test/${subjectId}`);
  };

  if (isLoading) {
    return <div className="container py-20 text-center text-2xl">Загрузка статистики...</div>;
  }

  if (!subject) {
    return <div className="container py-20 text-center">Предмет не найден</div>;
  }

  return (
    <div className="container py-8 max-w-2xl mx-auto">
      <button 
        onClick={() => navigate('/')}
        className="mb-8 text-xl flex items-center gap-2 text-gray-600 hover:text-black"
      >
        ← На главную
      </button>

      <div className="text-center mb-10">
        <div className="text-6xl mb-4">📊</div>
        <h1 className="text-4xl font-bold mb-2">{subject.name}</h1>
        <p className="text-xl text-gray-600">{subject.questions.length} вопросов</p>
      </div>

      {stats && (
        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Общая статистика</h2>
          
          <div className="space-y-6 text-center">
            <div className="text-xl">
              Пройдено всего: <span className="font-bold text-3xl text-emerald-600">{stats.attempts}</span>
            </div>
            <div className="text-xl">
              Лучший результат: <span className="font-bold text-3xl text-emerald-600">{stats.bestResult}%</span>
            </div>
            <div className="text-xl">
              Последний результат: <span className="font-bold text-3xl text-emerald-600">{stats.lastResult}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Последние 3 попытки</h2>
        
        {recentResults.length > 0 ? (
          <div className="space-y-4">
            {recentResults.map((result, index) => (
              <div key={index} className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl">
                <div>
                  <div className="text-sm text-gray-500">
                    {new Date(result.date).toLocaleDateString('ru-RU', { 
                      day: 'numeric', 
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-emerald-600">{result.percentage}%</div>
                  <div className="text-sm text-gray-600">
                    {result.correctCount} из {subject.questions.length}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Вы ещё не проходили этот тест
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-col gap-4">
        {hasUnfinishedAttempt && (
          <button 
            onClick={continueUnfinishedTest}
            className="primary w-full py-5 text-xl"
          >
            Продолжить незавершенный тест
          </button>
        )}

        <button 
          onClick={startNewTest}
          className="secondary w-full py-5 text-xl"
        >
          Начать новый тест
        </button>
      </div>
    </div>
  );
};

export default SubjectStatsPage;