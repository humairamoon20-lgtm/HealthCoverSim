import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import QuoteList from './pages/QuoteList';
import CreateQuote from './pages/CreateQuote';
import QuoteDetail from './pages/QuoteDetail';
import EditQuote from './pages/EditQuote';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="navbar">
          <div className="navbar-inner">
            <Link to="/" className="navbar-brand">
              <span className="brand-icon">🏥</span>
              <span className="brand-text">HealthCoverSim</span>
            </Link>
            <nav className="navbar-nav">
              <Link to="/" className="nav-link">All Quotes</Link>
              <Link to="/create" className="nav-link btn btn-nav">+ New Quote</Link>
            </nav>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<QuoteList />} />
            <Route path="/create" element={<CreateQuote />} />
            <Route path="/quotes/:id" element={<QuoteDetail />} />
            <Route path="/quotes/:id/edit" element={<EditQuote />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>HealthCoverSim — Private Health Insurance Quote Simulator</p>
          <p className="footer-disclaimer">This is a learning simulator only. It is not financial advice.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
