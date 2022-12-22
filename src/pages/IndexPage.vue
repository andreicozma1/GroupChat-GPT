<template>
  <!--  <q-page class="row items-center justify-evenly">-->
  <div class="full-width">
    <ChatThread :my-name="myName" :scroll-area-style="scStyle"/>
    <q-card class="fixed-bottom" ref="inputCard">
      <q-card-section class="q-px-sm q-pt-sm q-pb-none">
        <q-input
            clearable
            autofocus
            autogrow
            outlined
            v-model="message"
            label="Message"
            ref="inputElem"
        />
      </q-card-section>
      <q-card-actions>
        <q-btn
            label="Send"
            color="primary"
            icon="send"
            padding="5px 20px"
            rounded
            @click="sendMessage"
        />
        <q-space/>
        <q-btn
            label="Clear Thread"
            color="orange"
            dense
            rounded
            no-caps
            outline
            icon-right="clear"
            @click="comp.clearThread"
        />
        <q-btn
            label="Clear Cache"
            color="red"
            dense
            rounded
            no-caps
            outline
            icon-right="delete_forever"
            @click="comp.clearCache"
        />
      </q-card-actions>
    </q-card>
  </div>
  <!--  </q-page>-->
</template>

<script lang="ts" setup>
import ChatThread from "components/ChatThread.vue"
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { GenConfig, GenerationResult, promptTypes, TextMessage, useCompStore } from "stores/compStore"
import { getSeededAvatarURL } from "src/util/Util"

const comp = useCompStore()

const inputCard = ref(null)
const inputElem = ref(null)
const scStyle = ref({})

const myName = ref("Andrei Cozma")
const message = ref("")
const isMessageValid = computed(() => {
  return message.value.trim().length > 0
})

const createAIMsgTemplate = (cfg: GenConfig): TextMessage => {
  // if config.promptType.config has "model", use that, otherwise use "AI"
  const name = cfg.promptType.config?.model || "AI"
  return {
    text       : [],
    images     : [],
    avatar     : getSeededAvatarURL(name),
    name       : name,
    date       : new Date(),
    dateCreated: undefined,
    objective  : cfg.promptType.key
  }
}

function genFollowUp(followUpPromptType: any, msg: TextMessage) {
  const cfgFollowup: GenConfig = {
    promptType : followUpPromptType,
    ignoreCache: false
  }
  comp.genTextCompletion(cfgFollowup).then((res2) => {
    console.log(res2)
    if (res2?.errorMsg) {
      console.error(res2.errorMsg)
      msg.text.push(res2.errorMsg)
      comp.pushMessage(msg)
      return
    }
    if (res2?.text) {
      msg.text.push(...res2.text)
    }
    if (res2?.images) {
      msg.images.push(...res2.images)
    }
    msg.dateCreated = res2?.result?.created * 1000
    msg.cached = res2?.cached
    msg.loading = false
    comp.pushMessage(msg)
  })
}

const getAIResponse = () => {
  const cfg: GenConfig = {
    promptType   : promptTypes.chat,
    maxHistoryLen: 10,
    ignoreCache  : false
  }
  // push the initial message and then get the response to update it

  let msg: TextMessage = createAIMsgTemplate(cfg)
  msg.loading = true
  msg = comp.pushMessage(msg)
  comp.genTextCompletion(cfg).then((res: GenerationResult) => {
    console.log(res)
    if (res.errorMsg) {
      console.error(res.errorMsg)
      msg.text = [ res.errorMsg ]
      msg.loading = false
      comp.pushMessage(msg)
      return
    }
    if (!res.result) {
      console.error("No result")
      msg.text = [ "No result" ]
      msg.loading = false
      comp.pushMessage(msg)
      return
    }
    msg.text = res.text ? [ ...res.text ] : [ "An error occurred" ]
    msg.dateCreated = res.result.created * 1000
    msg.cached = res.cached
    msg.loading = false
    comp.pushMessage(msg)

    const cfgClassifyReq: GenConfig = {
      promptType : promptTypes.classify_req,
      ignoreCache: false
    }
    comp.genTextCompletion(cfgClassifyReq).then((res1: GenerationResult) => {
      console.log(res1)
      if (res1.errorMsg) {
        console.error(res1.errorMsg)
        return
      }
      if (!res1.text) {
        console.error("No text in classify_req response")
        return
      }
      // join the text and classify it
      const objectiveStr = res1.text.join(" ").trim()
      const skipPrompts = [ "none", "" ]
      if (skipPrompts.includes(objectiveStr)) return
      msg.loading = true
      msg.objective = objectiveStr
      comp.pushMessage(msg)

      const nextPromptType = promptTypes[objectiveStr]
      if (!nextPromptType) {
        console.error(`Unknown follow-up prompt type: ${nextPromptType}`)
        msg.text.push(`An error occurred requesting a follow-up prompt (${res1?.text})`)
        comp.pushMessage(msg)
        return
      }
      genFollowUp(nextPromptType, msg)
    })
  })
}

const sendMessage = () => {
  if (!isMessageValid.value) return
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

const updateIC = () => {
  setTimeout(() => {
    const ic = inputCard.value
    let bottom = 0
    if (ic) bottom = ic.$el.clientHeight
    scStyle.value = { bottom: bottom + "px" }
  }, 100)
}

watch(message, () => {
  updateIC()
})

const kbShortcuts = (e) => {
  // ctrl+shift+x clears thread
  if (e.key === "X" && e.ctrlKey && e.shiftKey) {
    console.log("Clearing thread")
    e.preventDefault()
    comp.clearThread()
    // ctrl+alt+shift+x clears cache
    if (e.altKey) {
      console.log("Clearing cache")
      comp.clearCache()
    }
    return
  }
  if (e.key === "Enter" && !e.shiftKey) {
    console.log("Sending message")
    e.preventDefault()
    sendMessage()
    return
  }
  // on escape first clear the input, then unfocus it
  if (e.key === "Escape") {
    if (inputElem.value) {
      if (message.value) {
        message.value = ""
      } else {
        inputElem.value.blur()
      }
      updateIC()
      return
    }
  }
  // if any number or letter is pressed, focus the input
  if (e.key.match(/^[a-z0-9]$/i)) {
    // if no modifier keys are pressed, focus the input
    if (!e.ctrlKey && !e.altKey && !e.shiftKey && inputElem.value) {
      console.log("Focusing input")
      inputElem.value.focus()
      return
    }
  }
}

onMounted(() => {
  document.addEventListener("keydown", kbShortcuts)
  updateIC()
})

onBeforeUnmount(() => {
  document.removeEventListener("keydown", kbShortcuts)
})
</script>
