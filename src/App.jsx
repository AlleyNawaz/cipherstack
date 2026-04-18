import { useState, useRef, useEffect } from 'react';
import { applyCipher } from './lib/engine';
import './index.css';

function App() {
  const [nodes, setNodes] = useState([]);
  const [inputData, setInputData] = useState('Welcome to Vyrothon');
  const [mode, setMode] = useState('encrypt');

  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [pipelineResults, setPipelineResults] = useState({ finalOutput: '', steps: [] });
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  
  const [outputExpanded, setOutputExpanded] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

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
      id: Date.now() + Math.random().toString(36).substring(2),
      type,
      config
    };
    setNodes(prev => [...prev, newNode]);
    setPipelineResults({ finalOutput: '', steps: [] });
  };

  const removeNode = (id) => {
    setNodes(nodes.filter(n => n.id !== id));
    setPipelineResults({ finalOutput: '', steps: [] });
  };

  const moveNode = (index, direction) => {
    if (index + direction < 0 || index + direction >= nodes.length) return;
    const newNodes = [...nodes];
    const [movedNode] = newNodes.splice(index, 1);
    newNodes.splice(index + direction, 0, movedNode);
    setNodes(newNodes);
    setPipelineResults({ finalOutput: '', steps: [] });
  };

  const updateConfig = (id, key, value) => {
    setNodes(nodes.map(n => 
      n.id === id ? { ...n, config: { ...n.config, [key]: value } } : n
    ));
    setPipelineResults({ finalOutput: '', steps: [] });
  };

  const configurableCount = nodes.filter(n => !['BASE64', 'REVERSE'].includes(n.type)).length;
  const isInvalid = !inputData.trim() || configurableCount < 3;

  const displayNodes = mode === 'encrypt' 
    ? nodes.map((n, i) => ({ ...n, realIdx: i }))
    : [...nodes].map((n, i) => ({ ...n, realIdx: i })).reverse();

  const handleRunAnimated = async () => {
    if (isInvalid) return;

    setIsRunning(true);
    setPipelineResults({ finalOutput: '', steps: [] });
    setOutputExpanded(true);
    
    let currentState = inputData;
    let accumulatedSteps = [];
    const isDecrypt = mode === 'decrypt';

    for (let i = 0; i < displayNodes.length; i++) {
      setActiveStep(displayNodes[i].id); 
      await new Promise(r => setTimeout(r, 600)); 
      
      const node = displayNodes[i];
      const output = applyCipher(node.type, currentState, node.config, isDecrypt);
      
      accumulatedSteps.push({
        id: node.id,
        nodeType: node.type,
        config: node.config,
        input: currentState,
        output: output
      });
      
      setPipelineResults({ finalOutput: '', steps: [...accumulatedSteps] });
      currentState = output;
    }
    
    await new Promise(r => setTimeout(r, 300)); 
    setActiveStep(-1);
    setPipelineResults({ finalOutput: currentState, steps: accumulatedSteps });
    setIsRunning(false);
  };

  const handleCopy = () => {
    if (pipelineResults.finalOutput) {
      navigator.clipboard.writeText(pipelineResults.finalOutput);
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
        setPipelineResults({ finalOutput: '', steps: [] });
        showToast('Pipeline imported successfully!');
      }
    } catch {
      showToast('Error: Invalid JSON config.');
    }
  };

  return (
    <div className="app-container">
      {toastMsg && <div className="global-toast">{toastMsg}</div>}
      
      <header className="header">
        <h1>CipherStack</h1>
        <p className="subtitle">Node-Based Cascade Encryption</p>
      </header>

      <div className="main-content">
        <div className="panel left-panel">
          <div className="config-section">
            <label className="section-label">Mode</label>
            <div className="mode-toggle">
              <button 
                className={mode === 'encrypt' ? 'active encrypt' : ''} 
                onClick={() => { 
                  if (mode !== 'encrypt') {
                    if (pipelineResults.finalOutput) setInputData(pipelineResults.finalOutput);
                    setMode('encrypt'); 
                    setPipelineResults({ finalOutput: '', steps: [] }); 
                  }
                }}
              >
                🔒 Encrypt
              </button>
              <button 
                className={mode === 'decrypt' ? 'active decrypt' : ''} 
                onClick={() => { 
                  if (mode !== 'decrypt') {
                    if (pipelineResults.finalOutput) setInputData(pipelineResults.finalOutput);
                    setMode('decrypt'); 
                    setPipelineResults({ finalOutput: '', steps: [] }); 
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
              className="input-textarea"
              value={inputData} 
              onChange={(e) => { setInputData(e.target.value); setPipelineResults({ finalOutput: '', steps: [] }); }}
              placeholder="Enter text to encrypt or decrypt..."
            />
          </div>

          <div className="add-nodes relative-layer">
            <label className="section-label">Add cipher sequence</label>
            
            <div className="desktop-only mt-2">
              <div className="cipher-category-label">Core Ciphers</div>
              <div className="cipher-grid">
                <button onClick={() => addNode('CAESAR')}>+ Caesar</button>
                <button onClick={() => addNode('XOR')}>+ XOR</button>
                <button onClick={() => addNode('VIGENERE')}>+ Vigenère</button>
              </div>
              <div className="cipher-category-label mt-4">Structural Transforms</div>
              <div className="cipher-grid mt-2">
                <button onClick={() => addNode('BASE64')}>+ Base64</button>
                <button onClick={() => addNode('REVERSE')}>+ Reverse</button>
                <button onClick={() => addNode('RAIL_FENCE')}>+ Rail Fence</button>
              </div>
            </div>

            <div className="mobile-only dropdown-container">
              <button 
                className="native-select dropdown-toggle-btn"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                + Select a Cipher {showDropdown ? '▲' : '▼'}
              </button>
              
              {showDropdown && (
                <div className="custom-dropdown-menu">
                  <button onClick={() => { addNode('CAESAR'); setShowDropdown(false); }}>+ Caesar</button>
                  <button onClick={() => { addNode('XOR'); setShowDropdown(false); }}>+ XOR</button>
                  <button onClick={() => { addNode('VIGENERE'); setShowDropdown(false); }}>+ Vigenère</button>
                  <button onClick={() => { addNode('BASE64'); setShowDropdown(false); }}>+ Base64</button>
                  <button onClick={() => { addNode('REVERSE'); setShowDropdown(false); }}>+ Reverse</button>
                  <button onClick={() => { addNode('RAIL_FENCE'); setShowDropdown(false); }}>+ Rail Fence</button>
                </div>
              )}
            </div>
          </div>

          <div className="utility-section mt-auto hidden-mobile">
            <div className="button-group horizontal">
              <button onClick={exportConfig} className="utility-btn" disabled={isRunning}>Export JSON</button>
              <button onClick={importConfig} className="utility-btn" disabled={isRunning}>Import JSON</button>
            </div>
          </div>
        </div>

        <div className={`panel middle-panel pipeline-panel ${isRunning ? 'pipeline-running' : ''}`}>
          <div className="pipeline-header-flex">
            <h2 className="desktop-only">[2] Pipeline Execution</h2>
            <h2 className="mobile-only">Pipeline ({nodes.length})</h2>
            {mode === 'decrypt' && nodes.length > 0 && (
              <span className="reverse-badge">Reverse order</span>
            )}
          </div>
          
          {nodes.length === 0 && (
            <div className="canvas-empty-state">
              <div className="icon-wrapper">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="canvas-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h3 className="desktop-only text-canvas">Pipeline Canvas is Empty</h3>
              <h3 className="mobile-only text-canvas">Empty</h3>
              <p>Select a cipher on the left to begin stacking your sequence.</p>
            </div>
          )}
          
          <div className="pipeline-stack">
            {displayNodes.map((node, index) => {
              const stepResult = pipelineResults.steps.find(s => s.id === node.id);
              const isActive = activeStep === node.id;
              
              return (
                <div key={node.id} id={`node-card-${node.id}`} className="node-wrapper z-10 relative">
                  <div className={`node-card ${isActive ? 'active-glow' : ''}`}>
                    <div className="node-step-tag">Step {index + 1}</div>
                    <div className="node-header">
                      <h3>{node.type.replace('_', ' ')}</h3>
                      <div className="node-actions relative z-20">
                        <button onClick={() => moveNode(node.realIdx, -1)} disabled={node.realIdx === 0 || isRunning}>↑</button>
                        <button onClick={() => moveNode(node.realIdx, 1)} disabled={node.realIdx === nodes.length - 1 || isRunning}>↓</button>
                        <button className="delete" onClick={() => removeNode(node.id)} disabled={isRunning}>✕</button>
                      </div>
                    </div>

                    <div className="node-config relative z-20">
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
                          <span className="io-muted">IN: </span>
                          <span className="io-value">{stepResult.input || ' '}</span>
                        </div>
                        <div className="io-line separator">↓</div>
                        <div className="io-line highlighted">
                          <span className="io-color">OUT: </span>
                          <span className="io-value primary-glow">{stepResult.output || ' '}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {index < displayNodes.length - 1 && (
                    <div className="pipeline-connector">
                      ↓
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="panel right-panel">
          <h2 className="desktop-only">[3] Control & Status</h2>
          
          <div className="execution-controls relative z-50">
            <button 
              className={`run-button ${isRunning ? 'spinning' : ''}`}
              onClick={handleRunAnimated}
              disabled={isRunning || Boolean(!inputData.trim() && !isRunning)}
            >
              {isRunning ? '▶ PROCESSING...' : '▶ EXECUTE'}
            </button>
            
            <div className="validation-box">
              {configurableCount >= 3 
                ? <div className="status-msg valid">✓ Pipeline configuration valid</div> 
                : <div className="status-msg invalid">Add at least {3 - configurableCount} configurable ciphers.</div>}
            </div>
          </div>
          
          <div className="final-output-container mt-4 relative z-20 flex-1 flex-col">
            <button 
              className="collapse-toggle mobile-only" 
              onClick={() => setOutputExpanded(!outputExpanded)}>
                FINAL OUTPUT {outputExpanded ? '▲' : '▼'}
            </button>
            <label className="section-label glow-label desktop-only">FINAL ENCRYPTED OUTPUT</label>
            
            <div className={`collapsible-content ${outputExpanded ? 'expanded' : ''} desktop-expanded flex-1-y`}>
              <textarea 
                value={pipelineResults.finalOutput} 
                readOnly
                className={`final-output fill-height ${pipelineResults.finalOutput ? 'has-data' : ''}`}
                placeholder="..."
                rows={8}
              />
              <button onClick={handleCopy} className="copy-button" disabled={!pipelineResults.finalOutput}>
                {copied ? '✓ COPIED!' : '📋 Copy'}
              </button>
            </div>
          </div>

          <div className="utility-section mt-auto mobile-only mobile-utilities">
            <div className="button-group horizontal">
              <button onClick={exportConfig} className="utility-btn" disabled={isRunning}>Export</button>
              <button onClick={importConfig} className="utility-btn" disabled={isRunning}>Import</button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default App;
