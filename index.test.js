"use strict";

const vows = require('vows');
const assert = require('assert');
const { Remarkable } = require('remarkable');

const plugin = require('./index.js');

const md = new Remarkable();
md.use(plugin);

vows.describe('MermaidPlugin').addBatch({
  'Render simple Mermaid diagram': {
    topic: md.render('```mermaid\ngraph TD\n    A-->B\n```'),
    'Contains mermaid div': function(topic) {
      assert.notEqual(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Contains diagram content': function(topic) {
      assert.notEqual(topic.indexOf('graph TD'), -1);
      assert.notEqual(topic.indexOf('A--&gt;B'), -1);
    },
    'Has unique id': function(topic) {
      assert.notEqual(topic.indexOf('id="mermaid-'), -1);
    }
  },
  'Render Mermaid flowchart': {
    topic: md.render('```mermaid\nflowchart LR\n    Start --> End\n```'),
    'Contains mermaid div': function(topic) {
      assert.notEqual(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Contains flowchart content': function(topic) {
      assert.notEqual(topic.indexOf('flowchart LR'), -1);
      assert.notEqual(topic.indexOf('Start --&gt; End'), -1);
    }
  },
  'Render Mermaid sequence diagram': {
    topic: md.render('```mermaid\nsequenceDiagram\n    Alice->>Bob: Hello\n```'),
    'Contains mermaid div': function(topic) {
      assert.notEqual(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Contains sequence diagram content': function(topic) {
      assert.notEqual(topic.indexOf('sequenceDiagram'), -1);
      assert.notEqual(topic.indexOf('Alice-&gt;&gt;Bob: Hello'), -1);
    }
  },
  'Ignore non-mermaid code blocks': {
    topic: md.render('```javascript\nconst x = 1;\n```'),
    'No mermaid div': function(topic) {
      assert.equal(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Regular code block': function(topic) {
      assert.notEqual(topic.indexOf('<pre><code class="language-javascript">'), -1);
    }
  },
  'Incomplete mermaid block (no closing)': {
    topic: md.render('```mermaid\ngraph TD\n    A-->B'),
    'No mermaid div': function(topic) {
      assert.equal(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Falls back to code block': function(topic) {
      assert.notEqual(topic.indexOf('<pre><code class="language-mermaid">'), -1);
    }
  },
  'Empty mermaid block': {
    topic: md.render('```mermaid\n```'),
    'Contains mermaid div': function(topic) {
      assert.notEqual(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Empty content': function(topic) {
      assert.notEqual(topic.indexOf('></div>'), -1);
    }
  },
  'Mermaid with custom options': {
    topic() {
      const md = new Remarkable();
      md.use(plugin, {
        mermaidCustomClass: 'custom-class',
        mermaidCustomStyle: 'border: 1px solid red;'
      });
      return md.render('```mermaid\ngraph TD\n    A-->B\n```');
    },
    'Contains custom class': function(topic) {
      assert.notEqual(topic.indexOf('class="mermaid custom-class"'), -1);
    },
    'Contains custom style': function(topic) {
      assert.notEqual(topic.indexOf('style="border: 1px solid red;"'), -1);
    }
  },
  'Mermaid with script inclusion': {
    topic() {
      const md = new Remarkable();
      md.use(plugin, {
        includeScript: true
      });
      return md.render('```mermaid\ngraph TD\n    A-->B\n```');
    },
    'Contains initialization script': function(topic) {
      assert.notEqual(topic.indexOf('<script>'), -1);
      assert.notEqual(topic.indexOf('mermaid.init'), -1);
    }
  },
  'HTML escaping in Mermaid': {
    topic: md.render('```mermaid\ngraph TD\n    A[\"Hello <world>\"]\n```'),
    'HTML characters escaped': function(topic) {
      assert.notEqual(topic.indexOf('&lt;world&gt;'), -1);
    },
    'No unescaped HTML': function(topic) {
      assert.equal(topic.indexOf('<world>'), -1);
    }
  },
  'Case insensitive mermaid': {
    topic: md.render('```MERMAID\ngraph TD\n    A-->B\n```'),
    'Contains mermaid div': function(topic) {
      assert.notEqual(topic.indexOf('<div class="mermaid"'), -1);
    },
    'Contains diagram content': function(topic) {
      assert.notEqual(topic.indexOf('graph TD'), -1);
    }
  }
}).export(module);
