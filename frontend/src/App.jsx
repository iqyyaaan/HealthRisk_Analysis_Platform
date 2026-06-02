import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

const firebaseConfig = {
  apiKey: "AIzaSyANglvdUTYoa2Q0vFOXgRwuXZNOTjlIWdU",
  authDomain: "health-risk-questionnaire.firebaseapp.com",
  projectId: "health-risk-questionnaire",
  storageBucket: "health-risk-questionnaire.firebasestorage.app",
  messagingSenderId: "250233180024",
  appId: "1:250233180024:web:4729c2914550abf938028d"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const API = 'http://localhost:8000'; // change to Railway URL after deploy

const COLORS = { aligned: '#1D9E75', underestimate: '#E85D24', overestimate: '#BA7517' };

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [shap, setShap] = useState(null);
  const [bias, setBias] = useState(null);
  const [fl, setFl] = useState(null);
  const [llmThemes, setLlmThemes] = useState(null);
  const [augmented, setAugmented] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, u => setUser(u));
  }, []);

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  async function login(e) {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setLoginError('Invalid email or password');
    }
  }

  async function loadAll() {
    setLoading(true);
    try {
      const [a, s, b, f, l, aug] = await Promise.all([
        fetch(`${API}/analysis`).then(r => r.json()),
        fetch(`${API}/shap`).then(r => r.json()),
        fetch(`${API}/bias`).then(r => r.json()),
        fetch(`${API}/fl/simulate`).then(r => r.json()),
        fetch(`${API}/llm/themes`).then(r => r.json()),
        fetch(`${API}/analysis/augmented`).then(r => r.json()),
      ]);
      setAnalysis(a);
      setShap(s);
      setBias(b);
      setFl(f);
      setLlmThemes(l);
      setAugmented(aug);
    } catch (e) {
      console.error('API error', e);
    } finally {
      setLoading(false);
    }
  }

  async function exportCSV() {
    const snap = await getDocs(collection(db, 'responses'));
    const rows = snap.docs.map(d => d.data());
    if (!rows.length) return alert('No data yet');
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'responses.csv'; a.click();
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f8' }}>
        <div style={{ background: '#fff', padding: 40, borderRadius: 16, width: 340, boxShadow: '0 2px 20px rgba(0,0,0,0.08)' }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Analytics dashboard</h1>
          <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>Admin access only</p>
          <form onSubmit={login}>
            <input style={inputStyle} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            {loginError && <p style={{ color: '#e00', fontSize: 13 }}>{loginError}</p>}
            <button style={btnStyle} type="submit">Sign in</button>
          </form>
        </div>
      </div>
    );
  }

  const labelData = analysis?.label_distribution
    ? Object.entries(analysis.label_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const shapData = shap?.features
    ? shap.features.map((f, i) => ({ feature: f, importance: parseFloat(shap.mean_abs_shap[i].toFixed(4)) }))
        .sort((a, b) => b.importance - a.importance)
    : [];

  const biasSections = bias
    ? [
        { key: 'age_band', title: 'Bias by age band' },
        { key: 'gender', title: 'Bias by gender' },
        { key: 'education', title: 'Bias by education' },
      ]
    : [];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Health Risk Analytics</h1>
          <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>Crowdsourced Health Perception Analysis Platform</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={exportCSV} style={{ ...btnStyle, background: '#1a1a1a', padding: '10px 18px', fontSize: 13 }}>Export CSV</button>
          <button onClick={() => signOut(auth)} style={{ ...btnStyle, background: '#888', padding: '10px 18px', fontSize: 13 }}>Sign out</button>
        </div>
      </div>

      {loading && <p style={{ color: '#888' }}>Loading analytics...</p>}

      {analysis && !analysis.error && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            <StatCard label="Total responses" value={analysis.total_responses} />
            <StatCard label="Model accuracy" value={`${(analysis.accuracy * 100).toFixed(1)}%`} />
            <StatCard label="Aligned responses" value={`${Math.round((analysis.label_distribution?.aligned || 0) / analysis.total_responses * 100)}%`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
            <Card title="Reliability label distribution">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={labelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {labelData.map((entry) => <Cell key={entry.name} fill={COLORS[entry.name] || '#888'} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card title="SHAP feature importance (XAI)">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={shapData} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="feature" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="importance" fill="#c0006a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}

      {bias && !bias.error && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Bias analysis by demographic group</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {biasSections.map(section => {
              const sectionData = bias[section.key];
              if (!sectionData) return null;

              return (
                <Card key={section.key} title={section.title}>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {Object.entries(sectionData).map(([group, values]) => (
                      <div
                        key={group}
                        style={{
                          border: '1px solid #eee',
                          borderRadius: 10,
                          padding: 12,
                          background: '#fafafa'
                        }}
                      >
                        <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px' }}>{group}</p>
                        <p style={{ fontSize: 12, color: '#555', margin: '0 0 4px' }}>
                          Aligned: {Math.round((values.aligned || 0) * 100)}%
                        </p>
                        <p style={{ fontSize: 12, color: '#555', margin: '0 0 4px' }}>
                          Underestimate: {Math.round((values.underestimate || 0) * 100)}%
                        </p>
                        <p style={{ fontSize: 12, color: '#555', margin: 0 }}>
                          Overestimate: {Math.round((values.overestimate || 0) * 100)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {llmThemes && !llmThemes.error && (
        <div style={{ marginBottom: 32 }}>
          <Card title="LLM lifestyle themes">
            <p style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
              AI-generated thematic summary of open-ended lifestyle responses.
            </p>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Common themes</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {llmThemes.themes?.map((theme, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      fontSize: 12,
                      color: '#333'
                    }}
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Summary</p>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>
                {llmThemes.summary}
              </p>
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Health indicators mentioned</p>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>
                {Array.isArray(llmThemes.health_indicators)
                  ? llmThemes.health_indicators.join(', ')
                  : ''}
              </p>
            </div>
          </Card>
        </div>
      )}

      {augmented && !augmented.error && (
        <div style={{ marginBottom: 32 }}>
          <Card title="Embedding-augmented model">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 18 }}>
              <StatCard label="Model type" value="Augmented LR" />
              <StatCard label="Accuracy" value={`${(augmented.accuracy * 100).toFixed(1)}%`} />
              <StatCard label="Embedding components" value={augmented.embedding_components_used} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Top coefficients</p>
              <div style={{ display: 'grid', gap: 8 }}>
                {augmented.top_coefficients &&
                  Object.entries(augmented.top_coefficients).map(([feature, value]) => (
                    <div
                      key={feature}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        border: '1px solid #eee',
                        borderRadius: 8,
                        padding: '10px 12px',
                        background: '#fafafa'
                      }}
                    >
                      <span style={{ fontSize: 13, color: '#333' }}>{feature}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                        {Number(value).toFixed(4)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <p style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>
              This model combines structured health features with reduced semantic embedding components derived from users’ lifestyle text responses.
            </p>
          </Card>
        </div>
      )}

      {fl && !fl.error && (
        <Card title="Simulated federated learning vs centralised">
          <div style={{ display: 'flex', gap: 24, padding: '8px 0' }}>
            <FLStat label="Centralised accuracy" value={`${(fl.centralised_accuracy * 100).toFixed(1)}%`} color="#185FA5" />
            <FLStat label="Federated accuracy (FedAvg)" value={`${(fl.federated_accuracy * 100).toFixed(1)}%`} color="#1D9E75" />
            <FLStat label="Simulated hospitals" value={fl.n_hospitals} color="#888" />
          </div>
          <p style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>
            Data split into {fl.n_hospitals} hospital subsets. Local models trained independently, coefficients averaged with FedAvg.
          </p>
        </Card>
      )}

      {analysis?.error && (
        <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: 16, color: '#795548' }}>
          {analysis.error} — submit some responses via the mobile app first.
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #eee' }}>
      <p style={{ fontSize: 13, color: '#888', margin: '0 0 6px' }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>{value}</p>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #eee' }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#333', margin: '0 0 16px' }}>{title}</p>
      {children}
    </div>
  );
}

function FLStat({ label, value, color }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <p style={{ fontSize: 26, fontWeight: 700, color, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>{label}</p>
    </div>
  );
}

const inputStyle = { display: 'block', width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' };
const btnStyle = { display: 'block', width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#c0006a', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' };