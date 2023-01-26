# GroupChat-GPT

Imagine a world where multiple Large Language Models (LLMs) collaborate together to help us humans with various tasks.  
Well, this application is a step towards that world.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of Contents

- [Features:](#features)
  - [Chat with Specialized & Personalized Assistants:](#chat-with-specialized--personalized-assistants)
  - [Response Coordinator](#response-coordinator)
  - [Generate Images](#generate-images)
  - [Contexts, Follow-ups, and Ignored Messages](#contexts-follow-ups-and-ignored-messages)
  - [Markdown Formatting](#markdown-formatting)
- [Setup Project & Dependencies](#setup-project--dependencies)
- [Run & Build](#run--build)
  - [Start the app in development mode](#start-the-app-in-development-mode)
  - [Build the app for production](#build-the-app-for-production)
- [Additional Commands](#additional-commands)
  - [Lint the files](#lint-the-files)
  - [Format the files](#format-the-files)
- [License & Credit](#license--credit)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Features:

### Chat with Specialized & Personalized Assistants:
- Powered by the *OpenAI GPT-3 API*
- Current members: `@davinci`, `@dalle`, and `@codex`
- Assistants are given their own **distinct personalities, behaviors, and capabilities** through dynamically-created generation prompts.
  - Subject to tweaks and changes over time, so read through the following files instead: [./src/util/chat/users](./src/util/chat/users)
  - Tip: if you want to see the final prompt text that was created for each assistant message, I am printing them as 'error' to the JS console, lol
  
![introductions](https://user-images.githubusercontent.com/14914491/214446651-dc36ffe6-709a-4838-b5b7-df14eb1af72e.png)

### Response Coordinator
- `@coordinator` is a special assistant who dictates who should respond to the user's message by tagging other assistants
- Tip: Directly tag an assistant (ex: `@davinci`) to only have them respond (this skips the coordinator)

![coordinator-all](https://user-images.githubusercontent.com/14914491/214447142-4d254aee-1ba6-4c95-b562-159137c7c0b9.png)

![coordinator-one](https://user-images.githubusercontent.com/14914491/214447271-36895aac-4361-431f-b35b-f0bb30c8a958.png)

### Generate Images
- `@gen_image` is an assistant helper that directly uses the ***OpenAI DALL·E 2 API***, which can generate images from text prompts.
- `@dalle` (the chatting assistant) can help you generate these text prompts to generate images as you'd like.
- Tip: you can also directly prompt the ***OpenAI DALL·E 2 API*** just like `@dalle` did (`<gen_image>A picture of a cat.<gen_image>`)

![dalle](https://user-images.githubusercontent.com/14914491/214467854-54d2b106-9e67-410b-846d-932510067157.png)

### Contexts, Follow-ups, and Ignored Messages
- Hover over a message to visualize the messages that were used to provide context
- Coordinator messages are ignored by default - they won't be used as generation context for other assistants because that would waste tokens
- You can manually ignore messages by clicking the 'eye' icon at the bottom-right of a message

![message-contexts](https://user-images.githubusercontent.com/14914491/214448848-2db88455-5063-49e7-8942-c66772228863.gif)

### Markdown Formatting
- The UI for the chat message bubbles supports Markdown formatting
![markdown](https://user-images.githubusercontent.com/14914491/214452561-dcaaa582-2340-47f8-8061-2dfd44d21d1b.png)

## Setup Project & Dependencies

Install Node.JS (version ^18 required) and Yarn:

```bash
nvm install 18
# Optional: set this version as default:
nvm alias default node
```

Install Yarn:

```bash
npm install -g yarn
```

Install the rest of the project dependencies

```bash
yarn install
```

**Important!!** - You will have to put your OpenAI API Key inside the `.env` file.

- If forking this repository, run `git update-index --assume-unchanged .env` to make sure you don't accidentally push your API key to the repo

## Run & Build

### Start the app in development mode

- hot-code reloading, error reporting, etc.

```bash
yarn start
```

### Build the app for production

```bash
yarn build
```

## Additional Commands

### Lint the files

```bash
yarn lint
```

### Format the files

```bash
yarn format
```

## License & Credit

You may use this software and/or modify its functionality as you wish, but I ask you to keep the in-app credits intact and include a link to this repository in any derivative work.

