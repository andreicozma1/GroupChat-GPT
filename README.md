# GroupChat-GPT

Imagine a world where multiple Large Language Models (LLMs) collaborate together to help us humans with various tasks.  
Well, this application is a step towards that world.

**Important!!**: You will have to put your OpenAI API Key inside the `.env` file.

Current members are: Davinci, DALL-E, and Codex. 
Features: 
- The prompts for each AI assistant are dynamically created given their own data structure which includes information like personality traits, strengths, weaknesses, etc.
- Another special assistant is the Coordinator whose sole purpose is to dictate which of the other assistants needs to respond to the user's query.
- DALL-E can be asked to generate images. In certain instances it will try to gather information from you from which to generate a prompt for the DALL-E API. So, yes, even the prompt driven to DALL-E API is generated.

TODO:
- Implement code generation with Codex. Currently only the conversational part of Codex assistant is implemented. However it does not yet construct prompts for its own specialized API like DALL-E does. 
- Checkbox to hide Coordinator messages.
- Be able to delete chat messages and re-generate based on new history.
- Multiple chat threads.


## Demo:

![image](https://user-images.githubusercontent.com/14914491/209245190-6734d6a2-7935-41fc-9d4e-b7b57e2f6a53.png)

## Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).

### License & Credit

You may use this software and modify its functionality as you wish given that you provide proper credit to the original author (Andrei Cozma - www.andreicozma.com) and include the link to the original software repository.