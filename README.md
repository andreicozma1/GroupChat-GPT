# GroupChat-GPT

Imagine a world where multiple Large Language Models (LLMs) collaborate together to help us humans with various tasks.  
Well, this application is a step towards that world.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Features:](#features)
- [Setup Project & Dependencies](#setup-project--dependencies)
- [Run & Build](#run--build)
  - [Start the app in development mode](#start-the-app-in-development-mode)
  - [Build the app for production](#build-the-app-for-production)
- [Additional Commands](#additional-commands)
  - [Lint the files](#lint-the-files)
  - [Format the files](#format-the-files)
- [License & Credit](#license--credit)
- [Demo Screenshots:](#demo-screenshots)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Features: 
- Specialized Chat-bot Assistants:
  - Powered by GPT-3
  - Current members are: Davinci, DALL-E, and Codex.
  - Prompts for each AI assistant are dynamically created, including various characteristics and rules (outlined below)
- Response Coordinator
    - Dictates which assistant(s) needs to respond to the user's message.
    - For example, if the user asks "hey, how are you all?", multiple assistants may respond, each with their own unique response.
    - If the user asks "Hey DALL-E, I need to generate an image", then only DALL-E will respond.
- Assistant Traits, Characteristics, and Rules
  - Each assistant has its own personality traits, strengths, weaknesses, specialties, rules, etc.
  - Shared by all assistants:
    - Personality: enthusiastic, clever, very friendly
  - Davinci:
    - Personality: helpful (+ defaults)
    - Strengths: making conversation, answering questions, providing general information
  - DALL-E:
    - Personality: Artistic, Creative, Visionary (+ defaults)
    - Strengths: making art, providing creative ideas
    - Abilities: generating images from text descriptions (implemented)
  - Codex:
    - Personality: analytical, logical, rational (+ defaults)
    - Strengths: programming, math, science, logic
    - Abilities: generating code from text descriptions (work in progress)
- DALL-E can be asked to generate images. 
  - If necessary, DALL-E it will try to gather information from you from which to generate a prompt for the DALL-E API. 
  - Yes, even the final prompt given to the DALL-E API is generated by GPT-3.

## Setup Project & Dependencies

Install Node.JS (version ^18 required) and Yarn:

```bash
nvm install 18
# Optional: set this version as default:
nvm alias default node
# Install yarn
npm install --global yarn
```

Install the rest of the project dependencies

```bash
yarn
# or
npm install
```

**Important!!** - You will have to put your OpenAI API Key inside the `.env` file.

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


## Demo Screenshots:

![image](https://user-images.githubusercontent.com/14914491/209245190-6734d6a2-7935-41fc-9d4e-b7b57e2f6a53.png)
![image](https://user-images.githubusercontent.com/14914491/209996928-906cb9dc-74d4-4c92-adcd-be9ecb507570.png)
