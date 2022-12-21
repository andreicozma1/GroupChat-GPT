<template>
  <!--  <q-page class="row items-center justify-evenly">-->
  <div class="full-width">
    <ChatThread :my-name="myName" :scroll-area-style="scStyle"/>
    <q-card class="fixed-bottom q-pa-md" ref="inputCard">
      <q-card-section>
        <q-input filled clearable autofocus
                 autogrow
                 v-model="message" label="Message"/>
      </q-card-section>
      <q-card-actions>
        <q-btn
            label="Send"
            color="primary"
            @click="sendMessage"
        />
        <q-btn
            label="Clear"
            color="primary"
            @click="clearThread"
        />
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
const myName = ref("Andrei Cozma")
const message = ref("")
const inputCard = ref(null)

function createAIMessage(res) {
  const result = res?.result
  const model = result?.model
  const objective = result?.object
  const name = `AI ${model} (${objective})`
  const currDate = new Date()
  const msg: TextMessage = {
    text       : [ result?.choices[0]?.text ],
    images     : [],
    avatar     : getSeededAvatarURL(name),
    name       : name,
    date       : currDate,
    objective  : result?.object,
    dateCreated: result?.created * 1000,
    cached     : res?.cached
  }
  return msg
}

const getAIResponse = () => {
  const cfg: GenConfig = {
    maxHistoryLen: 10,
    ignoreCache  : false
  }
  comp.genTextCompletion(cfg).then((res) => {
    if (res?.errorMsg) {
      console.error(res.errorMsg)
      return
    }
    console.log(res)
    const aiMsg = createAIMessage(res)
    comp.pushMessage(aiMsg)
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

const kbShortcuts = (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

const scStyle = ref({})

watch(message, () => {
  // get the height of the input card
  const ic: any = inputCard.value
  if (ic) {
    scStyle.value = { bottom: ic.$el.clientHeight + "px" }
    console.log(scStyle.value)
  }
})

onMounted(() => {
  document.addEventListener("keydown", kbShortcuts)
})

onBeforeUnmount(() => {
  document.removeEventListener("keydown", kbShortcuts)
})

</script>
