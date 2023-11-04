// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const { Configuration, OpenAIApi } = require("openai");
const config = vscode.workspace.getConfiguration("codegpt");
const apiKey = config.get("openAIKey");

const configuration = new Configuration({
  apiKey: apiKey,
});
const openai = new OpenAIApi(configuration);

/**
 *
 * @param {string} prompt
 */
const promptAI = async (prompt) => {
  const chatCompletion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });
  const aimsg = chatCompletion.data.choices[0].message;
  return aimsg.content;
};

/**
 *
 * @param {string} sentence
 * @returns
 */
const doAskGPT = async (sentence, code = false, splitter = "```") => {
  if (sentence === undefined) {
    // User canceled the input
    vscode.window.showInformationMessage("You canceled the input.");
    return;
  }

  let content = await promptAI(sentence);

  if (code) {
    content = extractCode(content, splitter);
  } else {
    content = content;
  }

  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    return;
  }

  const cursorPosition = activeTextEditor.selection.active;
  const edit = new vscode.TextEdit(
    new vscode.Range(cursorPosition, cursorPosition),
    content
  );

  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.set(activeTextEditor.document.uri, [edit]);
  vscode.workspace.applyEdit(workspaceEdit);
};

/**
 *
 * @returns {string | undefined}
 */
function getCurrentLanguageId() {
  const activeTextEditor = vscode.window.activeTextEditor;

  if (activeTextEditor) {
    return activeTextEditor.document.languageId;
  }

  return undefined;
}

/**
 *
 * @param {string} data
 */
async function showOutputInNewTab(data, languageId = "markdown") {
  try {
    // Create a new untitled text document with the provided content
    const doc = await vscode.workspace.openTextDocument({
      content: data,
      language: languageId,
    });

    // Show the text document in a new tab and focus on it
    const editor = await vscode.window.showTextDocument(doc, {
      preview: false,
      viewColumn: vscode.ViewColumn.Active,
    });

    // Optionally, you can focus the editor and move the cursor
    editor.selection = new vscode.Selection(
      new vscode.Position(0, 0),
      new vscode.Position(0, 0)
    );
    editor.revealRange(new vscode.Range(0, 0, 0, 0));
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error showing output in new tab: ${error.message}`
    );
  }
}

function getSurroundingLines() {
  const activeTextEditor = vscode.window.activeTextEditor;

  if (activeTextEditor) {
    const cursorPosition = activeTextEditor.selection.active;
    const document = activeTextEditor.document;

    const lineBeforeCursor = Math.max(cursorPosition.line - 3, 0);
    const lineAfterCursor = Math.min(
      cursorPosition.line + 3,
      document.lineCount - 1
    );

    let surroundingText = [];
    for (let line = lineBeforeCursor; line <= lineAfterCursor; line++) {
      const lineText = document.lineAt(line).text;
      surroundingText.push(lineText);
    }

    // Add the text to insert to the middle of the array
    const insertAtIndex = Math.floor(surroundingText.length / 2);
    surroundingText.splice(
      insertAtIndex,
      0,
      "//-------generatedgptcode-------"
    );
    surroundingText.splice(
      insertAtIndex,
      0,
      "//-------generatedgptcode-------"
    );

    // Join the array into a single string
    const surroundingTextStr = surroundingText.join("\n");

    return surroundingTextStr;
  }

  return undefined;
}

/**
 *
 * @param {string} text
 * @param {string} splitter
 * @returns
 */
function extractCode(text, splitter) {
  const arrText = text.split(splitter);
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

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "code-gpt" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "code-gpt.helloWorld",
    function () {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from code-gpt!");
    }
  );

  let askGpt = vscode.commands.registerCommand(
    "code-gpt.askGpt",
    async function () {
      const loadingTitle = "Loading...";
      const sentence = await vscode.window.showInputBox({
        prompt: "Ask Anything",
        placeHolder: "Enter your question here...",
      });

      return vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification, // Show the progress in the notification area
          title: loadingTitle,
        },
        async (progress) => {
          // Start the long-running task
          const res = await promptAI(sentence);

          showOutputInNewTab(res);

          // Close the progress indicator
          progress.report({ increment: 100 });
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, 1000); // Wait 1 second to let the user see the completion of the progress bar
          });
        }
      );
    }
  );

  let testCode = vscode.commands.registerCommand(
    "code-gpt.testCode",
    async function () {
      const loadingTitle = "Loading...";

      let sentence = await vscode.window.showInputBox({
        prompt: "Generate Code for ...",
        placeHolder: "bubble sort",
      });

      if (!sentence) return;

      return vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification, // Show the progress in the notification area
          title: loadingTitle,
        },
        async (progress) => {
          // Start the long-running task
          const lines = getSurroundingLines();
          if (lines === undefined) {
            return;
          }

          sentence = `create a snippet in ${getCurrentLanguageId()} to ${sentence}. Write the code inside //-------generatedgptcode-------.
          
          \`\`\`
          ${lines}
          \`\`\`
          `;

          console.log(sentence);

          await doAskGPT(sentence, true, "//-------generatedgptcode-------");

          // Close the progress indicator
          progress.report({ increment: 100 });
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, 1000); // Wait 1 second to let the user see the completion of the progress bar
          });
        }
      );
    }
  );

  let askCode = vscode.commands.registerCommand(
    "code-gpt.askCode",
    async function () {
      const loadingTitle = "Loading...";
      let sentence = await vscode.window.showInputBox({
        prompt: "Generate Code for ...",
        placeHolder: "bubble sort",
      });
      if (!sentence) return;

      return vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification, // Show the progress in the notification area
          title: loadingTitle,
        },
        async (progress) => {
          // Start the long-running task
          sentence = `Generate Code for ${sentence} in ${getCurrentLanguageId()}. No explanation needed`;
          // console.log(sentence);

          await doAskGPT(sentence, true);

          // Close the progress indicator
          progress.report({ increment: 100 });
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, 1000); // Wait 1 second to let the user see the completion of the progress bar
          });
        }
      );
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(askGpt);
  context.subscriptions.push(askCode);
  context.subscriptions.push(testCode);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
