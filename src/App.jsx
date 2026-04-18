import { useState, useMemo } from 'react';
import { runPipeline } from './lib/engine';
import './index.css';

function App() {
  const [nodes, setNodes] = useState([]);
  const [inputData, setInputData] = useState('Hello Hackathon');
  const [mode, setMode] = useState('encrypt');

  // Compute derived state
  const { finalOutput, steps } = useMemo(() => {
    return runPipeline(inputData, nodes, mode === 'decrypt');
  }, [inputData, nodes, mode]);

  const addNode = (type) => {
    let config = {};
    if (type === 'CAESAR') config = { shift: 3 };
    else if (type === 'VIGENERE') config = { keyword: 'secret' };
    else if (type === 'XOR') config = { key: 'secret' };
    else if (type === 'RAIL_FENCE') config = { rails: 3 };
    
    // Base64 and Reverse don't need configs

    const newNode = {
      id: crypto.randomUUID(),
      type,
      config
    };
    setNodes([...nodes, newNode]);
  };

  const removeNode = (id) => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  const moveNode = (index, direction) => {
    if (index + direction < 0 || index + direction >= nodes.length) return;
    const newNodes = [...nodes];
    const temp = newNodes[index];
    newNodes[index] = newNodes[index + direction];
    newNodes[index + direction] = temp;
    setNodes(newNodes);
  };

  const updateConfig = (id, key, value) => {
    setNodes(nodes.map(n => 
      n.id === id ? { ...n, config: { ...n.config, [key]: value } } : n
    ));
  };

  // The rules state at least 3 configurable ciphers are required.
  const configurableCount = nodes.filter(n => !['BASE64', 'REVERSE'].includes(n.type)).length;

  return (
    <div className="app-container">
      <header className="header">
        <h1>Cascade Encryption Builder</h1>
        <p className="subtitle">Visually construct and test cipher pipelines.</p>
      </header>

      <div className="main-content">
        <div className="panel left-panel">
          <h2>Input & Settings</h2>
          
          <div className="mode-toggle">
            <button 
              className={mode === 'encrypt' ? 'active' : ''} 
              onClick={() => setMode('encrypt')}
            >
              Encrypt
            </button>
            <button 
              className={mode === 'decrypt' ? 'active' : ''} 
              onClick={() => setMode('decrypt')}
            >
              Decrypt
            </button>
          </div>

          <label>Data Input:</label>
          <textarea 
            value={inputData} 
            onChange={(e) => setInputData(e.target.value)}
            placeholder="Enter text to encrypt/decrypt..."
            rows={4}
          />

          <div className="add-nodes">
            <h3>Add Cipher Layer</h3>
            <div className="button-group">
              <button onClick={() => addNode('CAESAR')}>+ Caesar Shift</button>
              <button onClick={() => addNode('XOR')}>+ XOR Cipher</button>
              <button onClick={() => addNode('VIGENERE')}>+ Vigenère</button>
              <button onClick={() => addNode('BASE64')} className="secondary">+ Base64 (Bonus)</button>
              <button onClick={() => addNode('REVERSE')} className="secondary">+ Reverse (Bonus)</button>
              <button onClick={() => addNode('RAIL_FENCE')} className="optional">+ Rail Fence (Optional)</button>
            </div>
          </div>
        </div>

        <div className="panel middle-panel">
          <h2>Execution Pipeline ({nodes.length} Elements)</h2>
          {nodes.length === 0 && (
            <div className="empty-state">Add nodes from the left panel to begin.</div>
          )}
          
          <div className="pipeline-stack">
            {nodes.map((node, index) => {
              const stepResult = steps.find(s => s.id === node.id);
              
              return (
                <div key={node.id} className="node-card">
                  <div className="node-header">
                    <h3>{node.type.replace('_', ' ')}</h3>
                    <div className="node-actions">
                      <button onClick={() => moveNode(index, -1)} disabled={index === 0}>↑</button>
                      <button onClick={() => moveNode(index, 1)} disabled={index === nodes.length - 1}>↓</button>
                      <button className="delete" onClick={() => removeNode(node.id)}>✕</button>
                    </div>
                  </div>

                  <div className="node-config">
                    {node.type === 'CAESAR' && (
                      <label>
                        Shift Integer:
                        <input 
                          type="number" 
                          value={node.config.shift} 
                          onChange={(e) => updateConfig(node.id, 'shift', e.target.value)}
                        />
                      </label>
                    )}
                    {node.type === 'XOR' && (
                      <label>
                        Secret Key:
                        <input 
                          type="text" 
                          value={node.config.key} 
                          onChange={(e) => updateConfig(node.id, 'key', e.target.value)}
                        />
                      </label>
                    )}
                    {node.type === 'VIGENERE' && (
                      <label>
                        Keyword:
                        <input 
                          type="text" 
                          value={node.config.keyword} 
                          onChange={(e) => updateConfig(node.id, 'keyword', e.target.value)}
                        />
                      </label>
                    )}
                    {node.type === 'RAIL_FENCE' && (
                      <label>
                        Number of Rails:
                        <input 
                          type="number" 
                          min="2"
                          value={node.config.rails} 
                          onChange={(e) => updateConfig(node.id, 'rails', e.target.value)}
                        />
                      </label>
                    )}
                    {['BASE64', 'REVERSE'].includes(node.type) && (
                      <div className="no-config">No configuration required.</div>
                    )}
                  </div>

                  <div className="node-io">
                    <div className="io-box">
                      <span className="io-label">IN:</span> {stepResult?.input || '-'}
                    </div>
                    <div className="io-arrow">⬇</div>
                    <div className="io-box out">
                      <span className="io-label">OUT:</span> {stepResult?.output || '-'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="panel right-panel">
          <h2>Final Output</h2>
          <textarea 
            value={finalOutput} 
            readOnly
            className="final-output"
            rows={5}
          />
          
          <div className="validation-box">
            {configurableCount >= 3 
              ? <div className="success-tag">✓ Min 3 configurable met ({configurableCount}/3)</div> 
              : <div className="warning-tag">⚠ Add {3 - configurableCount} more configurable node(s)</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
