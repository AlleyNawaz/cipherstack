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
      return reverseStr(text); // Reverse is its own inverse!
    case 'RAIL_FENCE':
      return railFence(text, config.rails, isDecrypt);
    default:
      return text;
  }
}

export function runPipeline(text, nodes, isDecrypt) {
  let currentText = text || '';
  let steps = [];
  
  // Decryption runs backwards
  const executionPath = isDecrypt ? [...nodes].reverse() : nodes;
  
  for (const node of executionPath) {
    const output = applyCipher(node.type, currentText, node.config, isDecrypt);
    steps.push({
      id: node.id,
      nodeType: node.type,
      config: node.config,
      input: currentText,
      output: output
    });
    currentText = output;
  }
  
  return { finalOutput: currentText, steps };
}
