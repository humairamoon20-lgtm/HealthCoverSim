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
              <span className="brand-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                     strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21s-7.5-4.35-7.5-10.2V5.1L12 2.5l7.5 2.6v5.7C19.5 16.65 12 21 12 21z" />
                  <path d="M12 8.6v5.6M9.2 11.4h5.6" />
                </svg>
              </span>
              <span className="brand-text">
                HealthCoverSim
                <small>Quote Simulator</small>
              </span>
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
