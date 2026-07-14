import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Question } from '../types';
import { db } from '../db';

const Test = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();

  const [subject, setSubject] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMissedWarning, setShowMissedWarning] = useState(false);
  const [missedMode, setMissedMode] = useState(false);
  const [missedIndices, setMissedIndices] = useState<number[]>([]);

  useEffect(() => {
    const loadTest = async () => {
      if (!subjectId) return;

      try {
        const res = await fetch(`/subjects/${subjectId}.json`);
        if (!res.ok) throw new Error();
        
        const subj = await res.json();
        setSubject(subj);
        setQuestions(subj.questions);

        let attempt = await db.attempts.get(subjectId);
        
        if (!attempt) {
          attempt = {
            subjectId,
            answers: new Array(subj.questions.length).fill(null),
            currentQuestion: 0,
            lastUpdated: new Date()
          };
          await db.attempts.put(attempt);
        }

        setAnswers(attempt.answers);
        setCurrentIndex(attempt.currentQuestion);
      } catch (e) {
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadTest();
  }, [subjectId, navigate]);

  const saveProgress = useCallback(async (newAnswers: (number | null)[], index: number) => {
    if (!subjectId) return;
    await db.attempts.put({
      subjectId,
      answers: newAnswers,
      currentQuestion: index,
      lastUpdated: new Date()
    });
  }, [subjectId]);

  const selectAnswer = (idx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = idx;
    setAnswers(newAnswers);
    saveProgress(newAnswers, currentIndex);
  };

  const goToQuestion = (globalIndex: number) => {
    if (globalIndex < 0 || globalIndex >= questions.length) return;
    setCurrentIndex(globalIndex);
    saveProgress(answers, globalIndex);
  };

  const next = () => {
    if (missedMode) {
      const currentPos = missedIndices.indexOf(currentIndex);
      if (currentPos < missedIndices.length - 1) {
        goToQuestion(missedIndices[currentPos + 1]);
      } else {
        completeTest(answers);
      }
    } else {
      if (currentIndex < questions.length - 1) {
        goToQuestion(currentIndex + 1);
      } else {
        const hasUnanswered = answers.some(a => a === null);
        if (hasUnanswered) {
          setShowMissedWarning(true);
        } else {
          completeTest(answers);
        }
      }
    }
  };

  const prev = () => {
    if (missedMode) {
      const currentPos = missedIndices.indexOf(currentIndex);
      if (currentPos > 0) {
        goToQuestion(missedIndices[currentPos - 1]);
      }
    } else {
      if (currentIndex > 0) {
        goToQuestion(currentIndex - 1);
      }
    }
  };

  const startMissedMode = () => {
    const missed = answers.map((a, i) => a === null ? i : -1).filter(i => i !== -1);
    setMissedIndices(missed);
    setMissedMode(true);
    if (missed.length > 0) {
      goToQuestion(missed[0]);
    }
    setShowMissedWarning(false);
  };

  const completeTest = async (finalAnswers: (number | null)[]) => {
    let correctCount = 0;
    finalAnswers.forEach((selected, idx) => {
      if (selected !== null && questions[idx].correct.includes(selected)) correctCount++;
    });

    const errorCount = questions.length - correctCount;
    const percentage = Math.round((correctCount / questions.length) * 100);

    await db.results.add({
      subjectId: subjectId!,
      correctCount,
      errorCount,
      percentage,
      date: new Date(),
      answers: finalAnswers
    });

    let stat = await db.stats.get(subjectId!) || {
      subjectId: subjectId!, attempts: 0, bestResult: 0, previousResult: 0, lastResult: 0
    };

    await db.stats.put({
      ...stat,
      attempts: stat.attempts + 1,
      bestResult: Math.max(stat.bestResult, percentage),
      previousResult: stat.lastResult,
      lastResult: percentage
    });

    await db.attempts.delete(subjectId!);
    setMissedMode(false);

    navigate(`/results/${subjectId}?correct=${correctCount}&total=${questions.length}&perc=${percentage}`);
  };

  if (isLoading) return <div className="container py-20 text-center text-2xl">Загрузка...</div>;

  const q = questions[currentIndex];

  return (
    <div className="container py-6">
      {!showMissedWarning && (
        <>
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => navigate('/')} className="text-xl">← На главную</button>
            <div className="text-center">
              <div className="font-bold text-xl">{subject?.name}</div>
              <div>
                Вопрос {missedMode 
                  ? missedIndices.indexOf(currentIndex) + 1 
                  : currentIndex + 1} / 
                {missedMode ? missedIndices.length : questions.length}
              </div>
            </div>
          </div>

          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
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

            <div className="options space-y-2">
              {q.options.map((option, idx) => (
                <div
                  key={idx}
                  className={`option py-3 px-5 text-[16px] leading-tight min-h-[52px] flex items-center border-2 transition-all ${answers[currentIndex] === idx ? 'selected' : ''}`}
                  onClick={() => selectAnswer(idx)}
                >
                  {/* Картинка варианта (если будет) */}
                  {q.optionImages && q.optionImages[idx] && (
                    <img 
                      src={q.optionImages[idx]} 
                      alt="" 
                      className="w-8 h-8 mr-3 object-contain"
                    />
                  )}
                  {option}
                </div>
              ))}
            </div>
          </div>

          <div className="nav-buttons">
            {(missedMode ? missedIndices.indexOf(currentIndex) > 0 : currentIndex > 0) && (
              <button onClick={prev} className="secondary">
                Назад
              </button>
            )}

            <button onClick={next} className="primary">
              {(missedMode && missedIndices.indexOf(currentIndex) === missedIndices.length - 1) || 
               (!missedMode && currentIndex === questions.length - 1) 
                ? 'Завершить тест' 
                : 'Далее'}
            </button>
          </div>
        </>
      )}

      {showMissedWarning && (
        <div className="min-h-screen flex flex-col">
          <div className="flex justify-between items-center mb-6 px-6 pt-6">
            <button onClick={() => navigate('/')} className="text-xl">← На главную</button>
          </div>

          <div className="flex-1 flex items-center justify-center text-center px-6">
            <div className="max-w-md">
              <h3 className="text-3xl font-bold mb-8">Внимание!</h3>
              <p className="text-2xl mb-12">
                У вас осталось <strong>{answers.filter(a => a === null).length}</strong> вопросов без ответа.
              </p>
            </div>
          </div>

          <div className="nav-buttons">
            <button 
              onClick={() => completeTest(answers)}
              className="primary"
            >
              Завершить тест
            </button>
            <button 
              onClick={startMissedMode}
              className="secondary"
            >
              Ответить на пропущенные вопросы
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Test;