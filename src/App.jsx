import { useState, useEffect } from 'react';
import { applyCipher } from './lib/engine';
import './index.css';

function App() {
  const [nodes, setNodes] = useState([]);
  const [inputData, setInputData] = useState('Welcome to Vyrothon');
  const [mode, setMode] = useState('encrypt');
  const [autoRun, setAutoRun] = useState(false);
  const [validationState, setValidationState] = useState(null);

  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [pipelineResults, setPipelineResults] = useState({ finalOutput: '', steps: [] });
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  
  const [outputExpanded, setOutputExpanded] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    if (activeStep !== -1) {
      const el = document.getElementById(`node-card-${activeStep}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeStep]);

  const addNode = (type) => {
    let config = {};
    if (type === 'CAESAR') config = { shift: 3 };
    else if (type === 'VIGENERE') config = { keyword: 'secret' };
    else if (type === 'XOR') config = { key: 'secret' };
    else if (type === 'RAIL_FENCE') config = { rails: 3 };

    setNodes(prev => [...prev, {
      id: Date.now() + Math.random().toString(36).substring(2),
      type,
      config,
      isActive: true
    }]);
    setPipelineResults({ finalOutput: '', steps: [] });
  };

  const removeNode = (id) => {
    setNodes(nodes.filter(n => n.id !== id));
    setPipelineResults({ finalOutput: '', steps: [] });
  };

  const duplicateNode = (id) => {
    const nodeToCopy = nodes.find(n => n.id === id);
    if (!nodeToCopy) return;
    const index = nodes.findIndex(n => n.id === id);
    const newNodes = [...nodes];
    newNodes.splice(index + 1, 0, {
      ...nodeToCopy,
      id: Date.now() + Math.random().toString(36).substring(2)
    });
    setNodes(newNodes);
    setPipelineResults({ finalOutput: '', steps: [] });
  };

  const toggleNodeActive = (id) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, isActive: n.isActive === false ? true : false } : n));
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

  const configurableCount = nodes.filter(n => !['BASE64', 'REVERSE'].includes(n.type) && n.isActive !== false).length;
  const isInvalid = !inputData.trim() || configurableCount < 3;

  const displayNodes = mode === 'encrypt' 
    ? nodes.map((n, i) => ({ ...n, realIdx: i }))
    : [...nodes].map((n, i) => ({ ...n, realIdx: i })).reverse();

  const handleRun = async (animated = true) => {
    if (isInvalid) return;

    setIsRunning(true);
    setValidationState(null);
    if (animated) {
      setPipelineResults({ finalOutput: '', steps: [] });
      setOutputExpanded(true);
    }
    
    let currentState = inputData;
    let accumulatedSteps = [];
    const isDecrypt = mode === 'decrypt';
    const activeDisplayNodes = displayNodes.filter(n => n.isActive !== false);

    for (let i = 0; i < activeDisplayNodes.length; i++) {
      if (animated) {
        setActiveStep(activeDisplayNodes[i].id); 
        await new Promise(r => setTimeout(r, 600)); 
      }
      
      const node = activeDisplayNodes[i];
      const output = applyCipher(node.type, currentState, node.config, isDecrypt);
      
      accumulatedSteps.push({
        id: node.id,
        nodeType: node.type,
        config: node.config,
        input: currentState,
        output: output
      });
      
      if (animated) setPipelineResults({ finalOutput: '', steps: [...accumulatedSteps] });
      currentState = output;
    }
    
    if (animated) {
      await new Promise(r => setTimeout(r, 300)); 
      setActiveStep(-1);
    }
    
    setPipelineResults({ finalOutput: currentState, steps: accumulatedSteps });
    setIsRunning(false);

    if (mode === 'encrypt' && activeDisplayNodes.length > 0) {
      const reversePath = [...activeDisplayNodes].reverse();
      let reverseState = currentState;
      for (const node of reversePath) {
        reverseState = applyCipher(node.type, reverseState, node.config, true);
      }
      setValidationState(reverseState === inputData ? 'success' : 'failure');
    }
  };

  useEffect(() => {
    if (autoRun && !isInvalid && !isRunning) {
      const debounce = setTimeout(() => handleRun(false), 300);
      return () => clearTimeout(debounce);
    }
  }, [nodes, inputData, autoRun, mode]);

  const handleCopy = () => {
    if (pipelineResults.finalOutput) {
      navigator.clipboard.writeText(pipelineResults.finalOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const exportConfig = () => {
    const exportFormat = {
      version: 1,
      pipeline: nodes.map(n => ({
        type: n.type.toLowerCase(),
        ...n.config
      }))
    };
    navigator.clipboard.writeText(JSON.stringify(exportFormat, null, 2));
    showToast('Pipeline exported to clipboard!');
  };

  const importConfig = () => {
    setImportText('');
    setImportError('');
    setShowImportModal(true);
  };

  return (
    <div className="app-container">
      {toastMsg && <div className="global-toast">{toastMsg}</div>}

      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Import Pipeline</h3>
            <textarea 
              autoFocus
              value={importText} 
              onChange={e => { setImportText(e.target.value); setImportError(''); }}
              placeholder="Paste your JSON array here..."
              className="modal-textarea"
            />
            {importError && <div className="modal-error">{importError}</div>}
            <div className="modal-actions">
              <button className="utility-btn" onClick={() => setShowImportModal(false)}>Cancel</button>
              <button 
                className="primary-btn" 
                onClick={() => {
                  try {
                    const parsed = JSON.parse(importText);
                    const pipelineData = parsed.version === 1 ? parsed.pipeline : (Array.isArray(parsed) ? parsed : null);
                    
                    if (pipelineData && Array.isArray(pipelineData)) {
                      const reconstructedNodes = pipelineData.map(item => {
                        const { type, config: oldConfig, id: oldId, isActive, ...rest } = item;
                        return {
                          id: Date.now() + Math.random().toString(36).substring(2),
                          type: String(type).toUpperCase(),
                          config: oldConfig || rest,
                          isActive: true
                        };
                      });
                      
                      setNodes(reconstructedNodes);
                      setPipelineResults({ finalOutput: '', steps: [] });
                      setShowImportModal(false);
                      setImportText('');
                      showToast('Pipeline imported successfully!');
                    } else {
                      setImportError('Invalid format. Missing pipeline array.');
                    }
                  } catch {
                    setImportError('Invalid JSON format.');
                  }
                }}
                disabled={!importText.trim()}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
      
      <header className="header">
        <h1>CipherStack</h1>
        <p className="subtitle">Node-Based Cascade Encryption</p>
      </header>

      <div className="main-content">
        <div className="panel left-panel">
          <div className="config-section">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <label className="section-label">Mode</label>
              <label style={{display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', cursor: 'pointer', color: autoRun ? '#10b981' : '#64748b', fontWeight: 600}}>
                <input type="checkbox" checked={autoRun} onChange={(e) => setAutoRun(e.target.checked)} style={{cursor: 'pointer'}}/> Auto-Run
              </label>
            </div>
            <div className="mode-toggle">
              <button 
                className={mode === 'encrypt' ? 'active encrypt' : ''} 
                onClick={() => { 
                  if (mode !== 'encrypt') {
                    if (pipelineResults.finalOutput) setInputData(pipelineResults.finalOutput);
                    setMode('encrypt'); 
                    setPipelineResults({ finalOutput: '', steps: [] }); 
                    setValidationState(null);
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
                    setValidationState(null);
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
              onChange={(e) => { setInputData(e.target.value); setPipelineResults({ finalOutput: '', steps: [] }); setValidationState(null); }}
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
              const isNodeDisabled = node.isActive === false;
              
              return (
                <div key={node.id} id={`node-card-${node.id}`} className="node-wrapper z-10 relative">
                  <div className={`node-card ${isActive ? 'active-glow' : ''}`} style={{ opacity: isNodeDisabled ? 0.4 : 1, filter: isNodeDisabled ? 'grayscale(1)' : 'none' }}>
                    <div className="node-step-tag" style={{ background: isNodeDisabled ? '#475569' : '' }}>
                      {isNodeDisabled ? 'SKIPPED' : `Step ${index + 1}`}
                    </div>
                    <div className="node-header">
                      <h3>{node.type.replace('_', ' ')}</h3>
                      <div className="node-actions relative z-20">
                        <button onClick={() => toggleNodeActive(node.id)} disabled={isRunning} title={isNodeDisabled ? "Enable Node" : "Disable Node"}>
                          {isNodeDisabled ? '⏻' : '⏼'}
                        </button>
                        <button onClick={() => duplicateNode(node.id)} disabled={isRunning} title="Duplicate Node">⧉</button>
                        <button onClick={() => moveNode(node.realIdx, -1)} disabled={node.realIdx === 0 || isRunning}>↑</button>
                        <button onClick={() => moveNode(node.realIdx, 1)} disabled={node.realIdx === nodes.length - 1 || isRunning}>↓</button>
                        <button className="delete" onClick={() => removeNode(node.id)} disabled={isRunning}>✕</button>
                      </div>
                    </div>

                    <div className="node-config relative z-20">
                      {node.type === 'CAESAR' && (
                        <label>
                          Shift
                          <input type="number" value={node.config.shift} onChange={(e) => updateConfig(node.id, 'shift', e.target.value)} disabled={isRunning || isNodeDisabled} />
                        </label>
                      )}
                      {node.type === 'XOR' && (
                        <label>
                          Key
                          <input type="text" value={node.config.key} onChange={(e) => updateConfig(node.id, 'key', e.target.value)} disabled={isRunning || isNodeDisabled}/>
                        </label>
                      )}
                      {node.type === 'VIGENERE' && (
                        <label>
                          Keyword
                          <input type="text" value={node.config.keyword} onChange={(e) => updateConfig(node.id, 'keyword', e.target.value)} disabled={isRunning || isNodeDisabled}/>
                        </label>
                      )}
                      {node.type === 'RAIL_FENCE' && (
                        <label>
                          Rails
                          <input type="number" min="2" value={node.config.rails} onChange={(e) => updateConfig(node.id, 'rails', e.target.value)} disabled={isRunning || isNodeDisabled}/>
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
                    <div className="pipeline-connector" style={{ opacity: isNodeDisabled ? 0.4 : 1 }}>
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
              onClick={() => handleRun(true)}
              disabled={isRunning || Boolean(!inputData.trim() && !isRunning)}
            >
              {isRunning ? '▶ PROCESSING...' : '▶ EXECUTE'}
            </button>
            
            <div className="validation-box">
              {configurableCount >= 3 
                ? <div className="status-msg valid">✓ Pipeline configuration valid</div> 
                : <div className="status-msg invalid">Add at least {3 - configurableCount} configurable ciphers.</div>}
            </div>
            
            {validationState === 'success' && (
              <div className="status-msg valid" style={{marginTop: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981'}}>
                🛡️ Round-trip validation passed!
              </div>
            )}
            {validationState === 'failure' && (
              <div className="status-msg invalid" style={{marginTop: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444'}}>
                ⚠️ Round-trip loss detected.
              </div>
            )}
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
