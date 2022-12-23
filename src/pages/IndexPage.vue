<template>
  <div class="full-width">
    <ChatThread :my-name="myName" :scroll-area-style="scStyle"/>
    <q-card class="fixed-bottom" ref="inputCard">
      <q-card-section class="q-px-sm q-pt-sm q-pb-none">
        <q-input
            clearable
            autofocus
            autogrow
            outlined
            type="textarea"
            v-model="inputText"
            label="Message"
            ref="inputElem"
            maxlength="2000"
        />
      </q-card-section>
      <q-card-actions>
        <q-btn
            label="Send"
            color="primary"
            icon="send"
            padding="5px 20px"
            rounded
            :disable="!isMessageValid"
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
</template>

<script lang="ts" setup>
import ChatThread from "components/ChatThread.vue"
import { QCard, QInput } from "quasar"
import { ActorConfig, GenerationResult, TextMessage } from "src/util/Models"
import { getSeededAvatarURL } from "src/util/Util"
import { actors, useCompStore } from "stores/compStore"
import { computed, onBeforeUnmount, onMounted, Ref, ref, watch } from "vue"

const comp = useCompStore()

const inputCard: Ref<QCard | null> = ref(null)
const inputElem: Ref<QInput | null> = ref(null)
const scStyle = ref({})

const myName = computed(() => comp.userName)
const inputText = ref("")
const isMessageValid = computed(() => {
  return inputText.value.trim().length > 0
})

const createAIMessage = (cfg: ActorConfig): TextMessage => {
  const name: string = cfg?.name || "Anonymous AI"
  let msg: TextMessage = {
    text       : [],
    images     : [],
    avatar     : getSeededAvatarURL(name),
    name       : name,
    date       : new Date(),
    dateCreated: undefined,
    objective  : cfg?.key || "unknown",
    loading    : true
  }
  msg = comp.pushMessage(msg)
  return msg
}

const handleCoordinator = () => {
  const ai: ActorConfig = actors.coordinator
  const msg: TextMessage = createAIMessage(ai)

  comp.genCompletion(ai).then(async (res: GenerationResult) => {
    console.log(res)
    msg.loading = false
    msg.cached = res.cached
    if (res.errorMsg) {
      console.error(res.errorMsg)
      msg.text.push(`[${res.errorMsg}]`)
      comp.pushMessage(msg)
      return
    }
    if (!res.result) {
      console.error("No result")
      msg.text.push("[Error: No result]")
      comp.pushMessage(msg)
      return
    }
    if (!res.text) {
      console.error("No text in result")
      msg.text.push("[Error: No text in result]")
      comp.pushMessage(msg)
      return
    }
    msg.dateCreated = res.result.created * 1000
    msg.text = res.text ? [ ...res.text ] : [ "An error occurred" ]
    comp.pushMessage(msg)
    let nextActors: string[] = res.text[0].split(":")
    // if the length is 2, grab index 1, otherwise 0
    const nextActorsCommaSep: string = nextActors.length === 2 ? nextActors[1] : nextActors[0]
    nextActors = nextActorsCommaSep.trim().toLowerCase().split(", ")

    // for each actor, call the appropriate handler
    for (let actor of nextActors) {
      actor = actor.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
      await handleNext(actor)
    }
  })
}

const handleNext = async (actorKey: string, msg?: TextMessage) => {
  actorKey = actorKey?.trim()
  const cfgFollowup: ActorConfig = actors[actorKey]
  msg = msg || createAIMessage(cfgFollowup)
  if (!cfgFollowup) {
    msg.text.push(`[Error: Unknown actor type: ${actorKey}]`)
    msg.loading = false
    comp.pushMessage(msg)
    return
  }

  comp.pushMessage(msg)

  const res = await comp.genCompletion(cfgFollowup)

  console.log(res)
  msg.loading = false
  msg.cached = res?.cached
  msg.date = new Date()
  if (res.errorMsg) {
    console.error(res.errorMsg)
    msg.text.push(`[${res.errorMsg}]`)
    comp.pushMessage(msg)
    return
  }
  if (!res.result) {
    console.error("No result")
    msg.text.push("[Error: No result]")
    comp.pushMessage(msg)
    return
  }
  msg.dateCreated = res?.result?.created * 1000

  if (res?.images) msg.images.push(...res.images)

  if (res?.text) {
    msg.text.push(...res.text)
  }
  comp.pushMessage(msg)

  const createGen = cfgFollowup?.createGen
  if (createGen) {
    // filter out texts that contain <prompt> tags
    const prompts = msg.text.filter((t: string) => t.includes("<prompt>")).map(
        (t: string) => t.split("<prompt>")[1].trim().split("</prompt>")[0].trim()).filter(
        (t: string) => t.split(" ").length > 1)
    if (prompts.length > 0) {
      msg.text = msg.text.map((t: string) => t.replace("<prompt>", "").replace("</prompt>", ""))
      comp.pushMessage(msg)

      console.log("promptText", prompts)
      // if the actor is actors.dalle, then use dalle_gen
      // if the actor is actors.codex, then use codex_gen
      const nextActor = `${actorKey}_gen`
      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i]
        const nextMsg = createAIMessage(cfgFollowup)
        if (!prompt) {
          nextMsg.text.push(`[Error: Prompt text is empty]`)
          nextMsg.loading = false
          comp.pushMessage(nextMsg)
          continue
        }
        nextMsg.text.push(`[${prompt}]`)
        await handleNext(nextActor, nextMsg)
      }
    }
  }

}

const isTyping = ref(false)
const typingTimeout: Ref<any> = ref(null)
const coordInterv: Ref<any> = ref(null)

const currMsg: Ref<any> = ref(null)

const sendMessage = () => {
  if (!isMessageValid.value) return
  if (currMsg.value === null) {
    currMsg.value = {
      text  : [],
      images: [],
      avatar: getSeededAvatarURL(myName.value),
      name  : myName.value,
      date  : new Date()
    }
    comp.pushMessage(currMsg.value)
  }
  currMsg.value.text.push(inputText.value)
  inputText.value = ""

  if (coordInterv.value) clearInterval(coordInterv.value)
  coordInterv.value = setInterval(() => {
    if (!isTyping.value) {
      currMsg.value = null
      handleCoordinator()
      clearInterval(coordInterv.value)
    }
  }, 500)
}

const updateIC = () => {
  setTimeout(() => {
    const ic = inputCard.value
    let bottom = 0
    if (ic) bottom = ic.$el.clientHeight
    const newStyle = { bottom: bottom + "px" }
    if (newStyle.bottom !== scStyle.value.bottom) {
      scStyle.value = newStyle
    }
  }, 100)
}

watch(inputText, () => {
  updateIC()
  // introduce a delay to detect if the user is typing.
  // The coordinator will not be called until the user stops typing for a while.
  isTyping.value = true
  if (typingTimeout.value) clearTimeout(typingTimeout.value)
  typingTimeout.value = setTimeout(() => {
    isTyping.value = false
  }, isMessageValid.value ? 1000 : 250)
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
  // enter sends inputText
  if (e.key === "Enter" && !e.shiftKey) {
    console.log("Sending message")
    e.preventDefault()
    sendMessage()
    return
  }
  // on escape first clear the input, then unfocus it
  if (e.key === "Escape") {
    if (inputElem.value) {
      if (inputText.value) {
        inputText.value = ""
      } else {
        inputElem.value.blur()
      }
      updateIC()
      return
    }
  }
  // if any number or letter is pressed, focus the input
  // if no modifier keys are pressed, focus the input
  if (inputElem.value && !e.ctrlKey && !e.altKey && e.key.match(/^[a-z0-9]$/i)) {
    console.log("Focusing input")
    inputElem.value.focus()
    return
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
