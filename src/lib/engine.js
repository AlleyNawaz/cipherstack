import { caesar, vigenere, railFence, xor, base64, reverseStr } from './ciphers';

export function applyCipher(type, text, config, isDecrypt) {
  switch (type) {
    case 'CAESAR':
      return caesar(text, config.shift, isDecrypt);
    case 'VIGENERE':
      return vigenere(text, config.keyword, isDecrypt);
    case 'XOR':
      return xor(text, config.key, isDecrypt);
    case 'BASE64':
      return base64(text, isDecrypt);
    case 'REVERSE':
      return reverseStr(text);
    case 'RAIL_FENCE':
      return railFence(text, config.rails, isDecrypt);
    default:
      return text;
  }
}

export function runPipeline(text, nodes, isDecrypt) {
  let pipelineState = text || '';
  const historyList = [];
  const executionPath = isDecrypt ? [...nodes].reverse() : nodes;
  
  for (const node of executionPath) {
    const transformed = applyCipher(node.type, pipelineState, node.config, isDecrypt);
    historyList.push({
      id: node.id,
      nodeType: node.type,
      config: node.config,
      input: pipelineState,
      output: transformed
    });
    pipelineState = transformed;
  }
  
  return { finalOutput: pipelineState, steps: historyList };
}
