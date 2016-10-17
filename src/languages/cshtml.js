/*
Language: cshtml
Author: kobake <pg.koba@gmail.com>
Category: common, template
*/

function(hljs) {
  // ---------------------------------------- //
  // XML
  // ---------------------------------------- //
  var XML_IDENT_RE = '[A-Za-z0-9\\._:-]+';
  var TAG_INTERNALS = {
    endsWithParent: true,
    illegal: /</,
    relevance: 0,
    contains: [
      {
        className: 'attr',
        begin: XML_IDENT_RE,
        relevance: 0
      },
      {
        begin: /=\s*/,
        relevance: 0,
        contains: [
          {
            className: 'string',
            endsParent: true,
            variants: [
              {begin: /"/, end: /"/},
              {begin: /'/, end: /'/},
              {begin: /[^\s"'=<>`]+/}
            ]
          }
        ]
      }
    ]
  };

  function recursiveParen(begin, end) {
    var
    contains = [{begin: begin, end: end}];
    contains[0].contains = contains;
    return contains;
  }
  function createBlock(def) {
    return {
      begin: def.begin, end: def.end,
      className: def.className,
      endsParent: def.endsParent,
      returnBegin: true,
      contains: [
        {
          begin: def.begin,
          className: def.beginClassName,
        },
        {
          begin: def.end,
          className: def.endClassName,
          endsParent: true,
        },
        {
          end: def.end,
          returnEnd: true,
          contains: def.contains
        }
      ]
    };
  }
  // ---------------------------------------- //
  // cshtml
  // ---------------------------------------- //
  return {
    case_insensitive: true,
    contains: [
      // XML部
      {
        className: 'meta',
        begin: '<!DOCTYPE', end: '>',
        relevance: 10,
        contains: [{begin: '\\[', end: '\\]'}]
      },
      hljs.COMMENT(
        '<!--',
        '-->',
        {
          relevance: 10
        }
      ),
      {
        begin: '<\\!\\[CDATA\\[', end: '\\]\\]>',
        relevance: 10
      },
      {
        className: 'tag',
        /*
        The lookahead pattern (?=...) ensures that 'begin' only matches
        '<style' as a single word, followed by a whitespace or an
        ending braket. The '$' is needed for the lexeme to be recognized
        by hljs.subMode() that tests lexemes outside the stream.
        */
        begin: '<style(?=\\s|>|$)', end: '>',
        keywords: {name: 'style'},
        contains: [TAG_INTERNALS],
        starts: {
          end: '</style>', returnEnd: true,
          subLanguage: ['css', 'xml']
        }
      },
      {
        className: 'tag',
        // See the comment in the <style tag about the lookahead pattern
        begin: '<script(?=\\s|>|$)', end: '>',
        keywords: {name: 'script'},
        contains: [TAG_INTERNALS],
        starts: {
          end: '\<\/script\>', returnEnd: true,
          subLanguage: ['actionscript', 'javascript', 'handlebars', 'xml']
        }
      },
      {
        className: 'tag',
        begin: '</?', end: '/?>',
        contains: [
          {
            className: 'name', begin: /[^\/><\s]+/, relevance: 0
          },
          TAG_INTERNALS
        ]
      },

      // C# 埋め込み部 @{ ... }
      {
        className: 'inline-cs',
        begin: '@{',
        starts: {
          end: '}}', returnEnd: true,
          subLanguage: 'cs'
        }
      },
      {
        className: 'inline-cs',
        begin: '}}'
      },

      // C# ワンライナー埋め込み部 @Html.Hoge(aaa, aaaa)
      {
        className: 'inline-cs',
        begin: '@model '
      },
      {
        className: 'inline-cs',
        begin: '@',
        starts: {
          end: '}}',
          returnEnd: true,
          endCallback: function(value, index){
            var str = value;
            var re = /\([^()]*\)/;
            var output = [];
            var match, parts, last;

            str = str.substring(index);
            while (match = re.exec(str)) {
              parts = match[0].split("\uFFFF");
              if (parts.length < 2) {
                last = output.push(match[0]) - 1;
              } else {
                output[last] = parts[0] + output[last] + parts[1];
              }
              str = str.replace(re, new Array(match[0].length + 1).join("X"));
            }
            var m = str.match(/^[A-Za-z0-9\.]+/)
            if(m){
              var ret = {};
              ret[0] = "}}";
              ret.index = index + m[0].length;
              return ret;
            }
            else{
              return null;
            }
          },
          subLanguage: 'cs'
        }
      },
      
      // cshtml コメント {* ... *}
      hljs.COMMENT('{\\*', '\\*}') // C_BLOCK_COMMENT_MODE の真似
    ]
  };
}
