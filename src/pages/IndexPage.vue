<template>
  <!--  <q-page class="row items-center justify-evenly">-->
  <div class="full-width">
    <ChatThread :my-name="myName" :scroll-area-style="scStyle"/>
    <q-card class="fixed-bottom q-pa-md" ref="inputCard">
      <q-card-section>
        <q-input
            filled
            clearable
            autofocus
            autogrow
            v-model="message"
            label="Message"
        />
      </q-card-section>
      <q-card-actions>
        <q-btn label="Send" color="primary" @click="sendMessage"/>
        <q-btn label="Clear Thread" color="primary" @click="clearThread"/>
        <q-btn label="Clear Cache" color="primary" @click="clearCache"/>
      </q-card-actions>
    </q-card>
  </div>
  <!--  </q-page>-->
</template>

<script lang="ts" setup>
import ChatThread from "components/ChatThread.vue"
import { onBeforeUnmount, onMounted, ref, watch } from "vue"
import { GenConfig, TextMessage, useCompStore } from "stores/compStore"
import { getSeededAvatarURL } from "src/util/Util"

const comp = useCompStore()

const inputCard = ref(null)
const scStyle = ref({})

const myName = ref("Andrei Cozma")
const message = ref("")

const createAIMsgTemplate = (cfg: GenConfig): TextMessage => {
  const currDate = new Date()
  const model = cfg.config.model
  const name = `AI ${model}`
  return {
    text       : [],
    images     : [],
    avatar     : getSeededAvatarURL(name),
    name       : name,
    date       : currDate,
    dateCreated: currDate.getTime()
  }
}

const getAIResponse = () => {
  const cfg: GenConfig = {
    promptType   : "chatHistory",
    maxHistoryLen: 10,
    ignoreCache  : false,
    config       : {
      model            : "text-davinci-002",
      max_tokens       : 250,
      temperature      : 0.75,
      top_p            : 1,
      frequency_penalty: 0,
      presence_penalty : 0,
      stop             : [ "###" ]
    }
  }
  // push the initial message and then get the response to update it

  let msg: TextMessage = createAIMsgTemplate(cfg)
  msg.loading = true
  msg = comp.pushMessage(msg)
  comp.genTextCompletion(cfg).then((res) => {
    if (res?.errorMsg) {
      console.error(res.errorMsg)
      msg.text = [ res.errorMsg ]
      msg.loading = false
      comp.pushMessage(msg)
      return
    }
    console.log(res)
    const trTxt = res?.result?.choices[0]?.text.trim()
    msg.text = trTxt ? [ trTxt ] : [ "An error occurred" ]
    msg.dateCreated = res?.result?.created * 1000
    msg.cached = res?.cached
    msg.loading = false
    comp.pushMessage(msg)
  })
}

const sendMessage = () => {
  const currDate = new Date()
  const usrMsg: TextMessage = {
    text  : [ message.value ],
    images: [],
    avatar: getSeededAvatarURL(myName.value),
    name  : myName.value,
    date  : currDate
  }
  comp.pushMessage(usrMsg)
  message.value = ""
  getAIResponse()
}

const clearThread = () => {
  comp.clearThread()
}

const clearCache = () => {
  comp.clearCache()
}

const kbShortcuts = (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

watch(message, () => {
  const ic: any = inputCard.value
  if (ic) scStyle.value = { bottom: ic.$el.clientHeight + "px" }
})

onMounted(() => {
  document.addEventListener("keydown", kbShortcuts)
})

onBeforeUnmount(() => {
  document.removeEventListener("keydown", kbShortcuts)
})
</script>
