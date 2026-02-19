const english = require('./english');
const tamil = require('./tamil');
const hindi = require('./hindi');
const telugu = require('./telugu');

/**
 * Returns the message constants for the given language.
 * Falls back to English for unknown languages.
 * @param {string} language - one of TAMIL, HINDI, TELUGU, ENGLISH
 */
function getMessages(language) {
  switch (language) {
    case 'TAMIL':
      return tamil;
    case 'HINDI':
      return hindi;
    case 'TELUGU':
      return telugu;
    case 'ENGLISH':
    default:
      return english;
  }
}

module.exports = { getMessages };
