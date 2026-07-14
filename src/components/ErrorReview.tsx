import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Question } from '../types';
import { db } from '../db';

const ErrorReview = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [reviewItems, setReviewItems] = useState<number[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const loadReview = async () => {
      if (!subjectId) return;

      try {
        const res = await fetch(`/subjects/${subjectId}.json`);
        const data = await res.json();
        setQuestions(data.questions);

        const lastResult = await db.results
          .where('subjectId')
          .equals(subjectId)
          .reverse()
          .first();

        if (lastResult && lastResult.answers) {
          const errorIndices: number[] = [];
          let correct = 0;

          data.questions.forEach((q: Question, i: number) => {
            const selected = lastResult.answers[i];
            const isError = selected === null || !q.correct.includes(selected);
            if (isError) errorIndices.push(i);
            if (selected !== null && q.correct.includes(selected)) correct++;
          });

          setReviewItems(errorIndices);
          setUserAnswers(lastResult.answers);
          setCorrectCount(correct);
          setTotal(data.questions.length);
        } else {
          setReviewItems(data.questions.map((_: any, i: number) => i));
          setUserAnswers(new Array(data.questions.length).fill(null));
        }
      } catch (e) {
        navigate('/');
      }
    };

    loadReview();
  }, [subjectId, navigate]);

  const finishReview = () => {
    navigate(`/results/${subjectId}?correct=${correctCount}&total=${total}&perc=${Math.round((correctCount / total) * 100)}`);
  };

  if (reviewItems.length === 0) {
    return (
      <div className="container py-20 text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-3xl font-bold mb-6">Все ответы правильные!</h2>
        <button 
          onClick={() => navigate('/')}
          className="primary text-xl px-10 py-4"
        >
          На главную
        </button>
      </div>
    );
  }

  const currentIdx = reviewItems[reviewIndex];
  const q = questions[currentIdx];
  const selected = userAnswers[currentIdx];

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/')} className="text-xl">← На главную</button>
        <div className="text-lg font-medium">
          Разбор ошибок • {reviewIndex + 1} / {reviewItems.length}
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-semibold mb-6 leading-tight">{q.text}</h2>

        {/* Картинка вопроса */}
        {q.image && (
          <div className="mb-6 text-center">
            <img 
              src={q.image} 
              alt="Иллюстрация" 
              className="mx-auto rounded-2xl max-h-64 object-contain shadow-sm"
            />
          </div>
        )}

        <div className="options">
          {q.options.map((option, idx) => {
            const isCorrect = q.correct.includes(idx);
            const isSelected = selected === idx;

            return (
              <div
                key={idx}
                className={`option ${isCorrect ? 'correct' : ''} ${isSelected && !isCorrect ? 'incorrect' : ''}`}
              >
                {/* Картинка варианта */}
                {q.optionImages && q.optionImages[idx] && (
                  <img 
                    src={q.optionImages[idx]} 
                    alt="" 
                    className="w-8 h-8 mr-3 object-contain inline-block"
                  />
                )}
                {option}
              </div>
            );
          })}
        </div>

        <div className="mt-10 p-6 bg-amber-50 rounded-2xl border border-amber-200">
          <div className="font-semibold text-amber-800 mb-3">Подсказка:</div>
          <div className="text-amber-700 leading-relaxed text-[17px]">
            {q.hint}
          </div>
        </div>
      </div>

      <div className="nav-buttons">
        <button 
          onClick={() => setReviewIndex(i => Math.max(0, i - 1))}
          disabled={reviewIndex === 0}
          className="secondary"
        >
          Назад
        </button>
        <button 
          onClick={() => {
            if (reviewIndex < reviewItems.length - 1) {
              setReviewIndex(reviewIndex + 1);
            } else {
              finishReview();
            }
          }}
          className="primary"
        >
          {reviewIndex < reviewItems.length - 1 ? 'Далее' : 'Завершить'}
        </button>
      </div>
    </div>
  );
};

export default ErrorReview;