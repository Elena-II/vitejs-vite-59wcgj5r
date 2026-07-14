import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Subject, SubjectStats } from '../types';
import { db } from '../db';

const Home = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<Record<string, SubjectStats>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const loadSubjects = async () => {
      const files = ['fizkultura'];
      const loaded: Subject[] = [];

      for (const file of files) {
        try {
          const res = await fetch(`/subjects/${file}.json`);
          if (res.ok) {
            const data = await res.json();
            loaded.push(data);
          }
        } catch (e) {
          console.error(`Не удалось загрузить ${file}`);
        }
      }
      setSubjects(loaded);
    };

    loadSubjects();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      const allStats = await db.stats.toArray();
      const statsMap: Record<string, SubjectStats> = {};
      allStats.forEach(s => statsMap[s.subjectId] = s);
      setStats(statsMap);
    };

    loadStats();
  }, []);

  return (
    <div className="container py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Тренировочные тесты</h1>
        <p className="text-2xl text-gray-600">2 класс</p>
      </div>

      <div className="subject-grid">
        {subjects.map(subject => {
          const stat = stats[subject.id];

          return (
            <div 
              key={subject.id}
              className="subject-card cursor-pointer"
              onClick={() => navigate(`/subject/${subject.id}`)}
            >
              <div className="text-5xl mb-4">🏃</div>
              <h3 className="text-2xl font-bold mb-3">{subject.name}</h3>
              <p className="text-gray-500 mb-4">{subject.questions.length} вопросов</p>
              
              {stat ? (
                <div className="text-center mt-4">
                  <div className="text-sm text-gray-500">Лучший результат</div>
                  <div className="text-4xl font-bold text-emerald-600">{stat.bestResult}%</div>
                </div>
              ) : (
                <div className="text-sm text-gray-400 mt-6">Ещё не пройден</div>
              )}
            </div>
          );
        })}

        {/* Заглушки */}
        {['Окружающий мир', 'Математика', 'Русский язык', 'Литературное чтение', 'Изобразительное искусство'].map(name => (
          <div key={name} className="subject-card locked">
            <div className="text-5xl mb-4 opacity-40">📖</div>
            <h3 className="text-2xl font-bold mb-3">{name}</h3>
            <p className="text-amber-600 text-sm mt-4">Скоро будет доступно</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;