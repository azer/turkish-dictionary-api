var debug = require("debug")('api');
var circle = require("circle");
var scrape = require("scrape-url");
var strip = require("strip");
var memoize = require('memoize-with-leveldb')('./data-dictionary');
var query = memoize(pull, -1);
var url = 'http://www.tdk.gov.tr/index.php?option=com_gts&arama=gts';

module.exports = circle({
  '/:word': definitions
});

function definitions (reply, match) {
  query(match.params.word, reply);
}

function pull (word, callback) {
  debug('Pulling %s', word);

  scrape.post({ url: url, form: { kelime: word } }, '#hor-minimalist-a td', function (error, match) {
    if (error) return callback(error);
    if (match.length == 0) return callback(undefined, []);
    callback(undefined, match.map(parse));
  });
}

function parse (input) {
  var lines = input.html().replace(/^\s+\d+\.\s*/, '').split(/<br\s*\/?>/);
  var meaning = lines[0].split(/<\/?i>\s*/);
  var result = {};

  var type, definition;
  var example = strip(lines[1]);

  if (meaning.length == 3) {
    definition = meaning[2];
    type = meaning[1];
  } else {
    definition = meaning[meaning.length - 1];
  }

  example && (result.example = example);
  type && (result.type = type);
  result.definition = definition;

  return result;
}
