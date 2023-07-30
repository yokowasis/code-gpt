/**
 *
 * @param {string} text
 * @returns
 */
function extractCode(text) {
  const arrText = text.split("```");
  if (arrText.length !== 3) {
    return text;
  } else {
    // Use regular expression to extract the code portion
    const codeRegex = /(\`\`\`.*\n)([\s\S]*)(\`\`\`)/;
    const match = text.match(codeRegex);

    // Extract the matched code block
    const code = match ? match[2].trim() : "";

    return code;
  }
}

// Example usage:
const inputText = `asdasd
some text

\`\`\`cpp
#include <iostream>
using namespace std;
\`\`\`

some explanation
`;

const extractedCode = extractCode(inputText);
console.log(extractedCode);
