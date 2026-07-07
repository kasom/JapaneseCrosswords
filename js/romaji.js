const ROMAJI_MAP = {
  'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
  'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
  'sa': 'さ', 'shi': 'し', 'si': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
  'ta': 'た', 'chi': 'ち', 'ti': 'ち', 'tsu': 'つ', 'tu': 'つ', 'te': 'て', 'to': 'と',
  'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
  'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'hu': 'ふ', 'he': 'へ', 'ho': 'ほ',
  'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
  'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
  'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
  'wa': 'わ', 'wo': 'を', 'n': 'ん',
  'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
  'za': 'ざ', 'ji': 'じ', 'zi': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
  'da': 'だ', 'di': 'ぢ', 'du': 'づ',
  'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
  'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
  'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
  'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
  'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
  'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
  'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
  'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
  'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
  'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
  'ja': 'じゃ', 'jya': 'じゃ', 'ju': 'じゅ', 'jyo': 'じょ',
  'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
  'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
  'ffa': 'ふぁ', 'ffi': 'ふぃ', 'ffe': 'ふぇ', 'ffo': 'ふぉ',
  'wi': 'ウィ', 'we': 'ウェ',
  '-': 'ー',
};

function romajiToKana(input) {
  if (!input) return '';
  let result = '';
  let i = 0;

  while (i < input.length) {
    let matched = false;
    for (let len = Math.min(4, input.length - i); len >= 1; len--) {
      const substr = input.substring(i, i + len);
      if (ROMAJI_MAP[substr]) {
        if (substr === 'n') {
          if (i === input.length - 1) {
            result += ROMAJI_MAP[substr];
            i += len;
            matched = true;
            break;
          }
          const nextChar = input[i + 1].toLowerCase();
          if (['a', 'e', 'i', 'o', 'u', 'y'].includes(nextChar)) {
            continue;
          }
        }
        result += ROMAJI_MAP[substr];
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (i < input.length - 1 && input[i] === input[i + 1] && !['a', 'e', 'i', 'o', 'u', 'n'].includes(input[i])) {
        result += 'っ';
        i++;
      } else {
        if (input[i] === 'n') {
          result += 'ん';
        }
        i++;
      }
    }
  }
  return result;
}

function getLongestRomajiMatch(buffer) {
  for (let len = Math.min(4, buffer.length); len >= 1; len--) {
    const substr = buffer.substring(0, len);
    if (ROMAJI_MAP[substr]) {
      if (substr === 'n') {
        if (buffer.length === 1) {
          continue;
        }
        const nextChar = buffer[1].toLowerCase();
        if (['a', 'e', 'i', 'o', 'u', 'y'].includes(nextChar)) {
          continue;
        }
      }
      return { matched: true, kana: ROMAJI_MAP[substr], length: len, remainder: buffer.substring(len) };
    }
  }
  
  if (buffer.length >= 2) {
    const first = buffer[0];
    const second = buffer[1];
    const vowels = ['a', 'e', 'i', 'o', 'u', 'n'];
    if (first === second && !vowels.includes(first)) {
      return { matched: true, kana: 'っ', length: 1, remainder: buffer.substring(1) };
    }
  }
  
  return { matched: false, kana: '', length: 0, remainder: buffer };
}
