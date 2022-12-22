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
            :disable="!isMessageValid"
            @click="handleUser"
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
const message = ref("")
const isMessageValid = computed(() => {
  return message.value.trim().length > 0
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

  comp.genTextCompletion(ai).then(async (res: GenerationResult) => {
    console.log(res)
    msg.loading = false
    msg.cached = res.cached
    if (res.errorMsg) {
      console.error(res.errorMsg)
      msg.text.push(`[ERR: ${res.errorMsg}]`)
      comp.pushMessage(msg)
      return
    }
    if (!res.result) {
      console.error("No result")
      msg.text.push("[ERR: No result]")
      comp.pushMessage(msg)
      return
    }
    if (!res.text) {
      console.error("No text in result")
      msg.text.push("[ERR: No text in result]")
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
    for (const actor of nextActors) {
      await handleNext(actor)
    }
  })
}

// function handleNext(objectiveStr: string, prompt: string) {
const handleNext = async (actorKey: string) => {
  actorKey = actorKey?.trim()
  // prompt = prompt?.trim()
  const cfgFollowup: ActorConfig = actors[actorKey]
  const msg: TextMessage = createAIMessage(cfgFollowup)
  if (!cfgFollowup) {
    msg.text.push(`[ERR: Unknown actor type: ${actorKey}]`)
    comp.pushMessage(msg)
    return
  }
  // if (!prompt || prompt.length === 0) {
  //   msg.text.push(`[ERR: No follow-up prompt provided for ${objectiveStr}]`)
  //   comp.pushMessage(msg)
  //   return
  // }
  // msg.text.push(prompt)
  msg.loading = true
  comp.pushMessage(msg)

  const res = await comp.genTextCompletion(cfgFollowup)

  console.log(res)
  msg.cached = res?.cached
  msg.loading = false
  if (res.errorMsg) {
    console.error(res.errorMsg)
    msg.text.push(`[ERR: ${res.errorMsg}]`)
    comp.pushMessage(msg)
    return
  }
  if (!res.result) {
    console.error("No result")
    msg.text.push("[ERR: No result]")
    comp.pushMessage(msg)
    return
  }
  msg.dateCreated = res?.result?.created * 1000
  if (res?.text) {
    msg.text.push(...res.text)
  }
  if (res?.images) {
    msg.images.push(...res.images)
  }
  comp.pushMessage(msg)
}

const handleUser = () => {
  if (!isMessageValid.value) return
  const currDate = new Date()
  const msg: TextMessage = {
    text  : [ message.value ],
    images: [],
    avatar: getSeededAvatarURL(myName.value),
    name  : myName.value,
    date  : currDate
  }
  comp.pushMessage(msg)
  message.value = ""
  handleCoordinator()

  // handleDavinci()
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
    handleUser()
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
