import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Chat.css';

function RecipeCard({ recipe, url }) {
  const [checkedIngredients, setCheckedIngredients] = useState({});

  const toggleIngredient = (index) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="recipe-card">
      {/* Title & Description */}
      <div className="recipe-header-section">
        <h2 className="recipe-title">{recipe.title}</h2>
        {recipe.description && (
          <p className="recipe-description">{recipe.description}</p>
        )}
        {url && (
          <a
            className="original-url"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {url}
          </a>
        )}
      </div>

      {/* Time & Servings Badges */}
      {(recipe.prep_time || recipe.cook_time || recipe.total_time || recipe.servings) && (
        <div className="recipe-meta">
          {recipe.prep_time && (
            <div className="meta-badge">
              <span className="meta-icon">🔪</span>
              <div className="meta-text">
                <span className="meta-label">Prep</span>
                <span className="meta-value">{recipe.prep_time}</span>
              </div>
            </div>
          )}
          {recipe.cook_time && (
            <div className="meta-badge">
              <span className="meta-icon">🍳</span>
              <div className="meta-text">
                <span className="meta-label">Cook</span>
                <span className="meta-value">{recipe.cook_time}</span>
              </div>
            </div>
          )}
          {recipe.total_time && (
            <div className="meta-badge">
              <span className="meta-icon">⏱️</span>
              <div className="meta-text">
                <span className="meta-label">Total</span>
                <span className="meta-value">{recipe.total_time}</span>
              </div>
            </div>
          )}
          {recipe.servings && (
            <div className="meta-badge">
              <span className="meta-icon">🍽️</span>
              <div className="meta-text">
                <span className="meta-label">Servings</span>
                <span className="meta-value">{recipe.servings}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ingredients */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <div className="recipe-section">
          <h3 className="section-heading">
            <span className="section-icon">🥕</span> Ingredients
          </h3>
          <ul className="ingredients-list">
            {recipe.ingredients.map((item, i) => (
              <li
                key={i}
                className={`ingredient-item ${checkedIngredients[i] ? 'checked' : ''}`}
                onClick={() => toggleIngredient(i)}
              >
                <span className="ingredient-checkbox">
                  {checkedIngredients[i] ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="18" height="18" rx="4" fill="#4caf50" />
                      <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="18" height="18" rx="4" stroke="#999" strokeWidth="2" />
                    </svg>
                  )}
                </span>
                <span className="ingredient-text">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Steps */}
      {recipe.steps && recipe.steps.length > 0 && (
        <div className="recipe-section">
          <h3 className="section-heading">
            <span className="section-icon">📝</span> Instructions
          </h3>
          <div className="steps-list">
            {recipe.steps.map((step, i) => (
              <div key={i} className="step-item">
                <span className="step-number">{i + 1}</span>
                <p className="step-text">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {recipe.notes && recipe.notes.length > 0 && (
        <div className="recipe-section">
          <h3 className="section-heading">
            <span className="section-icon">💡</span> Tips & Notes
          </h3>
          <ul className="notes-list">
            {recipe.notes.map((note, i) => (
              <li key={i} className="note-item">{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function NotRecipePage({ title, url, onBack }) {
  return (
    <div className="not-recipe">
      <div className="not-recipe-icon">🤷</div>
      <h2 className="not-recipe-title">That's not a recipe!</h2>
      <p className="not-recipe-message">
        We checked <strong>{title}</strong> and it doesn't look like a recipe page. Try pasting a link to an actual recipe.
      </p>
      <button className="try-again-button" onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Try another URL
      </button>
    </div>
  );
}

function Chat() {
  const [response, setResponse] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [notRecipe, setNotRecipe] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedUrl, setSubmittedUrl] = useState('');
  const [apiStatus, setApiStatus] = useState('checking'); // 'checking' | 'healthy' | 'unreachable'
  const textareaRef = useRef(null);

  // Check API health on mount
  useEffect(() => {
    let cancelled = false;
    const checkHealth = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/health`);
        if (!cancelled) {
          setApiStatus(res.ok ? 'healthy' : 'unreachable');
        }
      } catch {
        if (!cancelled) setApiStatus('unreachable');
      }
    };
    checkHealth();
    return () => { cancelled = true; };
  }, []);

  const isValidUrl = (text) => {
    try {
      const url = new URL(text);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Keep browser tab title in sync with the page header
  useEffect(() => {
    document.title = pageTitle
      ? `${pageTitle} — Cut The Crap`
      : 'Cut The Crap';
  }, [pageTitle]);

  // Auto-resize textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleBack = () => {
    setResponse(null);
    setRecipe(null);
    setNotRecipe(null);
    setPageTitle('');
    setSubmitted(false);
    setSubmittedUrl('');
    setInput('');
    setUrlError('');
    // Clear the URL query param
    window.history.replaceState(null, '', window.location.pathname);
  };

  const fetchRecipe = useCallback(async (url) => {
    setUrlError('');
    setSubmitted(true);
    setSubmittedUrl(url);
    setIsLoading(true);

    // Sync URL into the browser address bar
    const params = new URLSearchParams({ url });
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      if (data.title) {
        setPageTitle(data.title);
      }
      if (data.is_recipe === false) {
        setNotRecipe({ title: data.title, url });
        setRecipe(null);
        setResponse(null);
      } else if (data.recipe) {
        setRecipe(data.recipe);
        setResponse(null);
        setNotRecipe(null);
      } else {
        setResponse(data.summary);
        setRecipe(null);
        setNotRecipe(null);
      }
    } catch (err) {
      setResponse(`Something went wrong: ${err.message}`);
      setRecipe(null);
      setNotRecipe(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch if a ?url= query param is present on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (urlParam && isValidUrl(urlParam)) {
      setInput(urlParam);
      fetchRecipe(urlParam);
    }
  }, [fetchRecipe]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    if (!isValidUrl(trimmed)) {
      setUrlError('Please enter a valid URL (e.g. https://example.com)');
      return;
    }
    fetchRecipe(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-container">
      {/* Header — only shown after submit */}
      {submitted && (
        <header className="chat-header">
          <button className="back-button" onClick={handleBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5M12 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="header-center">
            <h1>Cut The Crap</h1>
            {pageTitle && <span className="page-title">— {pageTitle}</span>}
          </div>
        </header>
      )}

      {/* Content area */}
      <main className="chat-messages">
        {!submitted ? (
          <div className="empty-state"></div>
        ) : isLoading ? (
          <div className="loading-state">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        ) : recipe ? (
          <div className="response-wrapper">
            <RecipeCard recipe={recipe} url={submittedUrl} />
          </div>
        ) : notRecipe ? (
          <div className="response-wrapper">
            <NotRecipePage title={notRecipe.title} url={notRecipe.url} onBack={handleBack} />
          </div>
        ) : response ? (
          <div className="response-wrapper">
            <div className="response-content">
              <p>{response}</p>
              <button className="try-again-button" onClick={handleBack}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Try another URL
              </button>
            </div>
          </div>
        ) : null}
      </main>

      {/* Input bar — only shown before first submit */}
      {!submitted && (
        <footer className="chat-input-area">
          <div className="input-hero">
            <h2>Cut The Crap</h2>
            <p>We'll strip out the life stories, ads, and pop-ups — giving you just the recipe.</p>
          </div>
          <form className="chat-input-form" onSubmit={handleSubmit}>
            <div className={`input-wrapper ${urlError ? 'input-wrapper-error' : ''}`}>
              <textarea
                ref={textareaRef}
                className="chat-input"
                placeholder="Paste a URL (e.g. https://example.com)..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (urlError) setUrlError('');
                }}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                type="submit"
                className="send-button"
                disabled={!input.trim() || isLoading || apiStatus !== 'healthy'}
                aria-label="Send message"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 11L12 6L17 11M12 18V7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            {urlError && <p className="url-error">{urlError}</p>}
          </form>
          <p className="disclaimer">Cut The Crap can make mistakes.</p>
        </footer>
      )}

      {/* API status footer — always visible */}
      <footer className="api-status-footer">
        <span className={`status-dot status-dot--${apiStatus}`} />
        <span className="status-text">
          {apiStatus === 'checking' && 'Connecting to API…'}
          {apiStatus === 'healthy' && 'API connected'}
          {apiStatus === 'unreachable' && 'API unreachable — make sure the backend is running'}
        </span>
      </footer>
    </div>
  );
}

export default Chat;
