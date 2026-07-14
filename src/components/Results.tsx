import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

const Results = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const correct = parseInt(searchParams.get('correct') || '0');
  const total = parseInt(searchParams.get('total') || '0');
  const percentage = parseInt(searchParams.get('perc') || '0');

  const hasErrors = correct < total;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6 px-6 pt-6">
        <button onClick={() => navigate('/')} className="text-xl">← На главную</button>
      </div>

      <div className="flex-1 flex items-center justify-center text-center px-6">
        <div className="max-w-md">
          <div className="text-7xl mb-6">🏆</div>
          
          <h1 className="text-4xl font-bold mb-4">Тест завершён!</h1>
          
          <div className="my-10">
            <div className="text-7xl font-bold text-emerald-600 mb-2">{percentage}%</div>
            <p className="text-2xl text-gray-600">
              Правильно: {correct} из {total}
            </p>
          </div>

          {hasErrors ? (
            <button 
              onClick={() => navigate(`/review/${subjectId}`)}
              className="primary text-xl py-5 w-full mb-4"
            >
              Разобрать ошибки
            </button>
          ) : (
            <div className="text-2xl text-emerald-600 font-medium mb-8">
              Отличный результат! 🎉
            </div>
          )}

          <button 
            onClick={() => navigate(`/test/${subjectId}`)}
            className="secondary text-xl py-5 w-full"
          >
            Пройти тест ещё раз
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;