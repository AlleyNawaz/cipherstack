import { useState, useRef, useEffect } from 'react';
import { applyCipher } from './lib/engine';
import './index.css';

function App() {
  const [nodes, setNodes] = useState([]);
  const [inputData, setInputData] = useState('Welcome to Vyrothon');
  const [mode, setMode] = useState('encrypt');

  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [results, setResults] = useState({ finalOutput: '', steps: [] });
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Auto-scroll to active node during animation
  useEffect(() => {
    if (activeStep !== -1) {
      const el = document.getElementById(`node-card-${activeStep}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeStep]);

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
    const [temp] = newNodes.splice(index, 1);
    newNodes.splice(index + direction, 0, temp);
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
  const isInvalid = !inputData.trim() || configurableCount < 3;

  // Reversing nodes order display for DECRYPT mode to show logical flow visually.
  const displayNodes = mode === 'encrypt' 
    ? nodes.map((n, i) => ({ ...n, realIdx: i }))
    : [...nodes].map((n, i) => ({ ...n, realIdx: i })).reverse();

  const handleRunAnimated = async () => {
    if (isInvalid) return;

    setIsRunning(true);
    setResults({ finalOutput: '', steps: [] });
    
    let currentText = inputData;
    let accumulatedSteps = [];

    const isDecrypt = mode === 'decrypt';

    // Execute step-by-step
    for (let i = 0; i < displayNodes.length; i++) {
      setActiveStep(displayNodes[i].id); // Set currently crunching node
      
      // Artificial delay for visual flow
      await new Promise(r => setTimeout(r, 600)); 
      
      const node = displayNodes[i];
      const output = applyCipher(node.type, currentText, node.config, isDecrypt);
      
      accumulatedSteps.push({
        id: node.id,
        nodeType: node.type,
        config: node.config,
        input: currentText,
        output: output
      });
      
      setResults({ finalOutput: '', steps: [...accumulatedSteps] });
      currentText = output;
    }
    
    // Final wait before clearing active step
    await new Promise(r => setTimeout(r, 300)); 
    setActiveStep(-1);
    setResults({ finalOutput: currentText, steps: accumulatedSteps });
    setIsRunning(false);
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
    showToast('Pipeline exported to clipboard!');
  };

  const importConfig = () => {
    const data = prompt('Paste your JSON pipeline config:');
    if (!data) return;
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        setNodes(parsed);
        setResults({ finalOutput: '', steps: [] });
        showToast('Pipeline imported successfully!');
      }
    } catch (e) {
      showToast('Error: Invalid JSON config.');
    }
  };

  return (
    <div className="app-container">
      {toastMsg && <div className="global-toast">{toastMsg}</div>}
      
      <header className="header">
        <h1>CipherStack</h1>
        <p className="subtitle">Node-Based Cascade Encryption Builder</p>
      </header>

      <div className="main-content">
        {/* LEFT PANEL: Inputs & Nodes */}
        <div className="panel left-panel">
          <h2>[1] Configuration</h2>
          
          <div className="config-section">
            <label className="section-label">Mode</label>
            <div className="mode-toggle">
              <button 
                className={mode === 'encrypt' ? 'active encrypt' : ''} 
                onClick={() => { 
                  if (mode !== 'encrypt') {
                    if (results.finalOutput) setInputData(results.finalOutput);
                    setMode('encrypt'); 
                    setResults({ finalOutput: '', steps: [] }); 
                  }
                }}
              >
                🔒 Encrypt
              </button>
              <button 
                className={mode === 'decrypt' ? 'active decrypt' : ''} 
                onClick={() => { 
                  if (mode !== 'decrypt') {
                    if (results.finalOutput) setInputData(results.finalOutput);
                    setMode('decrypt'); 
                    setResults({ finalOutput: '', steps: [] }); 
                  }
                }}
              >
                🔓 Decrypt
              </button>
            </div>
          </div>

          <div className="config-section">
            <label className="section-label">Input</label>
            <textarea 
              value={inputData} 
              onChange={(e) => { setInputData(e.target.value); setResults({ finalOutput: '', steps: [] }); }}
              placeholder="Enter text to encrypt or decrypt..."
              rows={5}
            />
          </div>

          <div className="add-nodes">
            <label className="section-label">Add cipher to run pipeline</label>
            <div className="button-group subtle">
              <button onClick={() => addNode('CAESAR')}>+ Caesar</button>
              <button onClick={() => addNode('XOR')}>+ XOR</button>
              <button onClick={() => addNode('VIGENERE')}>+ Vigenère</button>
              <button onClick={() => addNode('BASE64')}>+ Base64</button>
              <button onClick={() => addNode('REVERSE')}>+ Reverse</button>
              <button onClick={() => addNode('RAIL_FENCE')}>+ Rail Fence</button>
            </div>
          </div>

          <div className="add-nodes mt-auto">
            <div className="button-group horizontal">
              <button onClick={exportConfig} className="utility" disabled={isRunning}>Export JSON</button>
              <button onClick={importConfig} className="utility" disabled={isRunning}>Import JSON</button>
            </div>
          </div>
        </div>

        {/* MIDDLE PANEL: Pipeline */}
        <div className="panel middle-panel">
          <div className="pipeline-header-flex">
            <h2>[2] Pipeline Execution ({nodes.length})</h2>
            {mode === 'decrypt' && nodes.length > 0 && (
              <span className="reverse-badge">Running in reverse order</span>
            )}
          </div>
          
          {nodes.length === 0 && (
            <div className="empty-state">Add ciphers from the left panel to begin.</div>
          )}
          
          <div className="pipeline-stack">
            {displayNodes.map((node, loopIdx) => {
              const stepResult = results.steps.find(s => s.id === node.id);
              const isActive = activeStep === node.id;
              
              return (
                <div key={node.id} id={`node-card-${node.id}`} className="node-wrapper">
                  <div className={`node-card ${isActive ? 'active-glow' : ''}`}>
                    <div className="node-step-tag">Step {loopIdx + 1}</div>
                    <div className="node-header">
                      <h3>{node.type.replace('_', ' ')}</h3>
                      <div className="node-actions">
                        <button onClick={() => moveNode(node.realIdx, -1)} disabled={node.realIdx === 0 || isRunning}>↑</button>
                        <button onClick={() => moveNode(node.realIdx, 1)} disabled={node.realIdx === nodes.length - 1 || isRunning}>↓</button>
                        <button className="delete" onClick={() => removeNode(node.id)} disabled={isRunning}>✕</button>
                      </div>
                    </div>

                    <div className="node-config">
                      {node.type === 'CAESAR' && (
                        <label>
                          Shift
                          <input type="number" value={node.config.shift} onChange={(e) => updateConfig(node.id, 'shift', e.target.value)} disabled={isRunning} />
                        </label>
                      )}
                      {node.type === 'XOR' && (
                        <label>
                          Key
                          <input type="text" value={node.config.key} onChange={(e) => updateConfig(node.id, 'key', e.target.value)} disabled={isRunning}/>
                        </label>
                      )}
                      {node.type === 'VIGENERE' && (
                        <label>
                          Keyword
                          <input type="text" value={node.config.keyword} onChange={(e) => updateConfig(node.id, 'keyword', e.target.value)} disabled={isRunning}/>
                        </label>
                      )}
                      {node.type === 'RAIL_FENCE' && (
                        <label>
                          Rails
                          <input type="number" min="2" value={node.config.rails} onChange={(e) => updateConfig(node.id, 'rails', e.target.value)} disabled={isRunning}/>
                        </label>
                      )}
                    </div>

                    {stepResult && (
                      <div className="node-io-box">
                        <div className="io-line">
                          <span className="io-muted">Input: </span>
                          <span className="io-value">{stepResult.input || ' '}</span>
                        </div>
                        <div className="io-line separator">↓</div>
                        <div className="io-line highlighted">
                          <span className="io-color">Output: </span>
                          <span className="io-value primary-glow">{stepResult.output || ' '}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Structural Arrow between nodes */}
                  {loopIdx < displayNodes.length - 1 && (
                    <div className="pipeline-connector">
                      ↓
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT PANEL: Execution & Output */}
        <div className="panel right-panel">
          <h2>[3] Control & Status</h2>
          
          <div className="execution-controls">
            <button 
              className={`run-button ${isRunning ? 'spinning' : ''}`}
              onClick={handleRunAnimated}
              disabled={isRunning || Boolean(!inputData.trim() && !isRunning)}
            >
              {isRunning ? '▶ PROCESSING...' : '▶ EXECUTE PIPELINE'}
            </button>
            
            <div className="validation-box">
              {configurableCount >= 3 
                ? <div className="status-msg valid">✓ Pipeline configuration valid</div> 
                : <div className="status-msg invalid">Add at least {3 - configurableCount} configurable ciphers to run.</div>}
            </div>
          </div>
          
          <div className="final-output-container mt-auto">
            <label className="section-label glow-label">FINAL ENCRYPTED OUTPUT</label>
            <textarea 
              value={results.finalOutput} 
              readOnly
              className={`final-output ${results.finalOutput ? 'has-data' : ''}`}
              placeholder="..."
              rows={8}
            />
            <button onClick={handleCopy} className="copy-button" disabled={!results.finalOutput}>
              {copied ? '✓ COPIED!' : '📋 Copy Output'}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default App;
