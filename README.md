# AI-ChatBot (ai-chatbot)

A chatbot application written using the Quasar Framework.  
The Davinci model from the GPT-3 family is used for the chat-bot responses. The responses that need follow-ups (such as generating an image) are classified using a smaller model (Babbage).  
**Important!!**: You will have to put your OpenAI API Key inside the `.env` file.

## Demo:

![image](https://user-images.githubusercontent.com/14914491/209040878-71c79db3-f4c1-4fa8-97d5-f13e9d334c7d.png)

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
