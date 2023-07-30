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
 * @param {string} sentence
 * @returns
 */
const doAskGPT = async (sentence) => {
  if (sentence === undefined) {
    // User canceled the input
    vscode.window.showInformationMessage("You canceled the input.");
    return;
  }

  const chatCompletion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: sentence }],
  });
  const aimsg = chatCompletion.data.choices[0].message;

  const activeTextEditor = vscode.window.activeTextEditor;
  if (!activeTextEditor) {
    return;
  }

  const cursorPosition = activeTextEditor.selection.active;
  const edit = new vscode.TextEdit(
    new vscode.Range(cursorPosition, cursorPosition),
    aimsg.content
  );

  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.set(activeTextEditor.document.uri, [edit]);
  vscode.workspace.applyEdit(workspaceEdit);
};

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
          await doAskGPT(sentence);

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
        prompt: "Generate Code in Programming Language ...",
        placeHolder: "e.g. Python to create a Line Chart",
      });

      return vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification, // Show the progress in the notification area
          title: loadingTitle,
        },
        async (progress) => {
          // Start the long-running task
          sentence = `Generate Code in Programming Language ${sentence}. Only Output the code as plain text. Nothing else.`;
          await doAskGPT(sentence);

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
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
