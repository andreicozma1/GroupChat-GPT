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
import { computed, onBeforeUnmount, onMounted, Ref, ref, watch } from "vue"
import { promptTypes, useCompStore } from "stores/compStore"
import { getSeededAvatarURL } from "src/util/Util"
import { GenConfig, GenerationResult, TextMessage } from "src/util/Models"
import { QCard, QInput } from "quasar"

const comp = useCompStore()

const inputCard: Ref<QCard | null> = ref(null)
const inputElem: Ref<QInput | null> = ref(null)
const scStyle = ref({})

const myName = computed(() => comp.userName)
const message = ref("")
const isMessageValid = computed(() => {
  return message.value.trim().length > 0
})

const createAIMsgTemplate = (cfg: GenConfig): TextMessage => {
  // if config.actor.config has "model", use that, otherwise use "AI"
  const name = cfg.actor?.name || "AI"
  return {
    text       : [],
    images     : [],
    avatar     : getSeededAvatarURL(name),
    name       : name,
    date       : new Date(),
    dateCreated: undefined,
    objective  : cfg.actor?.key
  }
}

function genFollowUp(objectiveStr: string, prompt: string) {
  objectiveStr = objectiveStr?.trim()
  prompt = prompt?.trim()
  const cfgFollowup: GenConfig = {
    actor      : promptTypes[objectiveStr],
    ignoreCache: false
  }
  const msg: TextMessage = createAIMsgTemplate(cfgFollowup)
  if (!cfgFollowup.actor) {
    msg.text.push(`[ERR: Unknown follow-up prompt type: ${objectiveStr}]`)
    comp.pushMessage(msg)
    return
  }
  if (!prompt || prompt.length === 0) {
    msg.text.push(`[ERR: No follow-up prompt provided for ${objectiveStr}]`)
    comp.pushMessage(msg)
    return
  }
  msg.text.push(prompt)
  msg.loading = true
  comp.pushMessage(msg)

  comp.genTextCompletion(cfgFollowup).then((res) => {
    console.log(res)
    if (res?.errorMsg) {
      console.error(res.errorMsg)
      msg.text.push(`[ERR: ${res.errorMsg}]`)
      comp.pushMessage(msg)
      return
    }
    if (res?.text) {
      msg.text.push(...res.text)
    }
    if (res?.images) {
      msg.images.push(...res.images)
    }
    msg.dateCreated = res?.result?.created * 1000
    msg.cached = res?.cached
    msg.loading = false
    comp.pushMessage(msg)
  })
}

const getAIResponse = () => {
  const cfg: GenConfig = {
    actor        : promptTypes.chat,
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
      msg.text.push(`[ERR: ${res.errorMsg}]`)
      msg.loading = false
      comp.pushMessage(msg)
      return
    }
    if (!res.result) {
      console.error("No result")
      msg.text.push("[ERR: No result]")
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
      actor      : promptTypes.coordinator,
      ignoreCache: false
    }
    comp.genTextCompletion(cfgClassifyReq).then((res_fw: GenerationResult) => {
      console.log(res_fw)
      msg.loading = false
      if (res_fw.errorMsg) {
        console.error(res_fw.errorMsg)
        msg.text.push(`[ERR: ${res_fw.errorMsg}]`)
        comp.pushMessage(msg)
        return
      }
      if (!res_fw.text) {
        console.error("No text in result")
        msg.text.push("[ERR: No text in result]")
        comp.pushMessage(msg)
        return
      }
      // join the text and classify it
      const respSpl = res_fw.text[0].split("\nPrompt:")
      const objectiveStr = respSpl[0].trim().toLowerCase()
      const nextPrompt = respSpl[1]?.trim()
      msg.objective = objectiveStr
      comp.pushMessage(msg)
      const skipPrompts = [ "none", "" ]
      if (skipPrompts.includes(objectiveStr)) return
      genFollowUp(objectiveStr, nextPrompt)
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

const kbShortcuts = (e: KeyboardEvent) => {
  // ctrl+shift+x clears thread
  if (e.key === "X" && e.ctrlKey && e.shiftKey) {
    console.log("Clearing thread")
    e.preventDefault()
    comp.clearThread()
    return
  }
  // ctrl+shift+r clears cache
  if (e.key === "R" && e.ctrlKey && e.shiftKey) {
    console.log("Clearing cache")
    e.preventDefault()
    comp.clearCache()
    return
  }
  // enter sends message
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
