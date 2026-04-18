export function caesar(text, shift, isDecrypt) {
  const parsedShift = parseInt(shift) || 0;
  const actualShift = isDecrypt ? -parsedShift : parsedShift;
  
  return text.split('').map(char => {
    const code = char.charCodeAt(0);
    if (code >= 97 && code <= 122) {
      return String.fromCharCode(((code - 97 + actualShift) % 26 + 26) % 26 + 97);
    }
    if (code >= 65 && code <= 90) {
      return String.fromCharCode(((code - 65 + actualShift) % 26 + 26) % 26 + 65);
    }
    return char;
  }).join('');
}

export function vigenere(text, keyword, isDecrypt) {
  if (!keyword) return text;
  
  const sanitizedKey = String(keyword).toLowerCase().replace(/[^a-z]/g, '');
  if (!sanitizedKey.length) return text;
  
  let keyIndex = 0;
  
  return text.split('').map(char => {
    const code = char.charCodeAt(0);
    let shiftAmount = sanitizedKey.charCodeAt(keyIndex % sanitizedKey.length) - 97;
    if (isDecrypt) shiftAmount = -shiftAmount;
    
    if (code >= 97 && code <= 122) {
      keyIndex++;
      return String.fromCharCode(((code - 97 + shiftAmount) % 26 + 26) % 26 + 97);
    }
    if (code >= 65 && code <= 90) {
      keyIndex++;
      return String.fromCharCode(((code - 65 + shiftAmount) % 26 + 26) % 26 + 65);
    }
    return char;
  }).join('');
}

export function xor(text, key, isDecrypt) {
  if (!key) return text;
  
  if (!isDecrypt) {
    let hexResult = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const keyCode = key.charCodeAt(i % key.length);
      hexResult += (charCode ^ keyCode).toString(16).padStart(2, '0');
    }
    return hexResult;
  }
  
  if (text.length % 2 !== 0) return text;
  
  let decodedString = '';
  for (let i = 0; i < text.length; i += 2) {
    const charCode = parseInt(text.substring(i, i + 2), 16);
    if (isNaN(charCode)) return text; 
    
    const keyCode = key.charCodeAt((i / 2) % key.length);
    decodedString += String.fromCharCode(charCode ^ keyCode);
  }
  return decodedString;
}

export function base64(text, isDecrypt) {
  try {
    if (!isDecrypt) {
      return btoa(unescape(encodeURIComponent(text)));
    }
    return decodeURIComponent(escape(atob(text)));
  } catch {
    return text;
  }
}

export function reverseStr(text) {
  return text.split('').reverse().join('');
}

export function railFence(text, rails, isDecrypt) {
  const depth = Math.max(2, parseInt(rails) || Math.floor(rails));
  if (depth >= text.length || depth < 2) return text;

  if (!isDecrypt) {
    const outline = Array.from({ length: depth }, () => []);
    let currentRail = 0;
    let direction = 1;

    for (const char of text) {
      outline[currentRail].push(char);
      currentRail += direction;
      if (currentRail === depth - 1 || currentRail === 0) direction = -direction;
    }
    return outline.flat().join('');
  }

  const structure = Array.from({ length: depth }, () => new Array(text.length).fill(null));
  let currentRail = 0;
  let direction = 1;
  
  for (let i = 0; i < text.length; i++) {
    structure[currentRail][i] = '*';
    currentRail += direction;
    if (currentRail === depth - 1 || currentRail === 0) direction = -direction;
  }
  
  let pointer = 0;
  for (let i = 0; i < depth; i++) {
    for (let j = 0; j < text.length; j++) {
      if (structure[i][j] === '*' && pointer < text.length) {
        structure[i][j] = text[pointer++];
      }
    }
  }
  
  let finalString = '';
  currentRail = 0;
  direction = 1;
  
  for (let i = 0; i < text.length; i++) {
    finalString += structure[currentRail][i];
    currentRail += direction;
    if (currentRail === depth - 1 || currentRail === 0) direction = -direction;
  }
  return finalString;
}
