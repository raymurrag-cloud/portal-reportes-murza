import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const LIMITE_GRATIS = 3;
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function ReporteChat({ ticker, empresa, slug }) {
  const userToken = localStorage.getItem('portal_user_token');
  const storageKey = `chat_count_${ticker}`;

  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [preguntasUsadas, setPreguntasUsadas] = useState(() =>
    userToken ? 0 : parseInt(sessionStorage.getItem(storageKey) || '0', 10)
  );

  const limiteAlcanzado = !userToken && preguntasUsadas >= LIMITE_GRATIS;
  const restantes = LIMITE_GRATIS - preguntasUsadas;
  const mensajesRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  }, [mensajes, cargando]);

  useEffect(() => {
    if (abierto && !limiteAlcanzado) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [abierto]);

  const enviar = async () => {
    const texto = input.trim();
    if (!texto || cargando || limiteAlcanzado) return;

    const nuevosMensajes = [...mensajes, { role: 'user', content: texto }];
    setMensajes(nuevosMensajes);
    setInput('');
    setCargando(true);
    setError(null);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (userToken) headers['Authorization'] = `Bearer ${userToken}`;

      const res = await fetch(`${BASE_URL}/chat/${ticker}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: nuevosMensajes }),
      });

      const data = await res.json();

      if (res.status === 429) {
        if (!userToken) {
          setPreguntasUsadas(LIMITE_GRATIS);
          sessionStorage.setItem(storageKey, String(LIMITE_GRATIS));
        }
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Error al consultar');

      setMensajes(prev => [...prev, { role: 'assistant', content: data.respuesta }]);

      if (!userToken) {
        const next = preguntasUsadas + 1;
        setPreguntasUsadas(next);
        sessionStorage.setItem(storageKey, String(next));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="chat-flotante">
      {abierto && (
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-header-title">Analista IA — {empresa}</div>
              {!userToken && !limiteAlcanzado && (
                <div className="chat-header-sub">
                  {restantes} pregunta{restantes !== 1 ? 's' : ''} gratuita{restantes !== 1 ? 's' : ''} restante{restantes !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            <button className="chat-close" onClick={() => setAbierto(false)}>✕</button>
          </div>

          <div className="chat-mensajes" ref={mensajesRef}>
            {mensajes.length === 0 && !limiteAlcanzado && (
              <div className="chat-bienvenida">
                Hola. Puedes preguntarme sobre el reporte de <strong>{empresa}</strong>: métricas financieras, valuación, red flags o el veredicto de inversión.
              </div>
            )}
            {mensajes.map((m, i) => (
              <div key={i} className={`chat-msg chat-msg-${m.role}`}>
                {m.role === 'assistant' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p style={{ margin: '0 0 8px 0' }}>{children}</p>,
                      strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                      h1: ({ children }) => <p style={{ fontWeight: 700, fontSize: '1em', margin: '10px 0 4px 0' }}>{children}</p>,
                      h2: ({ children }) => <p style={{ fontWeight: 700, fontSize: '1em', margin: '10px 0 4px 0' }}>{children}</p>,
                      h3: ({ children }) => <p style={{ fontWeight: 700, fontSize: '1em', margin: '8px 0 4px 0' }}>{children}</p>,
                      ul: ({ children }) => <ul style={{ margin: '4px 0 8px 0', paddingLeft: 18 }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ margin: '4px 0 8px 0', paddingLeft: 18 }}>{children}</ol>,
                      li: ({ children }) => <li style={{ marginBottom: 3 }}>{children}</li>,
                      code: ({ inline, children }) => inline
                        ? <code style={{ background: 'rgba(0,0,0,.08)', borderRadius: 3, padding: '1px 4px', fontSize: '0.9em' }}>{children}</code>
                        : <pre style={{ background: 'rgba(0,0,0,.06)', borderRadius: 6, padding: '8px 10px', overflowX: 'auto', margin: '6px 0' }}><code>{children}</code></pre>,
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                ) : m.content}
              </div>
            ))}
            {cargando && (
              <div className="chat-msg chat-msg-assistant">
                <span className="chat-typing"><span/><span/><span/></span>
              </div>
            )}
          </div>

          {limiteAlcanzado ? (
            <div className="chat-paywall">
              <p>Has usado tus {LIMITE_GRATIS} preguntas gratuitas de hoy.</p>
              <Link to={`/registro?redirect=/reporte/${slug}`} className="btn-primary btn-full">
                Crear cuenta gratis — acceso ilimitado
              </Link>
              <p className="chat-login-hint">
                ¿Ya tienes cuenta? <Link to={`/login?redirect=/reporte/${slug}`}>Inicia sesión</Link>
              </p>
            </div>
          ) : (
            <div className="chat-input-row">
              <input
                ref={inputRef}
                className="chat-input"
                type="text"
                placeholder="¿Cuál fue el FCF en 2024?"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
                disabled={cargando}
                maxLength={500}
              />
              <button
                className="chat-send"
                onClick={enviar}
                disabled={!input.trim() || cargando}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          )}

          {error && <div className="chat-error">{error}</div>}
        </div>
      )}

      <button
        className={`chat-fab ${abierto ? 'chat-fab-open' : ''}`}
        onClick={() => setAbierto(v => !v)}
        title="Pregunta sobre este reporte"
      >
        {abierto ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
        {!userToken && !abierto && restantes > 0 && restantes < LIMITE_GRATIS && (
          <span className="chat-fab-badge">{restantes}</span>
        )}
      </button>
    </div>
  );
}
