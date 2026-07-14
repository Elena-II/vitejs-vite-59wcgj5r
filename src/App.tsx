import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Test from './components/Test';
import Results from './components/Results';
import ErrorReview from './components/ErrorReview';
import SubjectStatsPage from './components/SubjectStats';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/subject/:subjectId" element={<SubjectStatsPage />} />
          <Route path="/test/:subjectId" element={<Test />} />
          <Route path="/results/:subjectId" element={<Results />} />
          <Route path="/review/:subjectId" element={<ErrorReview />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;