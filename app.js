const express = require('express')
const { marked } = require('marked') // Import marked for Markdown processing
const app = express()
const PORT = 3000

// Set EJS as the templating engine
app.set('view engine', 'ejs')

// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public')) // Serve static files from the "public" folder

// Custom Markdown renderer using token-based approach
const renderer = {
  heading (token) {
    const text = token.text || 'Untitled'
    const level = token.depth || 1
    return `<h${level} class="display-${level}">${text}</h${level}>`
  },
  paragraph (token) {
    return `<p class="lead">${token.text}</p>`
  },
  list (token) {
    const type = token.ordered ? 'ol' : 'ul'
    const className = token.ordered ? 'list-group-numbered' : 'list-group'
    return `<${type} class="${className}">${token.body}</${type}>`
  },
  listitem (token) {
    return `<li class="list-group-item">${token.text}</li>`
  },
  table (token) {
    return `
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>${token.header}</thead>
          <tbody>${token.body}</tbody>
        </table>
      </div>`
  }
}

marked.use({ renderer })

// Home Route - renders the main page with a form
app.get('/', (req, res) => {
  res.render('index', { content: null })
})

// Markdown to HTML conversion route
app.post('/convert', (req, res) => {
  const markdownText = req.body.markdownText

  // Tokenize the Markdown input
  const tokens = marked.lexer(markdownText)
  console.log('-'.repeat(80))
  // console.log(JSON.stringify(tokens, null, 2)); // Log the tokens with indentation
  // Convert the tokens to HTML
  // const htmlContent = marked.parser(tokens)

  const output = parseToBootstrap(tokens)

  res.render('index', { content: output })
})

function parseToBootstrap (elements) {
  const outputHtml = elements.map(element => {
    switch (element.type) {
      case 'heading': {
        const headingClass = element.depth === 1 ? 'display-6' : `h${element.depth}`
        return `<h${element.depth} class="${headingClass}">${element.text}</h${element.depth}>`
      }
      case 'paragraph': {
        return `<p>${parseTokens(element.tokens)}</p>`
      }
      case 'list': {
        const listTag = element.ordered ? 'ol' : 'ul'
        const listClass = element.ordered ? 'list-group-numbered' : 'list-group'
        return `<${listTag} class="${listClass}">${element.items.map(item => `<li class="list-group-item">${parseTokens(item.tokens)}</li>`).join('')}</${listTag}>`
      }
      case 'hr':
        return '<hr class="my-4" />'

      case 'table':
        return `
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <thead>
                                <tr>${element.header.map(cell => `<th>${parseTokens(cell.tokens)}</th>`).join('')}</tr>
                            </thead>
                            <tbody>
                                ${element.rows.map(row => `<tr>${row.map(cell => `<td>${parseTokens(cell.tokens)}</td>`).join('')}</tr>`).join('')}
                            </tbody>
                        </table>
                    </div>`

      case 'space':
        return '<br />'

      default:
        return ''
    }
  }).join('')

  console.log('-----------------OUTPUT------------------------------')
  console.log(outputHtml)

  return `<div class="container bg-light p-3">${outputHtml}</div>`
}

function parseTokens (tokens) {
  return tokens.map(token => {
    switch (token.type) {
      case 'text':
        return token.text
      case 'strong':
        return `<span class="text-muted">${parseTokens(token.tokens)}</span>`
      case 'em':
        return `<em>${parseTokens(token.tokens)}</em>`
      case 'link':
        return `<a href="${token.href}" target="_blank">${parseTokens(token.tokens)}</a>`
      default:
        return token.raw || ''
    }
  }).join('')
}
// Example usage:
// const jsonData = [/* Your JSON data here */];
// console.log(parseToHtml(jsonData));

// Start the server
app.listen(PORT, () => {
  console.log(`Markstrap running at http://localhost:${PORT}`)
})
