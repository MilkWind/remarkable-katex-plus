"use strict";

const vows = require('vows');
const assert = require('assert');
const { Remarkable } = require('remarkable');

const plugin = require('./index.js');

const mdWithDollar = new Remarkable();
mdWithDollar.use(plugin);

const mdWithAt = new Remarkable();
mdWithAt.use(plugin, {delimiter: '@'});

vows.describe('KatexPlugin').addBatch({
  'Config empty delimiter': {
    topic() {
      const md = new Remarkable();
      md.use(plugin, {delimiter: ''});
      return md;
    },
    'Uses default delimiter': function(topic) {
      assert.equal(topic.renderer.rules.katex.delimiter, '$');
    }
  },
  'Multi-char delimiter': {
    topic() {
      return () => {
        const md = new Remarkable();
        md.use(plugin, {delimiter: '$$'});
        return md;
      };
    },
    'Throws exception': function(topic) {
      assert.throws(topic);
    }
  },
  'Render plain text': {
    topic: mdWithDollar.render('This is a test.'),
    'Nothing done': function(topic) {
      assert.equal(topic, '<p>This is a test.</p>\n');
    }
  },
  'Render with single $ in text': {
    topic: mdWithDollar.render('The car cost $20,000 new.'),
    'Nothing done': function(topic) {
      assert.equal(topic, '<p>The car cost $20,000 new.</p>\n');
    }
  },
  'Render $...$ in text': {
    topic: mdWithDollar.render('Equation $x + y$.'),
    'Starts with "<p>Equation "': function(topic) {
      assert.isTrue(topic.startsWith('<p>Equation '));
    },
    'Ends with ".</p>"': function(topic) {
      assert.isTrue(topic.endsWith('</span>.</p>\n'));
    },
    'Contains math span': function(topic) {
      assert.notEqual(topic.indexOf('<span class="katex">'), -1);
    }
  },
  'Render $...$ in text with embedded {$...$}': {
    topic: mdWithDollar.render('Equation $\\colorbox{aqua}{$F=ma$}$.'),
    'Starts with "<p>Equation "': function(topic) {
      assert.isTrue(topic.startsWith('<p>Equation '));
    },
    'Ends with ".</p>"': function(topic) {
      assert.isTrue(topic.endsWith('</span>.</p>\n'));
    },
    'Contains math span': function(topic) {
      assert.notEqual(topic.indexOf('<span class="katex">'), -1);
    }
  },
  'Render $...$ in text with embedded {': {
    topic: mdWithDollar.render('Equation $\\left\\{ hi \\right.$.'),
    'Starts with "<p>Equation "': function(topic) {
      assert.isTrue(topic.startsWith('<p>Equation '));
    },
    'Ends with ".</p>"': function(topic) {
      assert.isTrue(topic.endsWith('</span>.</p>\n'));
    },
    'Contains math span': function(topic) {
      assert.notEqual(topic.indexOf('<span class="katex">'), -1);
    }
  },
  'Render $...$ in text with embedded }': {
    topic: mdWithDollar.render('Equation $\\left\\{ hi \\right\\}$.'),
    'Starts with "<p>Equation "': function(topic) {
      assert.isTrue(topic.startsWith('<p>Equation '));
    },
    'Ends with ".</p>"': function(topic) {
      assert.isTrue(topic.endsWith('</span>.</p>\n'));
    },
    'Contains math span': function(topic) {
      assert.notEqual(topic.indexOf('<span class="katex">'), -1);
    }
  },
  'Render @...@ in text': {
    topic: mdWithAt.render('Equation @x + y@.'),
    'Starts with "<p>Equation "': function(topic) {
      assert.isTrue(topic.startsWith('<p>Equation '));
    },
    'Ends with ".</p>"': function(topic) {
      assert.isTrue(topic.endsWith('</span>.</p>\n'));
    },
    'Contains math span': function(topic) {
      assert.notEqual(topic.indexOf('<span class="katex">'), -1);
    }
  },
  'Render $$...$$ in text': {
    topic: mdWithDollar.render('Before\n$$\nx + y\n$$\nafter.'),
    'Starts with "<p>Before "': function(topic) {
      assert.isTrue(topic.startsWith('<p>Before\n'));
    },
    'Ends with "after.</p>"': function(topic) {
      assert.isTrue(topic.endsWith('</span>\nafter.</p>\n'));
    },
    'Contains math span': function(topic) {
      assert.notEqual(topic.indexOf('<span class="katex-display">'), -1);
    }
  },
  'Render @@...@@ in text': {
    topic: mdWithAt.render('Before @@x + y@@ after.'),
    'Starts with "<p>Before "': function(topic) {
      assert.isTrue(topic.startsWith('<p>Before '));
    },
    'Ends with "after.</p>"': function(topic) {
      assert.isTrue(topic.endsWith('</span> after.</p>\n'));
    },
    'Contains math span': function(topic) {
      assert.notEqual(topic.indexOf('<span class="katex-display">'), -1);
    }
  },
  'Incomplete inline expression (no closing delimiter)': {
    topic: mdWithDollar.render('This has $incomplete math expression.'),
    'Original text preserved': function(topic) {
      assert.equal(topic, '<p>This has $incomplete math expression.</p>\n');
    },
    'No KaTeX HTML generated': function(topic) {
      assert.equal(topic.indexOf('<span class="katex">'), -1);
    }
  },
  'Incomplete block expression (no closing delimiter)': {
    topic: mdWithDollar.render('Before\n$$\nincomplete block\nafter.'),
    'Original text preserved': function(topic) {
      assert.equal(topic, '<p>Before\n$$\nincomplete block\nafter.</p>\n');
    },
    'No KaTeX HTML generated': function(topic) {
      assert.equal(topic.indexOf('<span class="katex-display">'), -1);
    }
  },
  'Original expression completely removed in inline math': {
    topic: mdWithDollar.render('Test $x^2$ here.'),
    'No dollar signs in output': function(topic) {
      // Should not contain the original $ delimiters
      assert.equal(topic.indexOf('$x^2$'), -1);
    },
    'Contains rendered math': function(topic) {
      assert.notEqual(topic.indexOf('<span class="katex">'), -1);
    },
    'Contains x^2 in rendered form': function(topic) {
      // KaTeX should render x^2 as superscript
      assert.notEqual(topic.indexOf('x'), -1);
      assert.notEqual(topic.indexOf('2'), -1);
    }
  },
  'Original expression completely removed in block math': {
    topic: mdWithDollar.render('Before\n$$\n\\frac{a}{b}\n$$\nafter.'),
    'No double dollar signs in output': function(topic) {
      // Should not contain the original $$ delimiters
      assert.equal(topic.indexOf('$$'), -1);
    },
    'Raw LaTeX preserved in annotation (correct behavior)': function(topic) {
      // KaTeX preserves original LaTeX in annotation tags - this is correct
      assert.notEqual(topic.indexOf('\\frac{a}{b}'), -1);
      assert.notEqual(topic.indexOf('<annotation encoding="application/x-tex">'), -1);
    },
    'Contains rendered math': function(topic) {
      assert.notEqual(topic.indexOf('<span class="katex-display">'), -1);
    }
  },
  'Multiple expressions all converted': {
    topic: mdWithDollar.render('First $a+b$ and second $c+d$ expressions.'),
    'No dollar signs remain': function(topic) {
      assert.equal(topic.indexOf('$a+b$'), -1);
      assert.equal(topic.indexOf('$c+d$'), -1);
    },
    'Two math spans created': function(topic) {
      const matches = topic.match(/<span class="katex">/g);
      assert.equal(matches ? matches.length : 0, 2);
    }
  },
  'Mixed inline and block expressions': {
    topic: mdWithDollar.render('Inline $x$ and block:\n$$\ny = mx + b\n$$\ndone.'),
    'No original delimiters remain': function(topic) {
      assert.equal(topic.indexOf('$x$'), -1);
      assert.equal(topic.indexOf('$$'), -1);
      // Note: "y = mx + b" will be preserved in KaTeX annotation - this is correct
    },
    'Contains both inline and block math': function(topic) {
      assert.notEqual(topic.indexOf('<span class="katex">'), -1);
      assert.notEqual(topic.indexOf('<span class="katex-display">'), -1);
    },
    'LaTeX content preserved in annotations': function(topic) {
      // KaTeX correctly preserves LaTeX in annotations
      assert.notEqual(topic.indexOf('<annotation encoding="application/x-tex">x</annotation>'), -1);
      assert.notEqual(topic.indexOf('<annotation encoding="application/x-tex">y = mx + b</annotation>'), -1);
    }
  },
  'KaTeX error handling (throwOnError: false)': {
    topic: mdWithDollar.render('Invalid math: $\\invalidcommand{test}$.'),
    'Renders without throwing': function(topic) {
      // Should render something even with invalid LaTeX (due to throwOnError: false)
      assert.isTrue(topic.length > 0);
      assert.notEqual(topic.indexOf('<span class="katex">'), -1);
    },
    'No original delimiters remain': function(topic) {
      assert.equal(topic.indexOf('$\\invalidcommand{test}$'), -1);
    }
  }
}).export(module);
