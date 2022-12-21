<template>
  <!--  <q-page class="row items-center justify-evenly">-->
  <div class="full-width">
    <ChatThread :my-name="myName"/>
    <q-card class="fixed-bottom q-pa-md">
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
import { ref } from "vue"
import { TextMessage, useCompStore } from "stores/compStore"
import { getSeededAvatarURL } from "src/util/Util"

const comp = useCompStore()
const myName = ref("Andrei Cozma")
const message = ref("")

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

const getAIResponse = (prompt: string) => {
  const cfg = {
    prompt     : prompt,
    ignoreCache: false
  }
  comp.genTextCompletion(cfg).then((res) => {
    if (res?.errorMsg) {
      console.error(res.errorMsg)
      return
    }
    const msg = createAIMessage(res)
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
  getAIResponse(usrMsg.text[0])
}

const clearThread = () => {
  comp.clearThread()
}

</script>
