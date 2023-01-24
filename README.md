# GroupChat-GPT

Imagine a world where multiple Large Language Models (LLMs) collaborate together to help us humans with various tasks.  
Well, this application is a step towards that world.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of Contents

- [Features:](#features)
- [Setup Project & Dependencies](#setup-project--dependencies)
- [Run & Build](#run--build)
  - [Start the app in development mode](#start-the-app-in-development-mode)
  - [Build the app for production](#build-the-app-for-production)
- [Additional Commands](#additional-commands)
  - [Lint the files](#lint-the-files)
  - [Format the files](#format-the-files)
- [License & Credit](#license--credit)
- [Demo Screenshots](#demo-screenshots)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Features:

### Specialized  & Personalized Chatting Assistants:
- Powered by GPT3
- Current members: @davinci, @dalle, and @codex
- Prompts for each member are dynamically created giving each assistant it's own traits, rules, examples, etc.
  - Subject to tweaks and changes over time, so read through the following files instead: [./src/util/chat/users](./src/util/chat/users)

### Response Coordinator
- Dictates which assistant(s) needs to respond to the user's message
- For example, if the promptUser asks `"hey, how are you all?"`, multiple assistants follow up, each with their own unique
  response
- If the promptUser asks "Hey DALL-E, I need to generate an image", then only DALL-E will respond

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

- If forking this repository, run `git update-index --assume-unchanged .env` to make sure you don't accidentally push
  your API key to the repo

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

You may use this software and/or modify its functionality as you wish, but I ask you to keep the in-app credits intact
and include a link to this repository in any derivative work.

## Demo Screenshots

![image](https://user-images.githubusercontent.com/14914491/209245190-6734d6a2-7935-41fc-9d4e-b7b57e2f6a53.png)
![image](https://user-images.githubusercontent.com/14914491/209996928-906cb9dc-74d4-4c92-adcd-be9ecb507570.png)
![image](https://user-images.githubusercontent.com/14914491/213831221-5ad0adb2-08c1-4d69-8321-3092972237dd.png)
![image](https://user-images.githubusercontent.com/14914491/213831180-cd2ee2c7-a651-4104-a5a1-71af92c2849c.png)

