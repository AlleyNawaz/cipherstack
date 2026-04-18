export function caesar(text, shift, isDecrypt) {
  const parsedShift = parseInt(shift) || 0;
  const actualShift = isDecrypt ? -parsedShift : parsedShift;
  
  return text.split('').map(char => {
    const code = char.charCodeAt(0);
    // Lowercase
    if (code >= 97 && code <= 122) {
      return String.fromCharCode(((code - 97 + actualShift) % 26 + 26) % 26 + 97);
    }
    // Uppercase
    if (code >= 65 && code <= 90) {
      return String.fromCharCode(((code - 65 + actualShift) % 26 + 26) % 26 + 65);
    }
    return char;
  }).join('');
}

export function vigenere(text, keyword, isDecrypt) {
  if (!keyword) return text;
  keyword = String(keyword).toLowerCase().replace(/[^a-z]/g, '');
  if (!keyword.length) return text;
  
  let keyIndex = 0;
  return text.split('').map(char => {
    const code = char.charCodeAt(0);
    let shift = keyword.charCodeAt(keyIndex % keyword.length) - 97;
    if (isDecrypt) shift = -shift;
    
    if (code >= 97 && code <= 122) {
      keyIndex++;
      return String.fromCharCode(((code - 97 + shift) % 26 + 26) % 26 + 97);
    }
    if (code >= 65 && code <= 90) {
      keyIndex++;
      return String.fromCharCode(((code - 65 + shift) % 26 + 26) % 26 + 65);
    }
    return char;
  }).join('');
}

export function xor(text, key, isDecrypt) {
  if (!key) return text;
  
  if (!isDecrypt) {
    // Encrypt: Text -> Hex (to safely handle non-alphanumeric chars)
    let hexResult = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const keyCode = key.charCodeAt(i % key.length);
      const xored = charCode ^ keyCode;
      hexResult += xored.toString(16).padStart(2, '0');
    }
    return hexResult;
  } else {
    // Decrypt: Hex -> Text
    if (text.length % 2 !== 0) return text; // Handle invalid gracefully
    let strResult = '';
    for (let i = 0; i < text.length; i += 2) {
      const hexByte = text.substring(i, i + 2);
      const charCode = parseInt(hexByte, 16);
      if (isNaN(charCode)) return text; 
      
      const keyCode = key.charCodeAt((i / 2) % key.length);
      const xored = charCode ^ keyCode;
      strResult += String.fromCharCode(xored);
    }
    return strResult;
  }
}

export function base64(text, isDecrypt) {
  try {
    if (!isDecrypt) {
      // https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem
      return btoa(unescape(encodeURIComponent(text)));
    } else {
      return decodeURIComponent(escape(atob(text)));
    }
  } catch (e) {
    return text; // Gracefully fallback on invalid base64
  }
}

export function reverseStr(text) {
  // Self inverse! Reversing a reverse gives original.
  return text.split('').reverse().join('');
}

export function railFence(text, rails, isDecrypt) {
  let r = parseInt(rails) || Math.floor(rails);
  r = Math.max(2, r);
  if (r >= text.length || r < 2) return text;

  if (!isDecrypt) {
    let fence = Array.from({ length: r }, () => []);
    let rail = 0;
    let dir = 1;

    for (let char of text) {
      fence[rail].push(char);
      rail += dir;
      if (rail === r - 1 || rail === 0) dir = -dir;
    }
    return fence.flat().join('');
  } else {
    let fence = Array.from({ length: r }, () => new Array(text.length).fill(null));
    let rail = 0;
    let dir = 1;
    for (let i = 0; i < text.length; i++) {
        fence[rail][i] = '*';
        rail += dir;
        if (rail === r - 1 || rail === 0) dir = -dir;
    }
    
    let index = 0;
    for (let i = 0; i < r; i++) {
        for (let j = 0; j < text.length; j++) {
            if (fence[i][j] === '*' && index < text.length) {
                fence[i][j] = text[index++];
            }
        }
    }
    
    let result = '';
    rail = 0;
    dir = 1;
    for (let i = 0; i < text.length; i++) {
        result += fence[rail][i];
        rail += dir;
        if (rail === r - 1 || rail === 0) dir = -dir;
    }
    return result;
  }
}
