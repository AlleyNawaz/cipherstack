import { useState, useRef, useEffect } from 'react';
import { runPipeline } from './lib/engine';
import './index.css';

function App() {
  const [nodes, setNodes] = useState([]);
  const [inputData, setInputData] = useState('Hello Hackathon');
  const [mode, setMode] = useState('encrypt');

  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [results, setResults] = useState({ finalOutput: '', steps: [] });
  const [copied, setCopied] = useState(false);

  // Auto clean results if inputs/nodes dramatically change to avoid showing stale data.
  // Actually, we'll keep it simple: any change just means "not run yet".
  useEffect(() => {
    // If you want, you can clear results here, but sometimes it's nice to keep the old output until Run is clicked.
  }, [nodes, inputData, mode]);

  const addNode = (type) => {
    let config = {};
    if (type === 'CAESAR') config = { shift: 3 };
    else if (type === 'VIGENERE') config = { keyword: 'secret' };
    else if (type === 'XOR') config = { key: 'secret' };
    else if (type === 'RAIL_FENCE') config = { rails: 3 };

    const newNode = {
      id: crypto.randomUUID(),
      type,
      config
    };
    setNodes([...nodes, newNode]);
    setResults({ finalOutput: '', steps: [] });
  };

  const removeNode = (id) => {
    setNodes(nodes.filter(n => n.id !== id));
    setResults({ finalOutput: '', steps: [] });
  };

  const moveNode = (index, direction) => {
    if (index + direction < 0 || index + direction >= nodes.length) return;
    const newNodes = [...nodes];
    const temp = newNodes[index];
    newNodes[index] = newNodes[index + direction];
    newNodes[index + direction] = temp;
    setNodes(newNodes);
    setResults({ finalOutput: '', steps: [] });
  };

  const updateConfig = (id, key, value) => {
    setNodes(nodes.map(n => 
      n.id === id ? { ...n, config: { ...n.config, [key]: value } } : n
    ));
    setResults({ finalOutput: '', steps: [] });
  };

  const configurableCount = nodes.filter(n => !['BASE64', 'REVERSE'].includes(n.type)).length;

  const handleRun = () => {
    setErrorMsg('');
    if (!inputData.trim()) {
      setErrorMsg('Error: Plaintext input is empty.');
      return;
    }
    if (configurableCount < 3) {
      setErrorMsg(`Error: Need at least 3 configurable ciphers (Current: ${configurableCount}).`);
      return;
    }

    setIsRunning(true);
    // Fake processing time for "wow" effect (visual transformation)
    setTimeout(() => {
      const execResult = runPipeline(inputData, nodes, mode === 'decrypt');
      setResults(execResult);
      setIsRunning(false);
    }, 600); // 600ms animated delay
  };

  const handleCopy = () => {
    if (results.finalOutput) {
      navigator.clipboard.writeText(results.finalOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const exportConfig = () => {
    const configStr = JSON.stringify(nodes);
    navigator.clipboard.writeText(configStr);
    alert('Pipeline exported to clipboard!');
  };

  const importConfig = () => {
    const data = prompt('Paste your JSON pipeline config:');
    if (!data) return;
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        setNodes(parsed);
        setResults({ finalOutput: '', steps: [] });
      }
    } catch (e) {
      alert('Invalid JSON config.');
    }
  };

  // Reversing nodes order display for DECRYPT mode to show logical flow physically.
  const displayNodes = mode === 'encrypt' 
    ? nodes.map((n, i) => ({ ...n, realIdx: i }))
    : [...nodes].map((n, i) => ({ ...n, realIdx: i })).reverse();

  return (
    <div className="app-container">
      <header className="header">
        <h1>CipherStack</h1>
        <p className="subtitle">Node-Based Cascade Encryption Builder</p>
      </header>

      <div className="main-content">
        {/* LEFT PANEL: Inputs & Nodes */}
        <div className="panel left-panel">
          <h2>[1] Configuration</h2>
          
          <div className="mode-toggle">
            <button 
              className={mode === 'encrypt' ? 'active' : ''} 
              onClick={() => { setMode('encrypt'); setResults({ finalOutput: '', steps: [] }); }}
            >
              🔒 Encrypt Mode
            </button>
            <button 
              className={mode === 'decrypt' ? 'active' : ''} 
              onClick={() => { setMode('decrypt'); setResults({ finalOutput: '', steps: [] }); }}
            >
              🔓 Decrypt Mode
            </button>
          </div>

          <label>Original Input Text:</label>
          <textarea 
            value={inputData} 
            onChange={(e) => { setInputData(e.target.value); setResults({ finalOutput: '', steps: [] }); }}
            placeholder="Data to encrypt or decrypt..."
            rows={4}
          />

          <div className="add-nodes">
            <h3>Add Cipher Node</h3>
            <div className="button-group">
              <button onClick={() => addNode('CAESAR')}>➕ Caesar Shift</button>
              <button onClick={() => addNode('XOR')}>➕ XOR Cipher</button>
              <button onClick={() => addNode('VIGENERE')}>➕ Vigenère</button>
              <button onClick={() => addNode('BASE64')} className="secondary">➕ Base64 (Bonus)</button>
              <button onClick={() => addNode('REVERSE')} className="secondary">➕ Reverse (Bonus)</button>
              <button onClick={() => addNode('RAIL_FENCE')} className="optional">➕ Rail Fence</button>
            </div>
          </div>

          <div className="add-nodes mt-auto">
            <h3>Share & Save</h3>
            <div className="button-group horizontal">
              <button onClick={exportConfig} className="utility">⬇ Export JSON</button>
              <button onClick={importConfig} className="utility">⬆ Import JSON</button>
            </div>
          </div>
        </div>

        {/* MIDDLE PANEL: Pipeline */}
        <div className="panel middle-panel">
          <div className="pipeline-header-flex">
            <h2>[2] Pipeline execution ({nodes.length})</h2>
            {mode === 'decrypt' && nodes.length > 0 && (
              <span className="reverse-badge">Running in Reverse Order</span>
            )}
          </div>
          
          {nodes.length === 0 && (
            <div className="empty-state">Workspace is empty. Add nodes to construct chain.</div>
          )}
          
          <div className={`pipeline-stack ${isRunning ? 'is-running' : ''}`}>
            {displayNodes.map((node, loopIdx) => {
              const stepResult = results.steps.find(s => s.id === node.id);
              
              // Move Up/Down button logic must map to REAL index, but also respect reverse mode visually correctly
              return (
                <div key={node.id} className="node-card">
                  <div className="node-step-tag">Step {loopIdx + 1}</div>
                  <div className="node-header">
                    <h3>{node.type.replace('_', ' ')}</h3>
                    <div className="node-actions">
                      <button onClick={() => moveNode(node.realIdx, -1)} disabled={node.realIdx === 0}>↑</button>
                      <button onClick={() => moveNode(node.realIdx, 1)} disabled={node.realIdx === nodes.length - 1}>↓</button>
                      <button className="delete" onClick={() => removeNode(node.id)}>✕</button>
                    </div>
                  </div>

                  <div className="node-config">
                    {node.type === 'CAESAR' && (
                      <label>
                        Shift Integer:
                        <input type="number" value={node.config.shift} onChange={(e) => updateConfig(node.id, 'shift', e.target.value)} />
                      </label>
                    )}
                    {node.type === 'XOR' && (
                      <label>
                        Secret Key:
                        <input type="text" value={node.config.key} onChange={(e) => updateConfig(node.id, 'key', e.target.value)} />
                      </label>
                    )}
                    {node.type === 'VIGENERE' && (
                      <label>
                        Keyword:
                        <input type="text" value={node.config.keyword} onChange={(e) => updateConfig(node.id, 'keyword', e.target.value)} />
                      </label>
                    )}
                    {node.type === 'RAIL_FENCE' && (
                      <label>
                        Number of Rails:
                        <input type="number" min="2" value={node.config.rails} onChange={(e) => updateConfig(node.id, 'rails', e.target.value)} />
                      </label>
                    )}
                    {['BASE64', 'REVERSE'].includes(node.type) && (
                      <div className="no-config">No config parameters required.</div>
                    )}
                  </div>

                  {stepResult ? (
                    <div className="node-io success-glow">
                      <div className="io-box">
                        <span className="io-label">RECEIVED:</span> {stepResult.input || '-'}
                      </div>
                      <div className="io-arrow-anim">↓ Processed ↓</div>
                      <div className="io-box out">
                        <span className="io-label">OUTPUT:</span> {stepResult.output || '-'}
                      </div>
                    </div>
                  ) : (
                    <div className="node-io pending">
                      Awaiting Execution...
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT PANEL: Execution & Output */}
        <div className="panel right-panel">
          <h2>[3] Control & Final Output</h2>
          
          <div className="execution-controls">
            <button 
              className={`run-button ${isRunning ? 'spinning' : ''}`}
              onClick={handleRun}
              disabled={isRunning}
            >
              {isRunning ? '⚡ PROCESSING...' : '▶ EXECUTE PIPELINE'}
            </button>
            {errorMsg && <div className="error-toast">{errorMsg}</div>}
          </div>
          
          <div className="final-output-container">
            <label className="glow-label">FINAL RESULT</label>
            <textarea 
              value={results.finalOutput} 
              readOnly
              className={`final-output ${results.finalOutput ? 'has-data' : ''}`}
              placeholder="Result will appear here..."
              rows={8}
            />
            <button onClick={handleCopy} className="copy-button" disabled={!results.finalOutput}>
              {copied ? '✓ COPIED' : '📋 Copy Output'}
            </button>
          </div>
          
          <div className="validation-box mt-auto">
            {configurableCount >= 3 
              ? <div className="success-tag">✓ Chain Valid ({configurableCount}/3)</div> 
              : <div className="warning-tag">⚠ Add {3 - configurableCount} Configurable Cipher(s)</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
